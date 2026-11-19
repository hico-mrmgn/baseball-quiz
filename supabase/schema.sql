-- MY SEASON：ログインと同期のためのテーブル。
-- Supabase の SQL Editor にこのファイルをまるごと貼って、1回実行する（何度実行しても壊れない）。
--
-- 家族（family）が1つの記録を持つ。
--   保護者 … メール＋パスワードで登録する。初めてログインしたときに家族が1つできる
--   選手   … 保護者が「ログインID＋パスワード」を発行する（api/child.js がサーバー側で作る）。
--            その家族の、決まったプレーヤーとしてだけ使える
-- 記録はアプリの中身（season.v1）を JSON のまま1行に置き、写真は別の表に置く。
-- 行単位のセキュリティ（RLS）で、自分の家族の行しか読み書きできないようにする。

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  user_id uuid primary key references auth.users (id) on delete cascade,
  family_id uuid not null references public.families (id) on delete cascade,
  role text not null check (role in ('parent', 'child')),
  player_id text,            -- 選手のときだけ。アプリのプレーヤー（p1, p2 …）
  login_id text unique,      -- 選手のときだけ。ログインに使うID
  created_at timestamptz not null default now()
);
create index if not exists members_family_idx on public.members (family_id);

create table if not exists public.family_state (
  family_id uuid primary key references public.families (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  rev bigint not null default 0,   -- 書くたびに1つ増やす。同時に書いたときの見分けに使う
  updated_at timestamptz not null default now(),
  updated_by uuid
);

create table if not exists public.family_photos (
  family_id uuid not null references public.families (id) on delete cascade,
  player_id text not null,
  slot int not null check (slot between 0 and 3),
  data text not null,              -- 縮めた JPEG の data URL
  updated_at timestamptz not null default now(),
  primary key (family_id, player_id, slot)
);

-- ログインしている人の家族と役わり。RLS から使うので security definer にする
create or replace function public.my_family() returns uuid
language sql stable security definer set search_path = public as $$
  select family_id from public.members where user_id = auth.uid()
$$;
create or replace function public.my_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.members where user_id = auth.uid()
$$;

-- 保護者が初めてログインしたときに呼ぶ。家族がなければ作って、自分を保護者にする
create or replace function public.ensure_family() returns uuid
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select family_id into fid from public.members where user_id = auth.uid();
  if fid is null then
    insert into public.families default values returning id into fid;
    insert into public.members (user_id, family_id, role) values (auth.uid(), fid, 'parent');
    insert into public.family_state (family_id) values (fid);
  end if;
  return fid;
end $$;

-- 記録を書く。rev が手元と同じときだけ書き、新しい rev を返す（ちがえば null：先にだれかが書いた）
create or replace function public.save_state(p_data jsonb, p_rev bigint) returns bigint
language plpgsql security definer set search_path = public as $$
declare fid uuid := public.my_family(); nrev bigint;
begin
  if fid is null then raise exception 'no family'; end if;
  update public.family_state
     set data = p_data, rev = rev + 1, updated_at = now(), updated_by = auth.uid()
   where family_id = fid and rev = p_rev
  returning rev into nrev;
  return nrev;
end $$;

alter table public.families enable row level security;
alter table public.members enable row level security;
alter table public.family_state enable row level security;
alter table public.family_photos enable row level security;

drop policy if exists "family: read own" on public.families;
create policy "family: read own" on public.families for select using (id = public.my_family());

drop policy if exists "members: read family" on public.members;
create policy "members: read family" on public.members for select using (family_id = public.my_family());

drop policy if exists "state: read family" on public.family_state;
create policy "state: read family" on public.family_state for select using (family_id = public.my_family());
-- 書きこみは save_state() だけを通す（直接の insert / update は許さない）

drop policy if exists "photos: read family" on public.family_photos;
create policy "photos: read family" on public.family_photos for select using (family_id = public.my_family());
drop policy if exists "photos: parent writes" on public.family_photos;
create policy "photos: parent writes" on public.family_photos for all
  using (family_id = public.my_family() and public.my_role() = 'parent')
  with check (family_id = public.my_family() and public.my_role() = 'parent');

grant execute on function public.ensure_family() to authenticated;
grant execute on function public.save_state(jsonb, bigint) to authenticated;
grant execute on function public.my_family() to authenticated;
grant execute on function public.my_role() to authenticated;
