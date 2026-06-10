import { useState, useEffect, useId } from 'react';
import { DEFAULT_POSITIONS } from '../data/formations';
import { FIRST, SECOND, THIRD } from '../data/fieldCoords';
import {
  FieldDefs, FieldGround,
  PlayerIcon, RunnerIcon, BallIcon, OutsCounter, PlayerLabel,
} from './FieldBase';

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

/* ── ゴーストアイコン（元の位置・グレーのシルエット） ── */
function GhostIcon({ x, y, delay = 0, animated = false }) {
  return (
    <g
      opacity={animated ? 0 : 0.25}
      style={animated ? { animation: `fd-ghostIn 0.3s ease-out ${delay}s forwards` } : undefined}
    >
      <circle cx={x} cy={y - 6.5} r="4.2" fill="#6b7280" />
      <path
        d={`M${x - 4},${y - 0.5} Q${x - 4.8},${y + 6.5} ${x},${y + 6.5} Q${x + 4.8},${y + 6.5} ${x + 4},${y - 0.5} Q${x + 3},${y - 2.8} ${x},${y - 2.8} Q${x - 3},${y - 2.8} ${x - 4},${y - 0.5} Z`}
        fill="#6b7280"
      />
    </g>
  );
}

/* ── アニメーション付き選手 ── */
function AnimatedPlayer({ fromX, fromY, toX, toY, color, scale, label, delay, side }) {
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
        <g transform={`translate(${-dx}, ${-dy})`}>
          <PlayerIcon x={toX} y={toY} color={color} scale={scale} />
          <PlayerLabel x={toX} y={toY} label={label} color={color} side={side} emphasized />
        </g>
      </g>
    </g>
  );
}

export default function FormationDiagram({ formation, compact = false, animated = false }) {
  const uid = useId().replace(/:/g, '');

  // アニメーション用のフェーズ管理
  const [phase, setPhase] = useState(animated ? 0 : 2);
  const formationId = formation?.id;

  useEffect(() => {
    // setStateはタイムアウト経由で行い、エフェクト内の同期更新を避ける
    const timers = animated
      ? [
          setTimeout(() => setPhase(0), 0),    // phase 0: 初期状態（全員デフォルト位置）
          setTimeout(() => setPhase(1), 300),  // phase 1: 移動開始
        ]
      : [setTimeout(() => setPhase(2), 0)];
    return () => timers.forEach(clearTimeout);
  }, [animated, formationId]);

  if (!formation) return null;

  const { outs = 0, runners = {}, ballPos, moves = [], throws = [] } = formation;

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
            to { opacity: 0.25; }
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
        <FieldDefs uid={uid} />

        <g clipPath={`url(#${uid}-clip)`}>
          <FieldGround uid={uid} />

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
            const color = mv ? mv.color : '#1e3a8a';
            const isHighlighted = !!mv;
            const sideLabel = key === 'catcher' && !mv;

            // アニメーション中の移動選手
            if (isAnimating && mv) {
              const moveIdx = moves.findIndex(m => m.player === key);
              return (
                <g key={key} filter={`url(#${uid}-glow)`}>
                  <AnimatedPlayer
                    fromX={def.x} fromY={def.y}
                    toX={mv.to.x} toY={mv.to.y}
                    color={color} scale={1.2}
                    label={def.label}
                    delay={MOVE_DELAY + moveIdx * 0.08}
                    side={sideLabel}
                  />
                </g>
              );
            }

            return (
              <g key={key} filter={isHighlighted ? `url(#${uid}-glow)` : undefined}>
                <PlayerIcon
                  x={pos.x} y={pos.y}
                  color={color}
                  scale={isHighlighted ? 1.2 : 1}
                />
                <PlayerLabel
                  x={pos.x} y={pos.y}
                  label={def.label}
                  color={isHighlighted ? color : '#1e3a8a'}
                  side={sideLabel}
                  emphasized={isHighlighted}
                />
              </g>
            );
          })}

          {/* ── ランナー ── */}
          {runners.first  && <RunnerIcon x={FIRST.x  - 13} y={FIRST.y  - 13} />}
          {runners.second && <RunnerIcon x={SECOND.x}      y={SECOND.y - 15} />}
          {runners.third  && <RunnerIcon x={THIRD.x  + 13} y={THIRD.y  - 13} />}

          {/* ── ボール ── */}
          {ballPos && (
            <g style={isAnimating ? {
              opacity: 0,
              animation: `fd-fadeIn 0.3s ease-out ${THROW_DELAY + throws.length * 0.25}s forwards`,
            } : undefined}>
              <BallIcon x={ballPos.x} y={ballPos.y} uid={uid} />
            </g>
          )}

          {/* ── アウトカウント ── */}
          <OutsCounter outs={outs} />

          {/* ── 凡例 ── */}
          {!compact && (
            <g>
              <rect x="4" y="190" width="88" height="18" rx="5" fill="rgba(0,0,0,0.5)" />
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
