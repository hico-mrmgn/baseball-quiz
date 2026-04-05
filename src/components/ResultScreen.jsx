import { themes } from '../data/questions';

export default function ResultScreen({ score, total, theme, onRetry, onHome }) {
  const percentage = Math.round((score / total) * 100);

  const themeInfo = theme === 'random'
    ? { name: 'ランダム', icon: '🎲' }
    : themes[theme];

  let message, emoji;
  if (percentage === 100) {
    message = 'パーフェクト！天才！';
    emoji = '🏆';
  } else if (percentage >= 80) {
    message = 'すごい！よくできた！';
    emoji = '🎉';
  } else if (percentage >= 60) {
    message = 'いい感じ！もう少し！';
    emoji = '💪';
  } else if (percentage >= 40) {
    message = 'がんばった！復習しよう！';
    emoji = '📖';
  } else {
    message = 'もう一回チャレンジ！';
    emoji = '🔥';
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          <div className="text-6xl mb-4">{emoji}</div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">{message}</h2>

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">{themeInfo.icon}</span>
            <span className="font-bold text-gray-600">{themeInfo.name}</span>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 mb-6">
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
        </div>

        <div className="grid gap-3">
          <button
            onClick={onRetry}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            &#128260; もう一度チャレンジ
          </button>
          <button
            onClick={onHome}
            className="w-full p-4 rounded-xl bg-white border-2 border-green-300 text-green-700 font-bold text-lg shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
          >
            &#127968; トップに戻る
          </button>
        </div>
      </div>
    </div>
  );
}
