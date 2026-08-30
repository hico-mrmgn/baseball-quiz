/**
 * 基礎ドリル（従来のクイズ）の出題準備。
 *
 * 旧データは正解の選択肢インデックスが1に約63%集中していて（走塁編は93%が0番目）、
 * 中身を読まずに「迷ったら2番目」で当たってしまう状態だった。
 * データ側の並びは変えず、出題のたびに順番を混ぜることで解消する。
 */

/**
 * 決定的な擬似乱数。デイリーチャレンジは全員が同じ問題・同じ並びで
 * 解けないと成立しないので、日付シードから並びを再現できるようにする。
 */
export function makeSeededRandom(seed) {
  let s = seed >>> 0;
  return function random() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 配列を混ぜる（元の配列は変えない）。
 *
 * `rand` を渡さなければ毎回ちがう並び、`makeSeededRandom()` を渡せば
 * 同じシードから同じ並びが再現できる。
 */
export function shuffleArray(array, rand = Math.random) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 1問の選択肢を混ぜ、correct を新しい位置に振り直す。 */
export function shuffleQuestionChoices(question, rand = Math.random) {
  const order = question.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...question,
    choices: order.map((i) => question.choices[i]),
    correct: order.indexOf(question.correct),
  };
}

export function shuffleAllChoices(questions, rand = Math.random) {
  return questions.map((q) => shuffleQuestionChoices(q, rand));
}

/* ── 難易度 ── */

export const DIFFICULTY_FILTERS = [
  { id: 'all',    label: '全部',  short: '全部', emoji: '',    color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { id: 'easy',   label: '初級',    short: '初級',   emoji: '⭐',   color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 'normal', label: '中級',    short: '中級',   emoji: '⭐⭐', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  { id: 'hard',   label: '上級',    short: '上級',   emoji: '⭐⭐⭐', color: 'bg-orange-100 text-orange-700 border-orange-300' },
  { id: 'expert', label: 'プロ級',  short: 'プロ級', emoji: '🔥',  color: 'bg-red-100 text-red-700 border-red-300' },
];

/**
 * 難易度でしぼる。`difficulty` はこれまで表示専用で、出題には使われていなかった。
 * 該当が少なすぎるテーマでもクイズが成立するよう、0問になる場合は絞り込みを外す。
 */
export function filterByDifficulty(questions, difficultyId) {
  if (!difficultyId || difficultyId === 'all') return questions;
  const filtered = questions.filter((q) => q.difficulty === difficultyId);
  return filtered.length > 0 ? filtered : questions;
}

export function countByDifficulty(questions, difficultyId) {
  if (!difficultyId || difficultyId === 'all') return questions.length;
  return questions.filter((q) => q.difficulty === difficultyId).length;
}
