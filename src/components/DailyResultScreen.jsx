import { summarize, tagBreakdown } from '../utils/scenario';
import StatCard from './StatCard';
import WeakTagList from './WeakTagList';
import { todayKey, formatKey } from '../utils/daily';

/**
 * 今日のトレーニング（実戦5場面 → 守り切れ1回）の結果。
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
  scenarioAnswers, inningResult, dateKey, streak, onPracticeTag, onHome, onHistory,
}) {
  const isToday = !dateKey || dateKey === todayKey();
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
          <div className="text-xs font-black text-blue-200 mb-1">
            {isToday ? '今日のトレーニング 終わり' : `${formatKey(dateKey)}のぶんのトレーニング 終わり`}
          </div>
          <div className="text-5xl mb-1">{rank.emoji}</div>
          <div className="text-xl font-black text-white mb-2">{rank.title}</div>
          {streak > 0 && (
            <div className="inline-block bg-amber-400 text-amber-900 rounded-full px-3 py-1 text-sm font-black">
              🔥 {streak}日連続
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          <StatCard label="最善手率" value={s.bestRate} unit="%" tone="good" />
          <StatCard
            label="致命傷率"
            value={s.fatalRate}
            unit="%"
            tone={s.fatalRate > 0 ? 'bad' : 'neutral'}
          />
          <StatCard
            label="守り切れ"
            value={cleared ? '成功 🛡️' : '失敗 💧'}
            tone={cleared ? 'good' : 'neutral'}
          />
        </div>

        {/* ここが本題。結果を見て終わりにせず、次の練習に直接つなげる */}
        <WeakTagList tags={weak} title="今日弱かった判断" onPracticeTag={onPracticeTag} />

        {weak.length === 0 && all.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200 mb-4 text-center">
            <div className="text-sm font-black text-green-700">
              今日は苦手な判断がありませんでした 🎉
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
