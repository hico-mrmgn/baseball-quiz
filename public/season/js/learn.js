// まなぶ：判断の場面・知識クイズ・守備フォーメーション。
// 知識クイズとフォーメーションのデータは大きいので、開いたときに data/ から読む。

import { get, update, profile } from './store.js';
import { SCENES } from './scenes.js';
import { countFree, ROLE_GROUPS } from './sim.js';
import { renderField, fielderPos, POS, LEAD, HOME, ARROW, tween, sleep, W, H } from './field.js';
import { sfx } from './sound.js';
import { esc, icon, go, rankUpModal } from './ui.js';
import { checkRankUps } from './growth.js';

const cache = {};
const loadJSON = (path) => (cache[path] ??= fetch(new URL(`../data/${path}`, import.meta.url)).then((r) => {
  if (!r.ok) { delete cache[path]; throw new Error(path); }
  return r.json();
}));
const loading = (root, title, back) => {
  root.innerHTML = `<header class="top">${back ? `<a class="iconbtn" href="${back}" aria-label="もどる">${icon.left}</a>` : ''}<div><div class="brand">${title}</div><div class="brand-sub">読みこみ中…</div></div></header>`;
};
const failed = (root, back) => {
  root.innerHTML = `<div class="card empty"><h3>読みこめませんでした</h3><p>電波のいいところで、もう一度ひらいてください。</p><a class="btn primary" href="${back}">もどる</a></div>`;
};
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ───────── 入口 ───────── */

export const QUIZ_THEMES = [
  { id: 'pitcher', name: 'ピッチャー', badge: 'P', desc: '投げる前とあとの動き', g: 'def' },
  { id: 'catcher', name: 'キャッチャー', badge: 'C', desc: '全体を見て指示する', g: 'def' },
  { id: 'first', name: 'ファースト', badge: '1B', desc: 'ベースと打球のあいだ', g: 'def' },
  { id: 'second', name: 'セカンド', badge: '2B', desc: 'カバーと中継', g: 'def' },
  { id: 'third', name: 'サード', badge: '3B', desc: '強い打球とバント', g: 'def' },
  { id: 'short', name: 'ショート', badge: 'SS', desc: '内野のまとめ役', g: 'def' },
  { id: 'outfield', name: '外野', badge: 'OF', desc: '返球とバックアップ', g: 'def' },
  { id: 'baserun', name: '走塁', badge: '走', desc: 'ランナーの状況判断', g: 'off' },
  { id: 'batting', name: 'バッティング', badge: '打', desc: '打席でのねらい', g: 'off' },
  { id: 'coach', name: 'コーチャー', badge: 'コ', desc: '回す・止める', g: 'off' },
  { id: 'rules', name: 'ルール', badge: '規', desc: '知っていると得をする', g: 'know' },
  { id: 'umpire', name: '審判', badge: '審', desc: 'お父さん審判の知識', g: 'know' },
  { id: 'npb2025', name: 'プロ野球', badge: 'プロ', desc: 'プロ野球の知識', g: 'know' },
  { id: 'fighters', name: 'ファイターズ', badge: 'F', desc: 'ファイターズの知識', g: 'know' },
];
const themeById = Object.fromEntries(QUIZ_THEMES.map((t) => [t.id, t]));
const DIFFS = [{ id: 'all', name: 'ぜんぶ' }, { id: 'easy', name: 'やさしい' }, { id: 'normal', name: 'ふつう' }, { id: 'hard', name: 'むずかしい' }, { id: 'expert', name: '超むず' }];
const diffName = (id) => DIFFS.find((d) => d.id === id)?.name ?? '';
const QUIZ_LEN = 10;

export function renderLearn(root) {
  const s = get(), me = profile();
  const wrong = (s.quizWrong[me.id] ?? []).length;
  const lastQuiz = [...s.quiz].reverse().find((q) => q.p === me.id);
  root.innerHTML = `
    <header class="top"><div><div class="brand">まなぶ</div><div class="brand-sub">場面・知識・動き方</div></div></header>
    <a class="card learn l-scene" href="#/learn/scenes">
      <div class="learn-art" aria-hidden="true"></div>
      <div class="learn-body"><small>JUDGMENT</small><h3>判断の場面</h3><p>点差・アウト・走者で、いちばんいい手が変わる。先に決めてから投げさせる。</p>
        <span class="learn-count"><b class="led">${SCENES.length}</b>場面</span></div>${icon.right}
    </a>
    <a class="card learn l-quiz" href="#/learn/quiz">
      <div class="learn-art" aria-hidden="true"><span>Q</span></div>
      <div class="learn-body"><small>KNOWLEDGE</small><h3>知識クイズ</h3><p>ポジションごとの動き、走塁、ルール。10問ずつ。</p>
        <span class="learn-count"><b class="led">1170</b>問${wrong ? `　<em>まちがえた問題 ${wrong}</em>` : ''}</span>
        ${lastQuiz ? `<span class="learn-last">前回　${esc(themeById[lastQuiz.theme]?.name ?? 'まぜて')} ${lastQuiz.score}/${lastQuiz.total}</span>` : ''}</div>${icon.right}
    </a>
    <a class="card learn l-form" href="#/learn/form">
      <div class="learn-art" aria-hidden="true"></div>
      <div class="learn-body"><small>FORMATION</small><h3>フォーメーション</h3><p>この打球のとき、9人はどこへ動くか。図で動かして見る。</p>
        <span class="learn-count"><b class="led">190</b>パターン</span></div>${icon.right}
    </a>`;
}

/* ───────── 判断の場面 ───────── */

export function renderLearnScenes(root) {
  const kinds = [
    { k: 'all', name: 'ぜんぶ', sub: '守りも攻めもまぜて' },
    { k: 'rich', name: '先に動け', sub: '来たら・来なかったらを両方きめる' },
    { k: 'score', name: '点差で変わる判断', sub: '同じ打球、ちがう状況' },
    { k: 'pre', name: '投げる前に決める', sub: '打球が飛ぶ前の準備' },
    { k: 'def', name: '守る', sub: '投げる先・カバー' },
    { k: 'off', name: '走る・打つ', sub: 'ランナー・打席・コーチャー' },
    { k: 'real', name: 'じっさいの試合', sub: 'スコアブックから拾った場面' },
    { k: 'select', name: 'セレクション級', sub: 'ひとつ上の学年のむずかしさ' },
  ];
  const n = (k) => (k === 'rich' ? SCENES.filter((x) => !x.classic).length : countFree(k));
  root.innerHTML = `
    <header class="top"><a class="iconbtn" href="#/learn" aria-label="もどる">${icon.left}</a><div><div class="brand">判断の場面</div><div class="brand-sub">1回 8場面まで。毎回ちがう順番で出る</div></div></header>
    <section class="kinds">${kinds.map((x) => `
      <a class="card kind" href="#/play/free/${x.k}"><div><b>${x.name}</b><small>${x.sub}</small></div><span class="led">${n(x.k)}</span>${icon.play}</a>`).join('')}</section>
    <section><h2>ポジション別</h2>
      <div class="chipgrid">${Object.entries(ROLE_GROUPS).map(([id, name]) => { const c = countFree(`role:${id}`); return c ? `<a class="pchip" href="#/play/free/role:${id}"><b>${name}</b><span class="led">${c}</span></a>` : ''; }).join('')}</div>
    </section>`;
}

/* ───────── 知識クイズ ───────── */

let pickDiff = 'all';

export async function renderQuizPick(root) {
  const here = location.hash;
  loading(root, '知識クイズ', '#/learn');
  let index;
  try { index = await loadJSON('quiz-index.json'); } catch { return failed(root, '#/learn'); }
  if (location.hash !== here) return;
  const draw = () => {
    const s = get(), me = profile();
    const wrong = (s.quizWrong[me.id] ?? []).length;
    const last = (id) => [...s.quiz].reverse().find((q) => q.p === me.id && q.theme === id);
    const count = (id) => index[id]?.counts[pickDiff] ?? 0;
    const total = QUIZ_THEMES.reduce((a, t) => a + count(t.id), 0);
    const group = (g, title) => `<section><h2>${title}</h2><div class="themes">${QUIZ_THEMES.filter((t) => t.g === g).map((t) => {
      const c = count(t.id), l = last(t.id);
      return `<a class="card theme ${c ? '' : 'off'}" ${c ? `href="#/quiz/${t.id}/${pickDiff}"` : 'aria-disabled="true"'}>
        <span class="tbadge ${t.g}">${t.badge}</span><div><b>${t.name}</b><small>${t.desc}</small></div>
        <span class="tmeta"><b class="led">${c}</b>問${l ? `<i>前回 ${l.score}/${l.total}</i>` : ''}</span></a>`;
    }).join('')}</div></section>`;
    root.innerHTML = `
      <header class="top"><a class="iconbtn" href="#/learn" aria-label="もどる">${icon.left}</a><div><div class="brand">知識クイズ</div><div class="brand-sub">1回 ${QUIZ_LEN}問。答えたらすぐ解説</div></div></header>
      <section class="seg" role="group" aria-label="むずかしさ">${DIFFS.map((d) => `<button class="${d.id === pickDiff ? 'on' : ''}" data-d="${d.id}">${d.name}</button>`).join('')}</section>
      <section class="row quick">
        <a class="btn hot" href="#/quiz/mix/${pickDiff}">${icon.play} まぜて${QUIZ_LEN}問<small>${total}問から</small></a>
        ${wrong ? `<a class="btn ghost" href="#/quiz/wrong/all">まちがえた問題　${wrong}</a>` : ''}
      </section>
      ${group('def', '守る')}${group('off', '攻める')}${group('know', '知る')}`;
    root.querySelectorAll('[data-d]').forEach((b) => { b.onclick = () => { sfx.tap(); pickDiff = b.dataset.d; draw(); }; });
  };
  draw();
}

const themeOfId = (id) => id.replace(/-\d+$/, '');

export async function renderQuiz(root, theme, diff = 'all') {
  const here = location.hash;
  const me = profile();
  root.innerHTML = '<div class="quiz"><div class="card"><p class="muted center">読みこみ中…</p></div></div>';
  let pool;
  try {
    if (theme === 'wrong') {
      const ids = new Set(get().quizWrong[me.id] ?? []);
      const files = await Promise.all([...new Set([...ids].map(themeOfId))].filter((t) => themeById[t]).map((t) => loadJSON(`q/${t}.json`)));
      pool = files.flat().filter((q) => ids.has(q.id));
    } else if (theme === 'mix') {
      pool = (await Promise.all(QUIZ_THEMES.map((t) => loadJSON(`q/${t.id}.json`)))).flat();
    } else {
      if (!themeById[theme]) return failed(root, '#/learn/quiz');
      pool = await loadJSON(`q/${theme}.json`);
    }
  } catch { return failed(root, '#/learn/quiz'); }
  if (location.hash !== here) return;
  if (diff !== 'all') pool = pool.filter((q) => q.d === diff);
  const qs = shuffle([...pool]).slice(0, QUIZ_LEN).map((q) => {
    const order = shuffle(q.c.map((_, i) => i));
    return { ...q, order };
  });
  const title = theme === 'wrong' ? 'まちがえた問題' : theme === 'mix' ? 'まぜて' : themeById[theme].name;
  if (!qs.length) {
    root.innerHTML = `<div class="quiz"><div class="card empty"><h3>${theme === 'wrong' ? 'まちがえた問題は、いまはありません' : 'このむずかしさの問題はありません'}</h3><a class="btn primary" href="#/learn/quiz">テーマをえらぶ</a></div></div>`;
    return;
  }
  const G = { i: 0, right: 0, log: [] };

  const frame = (inner) => {
    root.innerHTML = `<div class="quiz">
      <div class="sim-eyebrow"><button class="iconbtn" data-quit aria-label="やめる">${icon.x}</button><span>KNOWLEDGE / ${esc(title)}</span>
        <div class="tally"><span>正解</span><b class="led">${G.right}</b><i>/</i><b class="led">${qs.length}</b></div></div>
      <div class="qbar" aria-hidden="true">${qs.map((_, i) => `<i class="${G.log[i] === true ? 'ok' : G.log[i] === false ? 'ng' : i === G.i ? 'now' : ''}"></i>`).join('')}</div>
      ${inner}</div>`;
    root.querySelector('[data-quit]').onclick = () => go('#/learn/quiz');
    window.scrollTo(0, 0);
  };

  function ask() {
    const q = qs[G.i];
    frame(`
      <div class="card qcard">
        <div class="chips"><span class="chip">${esc(themeById[themeOfId(q.id)]?.name ?? '')}</span><span class="chip d-${q.d}">${diffName(q.d)}</span><span class="qno led">${G.i + 1} / ${qs.length}</span></div>
        ${q.s ? `<p class="qsit">${esc(q.s)}</p>` : ''}
        <div class="q long">${esc(q.q)}</div>
        <div class="opts long">${q.order.map((ci, k) => `<button class="opt" data-c="${ci}"><i>${'ABCD'[k]}</i><span>${esc(q.c[ci])}</span></button>`).join('')}</div>
      </div>
      <div class="qafter"></div>`);
    root.querySelectorAll('.opt').forEach((b) => { b.onclick = () => answer(+b.dataset.c); });
  }

  function answer(ci) {
    const q = qs[G.i]; const ok = ci === q.a;
    G.log[G.i] = ok; if (ok) G.right++;
    (ok ? sfx.out : sfx.safe)();
    root.querySelectorAll('.opt').forEach((b) => {
      b.disabled = true;
      if (+b.dataset.c === q.a) b.classList.add('correct');
      else if (+b.dataset.c === ci) b.classList.add('wrong');
      else b.classList.add('dim');
    });
    root.querySelector('.tally .led').textContent = G.right;
    root.querySelectorAll('.qbar i')[G.i].className = ok ? 'ok' : 'ng';
    update((s) => {
      const list = new Set(s.quizWrong[me.id] ?? []);
      if (ok) list.delete(q.id); else list.add(q.id);
      s.quizWrong[me.id] = [...list];
    });
    const last = G.i >= qs.length - 1;
    const after = root.querySelector('.qafter');
    after.innerHTML = `
      <div class="verdict ${ok ? 'best' : 'poor'}"><span>${ok ? '正解！' : `正解は ${'ABCD'[q.order.indexOf(q.a)]}`}</span></div>
      <div class="card why"><p>${esc(q.e)}</p></div>
      <button class="btn primary" data-next>${last ? '結果を見る ' : '次の問題 '}${icon.right}</button>`;
    after.querySelector('[data-next]').onclick = () => { sfx.tap(); if (last) finish(); else { G.i++; ask(); } };
    after.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function finish() {
    update((s) => { s.quiz.push({ t: new Date().toISOString(), p: me.id, theme, diff, score: G.right, total: qs.length }); });
    const ups = checkRankUps(me.id);
    const missed = qs.filter((_, i) => !G.log[i]);
    G.i = -1;
    frame(`
      <div class="final card"><small>${esc(title)}${diff !== 'all' ? `・${diffName(diff)}` : ''}</small>
        <div class="finalscore"><b class="led">${G.right}</b><i>/</i><b class="led">${qs.length}</b></div>
        <div class="finalsub">${missed.length ? `まちがえた ${missed.length}問は「まちがえた問題」に入れておいた` : 'ぜんぶ正解'}</div></div>
      ${missed.length ? `<div class="card"><h4>もう一度見ておく</h4><ul class="missed">${missed.map((q) => `<li><b>${esc(q.q)}</b><span>${esc(q.c[q.a])}</span></li>`).join('')}</ul></div>` : ''}
      <div class="row"><button class="btn ghost" data-again>もう${QUIZ_LEN}問</button><a class="btn primary" href="#/learn/quiz">テーマをえらぶ</a></div>`);
    root.querySelector('[data-again]').onclick = () => renderQuiz(root, theme, diff);
    if (ups.length) setTimeout(() => rankUpModal(ups), 400);
  }
  ask();
}

/* ───────── 守備フォーメーション ───────── */

const POS_NAME = { pitcher: 'ピッチャー', catcher: 'キャッチャー', first: 'ファースト', second: 'セカンド', third: 'サード', short: 'ショート', left: 'レフト', center: 'センター', right: 'ライト' };
const KIND_NAME = { ball: '打球へ', cover: 'カバー', base: 'ベースに入る', throw: '送球' };
const RLEAD = [LEAD.r1, LEAD.r2, LEAD.r3];
const myPos = () => get().settings.pos ?? null;

function posPicker() {
  const cur = myPos();
  return `<div class="pospick"><small>自分のポジション</small><div>${Object.keys(POS).map((k) => `<button class="${k === cur ? 'on' : ''}" data-pos="${k}">${POS[k].l}</button>`).join('')}<button class="${cur ? '' : 'on'}" data-pos="">なし</button></div></div>`;
}
function bindPos(root, redraw) {
  root.querySelectorAll('[data-pos]').forEach((b) => { b.onclick = () => { sfx.tap(); update((s) => { s.settings.pos = b.dataset.pos || null; }); redraw(); }; });
}

export async function renderFormList(root, cat) {
  const here = location.hash;
  loading(root, '守備フォーメーション', '#/learn');
  let data;
  try { data = await loadJSON('formations.json'); } catch { return failed(root, '#/learn'); }
  if (location.hash !== here) return;
  const cur = data.cats.find((c) => c.id === cat) ?? data.cats[0];
  const draw = () => {
    const pos = myPos();
    const list = data.list.filter((f) => f.cat === cur.id);
    root.innerHTML = `
      <header class="top"><a class="iconbtn" href="#/learn" aria-label="もどる">${icon.left}</a><div><div class="brand">フォーメーション</div><div class="brand-sub">打球ごとの、9人の動き</div></div></header>
      <section class="seg scroll" aria-label="ランナーの状況">${data.cats.map((c) => `<a class="${c.id === cur.id ? 'on' : ''}" href="#/learn/form/${c.id}">${esc(c.name.replace('ランナー', ''))}</a>`).join('')}</section>
      ${posPicker()}
      <section class="forms">${list.map((f) => {
        const mine = pos ? f.moves.find((m) => m.p === pos) : null;
        return `<a class="card formrow" href="#/form/${f.id}"><div><b>${esc(f.title)}</b>
          <small>${mine ? `<i class="k-${mine.k}"></i>${POS[pos].l}：${esc(mine.role)}` : `${f.moves.length}人が動く`}</small></div>${icon.right}</a>`;
      }).join('')}</section>`;
    bindPos(root, draw);
  };
  draw();
}

export async function renderForm(root, id) {
  const here = location.hash;
  root.innerHTML = '<div class="card"><p class="muted center">読みこみ中…</p></div>';
  let data;
  try { data = await loadJSON('formations.json'); } catch { return failed(root, '#/learn/form'); }
  if (location.hash !== here) return;
  const idx = data.list.findIndex((f) => f.id === id);
  const f = data.list[idx];
  if (!f) return failed(root, '#/learn/form');
  const cat = data.cats.find((c) => c.id === f.cat);
  const sameCat = data.list.filter((x) => x.cat === f.cat);
  const k = sameCat.indexOf(f), prev = sameCat[k - 1], next = sameCat[k + 1];
  const sit = { defense: '定位置' };
  let view, busy = false, alive = true;
  const stop = () => { alive = false; window.removeEventListener('hashchange', stop); };
  window.addEventListener('hashchange', stop);

  const base = (withArrows) => {
    const pos = myPos();
    const fielders = Object.fromEntries(Object.keys(POS).map((key) => [key, fielderPos(key, sit)]));
    return {
      sit, role: pos, fielders, action: 'ready',
      runners: f.runners.map((on, i) => (on ? { id: `r${i + 1}`, ...RLEAD[i] } : null)).filter(Boolean),
      ball: { ...f.ball },
      arrows: withArrows ? [
        ...f.moves.map((m) => ({ from: fielders[m.p], to: m.to, k: m.k })),
        ...f.throws.map((t) => ({ from: t.from, to: t.to, k: 'throw' })),
      ] : [],
    };
  };

  const draw = () => {
    const pos = myPos();
    const mine = pos ? f.moves.find((m) => m.p === pos) : null;
    root.innerHTML = `
      <div class="sim formview">
        <div class="sim-eyebrow"><a class="iconbtn" href="#/learn/form/${f.cat}" aria-label="もどる">${icon.left}</a><span>FORMATION / ${esc(cat.name)}</span><div class="tally"><b class="led">${k + 1}</b><i>/</i><b class="led">${sameCat.length}</b></div></div>
        <div class="simleft">
          <div class="simhead"><div><div class="simtitle">${esc(f.title)}</div><div class="simsub">${esc(cat.name)}・${f.outs}アウト</div></div></div>
          <div class="stage"><div class="field-wrap">
            <svg viewBox="0 0 ${W} ${H}" class="field" aria-label="守備の動きの図"></svg>
            <div class="field-caption">${['ball', 'base', 'cover', 'throw'].map((x) => `<span><i class="dot" style="background:${ARROW[x]}"></i> ${KIND_NAME[x]}</span>`).join('')}</div>
          </div></div>
          <button class="btn replay" data-run>${icon.play} 動きを見る</button>
        </div>
        <div class="simpanel">
          ${posPicker()}
          ${pos ? `<div class="keycard"><small>${POS_NAME[pos]}の仕事</small>${mine ? esc(mine.role) : 'この打球では、定位置で次のプレーにそなえる'}</div>` : ''}
          <div class="card"><h4>だれが、どこへ</h4><ul class="moves">${f.moves.map((m) => `<li class="${m.p === pos ? 'me' : ''}"><i class="k-${m.k}"></i><b>${POS[m.p].l}</b><span>${esc(m.role)}</span></li>`).join('')}</ul></div>
          <div class="card why"><p>${esc(f.desc)}</p><ul class="points">${f.keys.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
          <div class="row">${prev ? `<a class="btn ghost" href="#/form/${prev.id}">${icon.left} まえ</a>` : '<span></span>'}${next ? `<a class="btn primary" href="#/form/${next.id}">つぎ ${icon.right}</a>` : `<a class="btn primary" href="#/learn/form/${f.cat}">一覧へ</a>`}</div>
        </div>
      </div>`;
    view = base(true); paint();
    root.querySelector('[data-run]').onclick = run;
    bindPos(root, () => { if (!busy) draw(); });
  };
  const paint = () => { const svg = root.querySelector('.field'); if (svg && alive) svg.innerHTML = renderField(view); };

  async function run() {
    if (busy) return; busy = true; sfx.tap();
    const pos = myPos();
    view = base(true); view.arrows.forEach((a) => { a.dim = true; });
    const from = { x: HOME.x, y: HOME.y - 6 };
    view.ball = { ...from }; paint(); await sleep(350); sfx.bat();
    await tween(from, f.ball, 600, (p) => { view.ball = p; paint(); });
    if (f.moves.some((m) => m.p === pos)) { view.action = 'run'; view.flip = f.moves.find((m) => m.p === pos).to.x < view.fielders[pos].x; }
    await Promise.all(f.moves.map((m) => { const o = { ...view.fielders[m.p] }; return tween(o, m.to, 950, (p) => { view.fielders[m.p] = { x: p.x, y: p.y }; paint(); }); }));
    view.action = 'ready'; sfx.catch(); paint(); await sleep(250);
    for (const t of f.throws) {
      if (!alive) break;
      await tween(t.from, t.to, 520, (p) => { view.ball = p; paint(); }, { arc: 8 }); sfx.catch(); await sleep(160);
    }
    view.action = 'cheer'; paint(); await sleep(900);
    busy = false;
    if (alive) { view = base(true); paint(); }
  }
  draw();
}
