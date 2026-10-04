// 成長の計算。レーダーは「答えた数」ではなく「直近の最善手率」で動く。

import { AXES, RANKS, RANK_MIN_PLAYS, WINDOW, ABILITIES, SCALE, GRADE_WEIGHT, DRILLS, ISSUES } from './catalog.js';
import { sceneById } from './scenes.js';
import { get, update, today, daysBetween, addDays } from './store.js';

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
  // 能力レーダーの5軸も同じように覚える
  for (const a of abilityStats(pid)) {
    if (!a.firm) continue;
    const key = `ab-${a.id}`, before = prev[key];
    if (!before) { next[key] = a.rank; continue; }
    if (rankIndex(a.rank) > rankIndex(before)) { ups.push({ axis: a, from: before, to: a.rank }); next[key] = a.rank; }
  }
  state.ranks[pid] = next;
  return ups;
}

/** ランクが上がっていたら歩みに残して返す。試合・計測・練習を入れたあとに呼ぶ。 */
export function checkRankUps(pid) {
  let ups = [];
  update((s) => {
    ups = collectRankUps(pid, s);
    ups.forEach((u) => s.events.push({ date: today(), p: pid, type: 'rank', axis: u.axis.id, text: `「${u.axis.name}」${u.from} → ${u.to}` }));
  });
  return ups;
}

/* ───────── 能力レーダー（打撃・投球・守備・走塁・判断） ───────── */

const lin = (v, [lo, hi]) => Math.max(0, Math.min(100, Math.round(((v - lo) / (hi - lo)) * 100)));
const drillAb = Object.fromEntries(DRILLS.map((d) => [d.id, d.ab]));
const roleKind = (role) => (role === 'pitcher' ? 'pit' : role === 'batter' ? 'bat' : null);
const f3 = (v) => v.toFixed(3).replace(/^0/, '');
const BAT_WINDOW = 10, PIT_WINDOW = 6;

/** 打撃の点。games は打席のある試合。相手の学年でヒットと四球の重みを変える。 */
export function battingScore(games) {
  let pa = 0, ab = 0, h = 0, bb = 0, so = 0, sh = 0, wh = 0, wbb = 0;
  for (const g of games) {
    const b = g.bat; if (!b || !b.pa) continue;
    const w = GRADE_WEIGHT[g.grade] ?? 1;
    pa += b.pa; ab += b.ab ?? 0; h += b.h ?? 0; bb += b.bb ?? 0; so += b.so ?? 0; sh += b.sh ?? 0; wh += (b.h ?? 0) * w; wbb += (b.bb ?? 0) * w;
  }
  if (!pa) return null;
  const parts = [];
  if (pa - sh > 0) parts.push({ label: '出塁率', src: 'game', text: f3((h + bb) / (pa - sh)), score: lin((wh + wbb) / (pa - sh), SCALE.obp), w: 40 });
  if (ab > 0) parts.push({ label: '打率', src: 'game', text: f3(h / ab), score: lin(wh / ab, SCALE.avg), w: 25 });
  parts.push({ label: '三振しない', src: 'game', text: `${pa}打席で三振${so}`, score: lin(1 - so / pa, SCALE.contact), w: 20 });
  return { pa, parts };
}

/** 投球の点。games は登板した試合（集計から外した試合は入れない）。 */
export function pitchingScore(games) {
  const z = pitchingLine(games);
  if (!z.outs) return null;
  const inn = z.outs / 3;
  return { outs: z.outs, parts: [
    { label: '四球の少なさ', src: 'game', text: `1回あたり ${(z.bb / inn).toFixed(1)}`, score: lin(z.bb / inn, SCALE.bbInn), w: 35 },
    { label: '三振', src: 'game', text: `1回あたり ${(z.k / inn).toFixed(1)}`, score: lin(z.k / inn, SCALE.kInn), w: 25 },
    { label: '失点の少なさ', src: 'game', text: `1回あたり ${(z.r / inn).toFixed(1)}`, score: lin(z.r / inn, SCALE.rInn), w: 25 },
    ...(z.p ? [{ label: '球数', src: 'game', text: `1回あたり ${Math.round(z.p / inn)}球`, score: lin(z.p / inn, SCALE.pInn), w: 15 }] : []),
  ] };
}
const total = (parts) => { const w = parts.reduce((a, p) => a + p.w, 0); return w ? Math.round(parts.reduce((a, p) => a + p.score * p.w, 0) / w) : 0; };
export const scoreOf = (res) => (res ? { value: total(res.parts), rank: rankOf(total(res.parts)) } : null);

/**
 * 5つの力。試合（直近の試合）・実測値・アプリでの場面と自主練から決まる。
 * 試合と実測値はプレーヤー1（選手本人）のものとして数える。
 */
export function abilityStats(pid, upTo = null) {
  const s = get(), now = upTo ?? today(), real = pid === 'p1';
  const games = real ? s.games.filter((g) => g.date <= now) : [];
  const measure = (id) => (real ? [...s.measures].filter((m) => m.id === id && m.date <= now).pop() : null);
  const plays = s.plays.filter((p) => p.p === pid && p.t.slice(0, 10) <= now);
  const sceneRate = (test, label, w) => {
    const mine = plays.filter((p) => { const sc = sceneById[p.scene]; return sc && test(sc); }).slice(-30);
    const best = mine.filter((p) => p.score === 3).length;
    return mine.length >= 5 ? [{ label, src: 'app', text: `${mine.length}プレーで最善手 ${best}`, score: Math.round((best / mine.length) * 100), w }] : [];
  };
  const drillDays = (ab, w) => {
    const from = addDays(now, -13);
    const days = new Set(s.drillLog.filter((d) => d.p === pid && drillAb[d.drill] === ab && d.date >= from && d.date <= now && (d.count > 0 || d.value)).map((d) => d.date)).size;
    return days ? [{ label: '自主練', src: 'drill', text: `この2週間で ${days}日`, score: Math.min(100, days * 10), w }] : [];
  };
  const meas = (id, label, unit, w) => { const m = measure(id); return m ? [{ label, src: 'measure', text: `${m.value}${unit}`, score: lin(m.value, SCALE[id]), w }] : []; };

  const batGames = games.filter((g) => g.bat?.pa).slice(-BAT_WINDOW);
  const pitGames = games.filter((g) => g.pit?.outs && !g.excluded).slice(-PIT_WINDOW);
  const errGames = games.filter((g) => g.bat || g.pit).slice(-BAT_WINDOW);
  const errs = errGames.reduce((a, g) => a + (g.bat?.e ?? 0), 0), sbs = batGames.reduce((a, g) => a + (g.bat?.sb ?? 0), 0);
  const judge = axisStats(pid, upTo).filter((a) => a.n);
  const quiz = s.quiz.filter((q) => q.p === pid && q.t.slice(0, 10) <= now).slice(-5);
  const qr = quiz.reduce((a, q) => a + q.score, 0), qt = quiz.reduce((a, q) => a + q.total, 0);

  const parts = {
    bat: [...(battingScore(batGames)?.parts ?? []), ...meas('exit', '打球速度', 'km/h', 15), ...sceneRate((sc) => roleKind(sc.role) === 'bat', '打席の判断', 10), ...drillDays('bat', 10)],
    pit: [...(pitchingScore(pitGames)?.parts ?? []), ...sceneRate((sc) => roleKind(sc.role) === 'pit', 'ピッチャーの判断', 15), ...drillDays('pit', 10)],
    fld: [...meas('release', '捕ってから投げるまで', '秒', 30), ...meas('throw', '遠投', 'm', 20),
      ...(errGames.length ? [{ label: '失策の少なさ', src: 'game', text: `${errGames.length}試合で ${errs}`, score: lin(errs / errGames.length, SCALE.err), w: 20 }] : []),
      ...sceneRate((sc) => sc.side === 'def', '守りの判断', 30), ...drillDays('fld', 10)],
    run: [...meas('run50', '50m走', '秒', 30), ...meas('base', '塁間', '秒', 15),
      ...(batGames.length ? [{ label: '盗塁', src: 'game', text: `${batGames.length}試合で ${sbs}`, score: lin(sbs / batGames.length, SCALE.sb), w: 25 }] : []),
      ...sceneRate((sc) => sc.side === 'off' && sc.role !== 'batter', '走塁の判断', 30), ...drillDays('run', 10)],
    iq: [...(judge.length ? [{ label: '場面の最善手率', src: 'app', text: `判断の${judge.length}項目の平均`, score: Math.round(judge.reduce((a, x) => a + x.value, 0) / judge.length), w: 75 }] : []),
      ...(qt ? [{ label: '知識クイズ', src: 'app', text: `直近${quiz.length}回 ${qr}/${qt}`, score: Math.round((qr / qt) * 100), w: 25 }] : []),
      ...drillDays('iq', 10)],
  };
  const gamesN = { bat: batGames.length, pit: pitGames.length };
  return ABILITIES.map((a) => {
    const ps = parts[a.id]; const main = ps.filter((p) => p.src !== 'drill');
    if (!main.length) return { ...a, n: 0, value: 0, rank: null, firm: false, parts: ps };
    const value = total(ps);
    const firm = a.id === 'iq' ? judge.some((x) => x.firm) : a.id === 'bat' || a.id === 'pit' ? gamesN[a.id] >= 3 : main.length >= 2;
    return { ...a, n: main.length, value, rank: rankOf(value), firm, parts: ps };
  });
}

/* ───────── 取り組みの成果（取り組む前の試合 → 取り組んでからの試合） ───────── */

const METRIC = {
  err:   { label: '1試合あたりの失策', low: true, of: (gs) => { const x = gs.filter((g) => g.bat || g.pit); return x.length ? x.reduce((a, g) => a + (g.bat?.e ?? 0), 0) / x.length : null; } },
  sb:    { label: '1試合あたりの盗塁', low: false, of: (gs) => { const x = gs.filter((g) => g.bat?.pa); return x.length ? x.reduce((a, g) => a + (g.bat.sb ?? 0), 0) / x.length : null; } },
  bbinn: { label: '1回あたりの四球', low: true, of: (gs) => { const z = pitchingLine(gs); return z.outs ? z.bb / (z.outs / 3) : null; } },
};
export function rxEffect(issueId, since) {
  const s = get(); const issue = ISSUES.find((i) => i.id === issueId);
  const scenes = new Set(issue?.scenes ?? []), drills = new Set(issue?.drills ?? []);
  const work = {
    plays: s.plays.filter((p) => p.t.slice(0, 10) >= since && scenes.has(p.scene)).length,
    drillDays: new Set(s.drillLog.filter((d) => d.date >= since && drills.has(d.drill)).map((d) => d.date)).size,
  };
  if (!issue?.metric) return { work };
  if (issue.metric === 'release') {
    const ms = s.measures.filter((m) => m.id === 'release');
    const b = ms.filter((m) => m.date < since).pop(), a = ms.filter((m) => m.date >= since).pop();
    return { work, label: '捕ってから投げるまで', before: b ? `${b.value}秒` : null, after: a ? `${a.value}秒` : null, n: a ? 1 : 0, unit: '回の計測', better: a && b && a.value !== b.value ? a.value < b.value : null };
  }
  const m = METRIC[issue.metric];
  const pre = s.games.filter((g) => g.date < since).slice(-8), post = s.games.filter((g) => g.date >= since);
  const b = m.of(pre), a = m.of(post);
  return { work, label: m.label, before: b === null ? null : b.toFixed(1), after: a === null ? null : a.toFixed(1), n: post.length, unit: '試合', better: a !== null && b !== null && a.toFixed(1) !== b.toFixed(1) ? (m.low ? a < b : a > b) : null };
}

/** ある試合の前（ひとつ前の試合の翌日〜その試合の日）に、アプリでやったこと */
export function prepFor(game) {
  const s = get(); const prev = [...s.games].filter((g) => g.date < game.date).pop();
  const from = prev ? addDays(prev.date, 1) : addDays(game.date, -14);
  const inWin = (d) => d >= from && d <= game.date;
  const plays = s.plays.filter((p) => p.p === 'p1' && inWin(p.t.slice(0, 10)));
  const quiz = s.quiz.filter((q) => q.p === 'p1' && inWin(q.t.slice(0, 10)));
  const drills = s.drillLog.filter((d) => d.p === 'p1' && inWin(d.date));
  return { from, plays: plays.length, best: plays.filter((p) => p.score === 3).length, quiz: quiz.length, drillDays: new Set(drills.map((d) => d.date)).size };
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
