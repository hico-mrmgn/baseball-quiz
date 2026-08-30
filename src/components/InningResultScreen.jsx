import { summarize } from '../utils/scenario';

/**
 * イニング制モードの結果。
 * 「何点取ったか」ではなく「守り切れたかどうか」で評価する。
 * 実戦の守備はスコアではなく、イニングを終わらせられたかで決まるため。
 */
export default function InningResultScreen({ inning, result, onRetry, onHome }) {
  const s = summarize(result.answers);
  const { cleared, finalScore, runsAllowed } = result;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-5">
      <div className="max-w-2xl mx-auto">

        <div className={`rounded-3xl p-5 text-center shadow-lg mb-4 ${
          cleared
            ? 'bg-gradient-to-br from-green-600 to-emerald-700'
            : 'bg-gradient-to-br from-gray-700 to-gray-900'
        }`}>
          <div className="text-5xl mb-1">{cleared ? '🛡️' : '💧'}</div>
          <div className="text-xl font-black text-white mb-1">
            {cleared ? '守り切った！' : '守り切れなかった'}
          </div>
          <div className="text-sm text-white/80 leading-snug">
            {cleared
              ? `${inning.subtitle}のピンチを、失点${runsAllowed}でしのいだ。`
              : `失点${runsAllowed}で追いつかれた。どのプレーが分かれ目だったか振り返ろう。`}
          </div>
          <div className="mt-3 inline-flex items-baseline gap-2 bg-black/25 rounded-full px-5 py-1.5">
            <span className="text-xs font-bold text-white/70">自分</span>
            <span className="text-2xl font-black text-white">{finalScore.us}</span>
            <span className="text-white/50 font-black">-</span>
            <span className="text-2xl font-black text-white">{finalScore.them}</span>
            <span className="text-xs font-bold text-white/70">相手</span>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-2xl border-2 border-green-200 bg-green-50 p-3 text-center">
            <div className="text-xs font-black text-green-700 mb-0.5">最善手率</div>
            <div className="text-2xl font-black text-green-700 leading-none">
              {s.bestRate}<span className="text-sm ml-0.5">%</span>
            </div>
          </div>
          <div className="flex-1 rounded-2xl border-2 border-red-200 bg-red-50 p-3 text-center">
            <div className="text-xs font-black text-red-700 mb-0.5">与えた点</div>
            <div className="text-2xl font-black text-red-700 leading-none">
              {runsAllowed}<span className="text-sm ml-0.5">点</span>
            </div>
          </div>
          <div className="flex-1 rounded-2xl border-2 border-gray-200 bg-gray-50 p-3 text-center">
            <div className="text-xs font-black text-gray-700 mb-0.5">判断した数</div>
            <div className="text-2xl font-black text-gray-700 leading-none">
              {s.total}<span className="text-sm ml-0.5">回</span>
            </div>
          </div>
        </div>

        {/* プレーごとの振り返り */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
          <div className="text-sm font-black text-gray-700 mb-2.5">このイニングの判断</div>
          <div className="space-y-2">
            {result.answers.map((a, i) => {
              const good = a.choice.score === 3;
              return (
                <div
                  key={a.scenario.id}
                  className={`rounded-xl p-2.5 border ${
                    good ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${
                      good ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      打者{i + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      失点 {a.choice.result.runs}
                    </span>
                  </div>
                  <div className="text-xs text-gray-700 leading-snug mb-1">
                    えらんだ判断：{a.choice.text}
                  </div>
                  <div className="text-xs font-bold text-gray-800 leading-snug">
                    👉 {a.scenario.explain.key}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="flex-1 p-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-black shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            もう一度守る 🔄
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
