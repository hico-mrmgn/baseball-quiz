import { themes } from '../data/questions';
import { getCareerTier } from '../utils/career';

export default function ResultScreen({ score, total, maxCombo, theme, onRetry, onHome, onHistory }) {
  const percentage = Math.round((score / total) * 100);
  const themeInfo = theme === 'random' ? { name: 'ランダム', icon: '🎲' } : themes[theme];
  const tier = getCareerTier(percentage);

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
            <div className="text-right text-sm font-bold text-green-600 mt-1">{percentage}%</div>
          </div>

          {maxCombo >= 3 && (
            <div className="flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-xl px-4 py-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-black text-orange-600 text-lg">最大コンボ {maxCombo}連続！</div>
                <div className="text-xs text-orange-500">
                  {maxCombo >= 10 ? '神がかり的な集中力！' :
                   maxCombo >= 7  ? 'ゾーンに入ってた！' :
                   maxCombo >= 5  ? '絶好調だったね！' : 'いい流れだった！'}
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
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onHistory}
              className="w-full p-4 rounded-xl bg-white border-2 border-amber-300 text-amber-700 font-bold text-base shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              📊 戦績を見る
            </button>
            <button
              onClick={onHome}
              className="w-full p-4 rounded-xl bg-white border-2 border-green-300 text-green-700 font-bold text-base shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              🏠 トップへ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
