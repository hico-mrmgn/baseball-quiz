import { themes, questions } from '../data/questions';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWrongAnswers } from '../utils/weakness';

const themeGroups = [
  {
    label: '守備ポジション',
    keys: ['third', 'second', 'short', 'pitcher', 'first', 'outfield'],
  },
  {
    label: '攻撃・走塁',
    keys: ['baserun', 'coach'],
  },
  {
    label: 'ルール知識',
    keys: ['rules'],
  },
  {
    label: '特別編',
    keys: ['fighters', 'npb2025'],
  },
];

export default function TopScreen({ onSelectTheme, onHistory, onBadges, onDailyChallenge, onWeaknessQuiz }) {
  const levelInfo = getLevelInfo(getLevelData().xp);
  const dailyDone = isDailyCompleted();
  const dailyStreak = getDailyStreak();
  const wrongCount = getWrongAnswers().length;

  return (
    <div className="min-h-screen bg-gray-50 px-3 lg:px-6 py-6">
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        {/* Zone 1: ヘッダー */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black text-gray-900">⚾ つぎ、どうする？</h1>
            <p className="text-xs text-gray-400">野球の状況判断クイズ</p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{levelInfo.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-black text-gray-800">Lv.{levelInfo.level} {levelInfo.title}</div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: 今日やること */}
        <div className="mb-5">
          <div className="text-xs font-bold text-gray-400 tracking-wider mb-2">今日やること</div>
          <div className="grid gap-2">
            <button
              onClick={onDailyChallenge}
              disabled={dailyDone}
              className={`flex items-center gap-3 w-full p-4 rounded-2xl shadow active:scale-[0.98] transition-all cursor-pointer ${
                dailyDone
                  ? 'bg-gray-100 border border-gray-200 opacity-60'
                  : 'bg-blue-50 border border-blue-200 hover:shadow-sm hover:border-blue-300'
              }`}
            >
              <span className="text-3xl">{dailyDone ? '✅' : '📅'}</span>
              <div className="text-left">
                <div className={`text-base font-bold ${dailyDone ? 'text-gray-400' : 'text-blue-800'}`}>
                  {dailyDone ? 'きょうのチャレンジ クリア！' : 'きょうのチャレンジ'}
                </div>
                <div className={`text-xs ${dailyDone ? 'text-gray-400' : 'text-blue-600'}`}>
                  {dailyDone
                    ? `${dailyStreak}日連続チャレンジ中 🔥`
                    : `毎日5もん！${dailyStreak > 0 ? `${dailyStreak}日連続中 🔥` : 'きょうもがんばろう！'}`}
                </div>
              </div>
            </button>

            {wrongCount > 0 && (
              <button
                onClick={onWeaknessQuiz}
                className="flex items-center gap-3 w-full p-4 rounded-2xl bg-blue-100 border border-blue-200 hover:shadow-sm hover:border-blue-300 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="text-3xl">📝</span>
                <div className="text-left">
                  <div className="text-base font-bold text-blue-800">にがてこくふく</div>
                  <div className="text-xs text-blue-600">まちがえた問題にリベンジ！（{wrongCount}問）</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Zone 3: テーマを選ぶ */}
        <div className="mb-5">
          <div className="text-xs font-bold text-gray-400 tracking-wider mb-3">テーマを選ぶ</div>
          <div className="grid gap-4">
            {themeGroups.map((group) => (
              <div key={group.label}>
                <div className="text-xs font-bold text-gray-400 mb-2">{group.label}</div>
                <div className="grid grid-cols-2 gap-2">
                  {group.keys.map((key) => {
                    const theme = themes[key];
                    if (!theme) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => onSelectTheme(key)}
                        className="flex items-center gap-2 w-full p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-800 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <span className="text-2xl">{theme.icon}</span>
                        <span className="font-bold text-sm">{theme.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Zone 4: もっとやるなら */}
        <div className="mb-4">
          <div className="text-xs font-bold text-gray-400 tracking-wider mb-2">もっとやるなら</div>
          <button
            onClick={() => onSelectTheme('random')}
            className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white border border-gray-200 shadow-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="text-3xl">🎲</span>
            <div className="text-left">
              <div className="text-base font-bold">全テーマランダム</div>
              <div className="text-xs opacity-90">すべての編からランダムに15問</div>
            </div>
          </button>
        </div>

        {/* Zone 5: フッター */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onHistory}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-300 hover:text-blue-600"
          >
            📊 戦績を見る
          </button>
          <button
            onClick={onBadges}
            className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm active:scale-[0.98] transition-all cursor-pointer hover:border-blue-300 hover:text-blue-600"
          >
            🏅 バッジ
          </button>
        </div>

      </div>
    </div>
  );
}
