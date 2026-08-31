import { useId } from 'react';
import { parseSituation } from '../utils/parseSituation';
import { FIRST, SECOND, THIRD, FIELDER_POSITIONS, poseOf } from '../data/fieldCoords';
import {
  FieldDefs, FieldGround,
  PlayerIcon, RunnerIcon, BallIcon, OutsCounter, PlayerLabel,
} from './FieldBase';

const FIELDERS = FIELDER_POSITIONS;

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
                <PlayerIcon x={pos.x} y={pos.y} color={color} scale={isHL ? 1.2 : 1} pose={poseOf(key)} />
              </g>
            );
          })}

          {/* ── ランナー ── */}
          {runners.first && <RunnerIcon x={FIRST.x - 13} y={FIRST.y - 13} />}
          {runners.second && <RunnerIcon x={SECOND.x} y={SECOND.y - 15} />}
          {runners.third && <RunnerIcon x={THIRD.x + 13} y={THIRD.y - 13} />}

          {/* ── ボール ── */}
          {ball && <BallIcon x={ball.x} y={ball.y} uid={uid} />}

          {/* ラベルはボールより後。打球と重なっても読めるようにするため */}
          {Object.entries(FIELDERS).map(([key, pos]) => {
            const isHL = key === highlighted;
            return (
              <PlayerLabel
                key={key}
                x={pos.x} y={pos.y}
                label={pos.label}
                color={isHL ? '#f59e0b' : '#1e3a8a'}
                side={key === 'catcher'}
                emphasized={isHL}
              />
            );
          })}

          {/* ── アウトカウント ── */}
          <OutsCounter outs={outs} />
        </g>
      </svg>
    </div>
  );
}
