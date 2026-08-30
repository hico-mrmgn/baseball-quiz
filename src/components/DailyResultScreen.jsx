import { summarize, tagBreakdown } from '../utils/scenario';

/**
 * きょうのトレーニング（実戦5場面 → 守り切れ1回）の結果。
 *
 * 「何点だったか」より「明日どこを練習すればいいか」で終わらせたい画面なので、
 * 弱かった判断の種類から、そのまま練習に入れる導線を置いている。
 */

const RANKS = [
  { min: 90, title: 'セレクション級の判断', emoji: '🏆' },
  { min: 75, title: 'レギュラーの判断',     emoji: '🌟' },
  { min: 60, title: 'あと一歩',             emoji: '💪' },
  { min: 40, title: '型で答えている',        emoji: '📘' },
  { min: 0,  title: 'まずは状況を読もう',    emoji: '🌱' },
];

export default function DailyResultScreen({
  scenarioAnswers, inningResult, streak, onPracticeTag, onHome, onHistory,
}) {
  const all = [...scenarioAnswers, ...(inningResult?.answers ?? [])];
  const s = summarize(all);
  const rank = RANKS.find((r) => s.bestRate >= r.min) ?? RANKS[RANKS.length - 1];
  const tags = tagBreakdown(scenarioAnswers);
  const weak = tags.filter((t) => t.percent < 100).slice(0, 3);
  const cleared = inningResult?.cleared;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-5">
      <div className="max-w-2xl mx-auto">

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-5 text-center shadow-lg mb-4">
          <div className="text-xs font-black text-blue-200 mb-1">きょうのトレーニング かんりょう</div>
          <div className="text-5xl mb-1">{rank.emoji}</div>
          <div className="text-xl font-black text-white mb-2">{rank.title}</div>
          {streak > 0 && (
            <div className="inline-block bg-amber-400 text-amber-900 rounded-full px-3 py-1 text-sm font-black">
              🔥 {streak}日連続
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-2xl border-2 border-green-200 bg-green-50 p-3 text-center">
            <div className="text-xs font-black text-green-700 mb-0.5">最善手率</div>
            <div className="text-2xl font-black text-green-700 leading-none">
              {s.bestRate}<span className="text-sm ml-0.5">%</span>
            </div>
          </div>
          <div className={`flex-1 rounded-2xl border-2 p-3 text-center ${
            s.fatalRate > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`text-xs font-black mb-0.5 ${s.fatalRate > 0 ? 'text-red-700' : 'text-gray-600'}`}>
              致命傷率
            </div>
            <div className={`text-2xl font-black leading-none ${s.fatalRate > 0 ? 'text-red-700' : 'text-gray-600'}`}>
              {s.fatalRate}<span className="text-sm ml-0.5">%</span>
            </div>
          </div>
          <div className={`flex-1 rounded-2xl border-2 p-3 text-center ${
            cleared ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className={`text-xs font-black mb-0.5 ${cleared ? 'text-green-700' : 'text-gray-600'}`}>
              守り切れ
            </div>
            <div className={`text-lg font-black leading-none mt-1 ${cleared ? 'text-green-700' : 'text-gray-600'}`}>
              {cleared ? '成功 🛡️' : '失敗 💧'}
            </div>
          </div>
        </div>

        {/* ここが本題。結果を見て終わりにせず、次の練習に直接つなげる */}
        {weak.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
            <div className="text-sm font-black text-gray-700 mb-1">きょう弱かった判断</div>
            <div className="text-xs text-gray-500 mb-3">
              タップすると、その判断だけを集めて練習できます
            </div>
            <div className="space-y-2">
              {weak.map((t) => (
                <button
                  key={t.tag}
                  onClick={() => onPracticeTag(t.tag)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer text-left"
                >
                  <span className="text-sm font-black text-gray-800 w-36 flex-shrink-0 truncate">
                    {t.tag}
                  </span>
                  <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        t.percent >= 67 ? 'bg-sky-500' : t.percent >= 34 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-black text-gray-600 w-9 text-right">{t.percent}%</span>
                  <span className="text-blue-500 font-black text-sm">›</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {weak.length === 0 && all.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200 mb-4 text-center">
            <div className="text-sm font-black text-green-700">
              きょうは苦手な判断がありませんでした 🎉
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onHome}
            className="flex-1 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            トップへ 🏠
          </button>
          <button
            onClick={onHistory}
            className="flex-1 p-3.5 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-black active:scale-[0.98] transition-all cursor-pointer"
          >
            戦績を見る 📊
          </button>
        </div>
      </div>
    </div>
  );
}
