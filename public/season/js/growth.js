// 成長の計算。レーダーは「答えた数」ではなく「直近の最善手率」で動く。

import { AXES, RANKS, RANK_MIN_PLAYS, WINDOW } from './catalog.js';
import { get, today, daysBetween } from './store.js';

/** 軸ごとの値。直近 WINDOW 回の最善手率。しばらくやらないと少しずつ下がる。 */
export function axisStats(pid, upTo = null) {
  const plays = get().plays.filter((p) => p.p === pid && (!upTo || p.t.slice(0, 10) <= upTo));
  const now = upTo ?? today();
  return AXES.map((axis) => {
    const mine = axis.id === 'pre'
      ? plays.filter((p) => p.both !== null && p.both !== undefined).map((p) => ({ t: p.t, hit: p.both }))
      : plays.filter((p) => (p.axes ?? []).includes(axis.id)).map((p) => ({ t: p.t, hit: p.score === 3 }));
    const recent = mine.slice(-WINDOW);
    const n = recent.length;
    if (n === 0) return { ...axis, n: 0, raw: 0, value: 0, rank: null, firm: false };
    const raw = Math.round((recent.filter((x) => x.hit).length / n) * 100);
    const idle = Math.max(0, daysBetween(recent[n - 1].t.slice(0, 10), now));
    const decay = Math.floor(idle / 7) * 3;
    const value = Math.max(Math.round(raw * 0.7), raw - decay);
    return { ...axis, n, raw, value, rank: rankOf(value), firm: n >= RANK_MIN_PLAYS, idle };
  });
}

export const rankOf = (v) => RANKS.find((r) => v >= r.min).id;
const rankIndex = (id) => RANKS.length - 1 - RANKS.findIndex((r) => r.id === id);

/**
 * ランクが上がった軸を返して、いまのランクを覚えておく。
 * 下がったときは何も知らせない（レーダーが静かに縮むだけ）。
 */
export function collectRankUps(pid, state) {
  const stats = axisStats(pid);
  const prev = state.ranks[pid] ?? {};
  const ups = [];
  const next = { ...prev };
  for (const a of stats) {
    if (!a.firm) continue;
    const before = prev[a.id];
    if (!before) { next[a.id] = a.rank; continue; }
    if (rankIndex(a.rank) > rankIndex(before)) { ups.push({ axis: a, from: before, to: a.rank }); next[a.id] = a.rank; }
    // 下がったときは覚えているランクを下げない。もう一度同じランクで祝わないため。
  }
  state.ranks[pid] = next;
  return ups;
}

/** 試合ログの集計。打撃は相手の学年で分ける。評価の言葉はつけない。 */
export function battingLine(games) {
  const z = { g: 0, pa: 0, ab: 0, h: 0, bb: 0, so: 0, sh: 0, rbi: 0, sb: 0, r: 0, e: 0 };
  for (const g of games) {
    const b = g.bat; if (!b) continue;
    z.g++;
    for (const k of Object.keys(z)) if (k !== 'g') z[k] += b[k] ?? 0;
  }
  z.avg = z.ab ? z.h / z.ab : null;
  z.obp = z.pa - z.sh > 0 ? (z.h + z.bb) / (z.pa - z.sh) : null;
  return z;
}

export function pitchingLine(games) {
  const z = { g: 0, outs: 0, p: 0, k: 0, bb: 0, h: 0, r: 0, er: 0 };
  for (const g of games) {
    const p = g.pit; if (!p || g.excluded) continue;
    z.g++;
    for (const k of Object.keys(z)) if (k !== 'g') z[k] += p[k] ?? 0;
  }
  z.ip = `${Math.floor(z.outs / 3)}${z.outs % 3 ? `.${z.outs % 3}` : ''}`;
  z.bb9 = z.outs ? (z.bb * 27) / z.outs : null;
  z.k9 = z.outs ? (z.k * 27) / z.outs : null;
  return z;
}

export const fmtAvg = (v) => (v === null ? '—' : v.toFixed(3).replace(/^0/, ''));
export const fmt1 = (v) => (v === null ? '—' : v.toFixed(1));
