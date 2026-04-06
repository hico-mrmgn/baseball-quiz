import { parseSituation } from '../utils/parseSituation';

// Base coordinates (viewBox 220 x 210)
const HOME   = { x: 110, y: 182 };
const FIRST  = { x: 168, y: 126 };
const SECOND = { x: 110, y: 70 };
const THIRD  = { x: 52,  y: 126 };
const MOUND  = { x: 110, y: 136 };

const FIELDERS = {
  pitcher: { x: 110, y: 136, label: 'P'  },
  catcher: { x: 110, y: 196, label: 'C'  },
  first:   { x: 178, y: 138, label: '1B' },
  second:  { x: 138, y: 96,  label: '2B' },
  short:   { x: 80,  y: 96,  label: 'SS' },
  third:   { x: 40,  y: 138, label: '3B' },
  left:    { x: 28,  y: 38,  label: 'LF' },
  center:  { x: 110, y: 18,  label: 'CF' },
  right:   { x: 192, y: 38,  label: 'RF' },
};

const THEME_FIELDER = {
  third:   'third',
  second:  'second',
  short:   'short',
  pitcher: 'pitcher',
  coach:   null,
};

/* ── 人型シルエット（SVG path） ── */
function PlayerIcon({ x, y, fill, stroke, strokeWidth, scale = 1 }) {
  const s = scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${s})`}>
      {/* 頭 */}
      <circle cx="0" cy="-8" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      {/* 体 */}
      <path
        d="M0,-4 L0,4 M-5,0 L5,0 M0,4 L-4,10 M0,4 L4,10"
        stroke={stroke}
        strokeWidth={strokeWidth * 0.8}
        strokeLinecap="round"
        fill="none"
      />
      {/* 体の塗り（胴体） */}
      <line x1="0" y1="-4" x2="0" y2="4" stroke={fill} strokeWidth={strokeWidth * 1.6} strokeLinecap="round" />
    </g>
  );
}

/* ── ランナー ── */
function Runner({ cx, cy }) {
  return (
    <g>
      {/* 影 */}
      <ellipse cx={cx + 1} cy={cy + 11} rx="6" ry="2" fill="rgba(0,0,0,0.2)" />
      {/* ヘルメット（光沢付き） */}
      <circle cx={cx} cy={cy - 7} r="5.5" fill="#dc2626" />
      <ellipse cx={cx - 1.5} cy={cy - 9} rx="2" ry="1.5" fill="#ef4444" opacity="0.6" />
      {/* 体 */}
      <path
        d={`M${cx},${cy - 2} L${cx},${cy + 4} M${cx - 4},${cy + 1} L${cx + 4},${cy + 1} M${cx},${cy + 4} L${cx - 3},${cy + 10} M${cx},${cy + 4} L${cx + 3},${cy + 10}`}
        stroke="#dc2626"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  );
}

export default function FieldDiagram({ situation, theme }) {
  const { outs, runners, ball } = parseSituation(situation);
  const highlighted = THEME_FIELDER[theme] ?? null;

  return (
    <div className="mt-3 w-full">
      <svg
        viewBox="0 0 220 210"
        className="w-full rounded-xl"
        aria-label="グラウンド図"
      >
        <defs>
          {/* 芝目パターン（刈り跡ストライプ） */}
          <pattern id="grassStripes" patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
            <rect width="16" height="16" fill="#3d8a4a" />
            <rect width="8" height="16" fill="#358042" />
          </pattern>

          {/* 外野の芝目（角度違い） */}
          <pattern id="outfieldStripes" patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(-30)">
            <rect width="14" height="14" fill="#378544" />
            <rect width="7" height="14" fill="#328040" />
          </pattern>

          {/* ダート（土）テクスチャ */}
          <pattern id="dirtTexture" patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="#c49a4a" />
            <circle cx="1" cy="1" r="0.5" fill="#b8894a" opacity="0.4" />
            <circle cx="3" cy="3" r="0.3" fill="#d4aa5a" opacity="0.3" />
          </pattern>

          {/* マウンドのグラデーション */}
          <radialGradient id="moundGrad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#d4aa5a" />
            <stop offset="100%" stopColor="#b8894a" />
          </radialGradient>

          {/* ボールのグラデーション */}
          <radialGradient id="ballGrad" cx="35%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </radialGradient>

          {/* ウォーニングトラック */}
          <clipPath id="fieldClip">
            <rect x="0" y="0" width="220" height="210" rx="10" />
          </clipPath>

          {/* ベースの影 */}
          <filter id="baseShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodOpacity="0.3" />
          </filter>

          {/* ハイライト用のグロー */}
          <filter id="glowHL" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g clipPath="url(#fieldClip)">
          {/* ── 背景（外野の芝） ── */}
          <rect x="0" y="0" width="220" height="210" fill="url(#outfieldStripes)" />

          {/* ── ウォーニングトラック（外野フェンス手前の土） ── */}
          <path
            d={`M 0,0 L 0,60 Q 110,-30 220,60 L 220,0 Z`}
            fill="#a0784a"
            opacity="0.5"
          />
          {/* フェンスライン */}
          <path
            d="M 0,52 Q 110,-40 220,52"
            fill="none"
            stroke="#1a3a20"
            strokeWidth="3"
          />
          {/* フェンス上部パッド */}
          <path
            d="M 0,52 Q 110,-40 220,52"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeDasharray="6,3"
            opacity="0.7"
          />

          {/* ── 内野の芝（ストライプパターン） ── */}
          <path
            d={`M ${HOME.x} ${HOME.y + 10}
                L 0 100 Q 110,30 220,100 Z`}
            fill="url(#grassStripes)"
          />

          {/* ── 内野ダート（土の部分） ── */}
          {/* ダイヤモンド周辺の土 */}
          <polygon
            points={`${HOME.x},${HOME.y + 4} ${FIRST.x + 8},${FIRST.y} ${SECOND.x},${SECOND.y - 8} ${THIRD.x - 8},${THIRD.y}`}
            fill="url(#dirtTexture)"
            opacity="0.7"
          />

          {/* ベースパス（塁間の走路） */}
          <line x1={HOME.x} y1={HOME.y} x2={FIRST.x} y2={FIRST.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={FIRST.x} y1={FIRST.y} x2={SECOND.x} y2={SECOND.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={SECOND.x} y1={SECOND.y} x2={THIRD.x} y2={THIRD.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={THIRD.x} y1={THIRD.y} x2={HOME.x} y2={HOME.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />

          {/* ── ファウルライン ── */}
          <line x1={HOME.x} y1={HOME.y} x2="0"   y2="55" stroke="white" strokeWidth="1.2" opacity="0.8" />
          <line x1={HOME.x} y1={HOME.y} x2="220" y2="55" stroke="white" strokeWidth="1.2" opacity="0.8" />

          {/* ── ベースライン（白い線） ── */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            opacity="0.6"
          />

          {/* ── バッターボックス ── */}
          <rect x={HOME.x - 14} y={HOME.y - 12} width="10" height="22" rx="1"
            fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <rect x={HOME.x + 4} y={HOME.y - 12} width="10" height="22" rx="1"
            fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />

          {/* キャッチャーボックス */}
          <rect x={HOME.x - 10} y={HOME.y + 8} width="20" height="14" rx="1"
            fill="none" stroke="white" strokeWidth="0.6" opacity="0.5" />

          {/* ── ピッチャーズマウンド（立体感） ── */}
          <ellipse cx={MOUND.x} cy={MOUND.y + 1} rx="9" ry="7" fill="rgba(0,0,0,0.15)" />
          <ellipse cx={MOUND.x} cy={MOUND.y} rx="9" ry="7" fill="url(#moundGrad)" />
          {/* ピッチャープレート */}
          <rect x={MOUND.x - 4} y={MOUND.y - 1.5} width="8" height="3" rx="0.5" fill="white" />

          {/* ── ベース（立体感＋影） ── */}
          {[
            { pos: FIRST, name: '1B' },
            { pos: SECOND, name: '2B' },
            { pos: THIRD, name: '3B' },
          ].map(({ pos, name }) => (
            <g key={name} filter="url(#baseShadow)">
              <rect
                x={pos.x - 5} y={pos.y - 5} width="10" height="10"
                fill="white"
                stroke="#e5e5e5"
                strokeWidth="0.5"
                transform={`rotate(45 ${pos.x} ${pos.y})`}
              />
              {/* 光沢 */}
              <rect
                x={pos.x - 3} y={pos.y - 4} width="6" height="4"
                fill="white"
                opacity="0.5"
                transform={`rotate(45 ${pos.x} ${pos.y})`}
              />
            </g>
          ))}

          {/* ホームプレート（リアルな五角形） */}
          <g filter="url(#baseShadow)">
            <polygon
              points={`${HOME.x},${HOME.y + 6} ${HOME.x - 6},${HOME.y} ${HOME.x - 4},${HOME.y - 5} ${HOME.x + 4},${HOME.y - 5} ${HOME.x + 6},${HOME.y}`}
              fill="white"
              stroke="#d4d4d4"
              strokeWidth="0.5"
            />
          </g>

          {/* ── 守備位置（人型アイコン） ── */}
          {Object.entries(FIELDERS).map(([key, pos]) => {
            const isHL = key === highlighted;
            const fill = isHL ? '#f59e0b' : '#1a3a20';
            const stroke = isHL ? '#fbbf24' : '#a3e635';
            return (
              <g key={key} filter={isHL ? 'url(#glowHL)' : undefined}>
                <PlayerIcon
                  x={pos.x} y={pos.y}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isHL ? 1.8 : 1.2}
                  scale={isHL ? 1.15 : 1}
                />
                {/* ラベル */}
                <text
                  x={pos.x} y={pos.y + 16}
                  textAnchor="middle"
                  fontSize="6"
                  fill="white"
                  fontWeight="bold"
                  opacity={isHL ? 1 : 0.8}
                  stroke="#1a3a20"
                  strokeWidth="2"
                  paintOrder="stroke"
                >
                  {pos.label}
                </text>
              </g>
            );
          })}

          {/* ── ランナー ── */}
          {runners.first && <Runner cx={FIRST.x - 12} cy={FIRST.y - 12} />}
          {runners.second && <Runner cx={SECOND.x} cy={SECOND.y - 14} />}
          {runners.third && <Runner cx={THIRD.x + 12} cy={THIRD.y - 12} />}

          {/* ── ボール ── */}
          {ball && (
            <g>
              {/* ボールの影 */}
              <ellipse cx={ball.x + 1} cy={ball.y + 2} rx="5" ry="2" fill="rgba(0,0,0,0.2)" />
              {/* ボール本体 */}
              <circle cx={ball.x} cy={ball.y} r="5" fill="url(#ballGrad)" stroke="#cc0000" strokeWidth="0.8" />
              {/* 縫い目 */}
              <path
                d={`M${ball.x - 2},${ball.y - 4} Q${ball.x - 4},${ball.y} ${ball.x - 2},${ball.y + 4}`}
                fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7"
              />
              <path
                d={`M${ball.x + 2},${ball.y - 4} Q${ball.x + 4},${ball.y} ${ball.x + 2},${ball.y + 4}`}
                fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7"
              />
            </g>
          )}

          {/* ── アウトカウント（右下） ── */}
          <g>
            {/* 背景パネル */}
            <rect x="152" y="190" width="56" height="18" rx="4" fill="rgba(0,0,0,0.5)" />
            <text x="160" y="199" fontSize="5.5" fill="rgba(255,255,255,0.8)" fontWeight="bold">OUT</text>
            {[0, 1, 2].map((i) => (
              <circle
                key={i}
                cx={182 + i * 10} cy="199" r="4"
                fill={i < outs ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
                stroke={i < outs ? '#fbbf24' : 'rgba(255,255,255,0.4)'}
                strokeWidth="1"
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  );
}
