const WEAKNESS_KEY = 'baseball-quiz-wrong-answers';

export function saveWrongAnswer(questionId) {
  const data = getWrongAnswers();
  if (!data.includes(questionId)) {
    data.push(questionId);
    localStorage.setItem(WEAKNESS_KEY, JSON.stringify(data));
  }
}

export function removeWrongAnswer(questionId) {
  const data = getWrongAnswers();
  const filtered = data.filter((id) => id !== questionId);
  localStorage.setItem(WEAKNESS_KEY, JSON.stringify(filtered));
}

export function getWrongAnswers() {
  try {
    return JSON.parse(localStorage.getItem(WEAKNESS_KEY)) || [];
  } catch {
    return [];
  }
}

export function clearWrongAnswers() {
  localStorage.removeItem(WEAKNESS_KEY);
}
