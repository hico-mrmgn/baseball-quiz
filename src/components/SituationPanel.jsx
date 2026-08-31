import {
  formatScoreContext, formatOuts, formatBatter, formatSide,
  formatRunnerBases, formatFormation,
} from '../utils/scenario';

const TONE_TEXT = {
  lead:   'text-blue-700',
  behind: 'text-red-700',
  even:   'text-gray-800',
};

/** アウトカウント。フィールド図の OUT ランプと同じ見た目にそろえている。 */
function OutDots({ outs }) {
  return (
    <span className="inline-flex items-center gap-1" title={formatOuts(outs)}>
      <span className="text-[10px] font-black text-gray-400">アウト</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`w-2.5 h-2.5 rounded-full border ${
            i < outs ? 'bg-amber-400 border-amber-500' : 'bg-white border-gray-300'
          }`}
        />
      ))}
    </span>
  );
}

/**
 * 走者を小さなダイヤ図で。塗ってある塁に走者がいる。
 *
 * 走者はフィールド図と同じ赤で統一している。脚質で色を変えると、
 * となりのアウトランプ（琥珀）と意味の違うものに同じ色を使うことになるうえ、
 * 「速」「遅」はフィールド図が走者の横に大きく出しているので重ねる必要がない。
 */
const BASE_POS = { first: [19, 12], second: [12, 5], third: [5, 12] };

function RunnerDiamond({ runners }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="flex-shrink-0">
      <path d="M12 5 L19 12 L12 19 L5 12 Z" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      {Object.entries(BASE_POS).map(([base, [x, y]]) => {
        const onBase = Boolean(runners?.[base]);
        const half = onBase ? 3.4 : 2.8;
        return (
          <rect
            key={base}
            x={x - half} y={y - half} width={half * 2} height={half * 2}
            transform={`rotate(45 ${x} ${y})`}
            fill={onBase ? '#dc2626' : '#e5e7eb'}
            stroke={onBase ? '#ffffff' : '#9ca3af'}
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

/**
 * 状況パネル。
 *
 * 以前はここに11個のタグを並べていたが、そのうち7個（回・点差・アウト・
 * カウント・走者・守備隊形）はとなりのフィールド図が同じことを描いていた。
 * 絵で分かったことを文字でもう一度読まされるので、結局どこも読まれなくなる。
 *
 * いまは「判断を決める3つ」だけを大きく1行に置く。点差・アウトカウント・走者で、
 * これが変わると正解が変わる。アウトと走者は数字ではなく絵にしてある。
 * 回とカウントはフィールド図のスコアボードに任せた。
 * 守備隊形は「定位置」のときは出さない。初期配置は判断の材料にならないため。
 *
 * hasScoreboard は、呼び出し側がすでにスコアボードを出しているとき（守り切れ）に
 * 点差とアウトを省くための指定。同じ数字を1画面に3回出さないため。
 */
export default function SituationPanel({ sit, hasScoreboard = false }) {
  const scoreCtx = formatScoreContext(sit);
  const side = formatSide(sit);
  const formation = formatFormation(sit.defense);
  const batter = formatBatter(sit.batter);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-2">
        {side && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border ${side.className}`}>
            {side.emoji} {side.text}
          </span>
        )}
        {!hasScoreboard && scoreCtx && (
          <span className={`text-sm font-black ${TONE_TEXT[scoreCtx.tone]}`}>
            {scoreCtx.text}
          </span>
        )}
        {!hasScoreboard && <OutDots outs={sit.outs} />}
        <span className="inline-flex items-center gap-1.5">
          <RunnerDiamond runners={sit.runners} />
          <span className="text-sm font-black text-gray-800">{formatRunnerBases(sit)}</span>
        </span>
        {formation && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border bg-sky-100 text-sky-800 border-sky-300">
            🧤 {formation}
          </span>
        )}
      </div>

      {/* 図に描けないもの。打者の特徴は配球や守備位置の判断に効く */}
      {batter && (
        <div className="text-xs font-bold text-violet-700 px-0.5">🏏 {batter}</div>
      )}

      {sit.play && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5">
          <span className="text-[10px] font-black text-amber-600 mr-1.5">打球</span>
          <span className="text-sm font-bold text-amber-900">{sit.play}</span>
        </div>
      )}

      {sit.note && (
        <div className="text-xs text-gray-600 leading-snug bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5">
          {sit.note}
        </div>
      )}
    </div>
  );
}
