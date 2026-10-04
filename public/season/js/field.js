// グラウンドと選手の描画。真上から見た図で統一する。
// 線は実際のグラウンドにあるものだけ：ファウルライン・内野の土・マウンド・ベース・フェンス。

export const W = 220, H = 224;
export const HOME = { x: 110, y: 184 }, FIRST = { x: 168, y: 128 }, SECOND = { x: 110, y: 72 }, THIRD = { x: 52, y: 128 }, MOUND = { x: 110, y: 138 };
const FENCE_R = 176;

export const POS = {
  pitcher: { x: 110, y: 138, l: 'P' }, catcher: { x: 110, y: 200, l: 'C' },
  first: { x: 171, y: 117, l: '1B' }, second: { x: 142, y: 85, l: '2B' },
  short: { x: 78, y: 85, l: 'SS' }, third: { x: 49, y: 117, l: '3B' },
  left: { x: 36, y: 46, l: 'LF' }, center: { x: 110, y: 26, l: 'CF' }, right: { x: 184, y: 46, l: 'RF' },
};
const SHIFT = {
  '前進守備': { first: 14, second: 16, short: 16, third: 14 }, 'バントシフト': { first: 26, third: 26 },
  '定位置より少し前': { first: 6, second: 7, short: 7, third: 6 }, 'やや後ろ': { left: -8, center: -6, right: -8 }, '外野は前進': { left: 12, center: 10, right: 12 },
  'ファーストが牽制でベースについている': { first: 13 },
};
/** コーチャーズボックス */
export const COACH = { coach1: { x: 192, y: 150 }, coach3: { x: 28, y: 150 } };

/** 打球が行く場所 */
export const AREA = {
  third: { x: 56, y: 130 }, short: { x: 80, y: 100 }, second: { x: 138, y: 100 }, first: { x: 162, y: 130 },
  pitcher: { x: 110, y: 150 }, bunt3: { x: 94, y: 162 }, bunt1: { x: 126, y: 162 }, line3: { x: 58, y: 136 }, line1: { x: 160, y: 138 },
  home: { x: 110, y: 176 }, backstop: { x: 122, y: 208 },
  left: { x: 34, y: 44 }, leftFront: { x: 52, y: 66 }, center: { x: 110, y: 26 }, centerFront: { x: 110, y: 52 }, centerDeep: { x: 112, y: 16 },
  right: { x: 180, y: 54 }, rightFront: { x: 168, y: 70 }, leftCenter: { x: 66, y: 30 }, rightCenter: { x: 154, y: 30 },
};

/** タップで答えられる場所。l は「来たら／来なかったら」の欄に出す言葉。 */
export const SPOT = {
  first: { ...FIRST, l: '一塁へ' }, second: { ...SECOND, l: '二塁へ' }, third: { ...THIRD, l: '三塁へ' }, home: { ...HOME, l: 'ホームへ' },
  cut: { x: 110, y: 104, l: 'カットマンへ', mark: 'C' },
  'first-base': { x: FIRST.x, y: FIRST.y, l: '一塁ベースへ' }, 'second-base': { x: SECOND.x, y: SECOND.y, l: '二塁ベースへ' },
  'third-base': { x: THIRD.x, y: THIRD.y, l: '三塁ベースへ' }, 'cover-home': { x: HOME.x, y: HOME.y, l: 'ホームへ' },
  'backup-home': { x: 138, y: 202, l: 'ホームの後ろへ' }, 'backup-first': { x: 200, y: 122, l: '一塁の後ろへ' },
};
/** 攻撃の動き先 */
export const RUNTO = {
  first: { x: FIRST.x + 2, y: FIRST.y - 2 }, second: { x: SECOND.x, y: SECOND.y + 2 }, third: { x: THIRD.x - 2, y: THIRD.y - 2 }, home: { x: HOME.x, y: HOME.y - 2 },
  round1: { x: FIRST.x + 6, y: FIRST.y - 14 }, mid12: { x: 140, y: 100 }, lead1: { x: FIRST.x - 12, y: FIRST.y - 12 },
};
export const LEAD = { r1: { x: FIRST.x - 12, y: FIRST.y - 12 }, r2: { x: SECOND.x - 12, y: SECOND.y + 9 }, r3: { x: THIRD.x + 11, y: THIRD.y + 13 } };
const NEXT = { r1: SECOND, r2: THIRD, r3: HOME, bat: FIRST };
export const BATBOX = { x: HOME.x - 10, y: HOME.y - 3 };

/** ボタンで答える選択肢の言葉 */
export const LABEL = {
  hold: 'ボールを持ったまま', stay: 'そのまま構える', chase: 'ボールを追いかける', tag: '走者を追ってタッチ', stepthird: '三塁ベースを踏む',
  'run-second': '二塁へ走る', 'round-first': '一塁を回って止まる', 'stay-first': '一塁ベースで止まる',
};
export const optLabel = (o) => o.l ?? SPOT[o.id]?.l ?? LABEL[o.id] ?? o.id;
export const isSpot = (o) => Boolean(SPOT[o.id]);

export function fielderPos(key, sit) {
  const p = POS[key]; const d = SHIFT[sit.defense]?.[key] ?? 0;
  return { x: p.x, y: p.y + d };
}

/* ── 選手（スプライト） ──
   players.webp : 味方（濃い緑の帽子）／自分（黄緑のつば）／走者（赤いヘルメット）の3体
   motion.webp  : 自分の動き 6コマ（構え・走る・捕る・投げる・ガッツポーズ・後ろ向き） */
const P_CELLS = [{ x: 0, w: 313.5 }, { x: 313.5, w: 282.5 }, { x: 596, w: 291 }];
const M_FRAMES = { ready: 0, run: 1, catch: 2, throw: 3, cheer: 4, back: 5 };

function pill(y, label, me) {
  if (!label) return '';
  const up = y > 186, w = Math.max(20, label.length * 5.2 + 9);
  return `<rect x="${-w / 2}" y="${up ? -28 : 13}" width="${w}" height="8" rx="4" fill="${me ? '#f3ffad' : '#194d35'}" stroke="${me ? '#fff' : '#7cb28b'}" stroke-width=".5"/>
    <text y="${up ? -22.3 : 18.7}" font-size="5" font-weight="900" text-anchor="middle" fill="${me ? '#33532b' : '#fff'}">${label}</text>`;
}
function speedTag(speed) {
  if (speed !== 'fast' && speed !== 'slow') return '';
  return `<circle cx="9" cy="-13" r="4.2" fill="${speed === 'fast' ? '#dc604b' : '#6b8290'}" stroke="#fff" stroke-width=".7"/><text x="9" y="-11.3" font-size="4.6" font-weight="900" fill="#fff" text-anchor="middle">${speed === 'fast' ? '速' : '遅'}</text>`;
}
function athlete({ x, y, type, label = '', scale = 1, speed = null, flip = false, me = false }) {
  const c = P_CELLS[type];
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="10" rx="7.4" ry="2.2" fill="#153d24" opacity=".28"/>
    ${me ? '<ellipse cx="0" cy="10" rx="10" ry="3.7" fill="#e3ff9033" stroke="#e1ff8a" stroke-width="1.2"/>' : ''}
    <g ${flip ? 'transform="scale(-1 1)"' : ''}><svg x="-10" y="-19" width="20" height="30" viewBox="${c.x} 30 ${c.w} 405" preserveAspectRatio="xMidYMid meet" overflow="hidden"><use href="#playerAtlas"/></svg></g>
    ${pill(y, label, me)}${speedTag(speed)}</g>`;
}
function meSprite({ x, y, action = 'ready', label = 'YOU', scale = 1.25, flip = false }) {
  const i = M_FRAMES[action] ?? 0, col = i % 3, row = Math.floor(i / 3);
  const bounce = action === 'run' ? Math.sin(performance.now() / 70) * 0.9 : 0;
  return `<g transform="translate(${x} ${y}) scale(${scale})">
    <ellipse cx="0" cy="10" rx="10" ry="3.7" fill="#e3ff9033" stroke="#e1ff8a" stroke-width="1.2"/>
    <g ${flip ? 'transform="scale(-1 1)"' : ''}><svg x="-13" y="${-20 + bounce}" width="26" height="31" viewBox="${col * 256} ${row === 0 ? 0 : 260} 256 ${row === 0 ? 260 : 252}" preserveAspectRatio="none" overflow="hidden"><use href="#motionAtlas"/></svg></g>
    ${pill(y, label, true)}</g>`;
}

/** 図の矢印の色。ball=打球へ、cover=カバー、base=ベースに入る、throw=送球 */
export const ARROW = { ball: '#ff7a59', cover: '#7cc4ff', base: '#c7f35c', throw: '#f5c941' };

function ground() {
  const len = Math.hypot(110, 127), fx = (FENCE_R * 110) / len, fy = (FENCE_R * 127) / len;
  let bands = ''; let k = 0;
  for (let r = FENCE_R - 14; r > 24; r -= 24, k++) bands += `<circle cx="${HOME.x}" cy="${HOME.y}" r="${r}" fill="${k % 2 ? '#4b9b58' : '#56a661'}"/>`;
  return `<defs>
    <image id="motionAtlas" width="768" height="512" href="img/motion.webp"/>
    <image id="playerAtlas" width="887" height="444" href="img/players.webp"/>
    <marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="#f5c941"/></marker>
    ${Object.entries(ARROW).map(([k, c]) => `<marker id="arw-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.6" markerHeight="4.6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10Z" fill="${c}"/></marker>`).join('')}
    <clipPath id="fclip"><rect width="${W}" height="${H}" rx="12"/></clipPath>
    <clipPath id="ffence"><circle cx="${HOME.x}" cy="${HOME.y}" r="${FENCE_R}"/></clipPath>
    <radialGradient id="turf"><stop offset="0" stop-color="#72a258" stop-opacity=".15"/><stop offset="1" stop-color="#061f16" stop-opacity=".28"/></radialGradient>
    <radialGradient id="mound" cx="50%" cy="38%" r="55%"><stop offset="0%" stop-color="#e8b870"/><stop offset="100%" stop-color="#c08c4a"/></radialGradient>
  </defs>
  <g clip-path="url(#fclip)">
    <rect width="${W}" height="${H}" fill="#226348"/>
    <g clip-path="url(#ffence)"><circle cx="${HOME.x}" cy="${HOME.y}" r="${FENCE_R}" fill="#4b9b58"/>${bands}
      <circle cx="${HOME.x}" cy="${HOME.y}" r="${FENCE_R - 7.5}" fill="none" stroke="#ac8058" stroke-width="14"/></g>
    <circle cx="${HOME.x}" cy="${HOME.y}" r="${FENCE_R}" fill="none" stroke="#1d4d2b" stroke-width="4.5"/>
    <circle cx="${HOME.x}" cy="${HOME.y}" r="${FENCE_R + 2.8}" fill="none" stroke="#facc15" stroke-width="1.4" opacity=".85"/>
    <circle cx="${MOUND.x}" cy="${MOUND.y}" r="82" fill="#dcb886"/>
    <polygon points="${HOME.x},${HOME.y - 14} ${FIRST.x - 14},${FIRST.y} ${SECOND.x},${SECOND.y + 14} ${THIRD.x + 14},${THIRD.y}" fill="#56a661" stroke="#56a661" stroke-width="8" stroke-linejoin="round"/>
    <line x1="${HOME.x}" y1="${HOME.y}" x2="${HOME.x - fx}" y2="${HOME.y - fy}" stroke="#fff" stroke-width="1.5" opacity=".9"/>
    <line x1="${HOME.x}" y1="${HOME.y}" x2="${HOME.x + fx}" y2="${HOME.y - fy}" stroke="#fff" stroke-width="1.5" opacity=".9"/>
    <ellipse cx="${MOUND.x}" cy="${MOUND.y}" rx="10" ry="8" fill="url(#mound)"/><rect x="${MOUND.x - 4}" y="${MOUND.y - 1.5}" width="8" height="3" rx=".6" fill="#fff"/>
    ${[FIRST, SECOND, THIRD].map((p) => `<rect x="${p.x - 5}" y="${p.y - 5}" width="10" height="10" fill="#fff" transform="rotate(45 ${p.x} ${p.y})"/>`).join('')}
    <polygon points="${HOME.x},${HOME.y + 6} ${HOME.x - 6},${HOME.y} ${HOME.x - 4},${HOME.y - 5} ${HOME.x + 4},${HOME.y - 5} ${HOME.x + 6},${HOME.y}" fill="#fff"/>
    <rect width="${W}" height="${H}" fill="url(#turf)" pointer-events="none"/>`;
}

const MARK = (id) => (id === 'cut' ? '中継' : id.includes('backup') ? '後ろ' : id.includes('first') ? '一塁' : id.includes('second') ? '二塁' : id.includes('third') ? '三塁' : '本塁');

/**
 * view = {
 *   sit, role,
 *   fielders: { key: {x,y} }, action（自分の動きのコマ）,
 *   runners: [{ id, x, y, speed, me, bat }],
 *   ball: {x,y,h}, line, route: {from,to}, targets: [{id}], bubble
 * }
 */
export function renderField(view) {
  const { role } = view;
  let g = ground();
  const defRole = POS[role] ? role : null;
  // 奥（上）から手前（下）へ描く。手前の選手が上に重なるように
  const actors = [];
  for (const key of Object.keys(POS)) {
    const p = view.fielders[key];
    if (key === defRole) actors.push({ y: p.y, draw: () => meSprite({ x: p.x, y: p.y, action: view.action, flip: view.flip }) });
    else actors.push({ y: p.y, draw: () => athlete({ x: p.x, y: p.y, type: 0, label: key === 'catcher' ? '' : POS[key].l }) });
  }
  for (const r of view.runners) {
    // 自分がランナー・打者のときは、守備の絵（帽子とグラブ）ではなくランナーの絵（ヘルメット）で描く
    if (r.me) actors.push({ y: r.y + 0.5, draw: () => athlete({ x: r.x, y: r.y, type: 2, scale: 1.15, flip: r.flip, me: true, label: 'YOU' }) });
    else actors.push({ y: r.y + 0.5, draw: () => athlete({ x: r.x, y: r.y, type: 2, scale: 0.85, speed: r.speed, flip: r.flip }) });
  }
  actors.sort((a, b) => a.y - b.y).forEach((a) => { g += a.draw(); });

  for (const a of view.arrows ?? []) {
    const c = ARROW[a.k] ?? '#fff', dx = a.to.x - a.from.x, dy = a.to.y - a.from.y, len = Math.hypot(dx, dy) || 1;
    // 矢印の先は、行き先の選手に重ならないよう少し手前で止める
    const ex = a.to.x - (dx / len) * 5, ey = a.to.y - (dy / len) * 5;
    g += `<line x1="${a.from.x}" y1="${a.from.y}" x2="${ex}" y2="${ey}" stroke="#0d3323" stroke-width="3.2" opacity=".35" stroke-linecap="round"/>
      <line x1="${a.from.x}" y1="${a.from.y}" x2="${ex}" y2="${ey}" stroke="${c}" stroke-width="1.8" stroke-linecap="round" ${a.k === 'throw' ? 'stroke-dasharray="4 2.5"' : ''} marker-end="url(#arw-${a.k})" opacity="${a.dim ? 0.35 : 1}"/>`;
  }
  if (view.route) {
    const { from: o, to: e } = view.route; const d = `M${o.x},${o.y} Q${(o.x + e.x) / 2 + 8},${(o.y + e.y) / 2 - 8} ${e.x},${e.y}`;
    g += `<path d="${d}" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/><path d="${d}" fill="none" stroke="#f5c941" stroke-width="1.7" marker-end="url(#routeArrow)"/><circle cx="${e.x}" cy="${e.y}" r="8" fill="none" stroke="#f5c941" stroke-width="1.5"/>`;
  }
  if (view.line) g += `<line x1="${view.line.x1}" y1="${view.line.y1}" x2="${view.line.x2}" y2="${view.line.y2}" stroke="#fff" stroke-width="1.4" stroke-dasharray="3 2" opacity=".9"/>`;
  if (view.ball) {
    const h = view.ball.h ?? 0;
    if (h > 0.5) g += `<ellipse cx="${view.ball.x}" cy="${view.ball.y}" rx="${3 + h * 0.08}" ry="${1.6 + h * 0.04}" fill="rgba(0,0,0,.22)"/>`;
    g += `<circle cx="${view.ball.x}" cy="${view.ball.y - h}" r="${3.2 + h * 0.06}" fill="#fff" stroke="#c0392b" stroke-width=".8"/>`;
  }
  for (const t of view.targets ?? []) {
    const p = SPOT[t.id]; if (!p) continue;
    g += `<g class="tgt" data-t="${t.id}" role="button" tabindex="0" aria-label="${p.l}">
      <circle cx="${p.x}" cy="${p.y}" r="13" fill="transparent"/>
      <circle cx="${p.x}" cy="${p.y}" r="9" fill="none" stroke="#fff" stroke-width="2" class="tgt-ring"/>
      <circle cx="${p.x}" cy="${p.y}" r="9" fill="#c7f35c" stroke="#fff" stroke-width="1.5"/>
      <text x="${p.x}" y="${p.y + (t.mark ? 3.4 : 1.9)}" font-size="${t.mark ? 10 : 5}" font-weight="900" fill="#16281c" text-anchor="middle" ${t.mark ? 'font-family="Bebas Neue, Arial Narrow, sans-serif"' : ''}>${t.mark ?? MARK(t.id)}</text></g>`;
  }
  if (view.bubble) {
    const b = view.bubble, w = Math.max(34, b.t.length * 7.2 + 12);
    g += `<g><rect x="${b.x - w / 2}" y="${b.y - 38}" width="${w}" height="14" rx="7" fill="#fff" stroke="#233c52" stroke-width=".8"/>
      <text x="${b.x}" y="${b.y - 28}" font-size="7" font-weight="900" text-anchor="middle" fill="#233c52">${b.t}</text></g>`;
  }
  return `${g}</g>`;
}

/* ── アニメの道具 ── */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export function tween(from, to, ms, set, { arc = 0 } = {}) {
  const t0 = performance.now();
  return new Promise((res) => {
    function f(now) {
      const k = Math.min(1, (now - t0) / ms);
      const e = k < 0.5 ? 2 * k * k : -1 + (4 - 2 * k) * k;
      set({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, h: arc ? Math.sin(Math.PI * k) * arc : 0 }, k);
      if (k < 1) requestAnimationFrame(f); else res();
    }
    requestAnimationFrame(f);
  });
}

/* ── 連動：打球に合わせて、ボールを持たない野手がどこへ動くか ──
   場面ごとに書くのではなく、基本の約束から決める。
   ゴロ：打球の逆側の二遊間が二塁へ、投手は一塁側なら一塁カバー、捕手は走者がいなければ一塁の後ろへ、外野は送球の後ろへ。
   外野への打球：近い外野手が後ろへ回り、打球側の二遊間が中継、反対側が二塁、一塁手は本塁へのカット（得点圏に走者）、投手は本塁か三塁の後ろへ。 */
const BACK = { first: { x: 197, y: 112 }, third: { x: 23, y: 112 }, home: { x: 110, y: 213 }, second: { x: 110, y: 48 } };
export function teamMoves({ areaKey, area, by, sit, throwTo, fielders, skip = [], avoid = null }) {
  const on = (b) => Boolean(sit.runners[b]);
  const scoring = on('second') || on('third');
  const m = {};
  const put = (k, p) => { if (k !== by && !skip.includes(k) && !m[k]) m[k] = p; };
  const d = (k) => Math.hypot(fielders[k].x - area.x, fielders[k].y - area.y);
  if (areaKey === 'backstop') { put('pitcher', { x: HOME.x - 4, y: HOME.y - 6 }); put('first', { x: FIRST.x - 3, y: FIRST.y - 2 }); put('third', { x: THIRD.x + 3, y: THIRD.y - 2 }); }
  else if (area.y < 78) {
    const left = area.x < 96, right = area.x > 124;
    const other = ['left', 'center', 'right'].filter((k) => k !== by).sort((a, b) => d(a) - d(b))[0];
    put(other, { x: area.x + (fielders[other].x < area.x ? -24 : 24), y: Math.max(12, area.y - 12) });
    const relay = right ? 'second' : 'short', cover = right ? 'short' : 'second';
    put(relay, { x: (area.x + SECOND.x) / 2, y: (area.y + SECOND.y) / 2 + 5 });
    put(cover, { x: SECOND.x + (cover === 'short' ? -3 : 3), y: SECOND.y + 3 });
    put('third', { x: THIRD.x + 3, y: THIRD.y - 2 });
    put('first', scoring ? { x: 110 + (right ? 16 : left ? -16 : 0), y: 114 } : { x: FIRST.x - 3, y: FIRST.y - 2 });
    put('pitcher', scoring ? BACK.home : on('first') ? BACK.third : { x: 110, y: 158 });
  } else {
    const bunt = area.y > 146 && Math.abs(area.x - 110) < 30;
    const rightSide = area.x > 112;
    const shift = sit.defense === 'バントシフト';
    if (bunt && shift) {
      put('first', { x: 134, y: 156 }); put('third', { x: 86, y: 156 });
      put('second', { x: FIRST.x - 2, y: FIRST.y - 2 }); put('short', on('second') ? { x: THIRD.x + 3, y: THIRD.y - 2 } : { x: SECOND.x - 2, y: SECOND.y + 3 });
    } else if (by === 'first') {
      put('pitcher', { x: FIRST.x - 3, y: FIRST.y - 1 }); put('second', { x: 184, y: 112 }); put('short', { x: SECOND.x - 2, y: SECOND.y + 3 });
    } else {
      put('first', { x: FIRST.x - 3, y: FIRST.y - 2 });
      if (rightSide || bunt) { put('short', { x: SECOND.x - 2, y: SECOND.y + 3 }); put('second', bunt ? { x: 184, y: 112 } : { x: 150, y: 96 }); }
      else { put('second', { x: SECOND.x + 2, y: SECOND.y + 3 }); put('short', by === 'third' ? { x: area.x + 12, y: area.y - 18 } : { x: 92, y: 84 }); }
    }
    put('third', { x: THIRD.x + 3, y: THIRD.y - 2 });
    put('pitcher', throwTo === 'home' || on('third') ? BACK.home : rightSide ? { x: 142, y: 138 } : { x: 110, y: 150 });
    if (!scoring && !on('first')) put('catcher', { x: 172, y: 164 });
    // 外野は、内野の後ろへ数歩つめる（送球やはじいた打球の後ろ）
    put('left', rightSide ? { x: 46, y: 52 } : { x: Math.min(64, Math.max(30, area.x - 16)), y: 62 });
    put('center', { x: 110 + (rightSide ? 8 : -8), y: 40 });
    put('right', rightSide ? { x: 176, y: 62 } : { x: 190, y: 78 });
  }
  // 自分の仕事（正しい行き先）を、味方が先に取らないようにする
  if (avoid) for (const k of Object.keys(m)) if (Math.hypot(m[k].x - avoid.x, m[k].y - avoid.y) < 9) delete m[k];
  return m;
}
