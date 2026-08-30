import { summarize, tagBreakdown } from '../utils/scenario';

/**
 * 実戦シナリオの結果。
 * 正答率ではなく「最善手率」と「致命傷率」で見せる。
 * ○×だけだと、"間違ってはいないが物足りない判断" と "試合を壊す判断" が
 * 同じ扱いになってしまうため。
 */

const RANKS = [
  { min: 90, title: 'セレクション合格ライン', emoji: '🏆', message: '点差とアウトカウントで判断を切りかえられている。この判断力なら、どのチームでも通用する。' },
  { min: 75, title: 'レギュラーの判断',       emoji: '🌟', message: '基本の判断はできている。あとは「点差で答えが変わる場面」を落とさないこと。' },
  { min: 60, title: 'あと一歩',               emoji: '💪', message: '型は身についている。次は「この場面で何を守るのか」を考えてから動こう。' },
  { min: 40, title: '型で答えている',          emoji: '📘', message: '覚えたとおりに動けているが、状況を読めていない。点差とアウトカウントを声に出す練習から。' },
  { min: 0,  title: 'まずは状況を読もう',      emoji: '🌱', message: '打球を見る前に「何点差？　何アウト？　走者は？」を確認するクセをつけよう。' },
];

function rankOf(percent) {
  return RANKS.find((r) => percent >= r.min) ?? RANKS[RANKS.length - 1];
}

function StatCard({ label, value, unit, tone }) {
  const tones = {
    good: 'bg-green-50 border-green-200 text-green-700',
    bad:  'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-gray-50 border-gray-200 text-gray-700',
  };
  return (
    <div className={`flex-1 rounded-2xl border-2 p-3 text-center ${tones[tone]}`}>
      <div className="text-xs font-black opacity-80 mb-0.5">{label}</div>
      <div className="text-2xl font-black leading-none">
        {value}
        <span className="text-sm font-bold ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

export default function ScenarioResultScreen({ answers, onRetry, onHome }) {
  const s = summarize(answers);
  const rank = rankOf(s.bestRate);
  const tags = tagBreakdown(answers);
  const weak = tags.filter((t) => t.percent < 100).slice(0, 3);
  const strong = [...tags].reverse().filter((t) => t.percent === 100).slice(0, 3);
  const fatalAnswers = answers.filter((a) => a.choice.score === -1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-5">
      <div className="max-w-2xl mx-auto">

        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-5 text-center shadow-lg mb-4">
          <div className="text-5xl mb-1">{rank.emoji}</div>
          <div className="text-xl font-black text-white mb-1">{rank.title}</div>
          <div className="text-sm text-blue-100 leading-snug">{rank.message}</div>
          <div className="mt-3 inline-flex items-baseline gap-1 bg-black/20 rounded-full px-4 py-1.5">
            <span className="text-3xl font-black text-white">{s.gained}</span>
            <span className="text-sm font-bold text-blue-100">/ {s.possible} 点</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <StatCard label="最善手率" value={s.bestRate} unit="%" tone="good" />
          <StatCard
            label="致命傷率"
            value={s.fatalRate}
            unit="%"
            tone={s.fatalRate > 0 ? 'bad' : 'good'}
          />
          <StatCard label="はやい判断" value={s.inTimeRate} unit="%" tone="neutral" />
        </div>

        {/* 判断の内訳 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
          <div className="text-sm font-black text-gray-700 mb-2.5">判断の内訳（{s.total}場面）</div>
          <div className="space-y-1.5">
            {[
              { key: 'best',  label: '🎯 最善手',       n: s.counts.best,  color: 'bg-green-500' },
              { key: 'ok',    label: '🙂 まあOK',       n: s.counts.ok,    color: 'bg-sky-500' },
              { key: 'poor',  label: '😕 もったいない', n: s.counts.poor,  color: 'bg-amber-500' },
              { key: 'fatal', label: '💥 試合が壊れる', n: s.counts.fatal, color: 'bg-red-500' },
            ].map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-600 w-32 flex-shrink-0">{row.label}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${row.color} rounded-full transition-all duration-700`}
                    style={{ width: `${s.total > 0 ? (row.n / s.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs font-black text-gray-700 w-8 text-right">{row.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 致命傷になった判断は必ず振り返らせる */}
        {fatalAnswers.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200 mb-4">
            <div className="text-sm font-black text-red-700 mb-2">
              💥 ここは試合が壊れる判断だった
            </div>
            <div className="space-y-2">
              {fatalAnswers.map((a) => (
                <div key={a.scenario.id} className="bg-white rounded-xl p-2.5 border border-red-200">
                  <div className="text-xs font-bold text-red-600 mb-1">{a.scenario.question}</div>
                  <div className="text-xs text-gray-700 leading-snug mb-1">
                    えらんだ判断：{a.choice.text}
                  </div>
                  <div className="text-xs text-gray-800 font-bold leading-snug">
                    👉 {a.scenario.explain.key}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* タグ別の弱点。問題ID単位より「何を練習すべきか」が分かる */}
        {weak.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
            <div className="text-sm font-black text-gray-700 mb-2.5">きたえる判断</div>
            <div className="space-y-2">
              {weak.map((t) => (
                <div key={t.tag} className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700 w-40 flex-shrink-0 truncate">
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
                  <span className="text-xs font-black text-gray-600 w-10 text-right">{t.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {strong.length > 0 && (
          <div className="bg-green-50 rounded-2xl p-3.5 border border-green-200 mb-4">
            <div className="text-sm font-black text-green-700 mb-1.5">できていた判断</div>
            <div className="flex flex-wrap gap-1.5">
              {strong.map((t) => (
                <span key={t.tag} className="text-xs font-bold bg-white text-green-700 border border-green-200 rounded-full px-2.5 py-1">
                  ✅ {t.tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            もう一度 🔄
          </button>
          <button
            onClick={onHome}
            className="flex-1 p-3.5 rounded-2xl bg-white border-2 border-gray-200 text-gray-700 font-black active:scale-[0.98] transition-all cursor-pointer"
          >
            トップへ 🏠
          </button>
        </div>
      </div>
    </div>
  );
}
