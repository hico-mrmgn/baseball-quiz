import { themes } from '../data/questions';

const CAREER_TIERS = [
  { min: 100, emoji: '🏆', title: 'ドラフト1位指名！', message: 'プロ球団からオファー殺到！野球脳、完璧すぎる！', bg: 'from-yellow-400 to-amber-500', text: 'text-white' },
  { min: 90,  emoji: '🌟', title: '甲子園のスター候補', message: 'スカウトが目をつけてる！あと少しでドラフトだ！', bg: 'from-amber-400 to-orange-400', text: 'text-white' },
  { min: 80,  emoji: '⚾', title: 'レギュラー確定！', message: '監督も全信頼！チームの柱になれる実力だ！', bg: 'from-green-400 to-emerald-500', text: 'text-white' },
  { min: 70,  emoji: '😤', title: 'スタメン争い中', message: 'もう少しで試合に出れる！ライバルに差をつけろ！', bg: 'from-blue-400 to-blue-500', text: 'text-white' },
  { min: 60,  emoji: '😅', title: '補欠メンバー', message: '応援席から熱く学ぼう！次は絶対スタメンだ！', bg: 'from-sky-300 to-blue-400', text: 'text-white' },
  { min: 50,  emoji: '🤔', title: '練習試合にたまに出れる', message: '基礎から見直そう。まずはキャッチボールから！', bg: 'from-gray-300 to-gray-400', text: 'text-gray-800' },
  { min: 40,  emoji: '😓', title: 'マネージャーの方が詳しい', message: 'まずはルールブックを読もう…！', bg: 'from-orange-200 to-orange-300', text: 'text-gray-800' },
  { min: 30,  emoji: '😰', title: '道具の片付け係', message: 'グラウンドをきれいにする仕事は任せろ！', bg: 'from-red-200 to-orange-200', text: 'text-gray-800' },
  { min: 20,  emoji: '😱', title: 'グローブの使い方からやり直し', message: 'え、グローブって右手につけるの…？', bg: 'from-red-300 to-red-400', text: 'text-white' },
  { min: 1,   emoji: '😭', title: 'ユニフォームが似合うだけ', message: '着てるだけでも十分かっこいい！でもちゃんと練習して！', bg: 'from-red-400 to-red-500', text: 'text-white' },
  { min: 0,   emoji: '⚰️', title: '野球は諦めて卓球部へ', message: 'でも卓球も楽しいよ！ラケット持ってみよう。', bg: 'from-gray-600 to-gray-700', text: 'text-white' },
];

export default function ResultScreen({ score, total, maxCombo, theme, onRetry, onHome }) {
  const percentage = Math.round((score / total) * 100);

  const themeInfo = theme === 'random'
    ? { name: 'ランダム', icon: '🎲' }
    : themes[theme];

  const tier = CAREER_TIERS.find((t) => percentage >= t.min);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">

        {/* Career tier card */}
        <div className={`bg-gradient-to-br ${tier.bg} rounded-3xl shadow-xl p-8 mb-4`}>
          <div className="text-7xl mb-3">{tier.emoji}</div>
          <h2 className={`text-2xl font-black mb-2 ${tier.text}`}>{tier.title}</h2>
          <p className={`text-sm font-bold opacity-90 ${tier.text}`}>{tier.message}</p>
        </div>

        {/* Score card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">{themeInfo.icon}</span>
            <span className="font-bold text-gray-600">{themeInfo.name}</span>
          </div>

          <div className="bg-green-50 rounded-2xl p-5 mb-4">
            <div className="text-6xl font-black text-green-600 mb-1">
              {score}<span className="text-2xl text-gray-400">/{total}</span>
            </div>
            <div className="text-sm text-gray-500">問正解</div>

            <div className="w-full h-4 bg-green-200 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="text-right text-sm font-bold text-green-600 mt-1">
              {percentage}%
            </div>
          </div>

          {/* Max combo */}
          {maxCombo >= 3 && (
            <div className="flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-xl px-4 py-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-black text-orange-600 text-lg">最大コンボ {maxCombo}連続！</div>
                <div className="text-xs text-orange-500">
                  {maxCombo >= 10 ? '神がかり的な集中力！' :
                   maxCombo >= 7  ? 'ゾーンに入ってた！' :
                   maxCombo >= 5  ? '絶好調だったね！' :
                                    'いい流れだった！'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-3">
          <button
            onClick={onRetry}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            🔄 もう一度チャレンジ
          </button>
          <button
            onClick={onHome}
            className="w-full p-4 rounded-xl bg-white border-2 border-green-300 text-green-700 font-bold text-lg shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            🏠 トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
