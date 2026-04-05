const BADGE_KEY = 'baseball-quiz-badges';

export const BADGE_DEFINITIONS = [
  // プレイ回数系
  { id: 'play-1',    emoji: '⚾', title: 'はじめの一歩',      description: 'はじめてクイズに挑戦した！',    check: (s) => s.totalGames >= 1 },
  { id: 'play-5',    emoji: '🥉', title: 'やる気十分！',       description: '5回クイズに挑戦した！',         check: (s) => s.totalGames >= 5 },
  { id: 'play-10',   emoji: '🥈', title: '練習の鬼',          description: '10回クイズに挑戦した！',         check: (s) => s.totalGames >= 10 },
  { id: 'play-30',   emoji: '🥇', title: '野球博士への道',     description: '30回クイズに挑戦した！',         check: (s) => s.totalGames >= 30 },
  { id: 'play-50',   emoji: '👑', title: 'クイズマスター',     description: '50回クイズに挑戦した！',         check: (s) => s.totalGames >= 50 },

  // スコア系
  { id: 'perfect',   emoji: '💯', title: 'パーフェクト！',     description: '全問正解を達成した！',            check: (s) => s.hasPerfect },
  { id: 'score-90',  emoji: '🌟', title: 'スーパープレイ',     description: '90%以上のスコアを出した！',       check: (s) => s.bestScore >= 90 },
  { id: 'score-80',  emoji: '✨', title: 'ナイスプレイ',       description: '80%以上のスコアを出した！',       check: (s) => s.bestScore >= 80 },

  // コンボ系
  { id: 'combo-5',   emoji: '⚡', title: 'コンボスター',       description: '5連続正解を達成した！',           check: (s) => s.bestCombo >= 5 },
  { id: 'combo-10',  emoji: '🔥', title: '連続正解マシーン',   description: '10連続正解を達成した！',          check: (s) => s.bestCombo >= 10 },
  { id: 'combo-15',  emoji: '💎', title: 'パーフェクトコンボ', description: '15連続正解！全問コンボ達成！',     check: (s) => s.bestCombo >= 15 },

  // テーマ系
  { id: 'all-themes', emoji: '🏟️', title: 'オールラウンダー', description: 'すべてのテーマに挑戦した！',     check: (s) => s.uniqueThemes >= 5 },

  // デイリー系
  { id: 'daily-3',   emoji: '📅', title: '3日連続チャレンジ',  description: 'デイリーチャレンジを3日連続達成！', check: (s) => s.dailyStreak >= 3 },
  { id: 'daily-7',   emoji: '🗓️', title: '1週間連続！',       description: 'デイリーチャレンジを7日連続達成！', check: (s) => s.dailyStreak >= 7 },
];

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
      const unlocked = {
        id: badge.id,
        unlockedAt: new Date().toISOString(),
      };
      current.push(unlocked);
      newBadges.push(badge);
    }
  }

  if (newBadges.length > 0) {
    localStorage.setItem(BADGE_KEY, JSON.stringify(current));
  }

  return newBadges;
}

export function getBadgeStatus() {
  const unlocked = getUnlockedBadges();
  const unlockedIds = new Set(unlocked.map((b) => b.id));
  return BADGE_DEFINITIONS.map((badge) => ({
    ...badge,
    unlocked: unlockedIds.has(badge.id),
  }));
}
