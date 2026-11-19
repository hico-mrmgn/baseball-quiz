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
  quiz: [],       // 知識クイズ { t, p, theme, diff, score, total }
  quizWrong: {},  // まちがえた問題 { p1: [questionId] }
  oldDays: [],    // まえのアプリで練習した日
  legacy: null,   // まえのアプリからの引きつぎ { at, drills, days, quiz, wrong }
  goals: {},      // 自主練の目標 { p1: { swing: { day, week, month } } }。無いプレーヤーは DEFAULT_GOALS
  drillSets: {},  // 季節のセット { p1: [{ name, hidden: [...], goals: {...} }] }
  hiddenDrills: {},// 自主練でかくしている種目 { p1: ['tee', …] }
  settings: { sound: true, pos: null },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? { ...fresh(), ...JSON.parse(raw) } : fresh();
    if (!s.legacy && migrateLegacy(s)) localStorage.setItem(KEY, JSON.stringify(s));
    return s;
  } catch {
    return fresh();
  }
}

/**
 * まえのアプリ（つぎ、どうする？）がこの端末に残した記録を、1回だけ引きつぐ。
 * 元の記録は消さない。自主練の数・練習した日・クイズの戦績・まちがえた問題を移す。
 */
function migrateLegacy(s) {
  const out = { at: today(), drills: 0, days: 0, quiz: 0, wrong: 0 };
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  const DRILL = { suburi: 'swing', tee: 'tee', shadow: 'shadow', kabeate: 'wall', nawatobi: 'rope', stretch: 'stretch' };
  const isDate = (d) => /^\d{4}-\d\d-\d\d$/.test(d ?? '');
  const days = new Set(s.oldDays);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith('ichi.drill.v1.day.')) continue;
    const d = read(k); const date = d?.date ?? k.slice('ichi.drill.v1.day.'.length);
    if (!d || !isDate(date)) continue;
    for (const [id, v] of Object.entries(d.values ?? {})) {
      if (!DRILL[id] || !(v > 0)) continue;
      // ストレッチは「やった」だけ。ほかは 10本中の数や回数なので、数ではなく値として置く
      s.drillLog.push(id === 'stretch' ? { date, p: 'p1', drill: 'stretch', count: 1, old: true } : { date, p: 'p1', drill: DRILL[id], count: 0, value: v, old: true });
      out.drills++;
    }
    if (typeof d.note === 'string' && d.note.trim()) s.events.push({ date, p: 'p1', type: 'note', text: `自主練メモ：${d.note.trim()}` });
  }
  Object.keys(read('baseball-quiz-daily')?.log ?? {}).filter(isDate).forEach((d) => days.add(d));
  const hist = read('baseball-quiz-history');
  if (Array.isArray(hist)) {
    for (const e of hist) {
      if (!(e?.id > 1e12) || !(e.total > 0)) continue;
      const at = new Date(e.id); days.add(today(at));
      // クイズの戦績だけを移す。場面やイニングの点数は数え方がちがうので、日付だけ残す
      if (typeof e.score === 'number' && e.score <= e.total && !['daily', 'scenario', 'inning'].includes(e.theme)) {
        s.quiz.push({ t: at.toISOString(), p: 'p1', theme: e.theme, diff: 'all', score: e.score, total: e.total, old: true });
        out.quiz++;
      }
    }
    s.quiz.sort((a, b) => a.t.localeCompare(b.t));
  }
  const wrong = read('baseball-quiz-wrong-answers');
  if (Array.isArray(wrong)) {
    const ids = wrong.filter((x) => typeof x === 'string');
    s.quizWrong.p1 = [...new Set([...(s.quizWrong.p1 ?? []), ...ids])];
    out.wrong = ids.length;
  }
  s.oldDays = [...days].sort(); out.days = s.oldDays.length;
  s.drillLog.sort((a, b) => a.date.localeCompare(b.date));
  s.legacy = out;
  return true;
}

/* ───────── 端末をまたぐ同期のための印 ─────────
   ログインしているときは、記録をサーバーにも置く（cloud.js）。2台で同時に書いても消えないよう、
   項目ごとに混ぜ方を決めておく。
     LOGS  … 足していくだけの記録。両方にあるものは1つにまとめ、片方にしかないものは足す
     DAILY … 日付ごとの今日の試合。日付×プレーヤーで足し合わせる
     その他 … 最後に変えたほうを使う。変えた時刻を _at に残す
   active（いま選んでいるプレーヤー）と legacy（引きつぎの印）は端末ごとのものなので送らない。 */
const LOGS = ['plays', 'drillLog', 'quiz', 'events'];
const LOCAL_ONLY = ['active', 'legacy', '_at'];
const lastSaved = {};
const syncFields = (s) => Object.keys({ ...fresh(), ...s }).filter((k) => !LOCAL_ONLY.includes(k) && k !== 'v');

/** 変わった項目に時刻を打つ。初回（読みこみ直後）は打たずに覚えるだけ */
function stamp(s, { remember = false } = {}) {
  s._at ??= {};
  const now = Date.now();
  for (const k of syncFields(s)) {
    const str = JSON.stringify(s[k] ?? null);
    if (!remember && lastSaved[k] !== undefined && lastSaved[k] !== str) s._at[k] = now;
    lastSaved[k] = str;
  }
}

function save() {
  stamp(state);
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 容量や設定で保存できなくても遊べるようにする */ }
  listeners.forEach((fn) => fn(state));
}
stamp(state, { remember: true });

/** 同じ中身の記録が、片方に n 個・もう片方に m 個あれば max(n, m) 個にする（並びは日付順） */
function mergeLog(a = [], b = []) {
  const count = new Map(), out = [];
  for (const x of a) { const k = JSON.stringify(x); count.set(k, (count.get(k) ?? 0) + 1); out.push(x); }
  const seen = new Map();
  for (const x of b) {
    const k = JSON.stringify(x); const n = (seen.get(k) ?? 0) + 1; seen.set(k, n);
    if (n > (count.get(k) ?? 0)) out.push(x);
  }
  const at = (x) => x.t ?? x.date ?? '';
  return out.map((x, i) => [x, i]).sort(([x, i], [y, j]) => String(at(x)).localeCompare(String(at(y))) || i - j).map(([x]) => x);
}

/** 2つの記録（この端末とサーバー）を1つにする。どちらも書きかえない */
export function mergeStates(local, remote) {
  const out = { ...fresh(), ...local, _at: { ...(local._at ?? {}) } };
  const ra = remote._at ?? {};
  for (const k of syncFields({ ...local, ...remote })) {
    if (!(k in remote)) continue;
    if (LOGS.includes(k)) out[k] = mergeLog(local[k], remote[k]);
    else if (k === 'daily') {
      out.daily = structuredClone(local.daily ?? {});
      for (const [d, byP] of Object.entries(remote.daily ?? {})) out.daily[d] = { ...byP, ...(out.daily[d] ?? {}) };
    } else if ((ra[k] ?? 0) >= (out._at[k] ?? 0) || !(k in local)) out[k] = structuredClone(remote[k]); // 同じ時刻ならサーバーのほう
    out._at[k] = Math.max(out._at[k] ?? 0, ra[k] ?? 0);
  }
  return out;
}

/** サーバーに送る中身（端末ごとの項目をのぞく） */
export function syncPayload() {
  const out = {};
  for (const k of syncFields(state)) out[k] = state[k];
  out._at = state._at ?? {};
  return out;
}

/** サーバーから来た中身にする。端末ごとの項目（いま選んでいるプレーヤーなど）は残す。
    listeners には知らせるが、時刻は打ち直さない */
export function replaceState(next, { notify = true } = {}) {
  const keep = Object.fromEntries(LOCAL_ONLY.filter((k) => k !== '_at').map((k) => [k, state[k]]));
  state = { ...fresh(), ...next, ...keep };
  if (!state.profiles.some((p) => p.id === state.active)) state.active = state.profiles[0]?.id;
  stamp(state, { remember: true });
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 保存できなくても画面は続ける */ }
  if (notify) listeners.forEach((fn) => fn(state));
}

/** ログアウトしたとき：この端末の記録を空にする（記録はサーバーに残っている） */
export function clearLocal() {
  state = { ...fresh(), legacy: { at: today(), reset: true } };
  for (const k of Object.keys(lastSaved)) delete lastSaved[k];
  stamp(state, { remember: true });
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 同上 */ }
  listeners.forEach((fn) => fn(state));
}

export const get = () => state;
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function update(fn) { fn(state); save(); }

/** 選手としてログインしているときは、そのプレーヤーに固定する（cloud.js が決める） */
let lockedPlayer = null;
export function lockPlayer(pid) { lockedPlayer = pid; }
export const lockedTo = () => lockedPlayer;

export const profile = () => state.profiles.find((p) => p.id === (lockedPlayer ?? state.active)) ?? state.profiles[0];
export const otherProfiles = () => state.profiles.filter((p) => p.id !== profile().id);

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
    ['plays', 'drillLog', 'events', 'quiz'].forEach((k) => {
      if (Array.isArray(data[k]) && data[k].length) s[k] = [...s[k], ...data[k]];
    });
    if (data.drillSets) Object.entries(data.drillSets).forEach(([p, list]) => {
      const map = new Map((s.drillSets[p] ?? []).map((x) => [x.name, x]));
      (list ?? []).forEach((x) => map.set(x.name, x));
      s.drillSets[p] = [...map.values()];
    });
    if (data.hiddenDrills) s.hiddenDrills = { ...s.hiddenDrills, ...data.hiddenDrills };
    if (data.goals) s.goals = { ...s.goals, ...data.goals };
    if (data.daily) s.daily = { ...s.daily, ...data.daily };
    if (data.ranks) s.ranks = { ...s.ranks, ...data.ranks };
    if (Array.isArray(data.oldDays)) s.oldDays = [...new Set([...s.oldDays, ...data.oldDays])].sort();
    if (data.quizWrong) Object.entries(data.quizWrong).forEach(([p, ids]) => { s.quizWrong[p] = [...new Set([...(s.quizWrong[p] ?? []), ...ids])]; });
  });
  return summary(data);
}
const summary = (d) => ({ games: d.games?.length ?? 0, measures: d.measures?.length ?? 0, videos: Object.keys(d.sceneVideos ?? {}).length });

export function resetAll() { state = { ...fresh(), legacy: { at: today(), reset: true } }; save(); }
