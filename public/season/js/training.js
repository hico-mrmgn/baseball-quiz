// 自主練ダッシュボード：目標とくらべた達成率・連続日数・ポイント・バッジ・選手の写真。
//
// 数えるのは「やった数」だけ（出来ばえは採点しない、という自主練の約束はそのまま）。
// ポイントとバッジは保存せず、自主練の記録と目標から毎回計算する。
// そのため目標を変えると、過去のポイントもその目標で数え直される。
// かくした種目も、目標があれば過去の達成はポイントに数える（季節で切りかえても、ためた分は減らない）。
// 「その日の目標をぜんぶ達成」と今日の達成率は、表示している種目だけで見る。

import { DRILLS, DEFAULT_GOALS, TITLES, PT_PER_LEVEL, ISSUES } from './catalog.js';
import { get, update, profile, today, addDays } from './store.js';
import { esc, icon, toast, modal } from './ui.js';

const drillById = Object.fromEntries(DRILLS.map((d) => [d.id, d]));
const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const PERIODS = [['day', '1日'], ['week', '週'], ['month', '月']];

/* ───────── 目標 ───────── */

/** プレーヤーの目標。まだ何も決めていなければ初期値。 */
export function goalsOf(pid) {
  return get().goals?.[pid] ?? DEFAULT_GOALS;
}

/* ───────── 表示する種目 ───────── */
// 季節や取り組む課題で、やる種目は変わる。かくした種目はダッシュボードにも記録の一覧にも出さない
// （記録の一覧では「かくしている種目」にたたんでおく）。記録と目標は消さずに残す。

export function hiddenOf(pid) {
  return new Set(get().hiddenDrills?.[pid] ?? []);
}
export const isShown = (pid, id) => !hiddenOf(pid).has(id);

export function setShown(pid, id, shown) {
  update((s) => {
    s.hiddenDrills ??= {};
    const set = new Set(s.hiddenDrills[pid] ?? []);
    if (shown) set.delete(id); else set.add(id);
    s.hiddenDrills[pid] = DRILLS.map((d) => d.id).filter((x) => set.has(x));
  });
}

/** 1日の目標があって、表示している種目を、DRILLS の並び順で返す */
export function goalDrills(pid) {
  const g = goalsOf(pid), hidden = hiddenOf(pid);
  return DRILLS.filter((d) => g[d.id]?.day > 0 && !hidden.has(d.id)).map((d) => d.id);
}

/* ───────── 季節のセット ───────── */
// 「冬」「シーズン中」のように、表示する種目と目標をひと組にして名前をつけて残す。
// 押すとその組に切りかわる。いまの設定と同じ組には ✓ をつける（どれを選んだかは保存せず、くらべて決める）。

const snapshot = (pid) => ({
  hidden: [...hiddenOf(pid)].sort(),
  goals: Object.fromEntries(Object.entries(structuredClone(goalsOf(pid))).sort(([a], [b]) => a.localeCompare(b))),
});
const sameSnap = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function setsOf(pid) {
  return get().drillSets?.[pid] ?? [];
}
/** いまの設定と同じセット（なければ null） */
export function currentSet(pid) {
  const now = snapshot(pid);
  return setsOf(pid).find((x) => sameSnap({ hidden: x.hidden, goals: x.goals }, now)) ?? null;
}
/** いまの表示と目標を、名前をつけて残す。同じ名前があれば上書き */
export function saveSet(pid, name) {
  const snap = snapshot(pid);
  update((s) => {
    s.drillSets ??= {};
    const list = (s.drillSets[pid] ??= []);
    const i = list.findIndex((x) => x.name === name);
    const item = { name, ...snap };
    if (i >= 0) list[i] = item; else list.push(item);
  });
}
export function applySet(pid, name) {
  const set = setsOf(pid).find((x) => x.name === name);
  if (!set) return false;
  update((s) => {
    s.hiddenDrills ??= {}; s.goals ??= {};
    s.hiddenDrills[pid] = [...set.hidden];
    s.goals[pid] = structuredClone(set.goals);
  });
  return true;
}
export function deleteSet(pid, name) {
  update((s) => { if (s.drillSets?.[pid]) s.drillSets[pid] = s.drillSets[pid].filter((x) => x.name !== name); });
}

/** セットを切りかえるチップの列。manage のときは消すボタンもつける */
export function setChipsHTML(pid, { manage = false } = {}) {
  const list = setsOf(pid), cur = currentSet(pid);
  if (!list.length) return manage ? '<p class="muted">まだセットはありません。下の表を整えてから、名前をつけて保存します。</p>' : '';
  return `<div class="setchips">${list.map((x) => `<span class="setchip ${cur?.name === x.name ? 'on' : ''}">
    <button data-applyset="${esc(x.name)}">${cur?.name === x.name ? icon.check : ''}${esc(x.name)}<small>${DRILLS.length - x.hidden.length}種目</small></button>
    ${manage ? `<button class="setdel" data-delset="${esc(x.name)}" aria-label="${esc(x.name)}を消す">${icon.x}</button>` : ''}</span>`).join('')}</div>`;
}

export function setGoal(pid, drill, period, value) {
  update((s) => {
    s.goals ??= {};
    s.goals[pid] ??= structuredClone(DEFAULT_GOALS);
    const g = (s.goals[pid][drill] ??= { day: 0, week: 0, month: 0 });
    g[period] = value > 0 ? value : 0;
    if (!g.day && !g.week && !g.month) delete s.goals[pid][drill];
  });
}

/* ───────── 集計 ───────── */

/** 月曜はじまりの週の、月曜の日付 */
const weekStart = (date) => { const d = new Date(`${date}T12:00:00`); return addDays(date, -((d.getDay() + 6) % 7)); };
const monthOf = (date) => date.slice(0, 7);

/** 日付ごと・種目ごとの合計回数 { '2026-11-17': { swing: 116 } } */
function dayTotals(pid) {
  const out = {};
  for (const d of get().drillLog) {
    if (d.p !== pid || !d.count) continue;
    const day = (out[d.date] ??= {});
    day[d.drill] = (day[d.drill] ?? 0) + d.count;
  }
  return out;
}

/** 自主練をした日の連続日数。今日まだなら、きのうまでで数える */
function streakOf(totals, date) {
  const did = (d) => Object.values(totals[d] ?? {}).some((n) => n > 0);
  let d = did(date) ? date : addDays(date, -1), n = 0;
  while (did(d)) { n++; d = addDays(d, -1); }
  return n;
}

const STREAK_MARKS = [3, 7, 14, 30, 50, 100];

/**
 * 記録と目標から、ポイント・バッジ・今日／週／月の数を出す。
 *   ポイント：自主練した日 +5、1日の目標を1つ達成 +10、その日の目標をぜんぶ達成 +20、
 *             週の目標 +30、月の目標 +100
 */
export function trainingStats(pid, date = today()) {
  const totals = dayTotals(pid);
  const goals = goalsOf(pid);
  const ids = goalDrills(pid);
  const days = Object.keys(totals).filter((d) => d <= date).sort();

  let pt = 0;
  const badges = [];
  const best = {};               // 種目ごとのこれまでの最高
  const weekSum = {}, monthSum = {};
  let run = 0, prev = null;

  for (const d of days) {
    const t = totals[d];
    const did = Object.values(t).some((n) => n > 0);
    if (!did) continue;
    pt += 5;
    run = prev && addDays(prev, 1) === d ? run + 1 : 1; prev = d;
    if (STREAK_MARKS.includes(run)) badges.push({ date: d, drill: null, kind: 'streak', label: `${run}日連続` });

    for (const [id, n] of Object.entries(t)) {
      if (!(n > 0)) continue;
      const g = goals[id] ?? {};
      if (g.day > 0 && n >= g.day) { pt += 10; badges.push({ date: d, drill: id, kind: 'day', label: '単日達成' }); }
      if (best[id] !== undefined && n > best[id]) badges.push({ date: d, drill: id, kind: 'best', label: '自己ベスト' });
      best[id] = Math.max(best[id] ?? 0, n);

      const wk = `${id}|${weekStart(d)}`, mo = `${id}|${monthOf(d)}`;
      const w0 = weekSum[wk] ?? 0, m0 = monthSum[mo] ?? 0;
      weekSum[wk] = w0 + n; monthSum[mo] = m0 + n;
      if (g.week > 0 && w0 < g.week && w0 + n >= g.week) { pt += 30; badges.push({ date: d, drill: id, kind: 'week', label: '週目標達成' }); }
      if (g.month > 0 && m0 < g.month && m0 + n >= g.month) { pt += 100; badges.push({ date: d, drill: id, kind: 'month', label: '月目標達成' }); }
    }
    if (ids.length && ids.every((id) => (t[id] ?? 0) >= goals[id].day)) pt += 20;
  }

  // 同じ種目・同じ種類のバッジは、いちばん新しいものだけ並べる
  const seen = new Set();
  const recent = badges.slice().reverse().filter((b) => {
    const k = `${b.drill}|${b.kind}`; if (seen.has(k)) return false; seen.add(k); return true;
  });

  const sumRange = (id, from) => days.filter((d) => d >= from).reduce((a, d) => a + Math.max(0, totals[d][id] ?? 0), 0);
  const todayT = totals[date] ?? {};
  const per = Object.fromEntries(DRILLS.map((d) => [d.id, {
    day: Math.max(0, todayT[d.id] ?? 0),
    week: sumRange(d.id, weekStart(date)),
    month: sumRange(d.id, `${monthOf(date)}-01`),
    all: days.reduce((a, x) => a + Math.max(0, totals[x][d.id] ?? 0), 0),
  }]));

  // 今日の達成率：目標がある種目それぞれの達成率（100%で頭打ち）の平均
  const rate = ids.length ? Math.round(ids.reduce((a, id) => a + Math.min(1, per[id].day / goals[id].day), 0) / ids.length * 100) : 0;

  const level = Math.floor(pt / PT_PER_LEVEL) + 1;
  const title = [...TITLES].reverse().find((t) => pt >= t.pt) ?? TITLES[0];
  const nextTitle = TITLES.find((t) => t.pt > pt) ?? null;

  return {
    pt, level, levelFrac: (pt % PT_PER_LEVEL) / PT_PER_LEVEL, toLevel: PT_PER_LEVEL - (pt % PT_PER_LEVEL),
    title, nextTitle, streak: streakOf(totals, date), rate, ids, goals, per, recent,
  };
}

/* ───────── 写真 ───────── */
// 写真は大きいので、記録（season.v1）とは別のキーに置く。書き出しファイルにも入れない。

const PHOTO_KEY = 'season.photos.v1';
export const PHOTO_SLOTS = 4;

function readPhotos() {
  try { return JSON.parse(localStorage.getItem(PHOTO_KEY)) ?? {}; } catch { return {}; }
}
export function photosOf(pid) {
  const list = readPhotos()[pid] ?? [];
  return [...Array(PHOTO_SLOTS)].map((_, i) => list[i] ?? null);
}
/** 写真を1枚置く（null で消す）。保存できたら true */
export function setPhoto(pid, slot, dataUrl) {
  const all = readPhotos();
  const list = photosOf(pid); list[slot] = dataUrl;
  all[pid] = list;
  try { localStorage.setItem(PHOTO_KEY, JSON.stringify(all)); return true; } catch { return false; }
}

/** 端末の写真を、長い辺 720px の JPEG に縮めて data URL にする */
export function shrinkImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}

/* ───────── アイコン ───────── */
const S = (d) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const DRILL_IC = {
  swing: S('<path d="M5 19L17 7"/><path d="M15.5 5.5l3 3 2-2a2.1 2.1 0 0 0-3-3z"/><circle cx="5" cy="19" r="1.4"/>'),
  tee: S('<path d="M12 21v-9"/><path d="M8 21h8"/><circle cx="12" cy="8" r="3.4"/>'),
  squat: S('<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>'),
  pushup: S('<circle cx="18.5" cy="7.5" r="1.8"/><path d="M3 15l12-5"/><path d="M15 10l1 6"/><path d="M3 15h18"/>'),
  situp: S('<circle cx="9" cy="6" r="1.8"/><path d="M10 9l3 6h6"/><path d="M13 15l-3 4H4"/><path d="M10 9L7 13"/>'),
  plank: S('<circle cx="19" cy="9" r="1.8"/><path d="M3 15l14-4"/><path d="M16 11l1 4h-3"/><path d="M2 17h20"/>'),
  hip: S('<path d="M2 12h4l2-5 4 10 3-7 2 2h5"/>'),
  stretch: S('<circle cx="12" cy="4.5" r="1.8"/><path d="M4 9l8 2 8-2"/><path d="M12 11v4l-4 6M12 15l4 6"/>'),
};
export const drillIcon = (id) => DRILL_IC[id] ?? icon.ball;

const BADGE_IC = { streak: S('<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 1.5 2 2 3 .5-2 1-4 1-7z"/>') };

/* ───────── ダッシュボード ───────── */

const fmtN = (n) => Number(n).toLocaleString('ja-JP');
const pctOf = (v, g) => (g > 0 ? Math.round((v / g) * 100) : 0);
const bar = (p, tone = '') => `<span class="bar ${tone}"><i style="width:${Math.min(100, p)}%"></i></span>`;

function photoPanel(src, i, me) {
  if (src) return `<figure class="ph"><img src="${src}" alt="写真${i + 1}"></figure>`;
  if (i === 0) {
    // 1枚目が空のときは背番号のユニフォームを出す
    return `<figure class="ph ph-jersey"><svg viewBox="0 0 120 120" aria-hidden="true">
      <path d="M40 14l-26 14 10 22 10-5v61h52V45l10 5 10-22-26-14c-3 8-11 12-20 12s-17-4-20-12z" fill="#e2453b" stroke="#a52822" stroke-width="2.5" stroke-linejoin="round"/>
      <text x="60" y="86" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="42" fill="#fff" stroke="#a52822" stroke-width="1.5">${esc(me.number ?? '')}</text></svg>
      <a class="ph-add" href="#/parent/photos">${icon.plus}写真</a></figure>`;
  }
  return `<figure class="ph ph-empty"><span>${icon.ball}</span><a class="ph-add" href="#/parent/photos">${icon.plus}写真</a></figure>`;
}

function ring(rate) {
  const R = 46, C = 2 * Math.PI * R;
  return `<svg viewBox="0 0 120 120" class="ring" aria-hidden="true">
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="#1d3554" stroke-width="10"/>
    <circle cx="60" cy="60" r="${R}" fill="none" stroke="url(#ringg)" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${(C * Math.min(100, rate)) / 100} ${C}" transform="rotate(-90 60 60)"/>
    <defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ee07a"/><stop offset="1" stop-color="#2fb34f"/></linearGradient></defs>
    ${rate >= 100 ? '<path d="M22 86c-6-8-8-17-6-27M98 86c6-8 8-17 6-27" stroke="#f2c54b" stroke-width="3" fill="none" stroke-linecap="round"/>' : ''}
  </svg>`;
}

/** 自主練画面の上に出すダッシュボード。「目標の達成状況」の種目は settings.focusDrill */
export function dashboardHTML() {
  const me = profile(), date = today();
  const st = trainingStats(me.id, date);
  const dn = new Date(`${date}T12:00:00`);
  const photos = photosOf(me.id);
  const focus = st.ids.includes(get().settings.focusDrill) ? get().settings.focusDrill : st.ids[0];
  const fd = focus ? drillById[focus] : null;
  const fg = focus ? st.goals[focus] : null;

  return `
  <div class="dash-bar">
    <span class="dchip">${icon.season}${dn.getMonth() + 1}月${dn.getDate()}日（${WEEK[dn.getDay()]}）</span>
    <span class="dchip hot">${BADGE_IC.streak}連続練習 <b class="led">${st.streak}</b>日</span>
    <span class="dchip coin"><i>P</i><b class="led">${fmtN(st.pt)}</b></span>
    <span class="dlv"><span>Lv.<b class="led">${st.level}</b></span>${bar(st.levelFrac * 100, 'gold')}<small>あと ${st.toLevel}pt</small></span>
  </div>
  <div class="dash-title">
    <span>${S('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>')}<b>${esc(st.title.name)}</b><small>${esc(me.name)}</small></span>
    ${st.nextTitle ? `<small>次の称号「${esc(st.nextTitle.name)}」まで あと ${fmtN(st.nextTitle.pt - st.pt)}pt</small>` : '<small>いちばん上の称号</small>'}
  </div>

  <div class="dash-grid">
    <div class="dash-photos">${photos.map((p, i) => photoPanel(p, i, me)).join('')}</div>

    <div class="dcard dash-rate">
      <div class="ring-wrap">${ring(st.rate)}<div><small>今日の達成率</small><b class="led">${st.rate}<i>%</i></b></div></div>
      <ul class="checks">${st.ids.map((id) => `<li class="${st.per[id].day >= st.goals[id].day ? 'ok' : ''}">${icon.check}${esc(drillById[id].name)}</li>`).join('') || '<li>目標を決めると、ここに並ぶ</li>'}</ul>
    </div>

    <div class="dcard dash-today">
      <h3 class="dhead">${S('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>')}今日の練習</h3>
      <ul class="dlist">${st.ids.map((id) => {
        const d = drillById[id], v = st.per[id].day, g = st.goals[id].day, p = pctOf(v, g);
        return `<li><button data-jump="${id}"><span class="dic">${drillIcon(id)}</span><b>${esc(d.name)}</b>
          <span class="dnum"><small>${fmtN(v)} / ${fmtN(g)}${esc(d.unit)}</small>${bar(p, p >= 100 ? 'ok' : 'go')}</span>
          <span class="dpct led">${p}%</span>${icon.right}</button></li>`;
      }).join('') || '<li class="muted">保護者メニューで目標を決めてください</li>'}</ul>
      ${fd ? `<div class="dtotal"><span>${esc(fd.name)}の総累計</span><b class="led">${fmtN(st.per[focus].all)}</b><small>${esc(fd.unit)}</small></div>` : ''}
      <button class="btn blue dash-rec" data-rec>${icon.pen} 練習を記録する</button>
    </div>

    <div class="dash-side">
      ${fd ? `<div class="dcard dash-goal">
        <h3 class="dhead">${icon.pen}目標の達成状況（<select data-focus aria-label="種目">${st.ids.map((id) => `<option value="${id}" ${id === focus ? 'selected' : ''}>${esc(drillById[id].name)}</option>`).join('')}</select>）</h3>
        <ul class="glist">${PERIODS.filter(([k]) => fg[k] > 0).map(([k, l]) => {
          const v = st.per[focus][k], p = pctOf(v, fg[k]);
          return `<li><span class="crown ${p >= 100 ? 'ok' : ''}">${S('<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>')}</span><b>${l}目標 ${fmtN(fg[k])}${esc(fd.unit)}</b>
            <span class="dnum"><small>${fmtN(v)} / ${fmtN(fg[k])}${esc(fd.unit)}</small>${bar(p, p >= 100 ? 'ok' : 'go')}</span><span class="dpct led">${p}%</span></li>`;
        }).join('')}</ul>
        ${st.per[focus].day >= fg.day ? '<p class="gnote">今日の目標を達成</p>' : ''}
      </div>` : ''}

      <div class="dcard dash-badges">
        <h3 class="dhead">${S('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/>')}最近獲得したバッジ</h3>
        ${st.recent.length ? `<div class="blist">${st.recent.slice(0, 12).map((b) => `<div class="bdg ${b.kind}" title="${b.date}">
          <span class="medal">${b.drill ? drillIcon(b.drill) : BADGE_IC.streak}</span>
          <b>${esc(b.drill ? drillById[b.drill]?.name ?? b.drill : '練習')}</b><small>${esc(b.label)}</small></div>`).join('')}</div>`
        : '<p class="muted">目標を達成すると、ここにバッジが並ぶ</p>'}
      </div>
    </div>
  </div>`;
}

/** ダッシュボードを描いて、操作をつなぐ。記録が変わったら呼び直す */
export function mountDashboard(el) {
  el.innerHTML = dashboardHTML();
  el.querySelector('[data-focus]')?.addEventListener('change', (e) => {
    update((s) => { s.settings.focusDrill = e.target.value; });
    mountDashboard(el);
  });
  const jump = (id) => {
    const card = document.querySelector(`.drill[data-id="${id}"]`) ?? document.querySelector('.drills');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
  };
  el.querySelectorAll('[data-jump]').forEach((b) => { b.onclick = () => jump(b.dataset.jump); });
  // まだ目標に届いていない最初の種目へ
  el.querySelector('[data-rec]').onclick = () => {
    const st = trainingStats(profile().id);
    jump(st.ids.find((id) => st.per[id].day < st.goals[id].day) ?? st.ids[0]);
  };
}

/* ───────── 保護者メニュー：目標と写真 ───────── */

export function goalSettingsHTML() {
  const me = profile(), g = goalsOf(me.id), hidden = hiddenOf(me.id);
  const rx = new Set(get().rx.flatMap((r) => ISSUES.find((i) => i.id === r.issue)?.drills ?? []));
  return `<section class="card form" id="goals"><h3>自主練の種目と目標（${esc(me.name)}）</h3>
    <p class="muted">季節や取り組む課題に合わせて、やる種目だけに「表示」のチェックを入れます。かくした種目の記録は消えません。1日の目標を入れた種目がダッシュボードに並びます。</p>
    <div class="setbox"><h4>季節のセット</h4>
      <div data-sets>${setChipsHTML(me.id, { manage: true })}</div>
      <div class="row setsave"><input type="text" maxlength="12" placeholder="例：冬・シーズン中" data-setname value="${esc(currentSet(me.id)?.name ?? '')}" aria-label="セットの名前">
        <button class="btn blue small" data-saveset>いまの内容を保存</button></div>
      <p class="muted">表示する種目と1日・週・月の目標をひと組にして残します。セットを押すと、その内容に切りかわります。</p>
    </div>
    <div class="row gt-quick"><button class="btn ghost small" data-showall>ぜんぶ表示</button><button class="btn ghost small" data-showgoal>目標がある種目だけ</button></div>
    <div class="goaltable">
      <div class="gt-head"><span>表示</span><span>種目</span>${PERIODS.map(([, l]) => `<span>${l}</span>`).join('')}</div>
      ${DRILLS.map((d) => `<div class="gt-row ${hidden.has(d.id) ? 'off' : ''}">
        <input type="checkbox" data-show="${d.id}" ${hidden.has(d.id) ? '' : 'checked'} aria-label="${esc(d.name)}を表示">
        <span>${esc(d.name)}<small>${esc(d.unit)}</small>${rx.has(d.id) ? '<em>取り組み中</em>' : ''}</span>
        ${PERIODS.map(([k]) => `<input type="number" inputmode="numeric" min="0" data-goal="${d.id}|${k}" value="${g[d.id]?.[k] || ''}" placeholder="—" aria-label="${esc(d.name)}の${k}">`).join('')}</div>`).join('')}
    </div></section>`;
}

export function photoSettingsHTML() {
  const me = profile(), list = photosOf(me.id);
  return `<section class="card form" id="photos"><h3>自主練ページの写真（${esc(me.name)}）</h3>
    <p class="muted">ダッシュボードの上に並ぶ ${PHOTO_SLOTS}枚です。写真はこの端末の中だけに置き、書き出しファイルには入りません。</p>
    <div class="photoset">${list.map((src, i) => `<div class="pslot">
      <div class="pprev">${src ? `<img src="${src}" alt="写真${i + 1}">` : `<span>${i + 1}</span>`}</div>
      <label class="btn ghost small filebtn">${src ? '変える' : '選ぶ'}<input type="file" accept="image/*" data-photo="${i}" hidden></label>
      ${src ? `<button class="link danger" data-photodel="${i}">消す</button>` : ''}
    </div>`).join('')}</div></section>`;
}

/** 保護者メニューの目標・写真の操作をつなぐ。rerender は写真を変えたあとに画面を描き直す関数 */
export function bindTrainingSettings(root, rerender) {
  const me = profile();
  // 表や目標を手で変えたら、どのセットと同じかを付け直す
  const refreshSets = () => { const box = root.querySelector('[data-sets]'); if (box) { box.innerHTML = setChipsHTML(me.id, { manage: true }); bindSets(); } };
  const bindSets = () => {
    root.querySelectorAll('[data-applyset]').forEach((b) => {
      b.onclick = () => { if (applySet(me.id, b.dataset.applyset)) { toast(`「${b.dataset.applyset}」にしました`); rerender('goals'); } };
    });
    root.querySelectorAll('[data-delset]').forEach((b) => {
      b.onclick = () => {
        const m = modal(`<h3>「${esc(b.dataset.delset)}」を消す？</h3><p class="muted">セットだけを消します。いまの表示と目標、記録はそのままです。</p>
          <div class="row"><button class="btn ghost" data-close>やめる</button><button class="btn danger" data-yes>消す</button></div>`);
        m.el.querySelector('[data-yes]').onclick = () => { deleteSet(me.id, b.dataset.delset); m.close(); refreshSets(); };
      };
    });
  };
  bindSets();
  root.querySelector('[data-saveset]').onclick = () => {
    const name = root.querySelector('[data-setname]').value.trim();
    if (!name) { toast('セットの名前を入れてください'); return; }
    const over = setsOf(me.id).some((x) => x.name === name);
    saveSet(me.id, name); refreshSets();
    toast(over ? `「${name}」を上書きしました` : `「${name}」を保存しました`);
  };
  root.querySelectorAll('[data-show]').forEach((el) => {
    el.onchange = () => { setShown(me.id, el.dataset.show, el.checked); el.closest('.gt-row').classList.toggle('off', !el.checked); refreshSets(); };
  });
  const showOnly = (keep) => {
    update((s) => { s.hiddenDrills ??= {}; s.hiddenDrills[me.id] = DRILLS.map((d) => d.id).filter((id) => !keep(id)); });
    rerender('goals'); toast('表示する種目を変えました');
  };
  root.querySelector('[data-showall]').onclick = () => showOnly(() => true);
  root.querySelector('[data-showgoal]').onclick = () => { const g = goalsOf(me.id); showOnly((id) => g[id]?.day > 0); };
  root.querySelectorAll('[data-goal]').forEach((el) => {
    el.onchange = () => {
      const [drill, period] = el.dataset.goal.split('|');
      setGoal(me.id, drill, period, Math.max(0, Math.round(Number(el.value) || 0)));
      toast('目標を変えました'); refreshSets();
    };
  });
  root.querySelectorAll('[data-photo]').forEach((el) => {
    el.onchange = async () => {
      const f = el.files[0]; if (!f) return;
      try {
        const url = await shrinkImage(f);
        if (!setPhoto(me.id, +el.dataset.photo, url)) { toast('保存できませんでした。ほかの写真を消してください'); return; }
        toast('写真を入れました'); rerender('photos');
      } catch { toast('この写真は読みこめませんでした'); }
    };
  });
  root.querySelectorAll('[data-photodel]').forEach((b) => {
    b.onclick = () => { setPhoto(me.id, +b.dataset.photodel, null); rerender('photos'); };
  });
}
