import { useState, useEffect } from 'react';
import { themes } from '../data/questions';
import { getCareerTier } from '../utils/career';
import Confetti from './Confetti';
import { playResult } from '../utils/sound';

export default function ResultScreen({ score, total, maxCombo, theme, onRetry, onHome, onHistory }) {
  const percentage = Math.round((score / total) * 100);
  const themeInfo = theme === 'random' ? { name: 'ランダム', icon: '🎲' }
    : theme === 'daily' ? { name: 'きょうのチャレンジ', icon: '📅' }
    : theme === 'weakness' ? { name: 'にがてこくふく', icon: '📝' }
    : themes[theme];
  const tier = getCareerTier(percentage);

  // カウントアップアニメーション
  const [displayScore, setDisplayScore] = useState(0);
  const [displayPercent, setDisplayPercent] = useState(0);
  const [showTier, setShowTier] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useEffect(() => {
    // スコアのカウントアップ
    if (score === 0) {
      setDisplayScore(0);
      setDisplayPercent(0);
      setShowTier(true);
      return;
    }

    const duration = 1200; // ms
    const steps = score;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current++;
      setDisplayScore(current);
      setDisplayPercent(Math.round((current / total) * 100));
      if (current >= score) {
        clearInterval(timer);
        // ティア表示 & 紙吹雪
        setTimeout(() => {
          setShowTier(true);
          if (percentage >= 60) {
            setConfettiTrigger((t) => t + 1);
          }
          playResult();
        }, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [score, total, percentage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-3 lg:px-6 py-6 lg:py-8 flex items-center justify-center">
      <Confetti trigger={confettiTrigger} />
      <div className="max-w-md lg:max-w-5xl w-full mx-auto">

        <div className="lg:flex lg:gap-6 lg:items-start">

          {/* Career tier card */}
          <div
            className={`bg-gradient-to-br ${tier.bg} rounded-3xl shadow-xl p-8 mb-4 lg:mb-0 lg:flex-1 text-center transition-all duration-500 ${showTier ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          >
            <div className="text-7xl mb-3">{tier.emoji}</div>
            <h2 className={`text-2xl font-black mb-2 ${tier.text}`}>{tier.title}</h2>
            <p className={`text-base font-bold opacity-90 ${tier.text}`}>{tier.message}</p>
          </div>

          {/* Right column: Score card + buttons */}
          <div className="lg:flex-1">
            {/* Score card */}
            <div className="bg-white rounded-3xl shadow-xl p-6 mb-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-2xl">{themeInfo.icon}</span>
                <span className="font-bold text-gray-600 text-lg">{themeInfo.name}</span>
              </div>

              <div className="bg-green-50 rounded-2xl p-5 mb-4">
                <div className={`text-6xl font-black text-green-600 mb-1 ${displayScore === score && score > 0 ? 'score-pop' : ''}`}>
                  {displayScore}<span className="text-2xl text-gray-400">/{total}</span>
                </div>
                <div className="text-base text-gray-500">問正解</div>
                <div className="w-full h-4 bg-green-200 rounded-full mt-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-300"
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>
                <div className="text-right text-base font-bold text-green-600 mt-1">{displayPercent}%</div>
              </div>

              {maxCombo >= 3 && (
                <div className="flex items-center justify-center gap-2 bg-orange-50 border-2 border-orange-200 rounded-xl px-4 py-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="font-black text-orange-600 text-xl">最大コンボ {maxCombo}連続！</div>
                    <div className="text-sm text-orange-500">
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
                className="w-full p-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
              >
                🔄 もう一度チャレンジ
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onHistory}
                  className="w-full p-4 rounded-xl bg-white border-2 border-red-300 text-red-700 font-bold text-lg shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  📊 戦績を見る
                </button>
                <button
                  onClick={onHome}
                  className="w-full p-4 rounded-xl bg-white border-2 border-red-200 text-red-600 font-bold text-lg shadow hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  🏠 トップへ
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
