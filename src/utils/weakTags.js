/**
 * 苦手の記録を「問題ID」ではなく「判断の種類（タグ）」で持つ。
 *
 * 従来の苦手リスト（utils/weakness.js）は間違えた問題のIDをためる作りで、
 * 基礎ドリルの1170問向けだった。実戦シナリオは53場面しかないので、
 * ID単位だとすぐ一巡してしまい復習にならない。
 *
 * タグ単位なら、53場面でも「点差判断が弱い」「カバーリングが弱い」を
 * 積み上げられるし、子どもにとっても何を練習すればいいかが分かる。
 */

const KEY = 'baseball-quiz-weak-tags';

/** 直近の成績を重く見るための減衰率。古い記録を少しずつ薄める。 */
const DECAY = 0.85;
/** これだけ答えていないタグは、まだ判断材料が足りないとみなす。 */
const MIN_SAMPLES = 2;

export function getTagStats() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

function save(stats) {
  localStorage.setItem(KEY, JSON.stringify(stats));
}

/**
 * シナリオの回答結果をタグ別に記録する。
 * answers: [{ scenario, choice }]（utils/scenario.js の summarize と同じ形）
 */
export function recordScenarioAnswers(answers) {
  if (!answers?.length) return;
  const stats = getTagStats();

  // 既存の記録を減衰させてから足す。今日の判断が明日の出題に効くようにするため。
  for (const tag of Object.keys(stats)) {
    stats[tag].gained *= DECAY;
    stats[tag].possible *= DECAY;
    stats[tag].count *= DECAY;
  }

  for (const a of answers) {
    for (const tag of a.scenario?.tags ?? []) {
      const cur = stats[tag] ?? { gained: 0, possible: 0, count: 0 };
      cur.gained += a.choice.score;
      cur.possible += 3; // 最善手＝3点
      cur.count += 1;
      stats[tag] = cur;
    }
  }
  save(stats);
}

/** タグごとの習熟度（0〜100）。低いほど苦手。 */
export function tagScores() {
  const stats = getTagStats();
  return Object.entries(stats).map(([tag, v]) => ({
    tag,
    percent: v.possible > 0 ? Math.round((Math.max(v.gained, 0) / v.possible) * 100) : 0,
    count: Math.round(v.count),
    enough: v.count >= MIN_SAMPLES,
  }));
}

/**
 * 苦手なタグを弱い順に返す。
 * まだ数が足りないタグは「苦手」と決めつけず対象外にする。
 */
export function getWeakTags(limit = 3) {
  return tagScores()
    .filter((t) => t.enough && t.percent < 100)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, limit);
}

/** 一度も答えていないタグを「まだやっていない」として扱えるように。 */
export function untouchedTags(allTags) {
  const stats = getTagStats();
  return allTags.filter((t) => !stats[t]);
}

export function clearTagStats() {
  localStorage.removeItem(KEY);
}
