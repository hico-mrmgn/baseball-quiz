const DAILY_KEY = 'baseball-quiz-daily';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getDailyData() {
  try {
    return JSON.parse(localStorage.getItem(DAILY_KEY)) || { streak: 0, lastDate: null, completedToday: false };
  } catch {
    return { streak: 0, lastDate: null, completedToday: false };
  }
}

function saveDailyData(data) {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
}

export function isDailyCompleted() {
  const data = getDailyData();
  return data.lastDate === todayStr();
}

export function completeDailyChallenge() {
  const data = getDailyData();
  const today = todayStr();

  if (data.lastDate === today) {
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
