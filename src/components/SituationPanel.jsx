import {
  formatInning, formatScoreContext, formatOuts, formatBatter,
  runnerList, RUNNER_SPEED,
} from '../utils/scenario';

const TONE_STYLE = {
  lead:   'bg-blue-100 text-blue-800 border-blue-200',
  behind: 'bg-red-100 text-red-800 border-red-200',
  even:   'bg-gray-100 text-gray-800 border-gray-200',
};

function Chip({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${className}`}>
      {children}
    </span>
  );
}

/**
 * 状況をチップで並べる。
 * 「7回裏・1点リード・1アウト・ランナー三塁・前進守備」までを一目で読ませたい。
 * ここが読めないと、そもそも判断のしようがない。
 */
export default function SituationPanel({ sit, compact = false }) {
  const scoreCtx = formatScoreContext(sit);
  const runners = runnerList(sit);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip className="bg-amber-100 text-amber-800 border-amber-200">
          🕐 {formatInning(sit)}
        </Chip>
        {scoreCtx && (
          <Chip className={TONE_STYLE[scoreCtx.tone]}>
            {sit.score.us} - {sit.score.them}
            <span className="opacity-60">/</span>
            {scoreCtx.text}
          </Chip>
        )}
        <Chip className="bg-gray-100 text-gray-700 border-gray-200">
          {formatOuts(sit.outs)}
        </Chip>
        {sit.count && (
          <Chip className="bg-gray-100 text-gray-700 border-gray-200">
            カウント {sit.count.b}-{sit.count.s}
          </Chip>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {runners.length === 0 ? (
          <Chip className="bg-gray-50 text-gray-500 border-gray-200">ランナーなし</Chip>
        ) : (
          runners.map((r) => (
            <Chip key={r.base} className="bg-red-50 text-red-700 border-red-200">
              🏃 {r.base}
              {RUNNER_SPEED[r.speed]?.short && (
                <span className="text-[10px] font-black">
                  （{RUNNER_SPEED[r.speed].label}）
                </span>
              )}
            </Chip>
          ))
        )}
        {sit.defense && (
          <Chip className="bg-sky-50 text-sky-700 border-sky-200">🧤 {sit.defense}</Chip>
        )}
        {!compact && formatBatter(sit.batter) && (
          <Chip className="bg-violet-50 text-violet-700 border-violet-200">
            🏏 {formatBatter(sit.batter)}
          </Chip>
        )}
      </div>

      {sit.play && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] font-black text-amber-600 mr-1.5">打球</span>
          <span className="text-sm font-bold text-amber-900">{sit.play}</span>
        </div>
      )}

      {!compact && sit.note && (
        <div className="text-xs text-gray-600 leading-snug bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          {sit.note}
        </div>
      )}
    </div>
  );
}
