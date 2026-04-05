import { themes, questions } from '../data/questions';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWrongAnswers } from '../utils/weakness';

export default function TopScreen({ onSelectTheme, onHistory, onBadges, onDailyChallenge, onWeaknessQuiz }) {
  const themeKeys = Object.keys(themes);
  const levelInfo = getLevelInfo(getLevelData().xp);
  const dailyDone = isDailyCompleted();
  const dailyStreak = getDailyStreak();
  const wrongCount = getWrongAnswers().length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-green-800 mb-2">
            ⚾ つぎ、どうする？
          </h1>
          <p className="text-lg text-green-700">
            野球の状況判断クイズ
          </p>
        </div>

        {/* レベル表示 */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{levelInfo.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="font-black text-gray-800 text-lg">Lv.{levelInfo.level} {levelInfo.title}</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                  style={{ width: `${levelInfo.progressPercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-0.5 text-right">
                {levelInfo.isMaxLevel ? 'MAX' : `${levelInfo.xpInLevel} / ${levelInfo.xpForNextLevel} XP`}
              </div>
            </div>
          </div>
        </div>

        {/* デイリーチャレンジ */}
        <button
          onClick={onDailyChallenge}
          disabled={dailyDone}
          className={`flex items-center gap-4 w-full p-5 rounded-2xl shadow-lg active:scale-[0.98] transition-all cursor-pointer mb-4 ${
            dailyDone
              ? 'bg-gray-100 border-2 border-gray-200 opacity-60'
              : 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white hover:shadow-xl'
          }`}
        >
          <span className="text-4xl">{dailyDone ? '✅' : '📅'}</span>
          <div className="text-left">
            <div className={`text-xl font-bold ${dailyDone ? 'text-gray-500' : 'text-white'}`}>
              {dailyDone ? 'きょうのチャレンジ クリア！' : 'きょうのチャレンジ'}
            </div>
            <div className={`text-sm ${dailyDone ? 'text-gray-400' : 'text-white/90'}`}>
              {dailyDone
                ? `${dailyStreak}日連続チャレンジ中 🔥`
                : `毎日5もん！${dailyStreak > 0 ? `${dailyStreak}日連続中 🔥` : 'きょうもがんばろう！'}`}
            </div>
          </div>
        </button>

        {/* にがてこくふくモード */}
        {wrongCount > 0 && (
          <button
            onClick={onWeaknessQuiz}
            className="flex items-center gap-4 w-full p-5 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer mb-4"
          >
            <span className="text-4xl">📝</span>
            <div className="text-left">
              <div className="text-xl font-bold">にがてこくふく</div>
              <div className="text-sm opacity-90">
                まちがえた問題にリベンジ！（{wrongCount}問）
              </div>
            </div>
          </button>
        )}

        {/* テーマ選択 */}
        <div className="grid gap-4">
          {themeKeys.map((key) => {
            const theme = themes[key];
            const count = questions.filter((q) => q.theme === key).length;
            return (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`flex items-center gap-4 w-full p-5 rounded-2xl bg-gradient-to-r ${theme.color} text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer`}
              >
                <span className="text-4xl">{theme.icon}</span>
                <div className="text-left">
                  <div className="text-xl font-bold">{theme.name}</div>
                  <div className="text-sm opacity-90">
                    {theme.description} ・ {count}問
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => onSelectTheme('random')}
            className="flex items-center gap-4 w-full p-5 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            <span className="text-4xl">🎲</span>
            <div className="text-left">
              <div className="text-xl font-bold">全テーマランダム</div>
              <div className="text-sm opacity-90">
                すべての編からランダムに15問
              </div>
            </div>
          </button>
        </div>

        {/* フッターボタン */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={onHistory}
            className="w-full p-3 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 font-bold text-base active:scale-[0.98] transition-all cursor-pointer"
          >
            📊 戦績を見る
          </button>
          <button
            onClick={onBadges}
            className="w-full p-3 rounded-xl border-2 border-purple-300 bg-purple-50 text-purple-700 font-bold text-base active:scale-[0.98] transition-all cursor-pointer"
          >
            🏅 バッジ
          </button>
        </div>
      </div>
    </div>
  );
}
