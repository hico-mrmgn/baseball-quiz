const LEVEL_KEY = 'baseball-quiz-level';

// 経験値テーブル: レベルNに必要な累計XP
const XP_TABLE = [
  0,    // Lv1: 0
  30,   // Lv2: 30
  80,   // Lv3: 80
  150,  // Lv4: 150
  250,  // Lv5: 250
  400,  // Lv6: 400
  600,  // Lv7: 600
  850,  // Lv8: 850
  1200, // Lv9: 1200
  1600, // Lv10: 1600
  2100, // Lv11: 2100
  2700, // Lv12: 2700
  3500, // Lv13: 3500
  4500, // Lv14: 4500
  6000, // Lv15: 6000
];

const LEVEL_TITLES = [
  { level: 1,  title: 'ルーキー',          emoji: '🌱' },
  { level: 2,  title: 'キャッチボール練習中', emoji: '⚾' },
  { level: 3,  title: 'ノック練習中',       emoji: '🥎' },
  { level: 4,  title: 'ベンチ入り選手',     emoji: '💺' },
  { level: 5,  title: 'スタメン候補',       emoji: '📋' },
  { level: 6,  title: 'チームの中心',       emoji: '💪' },
  { level: 7,  title: 'エースプレイヤー',    emoji: '⭐' },
  { level: 8,  title: 'キャプテン',         emoji: '🎖️' },
  { level: 9,  title: '地区大会MVP',        emoji: '🏅' },
  { level: 10, title: '県大会の星',         emoji: '🌟' },
  { level: 11, title: '甲子園出場',         emoji: '🏟️' },
  { level: 12, title: '甲子園ベスト8',      emoji: '🔥' },
  { level: 13, title: '甲子園の怪物',       emoji: '👹' },
  { level: 14, title: 'ドラフト候補',       emoji: '📝' },
  { level: 15, title: 'レジェンド',         emoji: '🏆' },
];

export function getLevelData() {
  try {
    return JSON.parse(localStorage.getItem(LEVEL_KEY)) || { xp: 0 };
  } catch {
    return { xp: 0 };
  }
}

function saveLevelData(data) {
  localStorage.setItem(LEVEL_KEY, JSON.stringify(data));
}

export function calculateLevel(xp) {
  let level = 1;
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) {
      level = i + 1;
      break;
    }
  }
  return Math.min(level, XP_TABLE.length);
}

export function getLevelInfo(xp) {
  const level = calculateLevel(xp);
  const currentXp = xp;
  const currentLevelXp = XP_TABLE[level - 1] || 0;
  const nextLevelXp = XP_TABLE[level] || XP_TABLE[XP_TABLE.length - 1];
  const isMaxLevel = level >= XP_TABLE.length;

  const titleInfo = LEVEL_TITLES.find((t) => t.level === level) || LEVEL_TITLES[0];

  return {
    level,
    title: titleInfo.title,
    emoji: titleInfo.emoji,
    currentXp,
    xpInLevel: currentXp - currentLevelXp,
    xpForNextLevel: nextLevelXp - currentLevelXp,
    progressPercent: isMaxLevel ? 100 : Math.round(((currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
    isMaxLevel,
  };
}

export function addXp(score, total, maxCombo) {
  const data = getLevelData();
  const prevLevel = calculateLevel(data.xp);

  // XP計算: 正解数×5 + 正答率ボーナス + コンボボーナス
  const percentage = Math.round((score / total) * 100);
  let xpGain = score * 5;
  if (percentage >= 100) xpGain += 30;       // パーフェクトボーナス
  else if (percentage >= 80) xpGain += 15;   // 高得点ボーナス
  if (maxCombo >= 10) xpGain += 20;          // コンボボーナス
  else if (maxCombo >= 5) xpGain += 10;

  data.xp += xpGain;
  saveLevelData(data);

  const newLevel = calculateLevel(data.xp);
  return {
    xpGain,
    totalXp: data.xp,
    levelUp: newLevel > prevLevel,
    newLevel,
    levelInfo: getLevelInfo(data.xp),
  };
}
