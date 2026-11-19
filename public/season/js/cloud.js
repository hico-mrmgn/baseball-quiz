// ログインと、端末をまたぐ同期。
//
// サーバーは Supabase。つなぎ先（URL と公開用の鍵）は /api/config から受けとる。
// 設定がないとき・電波がないときは、これまでどおり端末の中だけで動く。
//
//   保護者 … メール＋パスワード。初めてログインすると「家族」が1つでき、そこに記録を置く
//   選手   … 保護者が発行したログインID＋パスワード。家族の記録のうち、決まったプレーヤーとしてだけ使う
//
// 記録は家族ごとに1行（family_state）。書くときは rev（何回目の書きこみか）をそえて送り、
// だれかが先に書いていたら、読み直して混ぜてから書き直す（store.js の mergeStates）。

import {
  get, subscribe, syncPayload, replaceState, mergeStates, clearLocal, lockPlayer,
} from './store.js';

export const KID_EMAIL_DOMAIN = 'kids.myseason.app'; // api/child.js と同じ
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const INFO_KEY = 'season.sync.v1';
const PHOTO_KEY = 'season.photos.v1';

const C = {
  ready: false,      // 設定を読みおえたか
  enabled: false,
  client: null,
  session: null,
  member: null,      // { family_id, role, player_id, login_id }
  status: 'off',     // off | syncing | synced | offline | error
  error: '',
};
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(C));
export const onCloud = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export const cloud = () => C;
export const signedIn = () => Boolean(C.session && C.member);
export const isChild = () => C.member?.role === 'child';
export const isParent = () => C.member?.role === 'parent';

let onRemote = () => {};
/** サーバーから新しい記録が来て、画面を描き直したいときに呼ぶ関数を決める */
export function onRemoteChange(fn) { onRemote = fn; }
let onRecovery = () => {};
/** パスワード再設定のメールから戻ってきたときに呼ぶ関数 */
export function onPasswordRecovery(fn) { onRecovery = fn; }

const readInfo = () => { try { return JSON.parse(localStorage.getItem(INFO_KEY)) ?? {}; } catch { return {}; } };
const writeInfo = (v) => { try { localStorage.setItem(INFO_KEY, JSON.stringify(v)); } catch { /* なくても動く */ } };
const setStatus = (status, error = '') => { C.status = status; C.error = error; emit(); };

/* ───────── はじめ ───────── */

async function loadConfig() {
  // テストや手元の確認では window.__seasonCloud で差しかえられる
  if (window.__seasonCloud?.config) return window.__seasonCloud.config;
  try {
    const r = await fetch('/api/config', { cache: 'no-store' });
    if (!r.ok) return null;
    const c = await r.json();
    return c?.enabled ? c : null;
  } catch {
    return null;
  }
}

async function makeClient(cfg) {
  if (window.__seasonCloud?.createClient) return window.__seasonCloud.createClient(cfg);
  const { createClient } = await import(SUPABASE_JS);
  return createClient(cfg.url, cfg.anonKey, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

/** アプリの起動時に1回呼ぶ。設定がなければ何もしない */
export async function initCloud() {
  const cfg = await loadConfig();
  C.ready = true;
  if (!cfg) { emit(); return C; }
  try {
    C.client = await makeClient(cfg);
  } catch {
    setStatus('offline', 'サーバーにつながりません');
    return C;
  }
  C.enabled = true;
  C.client.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') onRecovery();
    if (event === 'SIGNED_OUT') { C.session = null; C.member = null; lockPlayer(null); emit(); }
    else if (session) C.session = session;
  });
  const { data } = await C.client.auth.getSession();
  if (data?.session) await afterSignIn(data.session);
  else emit();

  subscribe(() => schedulePush());
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(); });
  window.addEventListener('online', () => pull());
  setInterval(() => { if (document.visibilityState === 'visible') pull(); }, 120000);
  return C;
}

async function afterSignIn(session) {
  C.session = session;
  let { data: m } = await C.client.from('members').select('family_id, role, player_id, login_id').eq('user_id', session.user.id).maybeSingle();
  if (!m) {
    // 保護者の初めてのログイン：家族を作る
    const { error } = await C.client.rpc('ensure_family');
    if (error) { setStatus('error', '家族の記録を作れませんでした'); return; }
    ({ data: m } = await C.client.from('members').select('family_id, role, player_id, login_id').eq('user_id', session.user.id).maybeSingle());
  }
  if (!m) { setStatus('error', 'アカウントの情報を読めませんでした'); return; }
  C.member = m;
  lockPlayer(m.role === 'child' ? m.player_id : null);
  emit();
  await pull({ first: true });
  await pullPhotos();
}

/* ───────── 同期 ───────── */

let pushTimer = null, pulling = null, pushing = null, lastSent = '';

function schedulePush() {
  if (!signedIn()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => push(), 1200);
}

/** サーバーの記録を読み、この端末の記録と混ぜる。ちがいがあれば書き直す */
export function pull({ first = false } = {}) {
  if (!signedIn()) return Promise.resolve();
  if (pulling) return pulling;
  pulling = (async () => {
    setStatus('syncing');
    const { data, error } = await C.client.from('family_state').select('data, rev').eq('family_id', C.member.family_id).maybeSingle();
    if (error || !data) { setStatus(navigator.onLine === false ? 'offline' : 'error', '記録を読めませんでした'); return; }
    const info = readInfo();
    const remote = data.data ?? {};
    let next;
    if (first && info.family && info.family !== C.member.family_id) {
      // この端末は前に別の家族で使っていた：その記録は混ぜずに、こちらの家族の記録にする
      next = mergeStates({}, remote);
    } else {
      next = mergeStates(get(), remote);
    }
    const before = JSON.stringify(syncPayload());
    replaceState(next, { notify: false });
    writeInfo({ family: C.member.family_id, rev: data.rev, user: C.session.user.id });
    const after = JSON.stringify(syncPayload());
    if (after !== before) onRemote();
    // この端末にしかなかった記録があれば送る
    if (!sameAsRemote(remote)) await push({ force: true });
    else { lastSent = after; setStatus('synced'); }
  })().finally(() => { pulling = null; });
  return pulling;
}

/** サーバーの中身が、この端末の送る中身と同じか */
function sameAsRemote(remote) {
  const mine = syncPayload();
  return Object.keys(mine).every((k) => JSON.stringify(mine[k] ?? null) === JSON.stringify(remote[k] ?? null));
}

/** この端末の記録を送る。先にだれかが書いていたら、読み直して混ぜてからもう一度 */
export function push({ force = false } = {}) {
  if (!signedIn()) return Promise.resolve();
  if (pushing) return pushing.then(() => push({ force }));
  pushing = (async () => {
    for (let tries = 0; tries < 3; tries++) {
      const payload = syncPayload();
      const str = JSON.stringify(payload);
      if (!force && str === lastSent) { setStatus('synced'); return; }
      setStatus('syncing');
      const info = readInfo();
      const { data: rev, error } = await C.client.rpc('save_state', { p_data: payload, p_rev: info.rev ?? 0 });
      if (error) { setStatus(navigator.onLine === false ? 'offline' : 'error', '記録を送れませんでした'); return; }
      if (rev !== null && rev !== undefined) {
        writeInfo({ ...info, rev });
        lastSent = str;
        setStatus('synced');
        return;
      }
      // 先にだれかが書いた：読み直して混ぜる
      const { data } = await C.client.from('family_state').select('data, rev').eq('family_id', C.member.family_id).maybeSingle();
      if (!data) break;
      replaceState(mergeStates(get(), data.data ?? {}), { notify: false });
      writeInfo({ ...info, rev: data.rev });
      onRemote();
      force = true;
    }
    setStatus('error', '記録を送れませんでした');
  })().finally(() => { pushing = null; });
  return pushing;
}

/* ───────── 写真 ───────── */

async function pullPhotos() {
  if (!signedIn()) return;
  const { data, error } = await C.client.from('family_photos').select('player_id, slot, data').eq('family_id', C.member.family_id);
  if (error || !Array.isArray(data)) return;
  const all = {};
  for (const row of data) { (all[row.player_id] ??= [null, null, null, null])[row.slot] = row.data; }
  // この端末にだけある写真（ログイン前に入れたもの）は、保護者ならサーバーへ送る
  let local = {};
  try { local = JSON.parse(localStorage.getItem(PHOTO_KEY)) ?? {}; } catch { local = {}; }
  if (isParent()) {
    for (const [pid, list] of Object.entries(local)) {
      (list ?? []).forEach((src, slot) => {
        if (src && !all[pid]?.[slot]) { (all[pid] ??= [null, null, null, null])[slot] = src; savePhoto(pid, slot, src); }
      });
    }
  }
  try { localStorage.setItem(PHOTO_KEY, JSON.stringify(all)); } catch { /* 入りきらなければ端末には置かない */ }
  onRemote();
}

/** 写真を1枚サーバーに置く（null で消す）。保護者のときだけ */
export async function savePhoto(pid, slot, dataUrl) {
  if (!isParent()) return true;
  const q = C.client.from('family_photos');
  const { error } = dataUrl
    ? await q.upsert({ family_id: C.member.family_id, player_id: pid, slot, data: dataUrl, updated_at: new Date().toISOString() })
    : await q.delete().eq('family_id', C.member.family_id).eq('player_id', pid).eq('slot', slot);
  return !error;
}

/* ───────── ログイン・登録 ───────── */

const redirectTo = () => `${location.origin}${location.pathname}`;
const jaError = (e) => {
  const m = String(e?.message ?? e ?? '');
  if (/invalid login credentials/i.test(m)) return 'メールアドレス（ID）かパスワードがちがいます';
  if (/email not confirmed/i.test(m)) return '確認メールのリンクを、まだ押していません';
  if (/already registered|already exists/i.test(m)) return 'このメールアドレスはもう登録されています';
  if (/password.*(6|short|weak)/i.test(m)) return 'パスワードは6文字以上にしてください';
  if (/rate limit/i.test(m)) return 'しばらく待ってから、もう一度ためしてください';
  if (/fetch|network/i.test(m)) return 'サーバーにつながりません';
  return m || 'うまくいきませんでした';
};

/** 保護者の登録。確認メールが届くので、リンクを押してからログインする */
export async function signUp(email, password) {
  const { data, error } = await C.client.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
  if (error) throw new Error(jaError(error));
  if (data?.session) await afterSignIn(data.session);   // 確認メールなしの設定のとき
  return { needsConfirm: !data?.session };
}

export async function signIn(email, password) {
  const { data, error } = await C.client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(jaError(error));
  await afterSignIn(data.session);
  if (C.status === 'error') throw new Error(C.error);
}

/** 選手のログイン（ログインID＋パスワード） */
export async function signInKid(loginId, password) {
  const id = String(loginId).trim().toLowerCase();
  const { data, error } = await C.client.auth.signInWithPassword({ email: `${id}@${KID_EMAIL_DOMAIN}`, password });
  if (error) throw new Error(/invalid login/i.test(error.message) ? 'ログインIDかパスワードがちがいます' : jaError(error));
  await afterSignIn(data.session);
  if (C.status === 'error') throw new Error(C.error);
}

export async function sendReset(email) {
  const { error } = await C.client.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
  if (error) throw new Error(jaError(error));
}

export async function setNewPassword(password) {
  const { error } = await C.client.auth.updateUser({ password });
  if (error) throw new Error(jaError(error));
}

/** ログアウト。送り残しを送ってから、この端末の記録と写真を空にする（記録はサーバーに残る） */
export async function signOut() {
  clearTimeout(pushTimer);
  try { await push(); } catch { /* 送れなくてもログアウトはする */ }
  await C.client.auth.signOut();
  C.session = null; C.member = null; lastSent = '';
  lockPlayer(null);
  try { localStorage.removeItem(INFO_KEY); localStorage.removeItem(PHOTO_KEY); } catch { /* 同上 */ }
  clearLocal();
  setStatus('off');
}

/* ───────── 選手のログインID（保護者だけ） ───────── */

export async function listKids() {
  if (!isParent()) return [];
  const { data } = await C.client.from('members').select('player_id, login_id').eq('family_id', C.member.family_id).eq('role', 'child');
  return data ?? [];
}

export async function kidAction(action, body) {
  const r = await fetch('/api/child', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${C.session?.access_token ?? ''}` },
    body: JSON.stringify({ action, ...body }),
  });
  let res = {};
  try { res = await r.json(); } catch { /* 下で扱う */ }
  if (!r.ok) throw new Error(res.error || 'うまくいきませんでした');
  return res;
}
