export const CAREER_TIERS = [
  { min: 100, emoji: '🏆', title: 'ドラフト1位指名！',        message: 'プロ球団からオファー殺到！野球脳、完璧すぎる！',           bg: 'from-yellow-400 to-amber-500',  text: 'text-white' },
  { min: 90,  emoji: '🌟', title: '甲子園のスター候補',        message: 'スカウトが目をつけてる！あと少しでドラフトだ！',           bg: 'from-amber-400 to-orange-400',  text: 'text-white' },
  { min: 80,  emoji: '⚾', title: 'レギュラー確定！',          message: '監督も全信頼！チームの柱になれる実力だ！',                 bg: 'from-green-400 to-emerald-500', text: 'text-white' },
  { min: 70,  emoji: '😤', title: 'スタメン争い中',            message: 'もう少しで試合に出れる！ライバルに差をつけろ！',           bg: 'from-blue-400 to-blue-500',     text: 'text-white' },
  { min: 60,  emoji: '💪', title: 'チームの成長株！',          message: '伸びしろバツグン！練習するたびにうまくなってる！',         bg: 'from-sky-300 to-blue-400',      text: 'text-white' },
  { min: 50,  emoji: '🔥', title: 'やる気マックスの努力家',    message: 'がんばる気持ちが一番大事！その調子で続けよう！',           bg: 'from-teal-300 to-teal-400',     text: 'text-white' },
  { min: 40,  emoji: '📖', title: 'ルールを勉強中！',          message: '知れば知るほど野球はおもしろい！どんどん覚えよう！',       bg: 'from-indigo-300 to-indigo-400', text: 'text-white' },
  { min: 30,  emoji: '🌱', title: 'のびしろいっぱいルーキー',  message: 'まだまだこれから！次はもっといい結果が出るよ！',           bg: 'from-lime-300 to-green-400',    text: 'text-white' },
  { min: 20,  emoji: '⚡', title: 'チャレンジャー！',          message: 'むずかしい問題にもチャレンジするその気持ちがすごい！',     bg: 'from-purple-300 to-purple-400', text: 'text-white' },
  { min: 1,   emoji: '🎯', title: 'はじめの一歩！',            message: '正解できた問題があるってすごいこと！自信を持とう！',       bg: 'from-pink-300 to-pink-400',     text: 'text-white' },
  { min: 0,   emoji: '🌈', title: 'スタートライン！',          message: 'ここからスタート！何回もやればどんどんわかるよ！',         bg: 'from-violet-400 to-purple-500', text: 'text-white' },
];

export function getCareerTier(percentage) {
  return CAREER_TIERS.find((t) => percentage >= t.min);
}
