import { tagScores } from './weakTags';

/**
 * バッジ。
 *
 * 以前のバッジは「プレイ回数・正答率・コンボ」だけを見ていた。これは基礎ドリルの
 * ○×クイズを前提にした設計で、実戦シナリオが主役になったあとは実態と合わなくなって
 * いた。とくにコンボ系は maxCombo を記録しているのが基礎ドリルだけだったため、
 * メインモードをどれだけやっても永久に取れないバッジになっていた。
 *
 * いまは「続ける／判断の質／守り切れ／判断の種類／基本練習」の5つに分け、
 * 実戦シナリオの指標（最善手率・致命傷・最善手の連続・タグの習熟）で評価する。
 */

const BADGE_KEY = 'baseball-quiz-badges';

export const BADGE_CATEGORIES = [
  { id: 'habit',    name: '続ける',       emoji: '🔥' },
  { id: 'judgment', name: '判断の質',     emoji: '🎯' },
  { id: 'inning',   name: '守り切れ',     emoji: '🛡️' },
  { id: 'tag',      name: '判断の種類',   emoji: '🔎' },
  { id: 'drill',    name: '基本練習',     emoji: '📖' },
];

export const BADGE_DEFINITIONS = [
  /* ── 続ける ── */
  { id: 'play-1',   category: 'habit', emoji: '⚾', title: 'はじめの一歩',   description: 'はじめてトレーニングをした',   check: (s) => s.totalSessions >= 1 },
  { id: 'play-10',  category: 'habit', emoji: '🥈', title: '練習の鬼',       description: '10回トレーニングした',         check: (s) => s.totalSessions >= 10 },
  { id: 'play-30',  category: 'habit', emoji: '🥇', title: '野球脳を育てる', description: '30回トレーニングした',         check: (s) => s.totalSessions >= 30 },
  { id: 'play-50',  category: 'habit', emoji: '👑', title: 'やりこみ王',     description: '50回トレーニングした',         check: (s) => s.totalSessions >= 50 },
  { id: 'daily-3',  category: 'habit', emoji: '📅', title: '3日連続',        description: '今日のトレーニングを3日続けた', check: (s) => s.dailyStreak >= 3 },
  { id: 'daily-7',  category: 'habit', emoji: '🗓️', title: '1週間連続',      description: '今日のトレーニングを7日続けた', check: (s) => s.dailyStreak >= 7 },
  { id: 'daily-30', category: 'habit', emoji: '🔥', title: '1か月連続',      description: '今日のトレーニングを30日続けた', check: (s) => s.dailyStreak >= 30 },

  /* ── 判断の質（実戦シナリオ） ── */
  { id: 'score-80',  category: 'judgment', emoji: '✨', title: '判断が見えてきた',   description: '最善手率80%以上を出した',        check: (s) => s.bestRate >= 80 },
  { id: 'score-90',  category: 'judgment', emoji: '🌟', title: 'レギュラーの判断',   description: '最善手率90%以上を出した',        check: (s) => s.bestRate >= 90 },
  { id: 'perfect',   category: 'judgment', emoji: '💯', title: 'オール最善手',       description: '1回ぜんぶ最善手だった',          check: (s) => s.hasPerfectScenario },
  { id: 'no-fatal',  category: 'judgment', emoji: '🧠', title: '試合を壊さない',     description: '10場面以上を致命傷ゼロで終えた', check: (s) => s.hasCleanSession },
  { id: 'streak-8',  category: 'judgment', emoji: '🎯', title: '最善手8連続',        description: '最善手を8回続けた',              check: (s) => s.bestStreak >= 8 },

  /* ── 守り切れ（イニング） ── */
  { id: 'inning-1',   category: 'inning', emoji: '🥎', title: 'はじめて守り切った', description: 'イニングを1つ守り切った',       check: (s) => s.inningsCleared >= 1 },
  { id: 'inning-3',   category: 'inning', emoji: '🧤', title: '守りのかなめ',       description: '3種類のイニングを守り切った',   check: (s) => s.inningsCleared >= 3 },
  { id: 'inning-all', category: 'inning', emoji: '🏟️', title: '鉄壁',              description: 'すべてのイニングを守り切った', check: (s) => s.totalInnings > 0 && s.inningsCleared >= s.totalInnings },

  /* ── 判断の種類（タグ） ── */
  { id: 'tag-touch',    category: 'tag', emoji: '🔎', title: '幅広く挑戦',       description: '10種類以上の判断に取り組んだ', check: (s) => s.touchedTags >= 10 },
  { id: 'tag-master-1', category: 'tag', emoji: '📗', title: '得意ができた',     description: '1つの判断を100%にした',       check: (s) => s.masteredTags >= 1 },
  { id: 'tag-master-5', category: 'tag', emoji: '📚', title: '5つの得意',        description: '5つの判断で80%以上を出した',   check: (s) => s.strongTags >= 5 },

  /* ── 基本練習 ── */
  { id: 'all-themes',   category: 'drill', emoji: '🧩', title: 'オールラウンダー', description: 'すべてのテーマに挑戦した',     check: (s) => s.drillThemes >= s.totalDrillThemes && s.totalDrillThemes > 0 },
  { id: 'drill-expert', category: 'drill', emoji: '🔥', title: 'プロ級をこなす',   description: 'プロ級で80%以上を出した',      check: (s) => s.bestExpertScore >= 80 },
];

/**
 * 履歴とタグの成績からバッジ判定用の数値をまとめる。
 *
 * 履歴の meta は途中から入れたものなので、古いエントリには無い。
 * 無い前提で読むこと。
 */
export function buildBadgeStats({ history, dailyStreak, totalInnings, totalDrillThemes }) {
  const metas = history.map((h) => h.meta).filter(Boolean);
  const scenarioMetas = metas.filter((m) => m.bestRate !== undefined);

  const clearedInnings = new Set(
    metas.filter((m) => m.cleared && m.inningId).map((m) => m.inningId),
  );
  const drillThemes = new Set(
    history
      .filter((h) => !['daily', 'weakness', 'random', 'scenario', 'inning'].includes(h.theme))
      .map((h) => h.theme),
  );

  const tags = tagScores();

  return {
    totalSessions: history.length,
    dailyStreak,

    bestRate: Math.max(0, ...scenarioMetas.map((m) => m.bestRate)),
    hasPerfectScenario: scenarioMetas.some((m) => m.bestRate === 100 && m.total >= 5),
    hasCleanSession: scenarioMetas.some((m) => m.fatalCount === 0 && m.total >= 10),
    bestStreak: Math.max(0, ...scenarioMetas.map((m) => m.bestStreak ?? 0)),

    inningsCleared: clearedInnings.size,
    totalInnings,

    touchedTags: tags.length,
    masteredTags: tags.filter((t) => t.enough && t.percent >= 100).length,
    strongTags: tags.filter((t) => t.enough && t.percent >= 80).length,

    drillThemes: drillThemes.size,
    totalDrillThemes,
    bestExpertScore: Math.max(
      0,
      ...history.filter((h) => h.meta?.difficulty === 'expert').map((h) => h.percentage),
    ),
  };
}

export function getUnlockedBadges() {
  try {
    return JSON.parse(localStorage.getItem(BADGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function checkAndUnlockBadges(stats) {
  const current = getUnlockedBadges();
  const currentIds = new Set(current.map((b) => b.id));
  const newBadges = [];

  for (const badge of BADGE_DEFINITIONS) {
    if (!currentIds.has(badge.id) && badge.check(stats)) {
      current.push({ id: badge.id, unlockedAt: new Date().toISOString() });
      newBadges.push(badge);
    }
  }

  if (newBadges.length > 0) {
    localStorage.setItem(BADGE_KEY, JSON.stringify(current));
  }
  return newBadges;
}

export function getBadgeStatus() {
  const unlockedIds = new Set(getUnlockedBadges().map((b) => b.id));
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: unlockedIds.has(badge.id),
  }));
}
