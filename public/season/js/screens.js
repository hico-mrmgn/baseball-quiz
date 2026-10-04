// ホーム・成長・ドリル・シーズン・保護者メニュー。

import { ISSUES, DRILLS, MEASURES, GAME_KINDS, GRADES, RANK_WORD } from './catalog.js';
import { SCENES, sceneById } from './scenes.js';
import {
  get, update, profile, today, addDays, fmtDate, exportData, importData, resetAll,
} from './store.js';
import { axisStats, abilityStats, battingScore, pitchingScore, scoreOf, rxEffect, prepFor, checkRankUps, battingLine, pitchingLine, fmtAvg, fmt1 } from './growth.js';
import { buildDaily } from './sim.js';
import { sfx } from './sound.js';
import { h, esc, icon, toast, modal, go, rankUpModal } from './ui.js';

const issueById = Object.fromEntries(ISSUES.map((i) => [i.id, i]));
const drillById = Object.fromEntries(DRILLS.map((d) => [d.id, d]));
const kindName = (id) => GAME_KINDS.find((k) => k.id === id)?.name ?? '';
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];

/* ───────── レーダー ───────── */
export function radar(stats, { size = 260, ghost = null, small = false } = {}) {
  const c = size / 2, R = size * (small ? 0.36 : 0.33), n = stats.length;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [c + Math.cos(a) * R * v, c + Math.sin(a) * R * v]; };
  const poly = (vals) => vals.map((v, i) => pt(i, Math.max(0.04, v / 100)).map((x) => x.toFixed(1)).join(',')).join(' ');
  const rings = [0.25, 0.5, 0.75, 1].map((k) => `<polygon points="${stats.map((_, i) => pt(i, k).join(',')).join(' ')}" fill="${k === 1 ? '#fff' : 'none'}" stroke="#d0e1ed" stroke-width="${k === 1 ? 1.4 : 0.8}"/>`).join('');
  const spokes = stats.map((_, i) => { const [x, y] = pt(i, 1); return `<line x1="${c}" y1="${c}" x2="${x}" y2="${y}" stroke="#e1ecf4" stroke-width=".8"/>`; }).join('');
  const labels = stats.map((s, i) => {
    const [x, y] = pt(i, small ? 1.3 : 1.28);
    const rk = s.n ? `${s.firm ? '' : '仮'}${s.rank}` : '—';
    return small
      ? `<text x="${x}" y="${y + 3}" text-anchor="middle" font-size="${size * 0.05}" font-weight="900" fill="#526d7f">${esc(s.name.replace(/力$/, ''))}</text>`
      : `<text x="${x}" y="${y - 2}" text-anchor="middle" font-size="12.5" font-weight="900" fill="#233c52">${esc(s.name)}</text>
         <text x="${x}" y="${y + 14}" text-anchor="middle" font-size="13" class="led" fill="${s.n ? '#1762aa' : '#a9c0d1'}">${rk}${s.n ? `  ${s.value}` : ''}</text>`;
  }).join('');
  const dots = stats.map((s, i) => { const [x, y] = pt(i, Math.max(0.04, s.value / 100)); return `<circle cx="${x}" cy="${y}" r="${small ? 2.4 : 3.6}" fill="#368ad2" stroke="#fff" stroke-width="1.2"/>`; }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" class="radar" role="img" aria-label="能力のレーダー">
    ${rings}${spokes}
    ${ghost ? `<polygon points="${poly(ghost.map((s) => s.value))}" fill="rgba(35,60,82,.06)" stroke="#89a2b4" stroke-width="1.2" stroke-dasharray="4 3"/>` : ''}
    <polygon points="${poly(stats.map((s) => s.value))}" fill="rgba(54,138,210,.24)" stroke="#368ad2" stroke-width="2.2" stroke-linejoin="round"/>
    ${dots}${labels}</svg>`;
}

/* ───────── ホーム ───────── */
export function renderHome(root) {
  const s = get(), me = profile(), date = today();
  const set = buildDaily(date); const done = s.daily[date]?.[me.id];
  const stats = abilityStats(me.id);
  const played = stats.some((a) => a.n);
  const days = [...Array(7)].map((_, i) => addDays(date, i - 6));
  const drillDays = new Set(s.drillLog.filter((d) => d.p === me.id).map((d) => d.date));
  // 場面の練習・知識クイズ・まえのアプリでの練習も「やった日」に数える
  const studyDays = new Set([...s.plays.filter((p) => p.p === me.id).map((p) => today(new Date(p.t))), ...s.quiz.filter((q) => q.p === me.id).map((q) => today(new Date(q.t))), ...(me.id === 'p1' ? s.oldDays : [])]);
  const dn = new Date();

  root.innerHTML = `
    <header class="top">
      <div><div class="brand">MY SEASON</div><div class="brand-sub">${dn.getMonth() + 1}月${dn.getDate()}日（${WEEK[dn.getDay()]}）</div></div>
      <div class="top-actions">
        <button class="who" data-switch aria-label="プレーヤーを切りかえる"><span class="num">${esc(me.number ?? '')}</span>${esc(me.name)}${icon.swap}</button>
        <a class="iconbtn" href="#/parent" aria-label="保護者メニュー">${icon.gear}</a>
      </div>
    </header>

    <section class="hero ${done ? 'done' : ''}">
      <div class="hero-art" aria-hidden="true"></div>
      <div class="hero-body">
        <small>今日の試合</small>
        <h1><span>vs</span> ${esc(set.opp)}</h1>
        ${done
          ? `<div class="hero-score"><b class="led">${done.us}</b><i>-</i><b class="led">${done.them}</b><span>最善手 ${done.best}/${done.total}</span></div>
             <a class="btn light" href="#/play/free/all">べつの場面で練習 ${icon.right}</a>`
          : `<p>${set.scenes.length}場面。投げる前に、先に決めろ。</p>
             <a class="btn hot" href="#/play/daily">${icon.play} はじめる</a>`}
      </div>
    </section>

    <section class="strip" aria-label="この7日間">
      ${days.map((d) => {
        const dd = new Date(`${d}T12:00:00`); const g = s.daily[d]?.[me.id] || studyDays.has(d); const dr = drillDays.has(d);
        return `<div class="day ${d === date ? 'today' : ''}"><span>${WEEK[dd.getDay()]}</span><i class="${g ? 'g' : ''}"></i><i class="${dr ? 'd' : ''}"></i></div>`;
      }).join('')}
      <div class="strip-legend"><i class="g"></i>場面・クイズ<i class="d"></i>自主練</div>
    </section>

    ${s.rx.length ? `<section><h2>いま取り組んでいること</h2>
      ${s.rx.map((r) => { const is = issueById[r.issue]; if (!is) return ''; return `
        <div class="card rx">
          <div class="rx-head"><span class="rx-flag">${icon.flag}</span><div><b>${esc(is.name)}</b><small>${fmtDate(r.since)}から</small></div></div>
          ${effectRow(rxEffect(r.issue, r.since))}
          <div class="row">
            ${is.scenes.length ? `<a class="btn ghost small" href="#/play/free/rx:${is.id}">${icon.play} 場面で練習</a>` : ''}
            ${is.drills.length ? `<a class="btn ghost small" href="#/drills">${icon.drill} 自主練ドリル</a>` : ''}
          </div>
        </div>`; }).join('')}</section>` : ''}

    <section class="two">
      <a class="card tile" href="#/growth">
        <h3>能力レーダー</h3>
        ${played ? `${radar(stats, { size: 200, small: true })}<div class="mini-ranks">${stats.map((a) => `<span class="${a.n ? '' : 'none'}"><i>${a.name.slice(0, 2)}</i><b class="led">${a.n ? a.rank : '—'}</b></span>`).join('')}</div>` : '<div class="empty-radar">試合・計測・練習を入れると、ここに形ができる</div>'}
      </a>
      <div class="tiles">
        <a class="card tile mini" href="#/learn/scenes"><span class="tile-ic">${icon.ball}</span><b>判断の場面</b><small>${SCENES.length}場面</small></a>
        <a class="card tile mini" href="#/learn/quiz"><span class="tile-ic off">${icon.learn}</span><b>知識クイズ</b><small>1170問</small></a>
        <a class="card tile mini" href="#/learn/form"><span class="tile-ic dr">${icon.growth}</span><b>フォーメーション</b><small>190パターン</small></a>
      </div>
    </section>`;

  root.querySelector('[data-switch]').onclick = () => {
    sfx.tap();
    update((st) => { const i = st.profiles.findIndex((p) => p.id === st.active); st.active = st.profiles[(i + 1) % st.profiles.length].id; });
    renderHome(root);
  };
}

/* ───────── 成長 ───────── */
const SRC = { game: '試合', measure: '計測', app: 'アプリ', drill: '自主練' };
const BOOST = {
  bat: [['#/play/free/role:batter', '打席の場面'], ['#/quiz/batting/all', 'バッティングのクイズ'], ['#/drills', '素振り・ティー']],
  pit: [['#/play/free/role:pitcher', 'ピッチャーの場面'], ['#/quiz/pitcher/all', 'ピッチャーのクイズ'], ['#/drills', 'シャドー・低めへ']],
  fld: [['#/play/free/def', '守りの場面'], ['#/learn/form', 'フォーメーション'], ['#/drills', '持ちかえ・かべ当て']],
  run: [['#/play/free/off', '走塁の場面'], ['#/quiz/baserun/all', '走塁のクイズ'], ['#/drills', 'スタートの練習']],
  iq: [['#/play/daily', '今日の試合'], ['#/learn/scenes', '判断の場面'], ['#/learn/quiz', '知識クイズ']],
};

/** 取り組みの成果：取り組む前の試合の数字 → 取り組んでからの数字 */
function effectRow(e) {
  const work = [e.work.plays ? `場面 ${e.work.plays}回` : '', e.work.drillDays ? `自主練 ${e.work.drillDays}日` : ''].filter(Boolean).join('・');
  if (!e.label) return work ? `<p class="effect-work">取り組み：${work}</p>` : '';
  const after = e.after === null ? '<em class="wait">次の試合で確かめる</em>' : `<b class="led ${e.better === true ? 'up' : e.better === false ? 'down' : ''}">${e.after}</b>`;
  const word = e.after === null ? '' : e.better === true ? '<span class="tag up">よくなった</span>' : e.better === false ? '<span class="tag down">まだ出ていない</span>' : '<span class="tag">変わらず</span>';
  return `<div class="effect"><small>${esc(e.label)}${e.after !== null ? `（取り組んでから ${e.n}${e.unit}）` : ''}</small>
    <div class="effect-row"><span class="led">${e.before ?? '—'}</span>${icon.right}${after}${word}</div>
    ${work ? `<p class="effect-work">取り組み：${work}</p>` : ''}</div>`;
}

export function renderGrowth(root) {
  const s = get(), me = profile();
  const stats = abilityStats(me.id);
  const ghostDate = addDays(today(), -30);
  const past = abilityStats(me.id, ghostDate);
  const ghost = past.some((a) => a.n) ? past : null;
  const judge = axisStats(me.id);

  root.innerHTML = `
    <header class="top"><div><div class="brand">成長</div><div class="brand-sub">${esc(me.name)}</div></div></header>
    <section class="card radar-card">
      ${radar(stats, { size: 340, ghost })}
      <p class="muted center">試合の成績・実測値・アプリでの練習から出している。Sは、ジュニア選考で通用する目安。${ghost ? '点線は30日前。' : ''}</p>
    </section>
    <section><h2>5つの力</h2>
      <div class="axes">${stats.map((a, i) => {
        const d = ghost && past[i].n && a.n ? a.value - past[i].value : 0;
        return `<details class="card ability">
          <summary class="axis">
            <div class="axis-rank ${a.n ? '' : 'none'}">${a.n ? a.rank : '—'}${a.n && !a.firm ? '<small>仮</small>' : ''}</div>
            <div class="axis-body"><b>${esc(a.name)}</b>${d ? `<span class="delta ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</span>` : ''}<small>${esc(a.hint)}</small>
              <div class="bar"><i style="width:${a.value}%"></i></div></div>
            <div class="axis-val led">${a.n ? a.value : ''}</div>
          </summary>
          <div class="parts">
            ${a.parts.length ? a.parts.map((p) => `<div class="part"><span class="src s-${p.src}">${SRC[p.src]}</span><div><b>${esc(p.label)}</b><small>${esc(p.text)}</small></div><div class="bar"><i style="width:${p.score}%"></i></div><span class="led">${p.score}</span></div>`).join('')
              : `<p class="muted">${me.id === 'p1' ? 'まだ材料がない。試合か実測値を入れると出る。' : '試合と実測値は、選手本人のぶんだけを数えている。'}</p>`}
            <div class="boost"><small>ここを伸ばす</small><div>${BOOST[a.id].map(([href, name]) => `<a class="btn ghost small" href="${href}">${name}</a>`).join('')}</div></div>
          </div>
        </details>`; }).join('')}</div>
    </section>
    ${s.rx.length ? `<section><h2>取り組みの成果</h2>${s.rx.map((r) => { const is = issueById[r.issue]; if (!is) return ''; return `<div class="card rx"><div class="rx-head"><span class="rx-flag">${icon.flag}</span><div><b>${esc(is.name)}</b><small>${fmtDate(r.since)}から</small></div></div>${effectRow(rxEffect(r.issue, r.since))}</div>`; }).join('')}</section>` : ''}
    <section><h2>判断力のうちわけ</h2>
      <div class="card judge">${judge.map((a) => `<div class="jrow"><b>${esc(a.name)}</b><div class="bar"><i style="width:${a.value}%"></i></div><span class="led">${a.n ? `${a.firm ? '' : '仮'}${a.rank} ${a.value}` : '—'}</span></div>`).join('')}
        <p class="muted">場面の直近20プレーの最善手率。しばらくやらないと少し下がる。</p></div>
    </section>
    <section><h2>体の記録</h2>${bodyCards(s)}</section>
    <section><h2>シーズンの歩み</h2>${timeline(s, me)}</section>`;
}

/** 1試合の評価（打つ・投げる）。ランクと言葉で返す */
function gameMarks(g) {
  const b = g.bat?.pa >= 2 ? scoreOf(battingScore([g])) : null; // 1打席だけの試合は評価しない
  const p = g.pit?.outs && !g.excluded ? scoreOf(pitchingScore([g])) : null;
  return { b, p };
}
const markChips = (g) => { const { b, p } = gameMarks(g); return `${b ? `<span class="mark r${b.rank}">打<b class="led">${b.rank}</b></span>` : ''}${p ? `<span class="mark r${p.rank}">投<b class="led">${p.rank}</b></span>` : ''}`; };

function bodyCards(s) {
  const cards = MEASURES.map((m) => {
    const pts = s.measures.filter((x) => x.id === m.id).sort((a, b) => a.date.localeCompare(b.date));
    if (!pts.length) return '';
    const last = pts[pts.length - 1];
    const vals = pts.map((p) => p.value).concat(m.target ?? []);
    const lo = Math.min(...vals), hi = Math.max(...vals), pad = (hi - lo || 1) * 0.25;
    const y = (v) => 46 - ((v - (lo - pad)) / (hi - lo + pad * 2)) * 40;
    const x = (i) => (pts.length === 1 ? 70 : 8 + (i * 124) / (pts.length - 1));
    return `<div class="card body">
      <div><b>${esc(m.name)}</b><div class="body-val"><span class="led">${last.value}</span>${esc(m.unit)}</div><small>${fmtDate(last.date)}${m.targetLabel ? `　目標 ${esc(m.targetLabel)}` : ''}</small></div>
      <svg viewBox="0 0 140 52" class="spark" aria-hidden="true">
        ${m.target ? `<line x1="4" x2="136" y1="${y(m.target)}" y2="${y(m.target)}" stroke="#6dbb52" stroke-width="1.2" stroke-dasharray="4 3"/>` : ''}
        ${pts.length > 1 ? `<polyline points="${pts.map((p, i) => `${x(i)},${y(p.value)}`).join(' ')}" fill="none" stroke="#368ad2" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
        ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.value)}" r="3.2" fill="#368ad2" stroke="#fff" stroke-width="1.2"/>`).join('')}
      </svg></div>`;
  }).join('');
  return cards || '<div class="card muted">実測値を入れると、ここに折れ線が出る。（保護者メニューから）</div>';
}

function timeline(s, me) {
  const items = [];
  s.games.forEach((g) => items.push({ date: g.date, type: 'game', title: `${g.opp}戦${g.us !== null && g.us !== undefined ? `　${g.us}-${g.them}` : ''}`, sub: [kindName(g.kind), g.memo].filter(Boolean).join('　'), href: `#/game/${g.id}` }));
  s.rx.forEach((r) => items.push({ date: r.since, type: 'rx', title: `取り組みはじめ：${issueById[r.issue]?.name ?? ''}` }));
  s.events.filter((e) => e.p === me.id).forEach((e) => items.push({ date: e.date, type: e.type, title: e.type === 'rank' ? `成長　${e.text}` : e.text }));
  s.measures.forEach((m) => { const def = MEASURES.find((x) => x.id === m.id); if (def) items.push({ date: m.date, type: 'measure', title: `計測　${def.name} ${m.value}${def.unit}` }); });
  // 自主練は週ごとにまとめる
  const weeks = new Map();
  s.drillLog.filter((d) => d.p === me.id).forEach((d) => {
    const dt = new Date(`${d.date}T12:00:00`); dt.setDate(dt.getDate() - dt.getDay());
    const key = today(dt); const w = weeks.get(key) ?? { days: new Set(), by: {} };
    w.days.add(d.date); w.by[d.drill] = (w.by[d.drill] ?? 0) + (d.count ?? 0); weeks.set(key, w);
  });
  weeks.forEach((w, key) => items.push({ date: addDays(key, 6), type: 'drill', title: `自主練　${w.days.size}日`, sub: Object.entries(w.by).map(([id, n]) => `${drillById[id]?.name ?? id}${n ? ` ${n}` : ''}`).join('、') }));
  // 知識クイズの週まとめ
  const qw = new Map();
  s.quiz.filter((q) => q.p === me.id).forEach((q) => {
    const dt = new Date(q.t); dt.setHours(12); dt.setDate(dt.getDate() - dt.getDay());
    const key = today(dt); const w = qw.get(key) ?? { n: 0, right: 0, total: 0 }; w.n++; w.right += q.score; w.total += q.total; qw.set(key, w);
  });
  qw.forEach((w, key) => items.push({ date: addDays(key, 6), type: 'play', title: `知識クイズ　${w.n}回`, sub: `${w.total}問のうち正解 ${w.right}` }));
  // 試合（シミュ）の週まとめ
  const pw = new Map();
  s.plays.filter((p) => p.p === me.id).forEach((p) => {
    const dt = new Date(`${p.t.slice(0, 10)}T12:00:00`); dt.setDate(dt.getDate() - dt.getDay());
    const key = today(dt); const w = pw.get(key) ?? { n: 0, best: 0 }; w.n++; if (p.score === 3) w.best++; pw.set(key, w);
  });
  pw.forEach((w, key) => items.push({ date: addDays(key, 6), type: 'play', title: `場面の練習　${w.n}プレー`, sub: `最善手 ${w.best}` }));

  if (!items.length) return '<div class="card muted">試合・練習・計測が、ここに1本の線で並ぶ。</div>';
  items.sort((a, b) => b.date.localeCompare(a.date));
  return `<ol class="tl">${items.map((it) => `<li class="${it.type}"><time>${fmtDate(it.date)}</time>
    ${it.href ? `<a href="${it.href}">` : '<div>'}<b>${esc(it.title)}</b>${it.sub ? `<small>${esc(it.sub)}</small>` : ''}${it.href ? '</a>' : '</div>'}</li>`).join('')}</ol>`;
}

/* ───────── ドリル ───────── */
export function renderDrills(root) {
  const s = get(), me = profile(), date = today();
  const rxDrills = [...new Set(s.rx.flatMap((r) => issueById[r.issue]?.drills ?? []))];
  const order = [...rxDrills, ...DRILLS.map((d) => d.id).filter((id) => !rxDrills.includes(id))];
  const todays = (id) => s.drillLog.filter((d) => d.p === me.id && d.date === date && d.drill === id);
  const days = [...Array(14)].map((_, i) => addDays(date, i - 13));
  const doneDays = new Set(s.drillLog.filter((d) => d.p === me.id).map((d) => d.date));

  root.innerHTML = `
    <header class="top"><div><div class="brand">自主練</div><div class="brand-sub">やった数を、自分でつける</div></div></header>
    <section class="strip wide" aria-label="この2週間">${days.map((d) => `<div class="day ${d === date ? 'today' : ''}"><span>${+d.slice(8)}</span><i class="${doneDays.has(d) ? 'd' : ''}"></i></div>`).join('')}</section>
    <section class="drills">${order.map((id) => {
      const d = drillById[id]; const logs = todays(id); const total = logs.reduce((a, x) => a + (x.count ?? 0), 0);
      const val = [...logs].reverse().find((x) => x.value !== undefined && x.value !== null)?.value;
      return `<div class="card drill ${rxDrills.includes(id) ? 'rxd' : ''}" data-id="${id}">
        <div class="drill-head"><div><b>${esc(d.name)}</b>${rxDrills.includes(id) ? '<span class="chip src">いま取り組み中</span>' : ''}<p>${esc(d.how)}</p></div>
          <div class="drill-total"><span class="led">${total}</span>${esc(d.unit)}</div></div>
        <div class="row steps">${[1, 5, 10].map((n) => `<button class="step" data-add="${n}">+${n}</button>`).join('')}<button class="step undo" data-add="-1" aria-label="1へらす">${icon.minus}</button></div>
        ${d.measure ? `<label class="measure"><span>${esc(d.measure.label)}</span><input type="number" inputmode="decimal" step="${d.measure.step ?? 1}" value="${val ?? ''}" placeholder="—" data-val><em>${esc(d.measure.unit)}</em></label>` : ''}
      </div>`; }).join('')}</section>`;

  root.querySelectorAll('.drill').forEach((card) => {
    const id = card.dataset.id;
    card.querySelectorAll('[data-add]').forEach((b) => {
      b.onclick = () => {
        const n = +b.dataset.add;
        const cur = todays(id).reduce((a, x) => a + (x.count ?? 0), 0);
        if (cur + n < 0) return;
        sfx.tap();
        update((st) => { st.drillLog.push({ date, p: me.id, drill: id, count: n }); });
        rankUpModal(checkRankUps(me.id));
        card.querySelector('.drill-total .led').textContent = cur + n;
      };
    });
    const input = card.querySelector('[data-val]');
    if (input) input.onchange = () => {
      const v = input.value === '' ? null : Number(input.value);
      update((st) => { st.drillLog.push({ date, p: me.id, drill: id, count: 0, value: v }); });
      toast('つけました');
    };
  });
}

/* ───────── シーズン ───────── */
export function renderSeason(root) {
  const s = get(); const games = [...s.games].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  if (!games.length) {
    root.innerHTML = `<header class="top"><div><div class="brand">シーズン</div><div class="brand-sub">じっさいの試合の記録</div></div></header>
      <div class="card empty"><h3>まだ試合が入っていません</h3><p>試合の記録は、この端末の中だけに置きます。保護者メニューから、1試合ずつ入れるか、ファイルを読みこんでください。</p>
      <a class="btn primary" href="#/parent">保護者メニューへ</a></div>`;
    return;
  }
  const withScore = games.filter((g) => g.us !== null && g.us !== undefined);
  const w = withScore.filter((g) => g.us > g.them).length, l = withScore.filter((g) => g.us < g.them).length;
  const all = battingLine(games);
  const byGrade = GRADES.map((gr) => ({ gr, line: battingLine(games.filter((g) => g.grade === gr.id)) })).filter((x) => x.line.pa);
  const months = [...new Set(games.filter((g) => g.pit && !g.excluded).map((g) => g.date.slice(0, 7)))].sort();
  const pit = pitchingLine(games);

  root.innerHTML = `
    <header class="top"><div><div class="brand">シーズン</div><div class="brand-sub">${games.length}試合${withScore.length ? `　${w}勝${l}敗（スコアのある${withScore.length}試合）` : ''}</div></div></header>
    <section class="card table">
      <h3>打つ</h3>
      <table><thead><tr><th></th><th>打席</th><th>打数</th><th>安打</th><th>四球</th><th>三振</th><th>盗塁</th><th>打率</th><th>出塁</th></tr></thead><tbody>
        ${byGrade.map(({ gr, line }) => `<tr><th>対${esc(gr.name.replace('主体', ''))}</th>${cells(line)}</tr>`).join('')}
        <tr class="sum"><th>ぜんぶ</th>${cells(all)}</tr></tbody></table>
    </section>
    ${pit.g ? `<section class="card table"><h3>投げる</h3>
      <table><thead><tr><th></th><th>登板</th><th>回</th><th>球数</th><th>三振</th><th>四球</th><th>失点</th><th>四球/9</th><th>三振/9</th></tr></thead><tbody>
        ${months.map((m) => { const p = pitchingLine(games.filter((g) => g.date.startsWith(m))); return `<tr><th>${+m.slice(5)}月</th>${pcells(p)}</tr>`; }).join('')}
        <tr class="sum"><th>ぜんぶ</th>${pcells(pit)}</tr></tbody></table>
      ${games.some((g) => g.excluded) ? '<p class="muted">投球練習なしの登板など、外すと決めた試合は入れていない。</p>' : ''}</section>` : ''}
    <section><h2>試合</h2><div class="games">${games.map((g) => `
      <a class="card game" href="#/game/${g.id}">
        <time>${fmtDate(g.date)}</time>
        <div><b>${esc(g.opp)}</b><small>${esc(kindName(g.kind))}${g.pos ? `　${esc(g.pos)}` : ''}</small></div>
        <div class="marks">${markChips(g)}</div>
        <div class="game-score led">${g.us !== null && g.us !== undefined ? `${g.us}-${g.them}` : ''}</div>${icon.right}
      </a>`).join('')}</div></section>`;
}
const cells = (b) => `<td>${b.pa}</td><td>${b.ab}</td><td>${b.h}</td><td>${b.bb}</td><td>${b.so}</td><td>${b.sb}</td><td>${fmtAvg(b.avg)}</td><td>${fmtAvg(b.obp)}</td>`;
const pcells = (p) => `<td>${p.g}</td><td>${p.ip}</td><td>${p.p}</td><td>${p.k}</td><td>${p.bb}</td><td>${p.r}</td><td>${fmt1(p.bb9)}</td><td>${fmt1(p.k9)}</td>`;

export function renderGame(root, id) {
  const s = get(); const g = s.games.find((x) => x.id === id);
  if (!g) { root.innerHTML = '<div class="card">この試合は見つかりません。</div>'; return; }
  const b = g.bat, p = g.pit;
  const mk = gameMarks(g), prep = prepFor(g);
  const verdict = (m, res) => (m ? `<div class="gverdict r${m.rank}"><span class="led">${m.rank}</span><div><b>${RANK_WORD[m.rank]}</b><small>${res.parts.map((x) => `${x.label} ${x.score}`).join('　')}</small></div></div>` : '');
  const ip = p ? `${Math.floor(p.outs / 3)}${p.outs % 3 ? `.${p.outs % 3}` : ''}` : '';
  root.innerHTML = `
    <header class="top"><a class="iconbtn" href="#/season" aria-label="もどる">${icon.left}</a><div><div class="brand">${esc(g.opp)}戦</div><div class="brand-sub">${fmtDate(g.date)}　${esc(kindName(g.kind))}</div></div></header>
    <section class="card gamehead">
      ${g.us !== null && g.us !== undefined ? `<div class="finalscore"><span>じぶんたち</span><b class="led">${g.us}</b><i>-</i><b class="led">${g.them}</b><span>${esc(g.opp)}</span></div>` : ''}
      ${g.pos ? `<p class="center"><b>${esc(g.pos)}</b></p>` : ''}
      ${g.excluded ? '<p class="muted center">この試合の投球は、成績の集計から外している。</p>' : ''}
    </section>
    ${b ? `<section class="card"><h3>打つ</h3>${verdict(mk.b, battingScore([g]))}<div class="stats">${stat('打席', b.pa)}${stat('安打', b.h)}${stat('四球', b.bb)}${stat('三振', b.so)}${stat('盗塁', b.sb)}${stat('打点', b.rbi)}</div>${b.text ? `<p class="note">${esc(b.text)}</p>` : ''}</section>` : ''}
    ${p ? `<section class="card"><h3>投げる</h3>${verdict(mk.p, pitchingScore([g]))}<div class="stats">${stat('回', ip)}${stat('球数', p.p)}${stat('三振', p.k)}${stat('四球', p.bb)}${stat('安打', p.h)}${stat('失点', p.r)}</div></section>` : ''}
    ${prep.plays || prep.quiz || prep.drillDays ? `<section class="card prep"><h3>この試合までにやったこと</h3><small class="muted">${fmtDate(prep.from)}〜${fmtDate(g.date)}</small>
      <div class="stats">${stat('場面', prep.plays)}${stat('最善手', prep.best)}${stat('クイズ', prep.quiz)}${stat('自主練の日', prep.drillDays)}</div></section>` : ''}
    ${g.memo ? `<section class="card"><h3>メモ</h3><p class="note">${esc(g.memo)}</p></section>` : ''}
    ${(g.issues ?? []).length ? `<section><h2>次にやること</h2>${g.issues.map((i) => { const is = issueById[i]; if (!is) return ''; return `<div class="card rx"><div class="rx-head"><span class="rx-flag">${icon.flag}</span><div><b>${esc(is.name)}</b></div></div>
      <div class="row">${is.scenes.length ? `<a class="btn ghost small" href="#/play/free/rx:${is.id}">${icon.play} 場面で練習</a>` : ''}${is.drills.length ? `<a class="btn ghost small" href="#/drills">${icon.drill} ドリル</a>` : ''}</div></div>`; }).join('')}</section>` : ''}
    ${(g.scenes ?? []).length ? `<section><h2>この試合の場面</h2>${g.scenes.map((sid) => { const sc = sceneById[sid]; if (!sc) return ''; const v = s.sceneVideos[sid];
      return `<div class="card scene-row"><div><b>${esc(sc.key)}</b><small>${esc(sc.src)}</small></div>
        <div class="row"><a class="btn ghost small" href="#/play/free/one:${sid}">${icon.play} やってみる</a>${v ? `<a class="btn ghost small" target="_blank" rel="noopener" href="https://www.youtube.com/watch?v=${encodeURIComponent(v.id)}&t=${v.t | 0}s">${icon.video} 動画</a>` : ''}</div></div>`; }).join('')}</section>` : ''}
    <div class="row"><a class="btn ghost" href="#/parent/game/${g.id}">${icon.pen} なおす</a></div>`;
}
const stat = (l, v) => `<div><span class="led">${v ?? 0}</span><small>${l}</small></div>`;

/* ───────── 保護者メニュー ───────── */
export function renderParent(root, editId) {
  const s = get();
  const edit = editId ? s.games.find((g) => g.id === editId) : null;
  root.innerHTML = `
    <header class="top"><a class="iconbtn" href="#/home" aria-label="もどる">${icon.left}</a><div><div class="brand">保護者メニュー</div><div class="brand-sub">記録はこの端末の中だけに保存されます</div></div></header>

    <section class="card form"><h3>プレーヤー</h3>
      ${s.profiles.map((p, i) => `<div class="frow"><label>名前<input data-pname="${i}" value="${esc(p.name)}" maxlength="10"></label><label class="narrow">背番号<input data-pnum="${i}" type="number" value="${esc(p.number ?? '')}"></label></div>`).join('')}
      <label class="check"><input type="checkbox" data-sound ${s.settings.sound ? 'checked' : ''}> 音を出す</label>
    </section>

    <section class="card form"><h3>いま取り組むこと（2つまで）</h3>
      <div class="picks">${ISSUES.map((i) => `<label class="pick"><input type="checkbox" data-rx="${i.id}" ${s.rx.some((r) => r.issue === i.id) ? 'checked' : ''}><span>${esc(i.name)}</span></label>`).join('')}</div>
      <p class="muted">えらんだ課題の場面が「今日の試合」に多めに出て、ドリルが自主練の先頭に並びます。</p>
    </section>

    <section class="card form"><h3>実測値を入れる</h3>
      <div class="frow"><label>日付<input type="date" data-mdate value="${today()}"></label>
        <label>項目<select data-mid>${MEASURES.map((m) => `<option value="${m.id}">${esc(m.name)}（${esc(m.unit)}）</option>`).join('')}</select></label>
        <label class="narrow">値<input type="number" inputmode="decimal" step="0.01" data-mval></label></div>
      <button class="btn ghost" data-madd>${icon.plus} 入れる</button>
      ${s.measures.length ? `<ul class="mini-list">${[...s.measures].reverse().slice(0, 8).map((m) => { const d = MEASURES.find((x) => x.id === m.id); return `<li>${fmtDate(m.date)}　${esc(d?.name ?? m.id)} <b>${m.value}${esc(d?.unit ?? '')}</b><button class="link" data-mdel="${m.date}|${m.id}">消す</button></li>`; }).join('')}</ul>` : ''}
    </section>

    <section class="card form" id="gameform"><h3>${edit ? '試合をなおす' : '試合を入れる'}</h3>${gameForm(edit)}</section>

    ${s.legacy && !s.legacy.reset && (s.legacy.drills || s.legacy.days || s.legacy.quiz || s.legacy.wrong) ? `<section class="card form"><h3>まえのアプリからの引きつぎ</h3>
      <p class="muted">この端末に残っていた「つぎ、どうする？」の記録を、${fmtDate(s.legacy.at)}に移しました。</p>
      <ul class="mini-list"><li>練習した日 <b>${s.legacy.days}日</b></li><li>自主練の記録 <b>${s.legacy.drills}件</b></li><li>クイズの戦績 <b>${s.legacy.quiz}回</b></li><li>まちがえた問題 <b>${s.legacy.wrong}問</b></li></ul>
    </section>` : ''}

    <section class="card form"><h3>データの持ち運び</h3>
      <p class="muted">試合の成績や実測値は個人のデータなので、アプリには入れずにこの端末に保存しています。別の端末へはファイルで移します。</p>
      <div class="row"><button class="btn ghost" data-export>書き出す</button><label class="btn ghost filebtn">読みこむ<input type="file" accept="application/json,.json" data-import hidden></label></div>
      <button class="link danger" data-reset>この端末の記録をぜんぶ消す</button>
      <a class="link" href="/?classic">まえのアプリ（つぎ、どうする？）をひらく</a>
    </section>`;

  root.querySelectorAll('[data-pname]').forEach((el) => { el.onchange = () => update((st) => { st.profiles[+el.dataset.pname].name = el.value.trim() || 'じぶん'; }); });
  root.querySelectorAll('[data-pnum]').forEach((el) => { el.onchange = () => update((st) => { st.profiles[+el.dataset.pnum].number = el.value === '' ? '' : +el.value; }); });
  root.querySelector('[data-sound]').onchange = (e) => update((st) => { st.settings.sound = e.target.checked; });
  root.querySelectorAll('[data-rx]').forEach((el) => {
    el.onchange = () => {
      const id = el.dataset.rx;
      if (el.checked && get().rx.length >= 2) { el.checked = false; toast('2つまでです'); return; }
      update((st) => { st.rx = el.checked ? [...st.rx, { issue: id, since: today() }] : st.rx.filter((r) => r.issue !== id); });
    };
  });
  root.querySelector('[data-madd]').onclick = () => {
    const date = root.querySelector('[data-mdate]').value, id = root.querySelector('[data-mid]').value, v = root.querySelector('[data-mval]').value;
    if (!date || v === '') { toast('日付と値を入れてください'); return; }
    update((st) => { st.measures = st.measures.filter((m) => !(m.date === date && m.id === id)); st.measures.push({ date, id, value: Number(v) }); st.measures.sort((a, b) => a.date.localeCompare(b.date)); });
    toast('入れました'); renderParent(root, editId); rankUpModal(checkRankUps('p1'));
  };
  root.querySelectorAll('[data-mdel]').forEach((b) => { b.onclick = () => { const [date, id] = b.dataset.mdel.split('|'); update((st) => { st.measures = st.measures.filter((m) => !(m.date === date && m.id === id)); }); renderParent(root, editId); }; });
  bindGameForm(root, edit);
  root.querySelector('[data-export]').onclick = () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = h(`<a download="season-${today()}.json"></a>`); a.href = URL.createObjectURL(blob); document.body.append(a); a.click(); a.remove();
  };
  root.querySelector('[data-import]').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = importData(await f.text()); toast(`読みこみました：試合${r.games}　計測${r.measures}`); renderParent(root); rankUpModal(checkRankUps('p1')); }
    catch { toast('読みこめませんでした。ファイルを確かめてください'); }
  };
  root.querySelector('[data-reset]').onclick = () => {
    const m = modal(`<h3>ぜんぶ消す？</h3><p class="muted">この端末の試合・練習・計測の記録がすべて消えます。先に「書き出す」で残しておけます。</p>
      <div class="row"><button class="btn ghost" data-close>やめる</button><button class="btn danger" data-yes>消す</button></div>`);
    m.el.querySelector('[data-yes]').onclick = () => { resetAll(); m.close(); toast('消しました'); go('#/home'); };
  };
  if (edit) root.querySelector('#gameform').scrollIntoView();
}

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
    toast(edit ? '上書きしました' : '入れました'); go(`#/game/${g.id}`); setTimeout(() => rankUpModal(checkRankUps('p1')), 300);
  };
  const del = root.querySelector('[data-gdel]');
  if (del) del.onclick = () => { update((st) => { st.games = st.games.filter((x) => x.id !== edit.id); }); toast('消しました'); go('#/season'); };
}
