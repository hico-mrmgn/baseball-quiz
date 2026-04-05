import { parseSituation } from '../utils/parseSituation';

export default function FieldDiagram({ situation, theme }) {
  const { outs, runners } = parseSituation(situation);

  // Coordinates (viewBox 200x200, home at bottom center)
  const home = { x: 100, y: 170 };
  const first = { x: 152, y: 118 };
  const second = { x: 100, y: 66 };
  const third = { x: 48, y: 118 };
  const mound = { x: 100, y: 126 };

  // Fielder positions
  const positions = {
    pitcher: { x: 100, y: 126, label: 'P' },
    catcher: { x: 100, y: 185, label: 'C' },
    first: { x: 165, y: 130, label: '1B' },
    second: { x: 130, y: 90, label: '2B' },
    short: { x: 70, y: 90, label: 'SS' },
    third: { x: 35, y: 130, label: '3B' },
    left: { x: 30, y: 40, label: 'LF' },
    center: { x: 100, y: 20, label: 'CF' },
    right: { x: 170, y: 40, label: 'RF' },
  };

  const themeToPosition = {
    third: 'third',
    second: 'second',
    short: 'short',
    pitcher: 'pitcher',
    coach: null,
  };

  const highlighted = themeToPosition[theme] || null;

  return (
    <div className="flex items-center gap-4 mt-3">
      {/* Field SVG */}
      <svg viewBox="0 0 200 200" className="w-36 h-36 shrink-0" aria-label="グラウンド図">
        {/* Outfield grass */}
        <path
          d="M 100 66 Q 10 10 0 80 L 0 0 L 200 0 L 200 80 Q 190 10 100 66 Z"
          fill="#4ade80"
          opacity="0.3"
        />

        {/* Infield diamond fill */}
        <polygon
          points={`${home.x},${home.y} ${first.x},${first.y} ${second.x},${second.y} ${third.x},${third.y}`}
          fill="#86efac"
          opacity="0.4"
        />

        {/* Base paths */}
        <polygon
          points={`${home.x},${home.y} ${first.x},${first.y} ${second.x},${second.y} ${third.x},${third.y}`}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* Foul lines */}
        <line x1={home.x} y1={home.y} x2="200" y2="80" stroke="white" strokeWidth="1" opacity="0.5" />
        <line x1={home.x} y1={home.y} x2="0" y2="80" stroke="white" strokeWidth="1" opacity="0.5" />

        {/* Pitcher's mound */}
        <circle cx={mound.x} cy={mound.y} r="4" fill="#d4a574" />

        {/* Bases */}
        <rect x={first.x - 4} y={first.y - 4} width="8" height="8" fill="white" transform={`rotate(45 ${first.x} ${first.y})`} />
        <rect x={second.x - 4} y={second.y - 4} width="8" height="8" fill="white" transform={`rotate(45 ${second.x} ${second.y})`} />
        <rect x={third.x - 4} y={third.y - 4} width="8" height="8" fill="white" transform={`rotate(45 ${third.x} ${third.y})`} />

        {/* Home plate */}
        <polygon points={`${home.x},${home.y + 5} ${home.x - 5},${home.y} ${home.x - 3},${home.y - 4} ${home.x + 3},${home.y - 4} ${home.x + 5},${home.y}`} fill="white" />

        {/* Fielder positions */}
        {Object.entries(positions).map(([key, pos]) => {
          const isHighlighted = key === highlighted;
          return (
            <g key={key}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHighlighted ? 10 : 7}
                fill={isHighlighted ? '#f59e0b' : '#6b7280'}
                opacity={isHighlighted ? 0.9 : 0.35}
              />
              <text
                x={pos.x}
                y={pos.y + 3}
                textAnchor="middle"
                fontSize={isHighlighted ? '8' : '7'}
                fill="white"
                fontWeight="bold"
              >
                {pos.label}
              </text>
            </g>
          );
        })}

        {/* Runners */}
        {runners.first && (
          <g>
            <circle cx={first.x + 10} cy={first.y - 10} r="7" fill="#ef4444" />
            <text x={first.x + 10} y={first.y - 7} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">R</text>
          </g>
        )}
        {runners.second && (
          <g>
            <circle cx={second.x} cy={second.y - 14} r="7" fill="#ef4444" />
            <text x={second.x} y={second.y - 11} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">R</text>
          </g>
        )}
        {runners.third && (
          <g>
            <circle cx={third.x - 10} cy={third.y - 10} r="7" fill="#ef4444" />
            <text x={third.x - 10} y={third.y - 7} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">R</text>
          </g>
        )}
      </svg>

      {/* Out count */}
      <div className="flex flex-col items-center gap-1">
        <div className="text-xs font-bold text-gray-500">アウト</div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 ${
                i < outs
                  ? 'bg-yellow-400 border-yellow-500'
                  : 'bg-white border-gray-300'
              }`}
            />
          ))}
        </div>
        <div className="text-xs font-bold text-gray-500 mt-2">ランナー</div>
        <svg viewBox="0 0 50 50" className="w-10 h-10">
          {/* Mini diamond for runner indicator */}
          <polygon points="25,5 45,25 25,45 5,25" fill="none" stroke="#d1d5db" strokeWidth="2" />
          {runners.second && <circle cx="25" cy="5" r="5" fill="#ef4444" />}
          {runners.first && <circle cx="45" cy="25" r="5" fill="#ef4444" />}
          {runners.third && <circle cx="5" cy="25" r="5" fill="#ef4444" />}
          <polygon points="25,45 22,42 22,40 28,40 28,42" fill="#d1d5db" />
        </svg>
      </div>
    </div>
  );
}
