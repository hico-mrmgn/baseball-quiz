// 保護者の管理画面（/season/admin/）。選手が使う画面（/season/）とは別のページにしている。
//
//   ようす      … 選手ごとの自主練のようす（達成率・連続日数・ポイント・バッジ）と最近の試合
//   選手        … アカウント・選手のログインID・プレーヤーの名前と背番号
//   自主練      … 季節のセット・表示する種目と目標・写真（選手ごと）
//   課題        … いま取り組むこと
//   試合・計測  … 試合の入力となおし、実測値
//   データ      … 書き出し・読みこみ・消す
//
// 記録は選手の画面と同じもの（store.js）を読み書きする。ログインしていれば同期もされる。

import { ISSUES, DRILLS, MEASURES, GAME_KINDS, GRADES } from './catalog.js';
import { SCENES } from './scenes.js';
import { get, update, today, addDays, fmtDate, exportData, importData, resetAll, lockPlayer } from './store.js';
import { checkRankUps } from './growth.js';
import { h, esc, icon, toast, modal, go, rankUpModal } from './ui.js';
import { cloud, signedIn, isChild, signOut } from './cloud.js';
import { renderLogin, accountSectionHTML, bindAccount, addPlayer } from './account.js';
import { trainingStats, goalSettingsHTML, photoSettingsHTML, bindTrainingSettings, drillIcon, currentSet } from './training.js';

/** そのページへ移る。すでにそのページなら描き直す */
const show = (hash) => { if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange')); else go(hash); };

const drillById = Object.fromEntries(DRILLS.map((d) => [d.id, d]));
const kindName = (id) => GAME_KINDS.find((k) => k.id === id)?.name ?? '';

export const ADMIN_TABS = [
  { id: 'overview', label: 'ようす', ic: icon.growth },
  { id: 'players', label: '選手', ic: icon.home },
  { id: 'drills', label: '自主練', ic: icon.drill },
  { id: 'rx', label: '課題', ic: icon.flag },
  { id: 'games', label: '試合', ic: icon.season },
  { id: 'data', label: 'データ', ic: icon.gear },
];

/* ───────── どの選手の設定を見ているか ─────────
   選手の画面の「いま選んでいるプレーヤー」は変えずに、このページの中だけで切りかえる */
const PICK_KEY = 'season.admin.player';
export function adminPlayer() {
  const ps = get().profiles;
  let pid = null;
  try { pid = sessionStorage.getItem(PICK_KEY); } catch { /* なくても動く */ }
  return ps.some((p) => p.id === pid) ? pid : ps[0]?.id;
}
function pickPlayer(pid) {
  try { sessionStorage.setItem(PICK_KEY, pid); } catch { /* 同上 */ }
  lockPlayer(pid);
}
const playerPicker = () => {
  const cur = adminPlayer();
  return `<div class="seg ppick" role="tablist" aria-label="選手">${get().profiles.map((p) => `<button class="${p.id === cur ? 'on' : ''}" data-pick="${p.id}"><span class="num">${esc(p.number ?? '')}</span>${esc(p.name)}</button>`).join('')}</div>`;
};

const header = (title, sub) => `<header class="top"><div><div class="brand">${title}</div><div class="brand-sub">${sub}</div></div>
  <a class="btn ghost small" href="../#/home">${icon.play} 選手の画面</a></header>`;

/** 管理画面を描く。ログインが要るときはログインを先に出す */
export function renderAdmin(root, tab, arg) {
  const C = cloud();
  if (C.enabled && !signedIn()) { renderLogin(root, { admin: true }); return; }
  if (!C.ready && !C.enabled) { /* 設定を読みおえるまでも、端末の中の記録で描いておく */ }
  if (isChild()) {
    root.innerHTML = `${header('管理画面', '')}<div class="card form"><h3>選手のアカウントです</h3>
      <p class="muted">管理画面は、保護者のアカウントでログインして使います。</p><button class="btn ghost" data-out>ログアウト</button></div>`;
    root.querySelector('[data-out]').onclick = async () => { await signOut(); toast('ログアウトしました'); window.dispatchEvent(new HashChangeEvent('hashchange')); };
    return;
  }
  lockPlayer(adminPlayer());
  const draw = { overview, players, drills, rx, games, data }[tab] ?? overview;
  draw(root, arg);
  root.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => { pickPlayer(b.dataset.pick); renderAdmin(root, tab, arg); }; });
}

/* ───────── ようす ───────── */
function overview(root) {
  const s = get(), date = today();
  const week = [...Array(7)].map((_, i) => addDays(date, i - 6));
  const cards = s.profiles.map((p) => {
    const st = trainingStats(p.id, date);
    const days = new Set(s.drillLog.filter((d) => d.p === p.id && d.count > 0).map((d) => d.date));
    const last = [...days].sort().pop();
    const set = currentSet(p.id);
    return `<article class="card ov">
      <div class="ov-head"><span class="num">${esc(p.number ?? '')}</span><div><b>${esc(p.name)}</b><small>${esc(st.title.name)}・Lv.${st.level}・${st.pt.toLocaleString('ja-JP')}pt${set ? `・セット「${esc(set.name)}」` : ''}</small></div>
        <a class="link" href="#/drills" data-pick="${p.id}">設定</a></div>
      <div class="ov-nums">
        <div><span class="led">${st.rate}<i>%</i></span><small>今日の達成率</small></div>
        <div><span class="led">${st.streak}</span><small>連続練習（日）</small></div>
        <div><span class="led">${week.filter((d) => days.has(d)).length}<i>/7</i></span><small>この7日で練習</small></div>
      </div>
      <div class="ov-week">${week.map((d) => `<i class="${days.has(d) ? 'on' : ''}" title="${d}"></i>`).join('')}</div>
      ${st.ids.length ? `<ul class="ov-list">${st.ids.map((id) => { const g = st.goals[id], v = st.per[id]; const pc = Math.min(100, Math.round((v.day / g.day) * 100));
        return `<li><span class="dic">${drillIcon(id)}</span><b>${esc(drillById[id].name)}</b><span class="bar ${pc >= 100 ? 'ok' : 'go'}"><i style="width:${pc}%"></i></span><small>${v.day}/${g.day}${esc(drillById[id].unit)}</small><small class="muted">週 ${v.week}${g.week ? `/${g.week}` : ''}</small></li>`; }).join('')}</ul>` : '<p class="muted">目標が決まっていません。「自主練」で決められます。</p>'}
      <p class="muted">${last ? `最後に自主練した日：${fmtDate(last)}` : 'まだ自主練の記録がありません'}${st.recent.length ? `　最近のバッジ：${st.recent.slice(0, 3).map((b) => `${esc(b.drill ? drillById[b.drill]?.name ?? '' : '練習')} ${esc(b.label)}`).join('、')}` : ''}</p>
    </article>`;
  }).join('');
  const games = [...s.games].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
  root.innerHTML = `${header('ようす', `${fmtDate(date)}　${s.profiles.length}人`)}
    <section class="ovs">${cards}</section>
    ${s.rx.length ? `<section><h2>いま取り組んでいること</h2><div class="card"><ul class="mini-list">${s.rx.map((r) => { const is = ISSUES.find((i) => i.id === r.issue); return is ? `<li>${esc(is.name)}<small class="muted">　${fmtDate(r.since)}から</small></li>` : ''; }).join('')}</ul></div></section>` : ''}
    <section><h2>最近の試合</h2>${games.length ? `<div class="card"><ul class="mini-list">${games.map((g) => `<li>${fmtDate(g.date)}　${esc(g.opp)}戦${g.us !== null && g.us !== undefined ? `　<b>${g.us}-${g.them}</b>` : ''}<a class="link" href="#/games/${g.id}">なおす</a></li>`).join('')}</ul></div>` : `<div class="card"><p class="muted">まだ試合が入っていません。</p><a class="btn ghost small" href="#/games">${icon.plus} 試合を入れる</a></div>`}</section>`;
}

/* ───────── 選手 ───────── */
function players(root) {
  const s = get();
  root.innerHTML = `${header('選手', 'アカウント・ログインID・名前と背番号')}
    ${accountSectionHTML()}
    <section class="card form"><h3>プレーヤー</h3>
      ${s.profiles.map((p, i) => `<div class="frow"><label>名前<input data-pname="${i}" value="${esc(p.name)}" maxlength="10"></label><label class="narrow">背番号<input data-pnum="${i}" type="number" value="${esc(p.number ?? '')}"></label></div>`).join('')}
      <button class="btn ghost small" data-addp>${icon.plus} プレーヤーを足す</button>
      <label class="check"><input type="checkbox" data-sound ${s.settings.sound ? 'checked' : ''}> 選手の画面で音を出す</label>
    </section>`;
  root.querySelectorAll('[data-pname]').forEach((el) => { el.onchange = () => update((st) => { st.profiles[+el.dataset.pname].name = el.value.trim() || 'じぶん'; }); });
  root.querySelectorAll('[data-pnum]').forEach((el) => { el.onchange = () => update((st) => { st.profiles[+el.dataset.pnum].number = el.value === '' ? '' : +el.value; }); });
  root.querySelector('[data-sound]').onchange = (e) => update((st) => { st.settings.sound = e.target.checked; });
  root.querySelector('[data-addp]').onclick = () => { addPlayer(); toast('プレーヤーを足しました'); players(root); };
  bindAccount(root, () => players(root));
}

/* ───────── 自主練 ───────── */
function drills(root, anchor) {
  root.innerHTML = `${header('自主練', '季節のセット・種目と目標・写真')}
    ${playerPicker()}
    ${goalSettingsHTML()}
    ${photoSettingsHTML()}`;
  bindTrainingSettings(root, (a) => renderAdmin(root, 'drills', a));
  if (anchor && root.querySelector(`#${anchor}`)) root.querySelector(`#${anchor}`).scrollIntoView();
}

/* ───────── 課題 ───────── */
function rx(root) {
  const s = get();
  root.innerHTML = `${header('課題', 'いま取り組むこと（2つまで）')}
    <section class="card form">
      <div class="picks">${ISSUES.map((i) => `<label class="pick"><input type="checkbox" data-rx="${i.id}" ${s.rx.some((r) => r.issue === i.id) ? 'checked' : ''}><span>${esc(i.name)}</span></label>`).join('')}</div>
      <p class="muted">えらんだ課題の場面が選手の「今日の試合」に多めに出て、ドリルが自主練の先頭に並びます。</p>
    </section>`;
  root.querySelectorAll('[data-rx]').forEach((el) => {
    el.onchange = () => {
      const id = el.dataset.rx;
      if (el.checked && get().rx.length >= 2) { el.checked = false; toast('2つまでです'); return; }
      update((st) => { st.rx = el.checked ? [...st.rx, { issue: id, since: today() }] : st.rx.filter((r) => r.issue !== id); });
    };
  });
}

/* ───────── 試合・計測 ───────── */
function games(root, editId) {
  const s = get();
  const edit = editId ? s.games.find((g) => g.id === editId) : null;
  const list = [...s.games].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  root.innerHTML = `${header('試合・計測', '試合の成績と、体の実測値')}
    <section class="card form" id="gameform"><h3>${edit ? '試合をなおす' : '試合を入れる'}</h3>${gameForm(edit)}
      ${edit ? `<a class="link" href="#/games">あたらしい試合を入れる</a>` : ''}</section>
    ${list.length ? `<section><h2>入れた試合</h2><div class="card"><ul class="mini-list">${list.map((g) => `<li>${fmtDate(g.date)}　${esc(g.opp)}戦　<small class="muted">${esc(kindName(g.kind))}</small>${g.us !== null && g.us !== undefined ? `　<b>${g.us}-${g.them}</b>` : ''}<a class="link" href="#/games/${g.id}">なおす</a></li>`).join('')}</ul></div></section>` : ''}
    <section class="card form"><h3>実測値を入れる</h3>
      <div class="frow"><label>日付<input type="date" data-mdate value="${today()}"></label>
        <label>項目<select data-mid>${MEASURES.map((m) => `<option value="${m.id}">${esc(m.name)}（${esc(m.unit)}）</option>`).join('')}</select></label>
        <label class="narrow">値<input type="number" inputmode="decimal" step="0.01" data-mval></label></div>
      <button class="btn ghost" data-madd>${icon.plus} 入れる</button>
      ${s.measures.length ? `<ul class="mini-list">${[...s.measures].reverse().slice(0, 12).map((m) => { const d = MEASURES.find((x) => x.id === m.id); return `<li>${fmtDate(m.date)}　${esc(d?.name ?? m.id)} <b>${m.value}${esc(d?.unit ?? '')}</b><button class="link" data-mdel="${m.date}|${m.id}">消す</button></li>`; }).join('')}</ul>` : ''}
    </section>`;
  bindGameForm(root, edit);
  root.querySelector('[data-madd]').onclick = () => {
    const date = root.querySelector('[data-mdate]').value, id = root.querySelector('[data-mid]').value, v = root.querySelector('[data-mval]').value;
    if (!date || v === '') { toast('日付と値を入れてください'); return; }
    update((st) => { st.measures = st.measures.filter((m) => !(m.date === date && m.id === id)); st.measures.push({ date, id, value: Number(v) }); st.measures.sort((a, b) => a.date.localeCompare(b.date)); });
    toast('入れました'); games(root, editId); rankUpModal(checkRankUps('p1'));
  };
  root.querySelectorAll('[data-mdel]').forEach((b) => { b.onclick = () => { const [date, id] = b.dataset.mdel.split('|'); update((st) => { st.measures = st.measures.filter((m) => !(m.date === date && m.id === id)); }); games(root, editId); }; });
  if (edit) root.querySelector('#gameform').scrollIntoView();
}

/* ───────── データ ───────── */
function data(root) {
  const s = get();
  root.innerHTML = `${header('データ', signedIn() ? 'ログインしている家族の端末と同期しています' : '記録はこの端末の中だけに保存されます')}
    ${s.legacy && !s.legacy.reset && (s.legacy.drills || s.legacy.days || s.legacy.quiz || s.legacy.wrong) ? `<section class="card form"><h3>まえのアプリからの引きつぎ</h3>
      <p class="muted">この端末に残っていた「つぎ、どうする？」の記録を、${fmtDate(s.legacy.at)}に移しました。</p>
      <ul class="mini-list"><li>練習した日 <b>${s.legacy.days}日</b></li><li>自主練の記録 <b>${s.legacy.drills}件</b></li><li>クイズの戦績 <b>${s.legacy.quiz}回</b></li><li>まちがえた問題 <b>${s.legacy.wrong}問</b></li></ul>
    </section>` : ''}
    <section class="card form"><h3>データの持ち運び</h3>
      <p class="muted">${signedIn() ? '記録はサーバーにもあります。手元に控えを残したいときは書き出してください。' : '試合の成績や実測値は個人のデータなので、この端末に保存しています。別の端末へはファイルで移すか、ログインして同期します。'}</p>
      <div class="row"><button class="btn ghost" data-export>書き出す</button><label class="btn ghost filebtn">読みこむ<input type="file" accept="application/json,.json" data-import hidden></label></div>
      ${signedIn() ? '' : '<button class="link danger" data-reset>この端末の記録をぜんぶ消す</button>'}
      <a class="link" href="/?classic">まえのアプリ（つぎ、どうする？）をひらく</a>
    </section>`;
  root.querySelector('[data-export]').onclick = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = h(`<a download="season-${today()}.json"></a>`); a.href = URL.createObjectURL(blob); document.body.append(a); a.click(); a.remove();
  };
  root.querySelector('[data-import]').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = importData(await f.text()); toast(`読みこみました：試合${r.games}　計測${r.measures}`); data(root); rankUpModal(checkRankUps('p1')); }
    catch { toast('読みこめませんでした。ファイルを確かめてください'); }
  };
  root.querySelector('[data-reset]')?.addEventListener('click', () => {
    const m = modal(`<h3>ぜんぶ消す？</h3><p class="muted">この端末の試合・練習・計測の記録がすべて消えます。先に「書き出す」で残しておけます。</p>
      <div class="row"><button class="btn ghost" data-close>やめる</button><button class="btn danger" data-yes>消す</button></div>`);
    m.el.querySelector('[data-yes]').onclick = () => { resetAll(); m.close(); toast('消しました'); show('#/overview'); };
  });
}

/* ───────── 試合の入力 ───────── */
function gameForm(g) {
  const b = g?.bat ?? {}, p = g?.pit ?? {};
  const num = (name, label, v) => `<label class="narrow">${label}<input type="number" inputmode="numeric" min="0" data-f="${name}" value="${v ?? ''}"></label>`;
  return `
    <div class="frow"><label>日付<input type="date" data-f="date" value="${g?.date ?? today()}"></label>
      <label>相手<input data-f="opp" value="${esc(g?.opp ?? '')}" placeholder="チーム名"></label></div>
    <div class="frow"><label>区分<select data-f="kind">${GAME_KINDS.map((k) => `<option value="${k.id}" ${g?.kind === k.id ? 'selected' : ''}>${k.name}</option>`).join('')}</select></label>
      <label>相手の学年<select data-f="grade"><option value="">—</option>${GRADES.map((k) => `<option value="${k.id}" ${g?.grade === k.id ? 'selected' : ''}>${k.name}</option>`).join('')}</select></label></div>
    <div class="frow">${num('us', '得点', g?.us)}${num('them', '失点', g?.them)}<label>打順・守備<input data-f="pos" value="${esc(g?.pos ?? '')}" placeholder="6番 投→右"></label></div>
    <h4>打つ</h4>
    <div class="frow six">${num('b.pa', '打席', b.pa)}${num('b.ab', '打数', b.ab)}${num('b.h', '安打', b.h)}${num('b.bb', '四球', b.bb)}${num('b.so', '三振', b.so)}${num('b.sh', '犠打', b.sh)}${num('b.rbi', '打点', b.rbi)}${num('b.sb', '盗塁', b.sb)}${num('b.r', '得点', b.r)}${num('b.e', '失策', b.e)}</div>
    <label>打席の内容<input data-f="b.text" value="${esc(b.text ?? '')}" placeholder="四球・右ゴロ"></label>
    <h4>投げる（投げた試合だけ）</h4>
    <div class="frow six">${num('p.outs', 'アウト数', p.outs)}${num('p.p', '球数', p.p)}${num('p.k', '三振', p.k)}${num('p.bb', '四球', p.bb)}${num('p.h', '安打', p.h)}${num('p.r', '失点', p.r)}${num('p.er', '自責', p.er)}</div>
    <label class="check"><input type="checkbox" data-f="excluded" ${g?.excluded ? 'checked' : ''}> この試合の投球は集計から外す</label>
    <h4>次にやること</h4>
    <div class="picks">${ISSUES.map((i) => `<label class="pick"><input type="checkbox" data-issue="${i.id}" ${(g?.issues ?? []).includes(i.id) ? 'checked' : ''}><span>${esc(i.name)}</span></label>`).join('')}</div>
    <h4>この試合の場面</h4>
    <div class="picks">${SCENES.filter((x) => x.real && !x.whatIf).map((x) => `<label class="pick"><input type="checkbox" data-scene="${x.id}" ${(g?.scenes ?? []).includes(x.id) ? 'checked' : ''}><span>${esc(x.src)}　${esc(x.key)}</span></label>`).join('')}</div>
    <label>メモ<textarea data-f="memo" rows="2" placeholder="起きたことを、事実で">${esc(g?.memo ?? '')}</textarea></label>
    <div class="row"><button class="btn primary" data-gsave>${g ? '上書きする' : '入れる'}</button>${g ? '<button class="link danger" data-gdel>この試合を消す</button>' : ''}</div>`;
}

function bindGameForm(root, edit) {
  const f = (name) => root.querySelector(`[data-f="${name}"]`);
  const n = (name) => { const v = f(name).value; return v === '' ? null : Number(v); };
  root.querySelector('[data-gsave]').onclick = () => {
    const date = f('date').value, opp = f('opp').value.trim();
    if (!date || !opp) { toast('日付と相手を入れてください'); return; }
    const bat = {}; ['pa', 'ab', 'h', 'bb', 'so', 'sh', 'rbi', 'sb', 'r', 'e'].forEach((k) => { bat[k] = n(`b.${k}`) ?? 0; });
    bat.text = f('b.text').value.trim();
    const pit = {}; ['outs', 'p', 'k', 'bb', 'h', 'r', 'er'].forEach((k) => { pit[k] = n(`p.${k}`) ?? 0; });
    const g = {
      id: edit?.id ?? `g${date}-${Date.now().toString(36)}`, date, opp, kind: f('kind').value, grade: f('grade').value || null,
      us: n('us'), them: n('them'), pos: f('pos').value.trim(),
      bat: bat.pa || bat.text ? bat : null, pit: pit.outs || pit.p ? pit : null,
      excluded: f('excluded').checked,
      issues: [...root.querySelectorAll('[data-issue]:checked')].map((x) => x.dataset.issue),
      scenes: [...root.querySelectorAll('[data-scene]:checked')].map((x) => x.dataset.scene),
      memo: f('memo').value.trim(),
    };
    update((st) => { st.games = st.games.filter((x) => x.id !== g.id); st.games.push(g); st.games.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)); });
    toast(edit ? '上書きしました' : '入れました'); show('#/games'); setTimeout(() => rankUpModal(checkRankUps('p1')), 300);
  };
  const del = root.querySelector('[data-gdel]');
  if (del) del.onclick = () => { update((st) => { st.games = st.games.filter((x) => x.id !== edit.id); }); toast('消しました'); show('#/games'); };
}
