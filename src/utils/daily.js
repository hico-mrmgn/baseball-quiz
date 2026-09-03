import { getHistory } from './history';

const DAILY_KEY = 'baseball-quiz-daily';

/** Date → 'YYYY-MM-DD'（端末のローカル日付） */
export function toDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr() {
  return toDateKey(new Date());
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateKey(d);
}

const EMPTY = { streak: 0, lastDate: null, log: {} };

export function getDailyData() {
  try {
    const data = JSON.parse(localStorage.getItem(DAILY_KEY)) || {};
    return { ...EMPTY, ...data, log: data.log ?? {} };
  } catch {
    return { ...EMPTY };
  }
}

function saveDailyData(data) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

export function isDailyCompleted() {
  const data = getDailyData();
  return data.lastDate === todayStr();
}

/**
 * 今日のトレーニングを終えたことを記録する。
 *
 * ストリークとは別に、日ごとの実施ログ（log）も残す。保護者が
 * 「どの日にやったか」をあとから確かめるためのもので、同じ日に2回やっても
 * 最初の1回だけを残す（「やったかどうか」が知りたいので、上書きしない）。
 */
export function completeDailyChallenge(result = {}) {
  const data = getDailyData();
  const today = todayStr();

  const log = { ...data.log };
  if (!log[today]) {
    log[today] = {
      at: Date.now(),
      bestRate: result.bestRate ?? null,
      cleared: result.cleared ?? null,
    };
  }

  if (data.lastDate === today) {
    saveDailyData({ ...data, log });
    return { streak: data.streak, alreadyDone: true };
  }

  let newStreak;
  if (data.lastDate === yesterdayStr()) {
    newStreak = data.streak + 1;
  } else {
    newStreak = 1;
  }

  const newData = {
    streak: newStreak,
    lastDate: today,
    bestStreak: Math.max(newStreak, data.bestStreak || 0),
    log,
  };
  saveDailyData(newData);

  return { streak: newStreak, alreadyDone: false };
}

export function getDailyStreak() {
  const data = getDailyData();
  const today = todayStr();
  const yesterday = yesterdayStr();

  // 今日やった or 昨日やった（まだ今日やってない）→ ストリーク継続中
  if (data.lastDate === today || data.lastDate === yesterday) {
    return data.streak;
  }
  return 0;
}

/**
 * 日ごとの実施ログを返す。{ 'YYYY-MM-DD': { at, bestRate, cleared } }
 *
 * log を持つ前に終えた分は、戦績の履歴（theme が 'daily' のもの）から補う。
 * 履歴の id は保存時の Date.now() なので、そこから日付を起こせる。
 * 戦績は100件までしか残らないので、古い日は落ちることがある。
 */
export function getDailyLog() {
  const data = getDailyData();
  const log = {};

  for (const entry of getHistory()) {
    if (entry.theme !== 'daily' || typeof entry.id !== 'number') continue;
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

// 今日のデイリーチャレンジ用の問題シード（日付ベース）
export function getDailySeed() {
  const today = todayStr();
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = ((hash << 5) - hash) + today.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
