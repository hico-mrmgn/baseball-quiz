// 記録はすべてこの端末の中（localStorage）に置く。
// 試合の成績や体の実測値は個人のデータなので、リポジトリには入れない。
// 端末をまたぐときは「書き出す／読みこむ」で JSON を持ち運ぶ。

const KEY = 'season.v1';

const fresh = () => ({
  v: 1,
  profiles: [
    { id: 'p1', name: 'じぶん', number: 4 },
    { id: 'p2', name: 'おとうさん', number: 40 },
  ],
  active: 'p1',
  plays: [],      // { t, p, scene, kind, score, both, axes }
  daily: {},      // { '2026-10-03': { p1: { us, them, best, total, opp } } }
  drillLog: [],   // { date, p, drill, count, value }
  games: [],      // 試合ログ
  measures: [],   // { date, id, value }
  rx: [],         // 処方中の課題 { issue, since }
  events: [],     // { date, p, type, text }
  ranks: {},      // { p1: { pre: 'C', … } }
  sceneVideos: {},// { sceneId: { id, t } }
  settings: { sound: true },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    return { ...fresh(), ...JSON.parse(raw) };
  } catch {
    return fresh();
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 容量や設定で保存できなくても遊べるようにする */ }
  listeners.forEach((fn) => fn(state));
}

export const get = () => state;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function update(fn) { fn(state); save(); }

export const profile = () => state.profiles.find((p) => p.id === state.active) ?? state.profiles[0];
export const otherProfiles = () => state.profiles.filter((p) => p.id !== state.active);

export function today(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function addDays(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return today(d);
}
export function daysBetween(a, b) {
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}
export const fmtDate = (s) => { const [, m, d] = s.split('-'); return `${+m}/${+d}`; };

/** 日付から決まる乱数。同じ日は何度開いても同じ試合になる。 */
export function seeded(seedStr) {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

/** 読みこみ。試合・実測値・動画は足し合わせ、同じ id は新しいほうで置きかえる。 */
export function importData(text, { replace = false } = {}) {
  const data = JSON.parse(text);
  if (replace) { state = { ...fresh(), ...data }; save(); return summary(data); }
  update((s) => {
    if (Array.isArray(data.games)) {
      const map = new Map(s.games.map((g) => [g.id, g]));
      data.games.forEach((g) => map.set(g.id, g));
      s.games = [...map.values()].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
    }
    if (Array.isArray(data.measures)) {
      const key = (m) => `${m.date}|${m.id}`;
      const map = new Map(s.measures.map((m) => [key(m), m]));
      data.measures.forEach((m) => map.set(key(m), m));
      s.measures = [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
    }
    if (data.sceneVideos) s.sceneVideos = { ...s.sceneVideos, ...data.sceneVideos };
    if (Array.isArray(data.rx)) s.rx = data.rx.slice(0, 2);
    if (Array.isArray(data.profiles)) {
      data.profiles.forEach((p) => {
        const mine = s.profiles.find((x) => x.id === p.id);
        if (mine) Object.assign(mine, p);
      });
    }
    ['plays', 'drillLog', 'events'].forEach((k) => {
      if (Array.isArray(data[k]) && data[k].length) s[k] = [...s[k], ...data[k]];
    });
    if (data.daily) s.daily = { ...s.daily, ...data.daily };
    if (data.ranks) s.ranks = { ...s.ranks, ...data.ranks };
  });
  return summary(data);
}
const summary = (d) => ({ games: d.games?.length ?? 0, measures: d.measures?.length ?? 0, videos: Object.keys(d.sceneVideos ?? {}).length });

export function resetAll() { state = fresh(); save(); }
