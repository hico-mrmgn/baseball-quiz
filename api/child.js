// 選手のログインIDを、保護者が作る・パスワードを変える・消す。
// 選手にはメールアドレスがないので、ログインIDから決まった形のアドレスを作り、
// 確認メールなしで登録する。それにはサーバー用の鍵（service_role）が要るため、ここで行う。
// 鍵はこのファイルの外（Vercel の環境変数）にだけ置き、ブラウザには渡さない。

export const KID_EMAIL_DOMAIN = 'kids.myseason.app';
const ID_RE = /^[a-z0-9][a-z0-9_-]{2,19}$/;
const PLAYER_RE = /^p\d{1,3}$/;

const env = () => ({
  url: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, ''),
  key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
});

async function sb(path, { method = 'GET', body, token } = {}) {
  const { url, key } = env();
  const r = await fetch(`${url}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${token ?? key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

const fail = (res, status, message) => res.status(status).json({ error: message });

export default async function handler(req, res) {
  if (req.method !== 'POST') return fail(res, 405, 'POST だけです');
  const { url, key } = env();
  if (!url || !key) return fail(res, 503, 'サーバーの設定（SUPABASE_SERVICE_ROLE_KEY）がまだです');

  // 呼んだ人を、その人のログインのしるし（JWT）で確かめる
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return fail(res, 401, 'ログインしてください');
  const me = await sb('/auth/v1/user', { token });
  if (!me.ok || !me.data?.id) return fail(res, 401, 'ログインしなおしてください');
  const mine = await sb(`/rest/v1/members?user_id=eq.${me.data.id}&select=family_id,role`);
  const parent = Array.isArray(mine.data) ? mine.data[0] : null;
  if (!parent || parent.role !== 'parent') return fail(res, 403, '保護者のアカウントだけができます');

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body ?? {});
  const { action } = body;
  const loginId = String(body.loginId ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');

  // 同じ家族の選手を、ログインIDで探す
  const findChild = async () => {
    const r = await sb(`/rest/v1/members?family_id=eq.${parent.family_id}&role=eq.child&login_id=eq.${encodeURIComponent(loginId)}&select=user_id,player_id,login_id`);
    return Array.isArray(r.data) ? r.data[0] : null;
  };

  if (action === 'create') {
    const playerId = String(body.playerId ?? '');
    if (!ID_RE.test(loginId)) return fail(res, 400, 'ログインIDは 英小文字・数字・-・_ で3〜20文字です');
    if (password.length < 6) return fail(res, 400, 'パスワードは6文字以上にしてください');
    if (!PLAYER_RE.test(playerId)) return fail(res, 400, 'プレーヤーがちがいます');
    const dup = await sb(`/rest/v1/members?family_id=eq.${parent.family_id}&role=eq.child&player_id=eq.${playerId}&select=login_id`);
    if (Array.isArray(dup.data) && dup.data.length) return fail(res, 409, `このプレーヤーにはもうID（${dup.data[0].login_id}）があります`);

    const made = await sb('/auth/v1/admin/users', {
      method: 'POST',
      body: { email: `${loginId}@${KID_EMAIL_DOMAIN}`, password, email_confirm: true, app_metadata: { kid: true } },
    });
    if (!made.ok) {
      const taken = made.status === 422 || /already/i.test(JSON.stringify(made.data));
      return fail(res, taken ? 409 : 500, taken ? 'そのログインIDはもう使われています' : '作れませんでした');
    }
    const row = await sb('/rest/v1/members', {
      method: 'POST',
      body: { user_id: made.data.id, family_id: parent.family_id, role: 'child', player_id: playerId, login_id: loginId },
    });
    if (!row.ok) {
      await sb(`/auth/v1/admin/users/${made.data.id}`, { method: 'DELETE' });
      return fail(res, 500, '作れませんでした');
    }
    return res.status(200).json({ ok: true, loginId, playerId });
  }

  if (action === 'password') {
    if (password.length < 6) return fail(res, 400, 'パスワードは6文字以上にしてください');
    const child = await findChild();
    if (!child) return fail(res, 404, 'そのログインIDは見つかりません');
    const r = await sb(`/auth/v1/admin/users/${child.user_id}`, { method: 'PUT', body: { password } });
    return r.ok ? res.status(200).json({ ok: true }) : fail(res, 500, '変えられませんでした');
  }

  if (action === 'delete') {
    const child = await findChild();
    if (!child) return fail(res, 404, 'そのログインIDは見つかりません');
    // members の行は auth.users を消すと一緒に消える（on delete cascade）
    const r = await sb(`/auth/v1/admin/users/${child.user_id}`, { method: 'DELETE' });
    return r.ok ? res.status(200).json({ ok: true }) : fail(res, 500, '消せませんでした');
  }

  return fail(res, 400, 'action がちがいます');
}
