// ログイン画面・保護者メニューのアカウント欄・選手のログインIDの発行。

import { get, update, profile } from './store.js';
import {
  cloud, signedIn, isChild, isParent, signIn, signInKid, signUp, sendReset, setNewPassword, signOut,
  pull, listKids, kidAction,
} from './cloud.js';
import { esc, icon, toast, modal, go } from './ui.js';

/** ホームを描き直す（すでにホームにいても） */
const home = () => { if (location.hash === '#/home') window.dispatchEvent(new HashChangeEvent('hashchange')); else go('#/home'); };

const STATUS = { off: '', syncing: '同期中…', synced: '同期ずみ', offline: 'オフライン（つながったら送ります）', error: 'うまく同期できていません' };

/* ───────── ログイン画面 ───────── */

export function renderLogin(root, mode = 'parent') {
  const C = cloud();
  if (signedIn()) { go('#/home'); return; }
  root.innerHTML = `
    <header class="top"><a class="iconbtn" href="#/home" aria-label="もどる">${icon.left}</a><div><div class="brand">ログイン</div><div class="brand-sub">記録を、家族のどの端末でも見られるようにする</div></div></header>
    ${C.enabled ? `
    <div class="seg login-seg" role="tablist">
      <a href="#/login/parent" class="${mode === 'parent' ? 'on' : ''}" role="tab">保護者</a>
      <a href="#/login/kid" class="${mode === 'kid' ? 'on' : ''}" role="tab">選手</a>
    </div>
    ${mode === 'kid' ? `
    <form class="card form" data-kid>
      <label>ログインID<input name="loginid" autocomplete="username" autocapitalize="off" spellcheck="false" required></label>
      <label>パスワード<input name="pw" type="password" autocomplete="current-password" required></label>
      <button class="btn">ログイン</button>
      <p class="muted">ログインIDとパスワードは、おうちの人が保護者メニューで作ります。</p>
    </form>` : `
    <form class="card form" data-parent>
      <label>メールアドレス<input name="email" type="email" autocomplete="email" required></label>
      <label>パスワード（6文字以上）<input name="pw" type="password" autocomplete="current-password" minlength="6" required></label>
      <div class="row"><button class="btn" data-act="in">ログイン</button><button class="btn ghost" data-act="up" type="button">はじめて登録</button></div>
      <button class="link" type="button" data-forgot>パスワードを忘れた</button>
      <p class="muted">登録すると確認のメールが届きます。メールのリンクを押してから、ログインしてください。この端末にある記録は、ログインしたときにそのまま引きつぎます。</p>
    </form>`}`
    : `<div class="card"><p class="muted">${C.ready ? 'ログインの準備（サーバーの設定）がまだです。いまは、記録はこの端末の中だけに保存されます。' : '読みこみ中…'}</p></div>`}`;

  if (!C.enabled) return;
  const busy = (form, on) => form.querySelectorAll('button, input').forEach((el) => { el.disabled = on; });

  const kid = root.querySelector('[data-kid]');
  if (kid) kid.onsubmit = async (e) => {
    e.preventDefault();
    busy(kid, true);
    try { await signInKid(kid.loginid.value, kid.pw.value); toast(`${profile().name}でログインしました`); go('#/home'); }
    catch (err) { toast(err.message); busy(kid, false); }
  };

  const form = root.querySelector('[data-parent]');
  if (!form) return;
  const submit = async (act) => {
    if (!form.reportValidity()) return;
    busy(form, true);
    try {
      if (act === 'up') {
        const r = await signUp(form.email.value.trim(), form.pw.value);
        if (r.needsConfirm) {
          modal(`<h3>確認のメールを送りました</h3><p class="muted">${esc(form.email.value)} に届いたメールのリンクを押すと、登録が終わります。そのあと、ここでログインしてください。</p><button class="btn" data-close>わかった</button>`);
          busy(form, false);
          return;
        }
      } else {
        await signIn(form.email.value.trim(), form.pw.value);
      }
      toast('ログインしました'); go('#/home');
    } catch (err) { toast(err.message); busy(form, false); }
  };
  form.onsubmit = (e) => { e.preventDefault(); submit('in'); };
  form.querySelector('[data-act="up"]').onclick = () => submit('up');
  form.querySelector('[data-forgot]').onclick = async () => {
    const email = form.email.value.trim();
    if (!email) { toast('メールアドレスを入れてください'); form.email.focus(); return; }
    try { await sendReset(email); modal(`<h3>メールを送りました</h3><p class="muted">${esc(email)} に届いたリンクを押すと、新しいパスワードを決められます。</p><button class="btn" data-close>わかった</button>`); }
    catch (err) { toast(err.message); }
  };
}

/** パスワード再設定のメールから戻ってきたとき */
export function passwordRecoveryModal() {
  const m = modal(`<h3>新しいパスワード</h3><form class="form" data-newpw>
    <label>新しいパスワード（6文字以上）<input name="pw" type="password" autocomplete="new-password" minlength="6" required></label>
    <button class="btn">決める</button></form>`);
  const f = m.el.querySelector('[data-newpw]');
  f.onsubmit = async (e) => {
    e.preventDefault();
    try { await setNewPassword(f.pw.value); m.close(); toast('パスワードを変えました'); }
    catch (err) { toast(err.message); }
  };
}

/* ───────── 選手としてログインしているときのメニュー ───────── */

export function kidMenu() {
  const me = profile();
  const m = modal(`<h3>${esc(me.name)}</h3><p class="muted">選手としてログインしています（ID：${esc(cloud().member?.login_id ?? '')}）。記録はおうちの人の端末とつながっています。</p>
    <div class="row"><button class="btn ghost" data-close>とじる</button><button class="btn danger" data-out>ログアウト</button></div>`);
  m.el.querySelector('[data-out]').onclick = async () => { await signOut(); m.close(); toast('ログアウトしました'); home(); };
}

/* ───────── 保護者メニュー：アカウント ───────── */

export function accountSectionHTML() {
  const C = cloud();
  if (!C.enabled) return '';
  if (!signedIn()) {
    return `<section class="card form" id="account"><h3>アカウント</h3>
      <p class="muted">ログインすると、記録・目標・写真を家族のほかの端末でも見られます。選手用のログインIDも作れます。</p>
      <a class="btn" href="#/login">${icon.right} ログイン・登録</a></section>`;
  }
  const s = get();
  return `<section class="card form" id="account"><h3>アカウント</h3>
    <div class="acct"><b>${esc(C.session.user.email)}</b><span class="sync ${C.status}">${esc(STATUS[C.status] ?? '')}</span></div>
    ${C.error && C.status === 'error' ? `<p class="muted">${esc(C.error)}</p>` : ''}
    <div class="row"><button class="btn ghost small" data-syncnow>いま同期する</button><button class="btn ghost small" data-logout>ログアウト</button></div>

    <h4>選手のログインID</h4>
    <p class="muted">選手が自分の端末でログインすると、そのプレーヤーの記録だけを使えます（保護者メニューは開けません）。</p>
    <ul class="kids" data-kids>${s.profiles.map((p) => `<li data-pid="${p.id}"><span class="num">${esc(p.number ?? '')}</span><b>${esc(p.name)}</b><small class="muted">読みこみ中…</small></li>`).join('')}</ul>
  </section>`;
}

export function bindAccount(root, rerender) {
  if (!signedIn()) return;
  root.querySelector('[data-syncnow]').onclick = async () => { await pull(); toast(cloud().status === 'synced' ? '同期しました' : (STATUS[cloud().status] || '同期できませんでした')); rerender('account'); };
  root.querySelector('[data-logout]').onclick = () => {
    const m = modal(`<h3>ログアウトする？</h3><p class="muted">この端末から記録と写真を消します。記録はサーバーに残っているので、もう一度ログインすれば戻ります。</p>
      <div class="row"><button class="btn ghost" data-close>やめる</button><button class="btn danger" data-yes>ログアウト</button></div>`);
    m.el.querySelector('[data-yes]').onclick = async () => { await signOut(); m.close(); toast('ログアウトしました'); home(); };
  };
  drawKids(root, rerender);
}

async function drawKids(root, rerender) {
  const box = root.querySelector('[data-kids]');
  if (!box || !isParent()) return;
  let kids = [];
  try { kids = await listKids(); } catch { /* 下で「読めない」と出す */ }
  const byPlayer = Object.fromEntries(kids.map((k) => [k.player_id, k.login_id]));
  box.querySelectorAll('li').forEach((li) => {
    const pid = li.dataset.pid, id = byPlayer[pid];
    li.querySelector('small').outerHTML = id
      ? `<span class="kid-id">ID：<b>${esc(id)}</b></span><span class="kid-acts"><button class="link" data-kpw="${esc(id)}">パスワード</button><button class="link danger" data-kdel="${esc(id)}">消す</button></span>`
      : `<span class="kid-acts"><button class="btn ghost small" data-kmake="${pid}">${icon.plus} IDを作る</button></span>`;
  });

  const ask = (title, fields, onOk) => {
    const m = modal(`<h3>${title}</h3><form class="form" data-f>${fields}<div class="row"><button class="btn ghost" type="button" data-close>やめる</button><button class="btn">決める</button></div></form>`);
    const f = m.el.querySelector('[data-f]');
    f.onsubmit = async (e) => {
      e.preventDefault();
      f.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try { await onOk(f); m.close(); } catch (err) { toast(err.message); f.querySelectorAll('button').forEach((b) => { b.disabled = false; }); }
    };
  };
  const pwField = '<label>パスワード（6文字以上）<input name="pw" type="text" autocomplete="new-password" minlength="6" required></label>';

  box.querySelectorAll('[data-kmake]').forEach((b) => {
    b.onclick = () => {
      const p = get().profiles.find((x) => x.id === b.dataset.kmake);
      ask(`${esc(p?.name ?? '')}のログインID`, `<label>ログインID（英小文字・数字・-・_ で3〜20文字）<input name="loginid" autocapitalize="off" spellcheck="false" pattern="[a-z0-9][a-z0-9_\\-]{2,19}" required></label>${pwField}
        <p class="muted">選手はこのIDとパスワードで、「ログイン → 選手」から入ります。メモして渡してください。</p>`,
      async (f) => {
        await kidAction('create', { loginId: f.loginid.value.trim().toLowerCase(), password: f.pw.value, playerId: b.dataset.kmake });
        toast('ログインIDを作りました'); rerender('account');
      });
    };
  });
  box.querySelectorAll('[data-kpw]').forEach((b) => {
    b.onclick = () => ask(`${esc(b.dataset.kpw)} のパスワードを変える`, pwField, async (f) => {
      await kidAction('password', { loginId: b.dataset.kpw, password: f.pw.value });
      toast('パスワードを変えました');
    });
  });
  box.querySelectorAll('[data-kdel]').forEach((b) => {
    b.onclick = () => {
      const m = modal(`<h3>${esc(b.dataset.kdel)} を消す？</h3><p class="muted">このIDではログインできなくなります。記録は消えません。</p>
        <div class="row"><button class="btn ghost" data-close>やめる</button><button class="btn danger" data-yes>消す</button></div>`);
      m.el.querySelector('[data-yes]').onclick = async () => {
        try { await kidAction('delete', { loginId: b.dataset.kdel }); m.close(); toast('消しました'); rerender('account'); }
        catch (err) { toast(err.message); }
      };
    };
  });
}

/** プレーヤーを1人足す（保護者メニュー） */
export function addPlayer() {
  update((s) => {
    const n = Math.max(0, ...s.profiles.map((p) => Number(String(p.id).slice(1)) || 0)) + 1;
    s.profiles.push({ id: `p${n}`, name: `せんしゅ${n}`, number: '' });
  });
}

export const childBlocked = () => isChild();
