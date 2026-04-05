import { useState } from 'react';
import { themes } from '../data/questions';
import { getHistory, clearHistory } from '../utils/history';

function getThemeInfo(theme) {
  if (theme === 'random') return { name: 'ランダム', icon: '🎲' };
  if (theme === 'daily') return { name: 'デイリー', icon: '📅' };
  if (theme === 'weakness') return { name: 'にがて', icon: '📝' };
  return themes[theme];
}

export default function HistoryScreen({ onBack }) {
  const [history, setHistory] = useState(getHistory);
  const [confirmClear, setConfirmClear] = useState(false);

  function handleClear() {
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  }

  // 集計
  const totalGames = history.length;
  const bestScore = totalGames > 0 ? Math.max(...history.map((h) => h.percentage)) : 0;
  const bestCombo = totalGames > 0 ? Math.max(...history.map((h) => h.maxCombo || 0)) : 0;
  const avgScore = totalGames > 0 ? Math.round(history.reduce((s, h) => s + h.percentage, 0) / totalGames) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-6">
      <div className="max-w-md w-full mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="px-4 h-10 rounded-full bg-white shadow flex items-center justify-center text-green-700 font-bold text-base active:scale-95 transition-all cursor-pointer gap-1"
          >
            ← もどる
          </button>
          <h1 className="text-2xl font-black text-green-800">📊 戦績</h1>
        </div>

        {totalGames === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-10 text-center text-gray-400">
            <div className="text-5xl mb-3">⚾</div>
            <div className="font-bold">まだ戦績がありません</div>
            <div className="text-sm mt-1">クイズに挑戦してみよう！</div>
          </div>
        ) : (
          <>
            {/* 集計カード */}
            <div className="bg-white rounded-3xl shadow-xl p-5 mb-4">
              <div className="text-sm font-bold text-gray-500 mb-3">トータル成績</div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <div className="text-2xl font-black text-green-600">{totalGames}</div>
                  <div className="text-xs text-gray-500">試合数</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600">{avgScore}%</div>
                  <div className="text-xs text-gray-500">平均</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-500">{bestScore}%</div>
                  <div className="text-xs text-gray-500">最高点</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-orange-500">{bestCombo}</div>
                  <div className="text-xs text-gray-500">最大コンボ</div>
                </div>
              </div>
            </div>

            {/* 履歴リスト */}
            <div className="grid gap-3 mb-4">
              {history.map((entry) => {
                const themeInfo = getThemeInfo(entry.theme);
                return (
                  <div key={entry.id} className="bg-white rounded-2xl shadow p-4 flex items-center gap-3">
                    <div className="text-3xl w-10 text-center">{entry.careerEmoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-sm">{themeInfo.icon}</span>
                        <span className="text-sm font-bold text-gray-700 truncate">{themeInfo.name}</span>
                      </div>
                      <div className="text-xs text-gray-400 truncate">{entry.careerTitle}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xl font-black text-green-600">{entry.percentage}%</div>
                      <div className="text-xs text-gray-400">{entry.score}/{entry.total}問</div>
                      {(entry.maxCombo || 0) >= 3 && (
                        <div className="text-xs text-orange-500 font-bold">🔥 {entry.maxCombo}連続</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-300 shrink-0 ml-1">{entry.date}</div>
                  </div>
                );
              })}
            </div>

            {/* クリアボタン */}
            {confirmClear ? (
              <div className="bg-white rounded-2xl shadow p-4 text-center">
                <div className="text-sm font-bold text-gray-600 mb-3">戦績を全部消しますか？</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="p-2 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleClear}
                    className="p-2 rounded-xl bg-red-500 text-white font-bold text-sm active:scale-95 transition-all cursor-pointer"
                  >
                    消す
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="w-full p-3 rounded-xl border-2 border-red-200 text-red-400 font-bold text-sm active:scale-95 transition-all cursor-pointer"
              >
                🗑️ 戦績をリセット
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
