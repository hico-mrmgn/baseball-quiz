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
        {/* ── 背景 ── */}
        <rect x="0" y="0" width="220" height="210" rx="10" fill="#4a7c59" />

        {/* 外野芝 */}
        <path
          d={`M ${HOME.x} ${HOME.y}
              L 0 100 L 0 0 L 220 0 L 220 100 Z`}
          fill="#3d6b4a"
        />
        {/* 外野弧（緑の濃淡） */}
        <ellipse cx="110" cy="70" rx="105" ry="80" fill="#3d6b4a" opacity="0.5" />

        {/* 内野ダイヤ（土色） */}
        <polygon
          points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
          fill="#c49a4a"
          opacity="0.55"
        />

        {/* ファウルライン */}
        <line x1={HOME.x} y1={HOME.y} x2="0"   y2="55"  stroke="white" strokeWidth="1" opacity="0.4" />
        <line x1={HOME.x} y1={HOME.y} x2="220" y2="55"  stroke="white" strokeWidth="1" opacity="0.4" />

        {/* ベースライン */}
        <polygon
          points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
          fill="none"
          stroke="white"
          strokeWidth="1.8"
        />

        {/* ピッチャーズマウンド */}
        <circle cx={MOUND.x} cy={MOUND.y} r="6" fill="#b8894a" />

        {/* ベース */}
        {[FIRST, SECOND, THIRD].map((b, i) => (
          <rect
            key={i}
            x={b.x - 5} y={b.y - 5} width="10" height="10"
            fill="white"
            transform={`rotate(45 ${b.x} ${b.y})`}
          />
        ))}
        {/* ホームプレート */}
        <polygon
          points={`${HOME.x},${HOME.y + 6} ${HOME.x - 6},${HOME.y} ${HOME.x - 4},${HOME.y - 5} ${HOME.x + 4},${HOME.y - 5} ${HOME.x + 6},${HOME.y}`}
          fill="white"
        />

        {/* ── 守備位置 ── */}
        {Object.entries(FIELDERS).map(([key, pos]) => {
          const isHL = key === highlighted;
          return (
            <g key={key}>
              <circle
                cx={pos.x} cy={pos.y}
                r={isHL ? 12 : 9}
                fill={isHL ? '#f59e0b' : '#1e3a29'}
                stroke={isHL ? '#fbbf24' : '#4ade80'}
                strokeWidth={isHL ? 2 : 1}
                opacity={isHL ? 1 : 0.7}
              />
              <text
                x={pos.x} y={pos.y + 4}
                textAnchor="middle"
                fontSize={isHL ? '8' : '7'}
                fill="white"
                fontWeight="bold"
              >
                {pos.label}
              </text>
            </g>
          );
        })}

        {/* ── ランナー ── */}
        {runners.first && <Runner cx={FIRST.x - 14} cy={FIRST.y - 14} />}
        {runners.second && <Runner cx={SECOND.x} cy={SECOND.y - 16} />}
        {runners.third && <Runner cx={THIRD.x + 14} cy={THIRD.y - 14} />}

        {/* ── ボール ── */}
        {ball && (
          <g>
            <circle cx={ball.x} cy={ball.y} r="9" fill="white" stroke="#d4a017" strokeWidth="2" />
            <text x={ball.x} y={ball.y + 4} textAnchor="middle" fontSize="9">⚾</text>
          </g>
        )}

        {/* ── アウトカウント（右下） ── */}
        <g>
          <text x="178" y="196" textAnchor="middle" fontSize="7" fill="white" opacity="0.7">アウト</text>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={164 + i * 14} cy="204" r="5"
              fill={i < outs ? '#f59e0b' : 'none'}
              stroke="white"
              strokeWidth="1.5"
              opacity="0.9"
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

function Runner({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="8" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">R</text>
    </g>
  );
}
