const KEY = 'baseball-quiz-history';
const MAX_ENTRIES = 100;

/**
 * 1回ぶんの結果を保存する。
 *
 * meta には、モードごとの細かい成績（最善手率・致命傷の数・守り切れたか等）を
 * 入れる。バッジの判定に使うためのもので、古い履歴には入っていないので
 * 読む側は無い前提で書くこと。
 */
export function saveResult({ theme, score, total, maxCombo, careerTitle, careerEmoji, meta }) {
  const percentage = Math.round((score / total) * 100);
  const now = new Date();
  const date = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entry = { id: Date.now(), date, theme, score, total, percentage, maxCombo, careerTitle, careerEmoji, meta };
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
}

export function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function clearAllData() {
  localStorage.removeItem(KEY);
  localStorage.removeItem('baseball-quiz-badges');
  localStorage.removeItem('baseball-quiz-level');
  localStorage.removeItem('baseball-quiz-daily');
  localStorage.removeItem('baseball-quiz-wrong-answers');
}
