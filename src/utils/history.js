const KEY = 'baseball-quiz-history';
const MAX_ENTRIES = 100;

export function saveResult({ theme, score, total, maxCombo, careerTitle, careerEmoji }) {
  const percentage = Math.round((score / total) * 100);
  const now = new Date();
  const date = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const entry = { id: Date.now(), date, theme, score, total, percentage, maxCombo, careerTitle, careerEmoji };
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
