import { useId } from 'react';
import { parseSituation } from '../utils/parseSituation';
import { FIRST, SECOND, THIRD } from '../data/fieldCoords';
import {
  FieldDefs, FieldGround,
  PlayerIcon, RunnerIcon, BallIcon, OutsCounter, PlayerLabel,
} from './FieldBase';

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
  const uid = useId().replace(/:/g, '');

  return (
    <div className="mt-3 w-full">
      <svg
        viewBox="0 0 220 210"
        className="w-full rounded-xl"
        aria-label="グラウンド図"
      >
        <FieldDefs uid={uid} />

        <g clipPath={`url(#${uid}-clip)`}>
          <FieldGround uid={uid} />

          {/* ── 守備選手 ── */}
          {Object.entries(FIELDERS).map(([key, pos]) => {
            const isHL = key === highlighted;
            const color = isHL ? '#f59e0b' : '#1e3a8a';
            return (
              <g key={key} filter={isHL ? `url(#${uid}-glow)` : undefined}>
                <PlayerIcon x={pos.x} y={pos.y} color={color} scale={isHL ? 1.2 : 1} />
                <PlayerLabel
                  x={pos.x} y={pos.y}
                  label={pos.label}
                  color={color}
                  side={key === 'catcher'}
                  emphasized={isHL}
                />
              </g>
            );
          })}

          {/* ── ランナー ── */}
          {runners.first && <RunnerIcon x={FIRST.x - 13} y={FIRST.y - 13} />}
          {runners.second && <RunnerIcon x={SECOND.x} y={SECOND.y - 15} />}
          {runners.third && <RunnerIcon x={THIRD.x + 13} y={THIRD.y - 13} />}

          {/* ── ボール ── */}
          {ball && <BallIcon x={ball.x} y={ball.y} uid={uid} />}

          {/* ── アウトカウント ── */}
          <OutsCounter outs={outs} />
        </g>
      </svg>
    </div>
  );
}
