import { getHistory } from './history';

const DAILY_KEY = 'baseball-quiz-daily';

/** Date → 'YYYY-MM-DD'（端末のローカル日付） */
export function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

/** 'YYYY-MM-DD' を days 日ずらす（月またぎも Date に任せる） */
export function shiftKey(key, days) {
  const [y, m, d] = key.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

/** 'YYYY-MM-DD' → '9/1' のような短い表示 */
export function formatKey(key) {
  return `${Number(key.slice(5, 7))}/${Number(key.slice(8, 10))}`;
}

export function getDailyData() {
  try {
    const data = JSON.parse(localStorage.getItem(DAILY_KEY)) || {};
    return { ...data, log: data.log ?? {} };
  } catch {
    return { log: {} };
  }
}

function saveDailyData(data) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

/**
 * 日ごとの実施ログを返す。{ 'YYYY-MM-DD': { at, bestRate, cleared } }
 *
 * log を持つ前に終えた分は、戦績の履歴（theme が 'daily' のもの）から補う。
 * 履歴の id は保存時の Date.now() なので、そこから日付を起こせる。
 * ただし meta.dateKey を持つ履歴は log 導入後のものなので見ない
 * （過去の日のぶんをあとからやった場合、やった日ではなく対象の日に印がつく）。
 */
export function getDailyLog() {
  const data = getDailyData();
  const log = {};

  for (const entry of getHistory()) {
    if (entry.theme !== 'daily' || typeof entry.id !== 'number') continue;
    if (entry.meta?.dateKey) continue;
    const key = toDateKey(new Date(entry.id));
    // 同じ日の複数回は、いちばん早い1回を残す（履歴は新しい順なので上書きしてよい）
    log[key] = {
      at: entry.id,
      bestRate: entry.meta?.bestRate ?? entry.percentage ?? null,
      cleared: entry.meta?.cleared ?? null,
    };
  }

  // 本来のログを優先する
  Object.assign(log, data.log);

  // log には無いが lastDate だけ残っている場合（古いデータ）も1日として数える
  if (data.lastDate && !log[data.lastDate]) {
    log[data.lastDate] = { at: null, bestRate: null, cleared: null };
  }

  return log;
}

export function isDailyCompleted(dateKey = todayKey()) {
  return Boolean(getDailyLog()[dateKey]);
}

/** key の日で終わる連続日数 */
function streakEndingAt(log, key) {
  let n = 0;
  let k = key;
  while (log[k]) {
    n++;
    k = shiftKey(k, -1);
  }
  return n;
}

/**
 * dateKey の日のトレーニングを終えたことを記録する。
 *
 * ストリークは log から数えるので、抜けた日をあとからやればつながる。
 * 同じ日に2回やっても最初の1回だけを残す（「やったかどうか」が知りたいので上書きしない）。
 */
export function completeDailyChallenge(dateKey = todayKey(), result = {}) {
  const data = getDailyData();
  const alreadyDone = Boolean(getDailyLog()[dateKey]);

  const log = { ...data.log };
  if (!log[dateKey]) {
    log[dateKey] = {
      at: Date.now(),
      bestRate: result.bestRate ?? null,
      cleared: result.cleared ?? null,
    };
  }

  const merged = { ...getDailyLog(), ...log };
  const streak = streakEndingAt(merged, dateKey);
  saveDailyData({
    ...data,
    log,
    bestStreak: Math.max(streak, data.bestStreak || 0),
  });

  return { streak: getDailyStreak(), alreadyDone };
}

/** 今日まで（今日がまだなら昨日まで）の連続日数 */
export function getDailyStreak() {
  const log = getDailyLog();
  const today = todayKey();
  return log[today] ? streakEndingAt(log, today) : streakEndingAt(log, shiftKey(today, -1));
}

export function getBestStreak() {
  const data = getDailyData();
  const log = getDailyLog();
  let best = data.bestStreak || 0;
  for (const key of Object.keys(log)) {
    best = Math.max(best, streakEndingAt(log, key));
  }
  return best;
}

/** 初めて終えた日。まだ1日もやっていなければ null。 */
export function getFirstDoneKey() {
  const keys = Object.keys(getDailyLog()).sort();
  return keys[0] ?? null;
}

// その日のトレーニング用の問題シード（日付ベース）
export function getDailySeed(dateKey = todayKey()) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = ((hash << 5) - hash) + dateKey.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
