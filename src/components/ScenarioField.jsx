import { useId } from 'react';
import { FIRST, SECOND, THIRD } from '../data/fieldCoords';
import {
  FieldDefs, FieldGround,
  PlayerIcon, RunnerIcon, BallIcon, OutsCounter, PlayerLabel,
} from './FieldBase';
import { RUNNER_SPEED } from '../utils/scenario';

const FIELDERS = {
  pitcher: { x: 110, y: 136, label: 'P'  },
  catcher: { x: 110, y: 196, label: 'C'  },
  first:   { x: 178, y: 138, label: '1B' },
  second:  { x: 138, y: 96,  label: '2B' },
  short:   { x: 80,  y: 96,  label: 'SS' },
  third:   { x: 40,  y: 138, label: '3B' },
  left:    { x: 36,  y: 44,  label: 'LF' },
  center:  { x: 110, y: 24,  label: 'CF' },
  right:   { x: 184, y: 44,  label: 'RF' },
};

/** 前進守備・バントシフトでは内野の位置が変わる。隊形が見えないと判断できない。 */
const DEFENSE_SHIFTS = {
  '前進守備':       { first: { dy: -14 }, second: { dy: -16 }, short: { dy: -16 }, third: { dy: -14 } },
  '定位置より少し前': { first: { dy: -6 }, second: { dy: -7 }, short: { dy: -7 }, third: { dy: -6 } },
  'やや後ろ':       { left: { dy: -8 }, center: { dy: -6 }, right: { dy: -8 } },
  'バントシフト':    { first: { dy: -26 }, third: { dy: -26 } },
};

/** 打球の落下位置。旧データの文字列マッチと違い、キーで直接指定する。 */
const BALL_SPOTS = {
  third:       { x: 58,  y: 130 },
  short:       { x: 72,  y: 114 },
  second:      { x: 128, y: 102 },
  first:       { x: 162, y: 130 },
  pitcher:     { x: 110, y: 148 },
  bunt:        { x: 100, y: 158 },
  left:        { x: 28,  y: 36  },
  leftCenter:  { x: 62,  y: 22  },
  center:      { x: 100, y: 14  },
  rightCenter: { x: 158, y: 22  },
  right:       { x: 172, y: 36  },
  home:        { x: 110, y: 176 },
};

const THEME_FIELDER = {
  third: 'third', second: 'second', short: 'short',
  first: 'first', pitcher: 'pitcher', catcher: 'catcher',
};

function shifted(key, pos, defense) {
  const shift = DEFENSE_SHIFTS[defense]?.[key];
  if (!shift) return pos;
  return { ...pos, x: pos.x + (shift.dx ?? 0), y: pos.y + (shift.dy ?? 0) };
}

/** 走者の脚質バッジ。「速」「遅」が見えるだけで判断が変わる。 */
function SpeedTag({ x, y, speed }) {
  const info = RUNNER_SPEED[speed];
  if (!info?.short) return null;
  return (
    <g>
      <circle cx={x} cy={y} r="5.5" fill={info.color} stroke="white" strokeWidth="1" />
      <text
        x={x} y={y + 2.4} fontSize="6.5" fontWeight="bold"
        fill="white" textAnchor="middle"
      >
        {info.short}
      </text>
    </g>
  );
}

/** 塁上のスコアボード。イニング・点差・カウントを図の中で見せる。 */
function ScoreStrip({ sit }) {
  const inning = `${sit.inning}回${sit.half === 'top' ? '表' : '裏'}`;
  const count = sit.count ? `${sit.count.b}-${sit.count.s}` : null;
  return (
    <g>
      <rect x="6" y="6" width="118" height="20" rx="6" fill="rgba(0,0,0,0.62)" />
      <text x="13" y="19.5" fontSize="8.5" fill="#fde68a" fontWeight="bold">{inning}</text>
      <text x="52" y="19.5" fontSize="9" fill="white" fontWeight="bold">
        {sit.score.us} - {sit.score.them}
      </text>
      {count && (
        <>
          <text x="88" y="14" fontSize="5" fill="rgba(255,255,255,0.7)" fontWeight="bold">B-S</text>
          <text x="88" y="22" fontSize="7.5" fill="white" fontWeight="bold">{count}</text>
        </>
      )}
    </g>
  );
}

export default function ScenarioField({ sit, theme }) {
  const uid = useId().replace(/:/g, '');
  const highlighted = THEME_FIELDER[theme] ?? null;
  const ball = sit.ballArea ? BALL_SPOTS[sit.ballArea] : null;

  return (
    <div className="w-full">
      <svg viewBox="0 0 220 210" className="w-full rounded-xl" aria-label="グラウンド図">
        <FieldDefs uid={uid} />
        <g clipPath={`url(#${uid}-clip)`}>
          <FieldGround uid={uid} />

          {Object.entries(FIELDERS).map(([key, base]) => {
            const pos = shifted(key, base, sit.defense);
            const isHL = key === highlighted;
            const moved = pos.y !== base.y || pos.x !== base.x;
            const color = isHL ? '#f59e0b' : moved ? '#0ea5e9' : '#1e3a8a';
            return (
              <g key={key} filter={isHL ? `url(#${uid}-glow)` : undefined}>
                <PlayerIcon x={pos.x} y={pos.y} color={color} scale={isHL ? 1.2 : 1} />
                <PlayerLabel
                  x={pos.x} y={pos.y}
                  label={base.label}
                  color={color}
                  side={key === 'catcher'}
                  emphasized={isHL}
                />
              </g>
            );
          })}

          {sit.runners?.first && (
            <>
              <RunnerIcon x={FIRST.x - 13} y={FIRST.y - 13} />
              <SpeedTag x={FIRST.x - 3} y={FIRST.y - 22} speed={sit.runners.first} />
            </>
          )}
          {sit.runners?.second && (
            <>
              <RunnerIcon x={SECOND.x} y={SECOND.y - 15} />
              <SpeedTag x={SECOND.x + 10} y={SECOND.y - 24} speed={sit.runners.second} />
            </>
          )}
          {sit.runners?.third && (
            <>
              <RunnerIcon x={THIRD.x + 13} y={THIRD.y - 13} />
              <SpeedTag x={THIRD.x + 23} y={THIRD.y - 22} speed={sit.runners.third} />
            </>
          )}

          {ball && <BallIcon x={ball.x} y={ball.y} uid={uid} />}

          <OutsCounter outs={sit.outs} />
          <ScoreStrip sit={sit} />
        </g>
      </svg>
    </div>
  );
}
