export const CAREER_TIERS = [
  { min: 100, emoji: '🏆', title: 'ドラフト1位指名！',      message: 'プロ球団からオファー殺到！野球脳、完璧すぎる！',           bg: 'from-yellow-400 to-amber-500',  text: 'text-white' },
  { min: 90,  emoji: '🌟', title: '甲子園のスター候補',      message: 'スカウトが目をつけてる！あと少しでドラフトだ！',           bg: 'from-amber-400 to-orange-400',  text: 'text-white' },
  { min: 80,  emoji: '⚾', title: 'レギュラー確定！',        message: '監督も全信頼！チームの柱になれる実力だ！',                 bg: 'from-green-400 to-emerald-500', text: 'text-white' },
  { min: 70,  emoji: '😤', title: 'スタメン争い中',          message: 'もう少しで試合に出れる！ライバルに差をつけろ！',           bg: 'from-blue-400 to-blue-500',     text: 'text-white' },
  { min: 60,  emoji: '😅', title: '補欠メンバー',            message: '応援席から熱く学ぼう！次は絶対スタメンだ！',               bg: 'from-sky-300 to-blue-400',      text: 'text-white' },
  { min: 50,  emoji: '🤔', title: '練習試合にたまに出れる',  message: '基礎から見直そう。まずはキャッチボールから！',             bg: 'from-gray-300 to-gray-400',     text: 'text-gray-800' },
  { min: 40,  emoji: '😓', title: 'マネージャーの方が詳しい', message: 'まずはルールブックを読もう…！',                          bg: 'from-orange-200 to-orange-300', text: 'text-gray-800' },
  { min: 30,  emoji: '😰', title: '道具の片付け係',          message: 'グラウンドをきれいにする仕事は任せろ！',                   bg: 'from-red-200 to-orange-200',    text: 'text-gray-800' },
  { min: 20,  emoji: '😱', title: 'グローブの使い方からやり直し', message: 'え、グローブって右手につけるの…？',                  bg: 'from-red-300 to-red-400',       text: 'text-white' },
  { min: 1,   emoji: '😭', title: 'ユニフォームが似合うだけ', message: '着てるだけでも十分かっこいい！でもちゃんと練習して！',    bg: 'from-red-400 to-red-500',       text: 'text-white' },
  { min: 0,   emoji: '⚰️', title: '野球は諦めて卓球部へ',   message: 'でも卓球も楽しいよ！ラケット持ってみよう。',               bg: 'from-gray-600 to-gray-700',     text: 'text-white' },
];

export function getCareerTier(percentage) {
  return CAREER_TIERS.find((t) => percentage >= t.min);
}
