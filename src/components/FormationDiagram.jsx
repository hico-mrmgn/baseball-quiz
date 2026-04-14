import { useState, useEffect, useId } from 'react';
import { DEFAULT_POSITIONS } from '../data/formations';

// ベース座標
const HOME   = { x: 110, y: 182 };
const FIRST  = { x: 168, y: 126 };
const SECOND = { x: 110, y: 70 };
const THIRD  = { x: 52,  y: 126 };
const MOUND  = { x: 110, y: 136 };

/* ── 人型アイコン ── */
function PlayerIcon({ x, y, fill, stroke, strokeWidth = 1.2, scale = 1 }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <circle cx="0" cy="-8" r="4" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
      <path
        d="M0,-4 L0,4 M-5,0 L5,0 M0,4 L-4,10 M0,4 L4,10"
        stroke={stroke} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" fill="none"
      />
      <line x1="0" y1="-4" x2="0" y2="4" stroke={fill} strokeWidth={strokeWidth * 1.6} strokeLinecap="round" />
    </g>
  );
}

/* ── ランナー ── */
function Runner({ cx, cy }) {
  return (
    <g>
      <ellipse cx={cx + 1} cy={cy + 11} rx="6" ry="2" fill="rgba(0,0,0,0.2)" />
      <circle cx={cx} cy={cy - 7} r="5.5" fill="#dc2626" />
      <ellipse cx={cx - 1.5} cy={cy - 9} rx="2" ry="1.5" fill="#ef4444" opacity="0.6" />
      <path
        d={`M${cx},${cy - 2} L${cx},${cy + 4} M${cx - 4},${cy + 1} L${cx + 4},${cy + 1} M${cx},${cy + 4} L${cx - 3},${cy + 10} M${cx},${cy + 4} L${cx + 3},${cy + 10}`}
        stroke="#dc2626" strokeWidth="2" strokeLinecap="round" fill="none"
      />
    </g>
  );
}

/* ── 矢印計算ヘルパー ── */
function arrowGeom(from, to, startOffset = 13) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const arrowLen = 5;
  const arrowWidth = 2.5;
  const sx = from.x + ux * startOffset;
  const sy = from.y + uy * startOffset;
  const endX = to.x - ux * arrowLen;
  const endY = to.y - uy * arrowLen;
  const bx = to.x - arrowLen * ux;
  const by = to.y - arrowLen * uy;
  return {
    sx, sy, endX, endY, len,
    tipX: to.x, tipY: to.y,
    p1x: bx + arrowWidth * uy, p1y: by - arrowWidth * ux,
    p2x: bx - arrowWidth * uy, p2y: by + arrowWidth * ux,
  };
}

/* ── 矢印（移動ライン） ── */
function ArrowLine({ from, to, color = '#ef4444', delay = 0, animated = false }) {
  const g = arrowGeom(from, to);
  if (!g) return null;
  const lineLen = Math.sqrt((g.endX - g.sx) ** 2 + (g.endY - g.sy) ** 2);

  return (
    <g opacity="0.85">
      <line
        x1={g.sx} y1={g.sy} x2={g.endX} y2={g.endY}
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
        style={animated ? {
          strokeDasharray: lineLen,
          strokeDashoffset: lineLen,
          animation: `fd-draw ${0.4}s ease-out ${delay}s forwards`,
        } : undefined}
      />
      <polygon
        points={`${g.tipX},${g.tipY} ${g.p1x},${g.p1y} ${g.p2x},${g.p2y}`}
        fill={color}
        style={animated ? { opacity: 0, animation: `fd-fadeIn 0.15s ease-out ${delay + 0.35}s forwards` } : undefined}
      />
    </g>
  );
}

/* ── 送球ライン ── */
function ThrowLine({ from, to, color = '#f59e0b', delay = 0, animated = false }) {
  const g = arrowGeom(from, to, 8);
  if (!g) return null;
  const lineLen = Math.sqrt((g.endX - g.sx) ** 2 + (g.endY - g.sy) ** 2);

  return (
    <g opacity="0.7">
      <line
        x1={g.sx} y1={g.sy} x2={g.endX} y2={g.endY}
        stroke={color} strokeWidth="1.4"
        strokeDasharray="4,3"
        strokeLinecap="round"
        style={animated ? {
          strokeDasharray: `4,3`,
          strokeDashoffset: lineLen,
          animation: `fd-draw ${0.3}s ease-out ${delay}s forwards`,
        } : undefined}
      />
      <polygon
        points={`${g.tipX},${g.tipY} ${g.p1x},${g.p1y} ${g.p2x},${g.p2y}`}
        fill={color}
        style={animated ? { opacity: 0, animation: `fd-fadeIn 0.15s ease-out ${delay + 0.25}s forwards` } : undefined}
      />
    </g>
  );
}

/* ── ゴーストアイコン（元の位置） ── */
function GhostIcon({ x, y, delay = 0, animated = false }) {
  return (
    <g
      opacity={animated ? 0 : 0.22}
      style={animated ? { animation: `fd-ghostIn 0.3s ease-out ${delay}s forwards` } : undefined}
    >
      <circle cx={x} cy={y - 8} r="4" fill="#6b7280" stroke="#9ca3af" strokeWidth="1" />
      <path
        d={`M${x},${y - 4} L${x},${y + 4} M${x - 5},${y} L${x + 5},${y} M${x},${y + 4} L${x - 4},${y + 10} M${x},${y + 4} L${x + 4},${y + 10}`}
        stroke="#9ca3af" strokeWidth="1" strokeLinecap="round" fill="none"
      />
    </g>
  );
}

/* ── アニメーション付き選手 ── */
function AnimatedPlayer({ fromX, fromY, toX, toY, fill, stroke, strokeWidth, scale, label, color, delay }) {
  const dx = toX - fromX;
  const dy = toY - fromY;

  return (
    <g
      style={{
        transform: `translate(${dx}px, ${dy}px)`,
        animation: `fd-none 0s`,
      }}
    >
      {/* inner g uses animateTransform for SVG-native animation */}
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          from={`${-dx} ${-dy}`}
          to="0 0"
          dur="0.6s"
          begin={`${delay}s`}
          fill="freeze"
          calcMode="spline"
          keySplines="0.25 0.1 0.25 1"
        />
        {/* Start invisible at "from", become visible as it moves */}
        <g transform={`translate(${-dx}, ${-dy})`}>
          <PlayerIcon
            x={toX} y={toY}
            fill={fill} stroke={stroke}
            strokeWidth={strokeWidth} scale={scale}
          />
          <text
            x={toX} y={toY + 16}
            textAnchor="middle" fontSize="6"
            fill="white" fontWeight="bold"
            stroke={color} strokeWidth="2" paintOrder="stroke"
          >
            {label}
          </text>
        </g>
      </g>
    </g>
  );
}

export default function FormationDiagram({ formation, compact = false, animated = false }) {
  if (!formation) return null;

  const { outs = 0, runners = {}, ballPos, moves = [], throws = [] } = formation;
  const uid = useId().replace(/:/g, '');

  // アニメーション用のフェーズ管理
  const [phase, setPhase] = useState(animated ? 0 : 2);

  useEffect(() => {
    if (!animated) { setPhase(2); return; }
    setPhase(0);
    // phase 0: 初期状態（全員デフォルト位置）
    const t1 = setTimeout(() => setPhase(1), 300);   // phase 1: 移動開始
    return () => clearTimeout(t1);
  }, [animated, formation?.id]);

  // 移動マップ: player -> { to, color }
  const moveMap = {};
  moves.forEach(m => { moveMap[m.player] = m; });

  // タイミング計算
  const GHOST_DELAY = 0;       // ゴースト表示
  const MOVE_DELAY = 0.2;      // 選手移動開始
  const ARROW_DELAY = 0.1;     // 矢印描画（移動と同時開始）
  const THROW_DELAY = 1.0;     // 送球ライン（移動完了後）

  const isAnimating = animated && phase >= 1;

  return (
    <div className={compact ? 'w-full' : 'mt-2 w-full'}>
      {/* アニメーション用CSS */}
      {animated && (
        <style>{`
          @keyframes fd-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fd-fadeIn {
            to { opacity: 1; }
          }
          @keyframes fd-ghostIn {
            to { opacity: 0.22; }
          }
          @keyframes fd-ballPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
          }
        `}</style>
      )}
      <svg
        viewBox="0 0 220 210"
        className="w-full rounded-xl"
        aria-label="守備フォーメーション図"
      >
        <defs>
          <pattern id={`${uid}-grass`} patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
            <rect width="16" height="16" fill="#3d8a4a" />
            <rect width="8" height="16" fill="#358042" />
          </pattern>
          <pattern id={`${uid}-outfield`} patternUnits="userSpaceOnUse" width="14" height="14" patternTransform="rotate(-30)">
            <rect width="14" height="14" fill="#378544" />
            <rect width="7" height="14" fill="#328040" />
          </pattern>
          <pattern id={`${uid}-dirt`} patternUnits="userSpaceOnUse" width="4" height="4">
            <rect width="4" height="4" fill="#c49a4a" />
            <circle cx="1" cy="1" r="0.5" fill="#b8894a" opacity="0.4" />
            <circle cx="3" cy="3" r="0.3" fill="#d4aa5a" opacity="0.3" />
          </pattern>
          <radialGradient id={`${uid}-mound`} cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#d4aa5a" />
            <stop offset="100%" stopColor="#b8894a" />
          </radialGradient>
          <radialGradient id={`${uid}-ball`} cx="35%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0e0e0" />
          </radialGradient>
          <clipPath id={`${uid}-clip`}>
            <rect x="0" y="0" width="220" height="210" rx="10" />
          </clipPath>
          <filter id={`${uid}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="0.8" floodOpacity="0.3" />
          </filter>
          <filter id={`${uid}-glow`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g clipPath={`url(#${uid}-clip)`}>
          {/* 外野芝 */}
          <rect x="0" y="0" width="220" height="210" fill={`url(#${uid}-outfield)`} />

          {/* ウォーニングトラック */}
          <path d="M 0,0 L 0,60 Q 110,-30 220,60 L 220,0 Z" fill="#a0784a" opacity="0.5" />
          <path d="M 0,52 Q 110,-40 220,52" fill="none" stroke="#1a3a20" strokeWidth="3" />
          <path d="M 0,52 Q 110,-40 220,52" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6,3" opacity="0.7" />

          {/* 内野芝 */}
          <path d={`M ${HOME.x} ${HOME.y + 10} L 0 100 Q 110,30 220,100 Z`} fill={`url(#${uid}-grass)`} />

          {/* 内野ダート */}
          <polygon
            points={`${HOME.x},${HOME.y + 4} ${FIRST.x + 8},${FIRST.y} ${SECOND.x},${SECOND.y - 8} ${THIRD.x - 8},${THIRD.y}`}
            fill={`url(#${uid}-dirt)`} opacity="0.7"
          />

          {/* ベースパス */}
          <line x1={HOME.x} y1={HOME.y} x2={FIRST.x} y2={FIRST.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={FIRST.x} y1={FIRST.y} x2={SECOND.x} y2={SECOND.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={SECOND.x} y1={SECOND.y} x2={THIRD.x} y2={THIRD.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />
          <line x1={THIRD.x} y1={THIRD.y} x2={HOME.x} y2={HOME.y} stroke="#c49a4a" strokeWidth="5" opacity="0.5" />

          {/* ファウルライン */}
          <line x1={HOME.x} y1={HOME.y} x2="0"   y2="55" stroke="white" strokeWidth="1.2" opacity="0.8" />
          <line x1={HOME.x} y1={HOME.y} x2="220" y2="55" stroke="white" strokeWidth="1.2" opacity="0.8" />

          {/* ベースライン */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"
          />

          {/* バッターボックス */}
          <rect x={HOME.x - 14} y={HOME.y - 12} width="10" height="22" rx="1" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <rect x={HOME.x + 4}  y={HOME.y - 12} width="10" height="22" rx="1" fill="none" stroke="white" strokeWidth="0.8" opacity="0.7" />
          <rect x={HOME.x - 10} y={HOME.y + 8}  width="20" height="14" rx="1" fill="none" stroke="white" strokeWidth="0.6" opacity="0.5" />

          {/* マウンド */}
          <ellipse cx={MOUND.x} cy={MOUND.y + 1} rx="9" ry="7" fill="rgba(0,0,0,0.15)" />
          <ellipse cx={MOUND.x} cy={MOUND.y}     rx="9" ry="7" fill={`url(#${uid}-mound)`} />
          <rect x={MOUND.x - 4} y={MOUND.y - 1.5} width="8" height="3" rx="0.5" fill="white" />

          {/* ベース */}
          {[{ pos: FIRST, name: '1B' }, { pos: SECOND, name: '2B' }, { pos: THIRD, name: '3B' }].map(({ pos, name }) => (
            <g key={name} filter={`url(#${uid}-shadow)`}>
              <rect x={pos.x - 5} y={pos.y - 5} width="10" height="10" fill="white" stroke="#e5e5e5" strokeWidth="0.5" transform={`rotate(45 ${pos.x} ${pos.y})`} />
              <rect x={pos.x - 3} y={pos.y - 4} width="6" height="4" fill="white" opacity="0.5" transform={`rotate(45 ${pos.x} ${pos.y})`} />
            </g>
          ))}

          {/* ホームプレート */}
          <g filter={`url(#${uid}-shadow)`}>
            <polygon
              points={`${HOME.x},${HOME.y + 6} ${HOME.x - 6},${HOME.y} ${HOME.x - 4},${HOME.y - 5} ${HOME.x + 4},${HOME.y - 5} ${HOME.x + 6},${HOME.y}`}
              fill="white" stroke="#d4d4d4" strokeWidth="0.5"
            />
          </g>

          {/* ── 送球ライン ── */}
          {(isAnimating || !animated) && throws.map((t, i) => (
            <ThrowLine
              key={i} from={t.from} to={t.to} color={t.color}
              delay={isAnimating ? THROW_DELAY + i * 0.25 : 0}
              animated={isAnimating}
            />
          ))}

          {/* ── ゴーストアイコン（移動前の位置） ── */}
          {moves.map((m, i) => {
            const def = DEFAULT_POSITIONS[m.player];
            if (!def) return null;
            return (
              <GhostIcon
                key={m.player} x={def.x} y={def.y}
                delay={isAnimating ? GHOST_DELAY + i * 0.05 : 0}
                animated={isAnimating}
              />
            );
          })}

          {/* ── 移動矢印 ── */}
          {(isAnimating || !animated) && moves.map((m, i) => {
            const def = DEFAULT_POSITIONS[m.player];
            if (!def) return null;
            return (
              <ArrowLine
                key={m.player} from={def} to={m.to} color={m.color}
                delay={isAnimating ? ARROW_DELAY + i * 0.08 : 0}
                animated={isAnimating}
              />
            );
          })}

          {/* ── 選手アイコン ── */}
          {Object.entries(DEFAULT_POSITIONS).map(([key, def]) => {
            const mv = moveMap[key];
            const pos = mv ? mv.to : def;
            const color = mv ? mv.color : '#1a3a20';
            const stroke = mv ? (mv.color === '#ef4444' ? '#fca5a5' : mv.color === '#3b82f6' ? '#93c5fd' : '#6ee7b7') : '#a3e635';
            const isHighlighted = !!mv;

            // アニメーション中の移動選手
            if (isAnimating && mv) {
              const moveIdx = moves.findIndex(m => m.player === key);
              return (
                <g key={key} filter={`url(#${uid}-glow)`}>
                  <AnimatedPlayer
                    fromX={def.x} fromY={def.y}
                    toX={mv.to.x} toY={mv.to.y}
                    fill={color} stroke={stroke}
                    strokeWidth={1.8} scale={1.15}
                    label={def.label} color={color}
                    delay={MOVE_DELAY + moveIdx * 0.08}
                  />
                </g>
              );
            }

            return (
              <g key={key} filter={isHighlighted ? `url(#${uid}-glow)` : undefined}>
                <PlayerIcon
                  x={pos.x} y={pos.y}
                  fill={color} stroke={stroke}
                  strokeWidth={isHighlighted ? 1.8 : 1.2}
                  scale={isHighlighted ? 1.15 : 1}
                />
                <text
                  x={pos.x} y={pos.y + 16}
                  textAnchor="middle" fontSize="6"
                  fill="white" fontWeight="bold"
                  opacity={isHighlighted ? 1 : 0.8}
                  stroke={isHighlighted ? color : '#1a3a20'}
                  strokeWidth="2" paintOrder="stroke"
                >
                  {def.label}
                </text>
              </g>
            );
          })}

          {/* ── ランナー ── */}
          {runners.first  && <Runner cx={FIRST.x  - 12} cy={FIRST.y  - 12} />}
          {runners.second && <Runner cx={SECOND.x}      cy={SECOND.y - 14} />}
          {runners.third  && <Runner cx={THIRD.x  + 12} cy={THIRD.y  - 12} />}

          {/* ── ボール ── */}
          {ballPos && (
            <g style={isAnimating ? {
              opacity: 0,
              animation: `fd-fadeIn 0.3s ease-out ${THROW_DELAY + throws.length * 0.25}s forwards`,
            } : undefined}>
              <ellipse cx={ballPos.x + 1} cy={ballPos.y + 2} rx="5" ry="2" fill="rgba(0,0,0,0.2)" />
              <circle cx={ballPos.x} cy={ballPos.y} r="5" fill={`url(#${uid}-ball)`} stroke="#cc0000" strokeWidth="0.8" />
              <path d={`M${ballPos.x - 2},${ballPos.y - 4} Q${ballPos.x - 4},${ballPos.y} ${ballPos.x - 2},${ballPos.y + 4}`} fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7" />
              <path d={`M${ballPos.x + 2},${ballPos.y - 4} Q${ballPos.x + 4},${ballPos.y} ${ballPos.x + 2},${ballPos.y + 4}`} fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7" />
            </g>
          )}

          {/* ── アウトカウント ── */}
          <g>
            <rect x="152" y="190" width="56" height="18" rx="4" fill="rgba(0,0,0,0.5)" />
            <text x="160" y="199" fontSize="5.5" fill="rgba(255,255,255,0.8)" fontWeight="bold">OUT</text>
            {[0, 1, 2].map(i => (
              <circle
                key={i}
                cx={182 + i * 10} cy="199" r="4"
                fill={i < outs ? '#f59e0b' : 'rgba(255,255,255,0.15)'}
                stroke={i < outs ? '#fbbf24' : 'rgba(255,255,255,0.4)'}
                strokeWidth="1"
              />
            ))}
          </g>

          {/* ── 凡例 ── */}
          {!compact && (
            <g>
              <rect x="4" y="190" width="88" height="18" rx="4" fill="rgba(0,0,0,0.45)" />
              <circle cx="12" cy="199" r="3" fill="#ef4444" />
              <text x="17" y="202" fontSize="5" fill="white" opacity="0.9">前進・処理</text>
              <circle cx="44" cy="199" r="3" fill="#10b981" />
              <text x="49" y="202" fontSize="5" fill="white" opacity="0.9">カバー</text>
              <circle cx="70" cy="199" r="3" fill="#3b82f6" />
              <text x="75" y="202" fontSize="5" fill="white" opacity="0.9">補助</text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
