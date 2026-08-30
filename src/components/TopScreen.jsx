import { useState } from 'react';
import { scenarios, SCENARIO_TRACKS, scenarioCount } from '../data/scenarios';
import { inningScenarios } from '../data/innings';
import { formations } from '../data/formations';
import { questions } from '../data/questions';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWeakTags } from '../utils/weakTags';

/**
 * トップ画面。
 *
 * 以前は「何かを始める」入口が28個あり、スマホでは2.2画面ぶんの高さがあった。
 * 実戦トレーニングと基礎ドリルがそれぞれ独立した導線を持っていたのが原因で、
 * どちらをやればいいのかが画面から読み取れなかった。
 *
 * 今は主導線を「今日のトレーニング」1つに絞り、それ以外は
 * 「選んで練習」「基本練習」「解説編」の3つに畳んでいる。
 */
export default function TopScreen({
  onStartDailyTraining, onStartScenario, onStartInning,
  onOpenDrill, onOpenFormations, onHistory, onBadges,
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const levelInfo = getLevelInfo(getLevelData().xp);
  const dailyDone = isDailyCompleted();
  const streak = getDailyStreak();
  const weakTags = getWeakTags(2);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-4">
      <div className="max-w-2xl lg:max-w-3xl mx-auto">

        {/* ── ヘッダー：レベルを押すと戦績へ ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-green-700 shadow-lg mb-4 p-4">
          <div className="absolute -right-8 -top-10 w-44 h-44 rotate-45 rounded-3xl border-[10px] border-white/10 pointer-events-none" />

          <div className="relative flex items-center gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white drop-shadow-sm">⚾ つぎ、どうする？</h1>
              <p className="text-xs text-green-100 mt-0.5">野球の状況判断トレーニング</p>
            </div>
            <button
              onClick={onBadges}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer w-14 h-14 flex-shrink-0 backdrop-blur-sm"
            >
              <span className="text-xl">🏅</span>
              <span className="text-xs font-bold">バッジ</span>
            </button>
          </div>

          <button
            onClick={onHistory}
            className="relative w-full bg-white/15 rounded-xl p-2.5 backdrop-blur-sm hover:bg-white/25 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{levelInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-black text-white truncate">
                    Lv.{levelInfo.level} {levelInfo.title}
                  </div>
                  <div className="text-xs font-bold text-green-100 flex-shrink-0">
                    {levelInfo.progressPercent}%
                  </div>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
              <span className="text-white/70 font-black text-lg flex-shrink-0">›</span>
            </div>
          </button>
        </div>

        {/* ── 主導線：今日のトレーニング ── */}
        <button
          onClick={onStartDailyTraining}
          className={`w-full rounded-3xl p-5 mb-3 shadow-lg active:scale-[0.98] transition-all cursor-pointer text-left ${
            dailyDone
              ? 'bg-white border-2 border-green-300'
              : 'bg-gradient-to-br from-orange-500 to-red-600 hover:shadow-xl'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-4xl flex-shrink-0">{dailyDone ? '✅' : '🔥'}</span>
            <div className="flex-1 min-w-0">
              <div className={`text-lg font-black ${dailyDone ? 'text-green-700' : 'text-white'}`}>
                {dailyDone ? '今日はクリア済み' : '今日のトレーニング'}
              </div>
              <div className={`text-xs font-bold ${dailyDone ? 'text-gray-500' : 'text-orange-50'}`}>
                {dailyDone
                  ? '全部終わりました。もう一度やってもOK'
                  : '実戦5場面 ＋ 守り切れ1回'}
              </div>
              {streak > 0 && (
                <div className={`inline-block mt-1.5 rounded-full px-2 py-0.5 text-xs font-black ${
                  dailyDone ? 'bg-amber-100 text-amber-700' : 'bg-black/25 text-amber-200'
                }`}>
                  🔥 {streak}日連続
                </div>
              )}
            </div>
            <span className={`font-black text-2xl flex-shrink-0 ${dailyDone ? 'text-green-400' : 'text-white/80'}`}>
              ›
            </span>
          </div>

          {/* 苦手が分かっているときは、何を狙って出題するのかを見せる */}
          {weakTags.length > 0 && (
            <div className={`mt-3 pt-3 border-t flex flex-wrap items-center gap-1.5 ${
              dailyDone ? 'border-gray-100' : 'border-white/20'
            }`}>
              <span className={`text-xs font-bold ${dailyDone ? 'text-gray-400' : 'text-orange-100'}`}>
                今日は
              </span>
              {weakTags.map((t) => (
                <span
                  key={t.tag}
                  className={`text-xs font-black rounded-full px-2 py-0.5 ${
                    dailyDone ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'
                  }`}
                >
                  {t.tag}
                </span>
              ))}
              <span className={`text-xs font-bold ${dailyDone ? 'text-gray-400' : 'text-orange-100'}`}>
                を多めに
              </span>
            </div>
          )}
        </button>

        {/* ── 副導線 ── */}
        <div className="space-y-2">

          {/* 選んで練習（開くと種類が出る） */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="w-full flex items-center gap-3 p-3.5 hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-left"
            >
              <span className="text-2xl flex-shrink-0">🎯</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-black text-gray-800">選んで練習</div>
                <div className="text-xs text-gray-500">
                  実戦シナリオ {scenarios.length}場面 ／ 守り切れ {inningScenarios.length}イニング
                </div>
              </div>
              <span className={`text-gray-400 font-black text-lg flex-shrink-0 transition-transform ${
                pickerOpen ? 'rotate-90' : ''
              }`}>
                ›
              </span>
            </button>

            {pickerOpen && (
              <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                <div className="text-xs font-black text-gray-500 mt-2 mb-1.5">判断の種類で選ぶ</div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {SCENARIO_TRACKS.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => onStartScenario(track.id)}
                      className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <span className="text-lg flex-shrink-0">{track.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-gray-800 truncate">{track.name}</div>
                        <div className="text-[10px] font-bold text-blue-600">
                          {scenarioCount(track.id)}場面
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-xs font-black text-gray-500 mb-1.5">イニングを守り切る</div>
                <div className="space-y-1.5">
                  {inningScenarios.map((inn) => (
                    <button
                      key={inn.id}
                      onClick={() => onStartInning(inn.id)}
                      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer text-left"
                    >
                      <span className="text-xl flex-shrink-0">🛡️</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-white">{inn.title}</div>
                        <div className="text-[10px] font-bold text-gray-300 truncate">{inn.subtitle}</div>
                      </div>
                      <span className="text-[10px] font-black text-amber-300 flex-shrink-0">
                        打者{inn.plays.length}人
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 基本練習（別画面へ） */}
          <button
            onClick={onOpenDrill}
            className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <span className="text-2xl flex-shrink-0">📖</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-gray-800">基本練習</div>
              <div className="text-xs text-gray-500">
                ポジション別の基本を覚える・{questions.length}問
              </div>
            </div>
            <span className="text-gray-400 font-black text-lg flex-shrink-0">›</span>
          </button>

          {/* 解説編（別画面へ） */}
          <button
            onClick={onOpenFormations}
            className="w-full flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition-all cursor-pointer text-left"
          >
            <span className="text-2xl flex-shrink-0">📕</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-black text-gray-800">守備フォーメーション解説</div>
              <div className="text-xs text-gray-500">
                状況別の動き方を図で見る・{formations.length}パターン
              </div>
            </div>
            <span className="text-gray-400 font-black text-lg flex-shrink-0">›</span>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          実戦トレーニングは「型を捨てる練習」。<br />
          基本練習は「型を覚える練習」。
        </p>
      </div>
    </div>
  );
}
