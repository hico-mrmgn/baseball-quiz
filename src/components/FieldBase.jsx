// フィールド描画の共通パーツ（FieldDiagram / FormationDiagram 共用）
// viewBox は 220 x 210 を前提とする
import { HOME, FIRST, SECOND, THIRD, MOUND, FENCE_R } from '../data/fieldCoords';

/* ── SVG defs（パターン・グラデーション・フィルター） ── */
export function FieldDefs({ uid }) {
  return (
    <defs>
      {/* 内野芝の刈り跡ストライプ（半透明で下地に重ねる） */}
      <pattern id={`${uid}-grass`} patternUnits="userSpaceOnUse" width="16" height="16" patternTransform="rotate(45)">
        <rect width="16" height="16" fill="transparent" />
        <rect width="8" height="16" fill="rgba(255,255,255,0.07)" />
      </pattern>

      {/* ダート（土）の質感 */}
      <pattern id={`${uid}-dirt`} patternUnits="userSpaceOnUse" width="6" height="6">
        <circle cx="1.5" cy="1.5" r="0.6" fill="rgba(120,72,20,0.25)" />
        <circle cx="4.5" cy="4" r="0.45" fill="rgba(255,235,200,0.3)" />
        <circle cx="3" cy="5.2" r="0.3" fill="rgba(120,72,20,0.2)" />
      </pattern>

      <radialGradient id={`${uid}-mound`} cx="50%" cy="38%" r="55%">
        <stop offset="0%" stopColor="#e8b870" />
        <stop offset="100%" stopColor="#c08c4a" />
      </radialGradient>

      <radialGradient id={`${uid}-ball`} cx="35%" cy="35%" r="55%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#dcdcdc" />
      </radialGradient>

      <clipPath id={`${uid}-clip`}>
        <rect x="0" y="0" width="220" height="210" rx="12" />
      </clipPath>

      <clipPath id={`${uid}-fence`}>
        <circle cx={HOME.x} cy={HOME.y} r={FENCE_R} />
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
  );
}

/* ── グラウンド本体（芝・ダート・ライン・ベース） ── */
export function FieldGround({ uid }) {
  // 扇形の芝刈りバンド（ホーム中心の同心円を大→小の順で重ね塗り）
  const bands = [];
  let i = 0;
  for (let r = FENCE_R - 14; r > 24; r -= 24, i++) {
    bands.push(
      <circle key={r} cx={HOME.x} cy={HOME.y} r={r} fill={i % 2 === 0 ? '#4fae63' : '#46a258'} />
    );
  }

  // ファウルライン終端（フェンスまで延長）
  const foulLen = Math.sqrt(110 * 110 + 127 * 127);
  const fx = (FENCE_R * 110) / foulLen;
  const fy = (FENCE_R * 127) / foulLen;

  return (
    <g>
      {/* フェンスの外（スタンド） */}
      <rect x="0" y="0" width="220" height="210" fill="#27553a" />

      {/* 芝（フェンス内にクリップ） */}
      <g clipPath={`url(#${uid}-fence)`}>
        <circle cx={HOME.x} cy={HOME.y} r={FENCE_R} fill="#46a258" />
        {bands}
        {/* ウォーニングトラック */}
        <circle cx={HOME.x} cy={HOME.y} r={FENCE_R - 7.5} fill="none" stroke="#b9854c" strokeWidth="14" />
        <circle cx={HOME.x} cy={HOME.y} r={FENCE_R - 7.5} fill="none" stroke={`url(#${uid}-dirt)`} strokeWidth="14" />
        <circle cx={HOME.x} cy={HOME.y} r={FENCE_R - 14.5} fill="none" stroke="#a3743f" strokeWidth="1" opacity="0.7" />
      </g>

      {/* フェンス */}
      <circle cx={HOME.x} cy={HOME.y} r={FENCE_R} fill="none" stroke="#1d4d2b" strokeWidth="4.5" />
      <circle cx={HOME.x} cy={HOME.y} r={FENCE_R + 2.8} fill="none" stroke="#facc15" strokeWidth="1.4" opacity="0.85" />

      {/* 内野ダート（マウンド中心の円形） */}
      <circle cx={MOUND.x} cy={MOUND.y} r="82" fill="#dca35e" />
      <circle cx={MOUND.x} cy={MOUND.y} r="82" fill={`url(#${uid}-dirt)`} />
      <circle cx={MOUND.x} cy={MOUND.y} r="82" fill="none" stroke="#c08c4a" strokeWidth="2" opacity="0.7" />

      {/* 内野の芝ダイヤモンド */}
      <polygon
        points={`${HOME.x},168 154,${FIRST.y} ${SECOND.x},84 66,${THIRD.y}`}
        fill="#4fae63" stroke="#4fae63" strokeWidth="8" strokeLinejoin="round"
      />
      <polygon
        points={`${HOME.x},168 154,${FIRST.y} ${SECOND.x},84 66,${THIRD.y}`}
        fill={`url(#${uid}-grass)`} stroke="none"
      />

      {/* ファウルライン */}
      <line x1={HOME.x} y1={HOME.y} x2={HOME.x - fx} y2={HOME.y - fy} stroke="white" strokeWidth="1.5" opacity="0.9" />
      <line x1={HOME.x} y1={HOME.y} x2={HOME.x + fx} y2={HOME.y - fy} stroke="white" strokeWidth="1.5" opacity="0.9" />

      {/* ベースを結ぶ白ライン（うっすら） */}
      <polygon
        points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
        fill="none" stroke="white" strokeWidth="1.2" opacity="0.4"
      />

      {/* バッターボックス・キャッチャーボックス */}
      <rect x={HOME.x - 14} y={HOME.y - 12} width="10" height="22" rx="1" fill="none" stroke="white" strokeWidth="0.9" opacity="0.75" />
      <rect x={HOME.x + 4} y={HOME.y - 12} width="10" height="22" rx="1" fill="none" stroke="white" strokeWidth="0.9" opacity="0.75" />
      <rect x={HOME.x - 10} y={HOME.y + 8} width="20" height="14" rx="1" fill="none" stroke="white" strokeWidth="0.7" opacity="0.55" />

      {/* ピッチャーズマウンド */}
      <ellipse cx={MOUND.x} cy={MOUND.y + 1.5} rx="10" ry="8" fill="rgba(0,0,0,0.18)" />
      <ellipse cx={MOUND.x} cy={MOUND.y} rx="10" ry="8" fill={`url(#${uid}-mound)`} />
      <rect x={MOUND.x - 4} y={MOUND.y - 1.5} width="8" height="3" rx="0.6" fill="white" />

      {/* ベース */}
      {[FIRST, SECOND, THIRD].map((pos, idx) => (
        <g key={idx} filter={`url(#${uid}-shadow)`}>
          <rect
            x={pos.x - 5} y={pos.y - 5} width="10" height="10"
            fill="white" stroke="#e5e5e5" strokeWidth="0.5"
            transform={`rotate(45 ${pos.x} ${pos.y})`}
          />
          <rect
            x={pos.x - 3} y={pos.y - 4} width="6" height="4"
            fill="white" opacity="0.6"
            transform={`rotate(45 ${pos.x} ${pos.y})`}
          />
        </g>
      ))}

      {/* ホームプレート */}
      <g filter={`url(#${uid}-shadow)`}>
        <polygon
          points={`${HOME.x},${HOME.y + 6} ${HOME.x - 6},${HOME.y} ${HOME.x - 4},${HOME.y - 5} ${HOME.x + 4},${HOME.y - 5} ${HOME.x + 6},${HOME.y}`}
          fill="white" stroke="#d4d4d4" strokeWidth="0.5"
        />
      </g>
    </g>
  );
}

/* ── 守備選手（ちびキャラ: 白ユニフォーム＋カラーキャップ） ── */
/**
 * 守備の選手。
 *
 * 以前は9人とも同じ形だった。守備は「誰がどこで何をしているか」を読む絵なので、
 * 少なくとも捕手（しゃがんでミットを構える）と投手（プレートを踏む）は
 * ひと目で分かるようにしている。野手はグラブを持たせた。
 */
export function PlayerIcon({ x, y, color = '#1e3a8a', scale = 1, pose = 'field' }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {pose === 'catcher' ? <CatcherBody color={color} />
        : pose === 'pitcher' ? <PitcherBody color={color} />
        : <FielderBody color={color} />}
    </g>
  );
}

/** グラブ。どの守備者も左手にはめている前提で描く。 */
function Glove({ cx, cy, r = 2.4 }) {
  return <circle cx={cx} cy={cy} r={r} fill="#8b5e34" stroke="#5c3d21" strokeWidth="0.5" />;
}

/** 帽子（つば付き）。頭の形は3種類で共通。 */
function Cap({ color, cy = -7.2 }) {
  return (
    <>
      <path d={`M-4.2,${cy} A4.2,4.2 0 0 1 4.2,${cy} Z`} fill={color} />
      <rect x="-4.8" y={cy - 0.7} width="9.6" height="1.5" rx="0.75" fill={color} />
    </>
  );
}

function FielderBody({ color }) {
  return (
    <>
      <ellipse cx="0.5" cy="10.5" rx="5.5" ry="1.8" fill="rgba(0,0,0,0.2)" />
      {/* 構えの足幅。棒立ちより少し開く */}
      <path d="M-2.6,5.5 L-3.4,9.5 M2.6,5.5 L3.4,9.5" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
      <path d="M-3.8,0.5 L-6.4,3.4 M3.8,0.5 L6.2,3.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M-4,-0.5 Q-4.8,6.5 0,6.5 Q4.8,6.5 4,-0.5 Q3,-2.8 0,-2.8 Q-3,-2.8 -4,-0.5 Z"
        fill="#ffffff" stroke={color} strokeWidth="1"
      />
      <Glove cx={-6.9} cy={3.8} />
      <circle cx="0" cy="-6.5" r="4.2" fill="#fcd7b0" />
      <Cap color={color} />
    </>
  );
}

/** 投手。プレートを踏み、グラブを胸の前に置く。 */
function PitcherBody({ color }) {
  return (
    <>
      <ellipse cx="0.5" cy="10.5" rx="5.5" ry="1.8" fill="rgba(0,0,0,0.2)" />
      {/* 投手板 */}
      <rect x="-5.2" y="9.2" width="10.4" height="1.7" rx="0.7" fill="#f8fafc" opacity="0.95" />
      <path d="M-1.8,5.5 L-2.2,9.2 M1.8,5.5 L2.2,9.2" stroke="#52525b" strokeWidth="2" strokeLinecap="round" />
      <path d="M-3.6,0.6 L-5.2,2.2 M3.6,0.6 L5.6,2.6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path
        d="M-4,-0.5 Q-4.8,6.5 0,6.5 Q4.8,6.5 4,-0.5 Q3,-2.8 0,-2.8 Q-3,-2.8 -4,-0.5 Z"
        fill="#ffffff" stroke={color} strokeWidth="1"
      />
      <Glove cx={-4.4} cy={1.4} r={2.7} />
      <circle cx="0" cy="-6.5" r="4.2" fill="#fcd7b0" />
      <Cap color={color} />
    </>
  );
}

/** 捕手。しゃがんでミットを構え、マスクをつけている。 */
function CatcherBody({ color }) {
  return (
    <>
      <ellipse cx="0.5" cy="8.2" rx="6" ry="1.8" fill="rgba(0,0,0,0.2)" />
      {/* しゃがんだ脚。膝が外へ開く */}
      <path d="M-2.6,3.4 L-5.6,7 M2.6,3.4 L5.6,7" stroke="#52525b" strokeWidth="2.2" strokeLinecap="round" />
      {/* プロテクターごと低く構えた胴体 */}
      <path
        d="M-4.2,-1 Q-5,4.6 0,4.6 Q5,4.6 4.2,-1 Q3.2,-3.2 0,-3.2 Q-3.2,-3.2 -4.2,-1 Z"
        fill="#ffffff" stroke={color} strokeWidth="1"
      />
      <path d="M3.6,-0.4 L5.6,1.6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* ミット。野手のグラブより大きい */}
      <Glove cx={-6} cy={0.6} r={3.1} />
      <circle cx="0" cy="-6.6" r="4" fill="#fcd7b0" />
      <Cap color={color} cy={-7.3} />
      {/* マスクの格子 */}
      <g stroke="#3f3f46" strokeWidth="0.7" strokeLinecap="round">
        <path d="M-3.4,-7.4 L-3.4,-4.2 M0,-7.6 L0,-4 M3.4,-7.4 L3.4,-4.2" />
        <path d="M-3.6,-6.4 L3.6,-6.4 M-3.4,-4.6 L3.4,-4.6" />
      </g>
    </>
  );
}

/* ── ランナー（赤ヘルメット・走るポーズ） ── */
export function RunnerIcon({ x, y }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* 影 */}
      <ellipse cx="1" cy="10.5" rx="5.5" ry="1.8" fill="rgba(0,0,0,0.2)" />
      {/* スピード線 */}
      <path d="M-9,-3 L-12.5,-3 M-8.5,0.5 L-12,0.5 M-9,4 L-12.5,4" stroke="white" strokeWidth="1" strokeLinecap="round" opacity="0.65" />
      <g transform="rotate(8)">
        {/* 走る脚 */}
        <path d="M-1,4.8 L-4.5,9 M1,4.8 L4,8" stroke="#7f1d1d" strokeWidth="2" strokeLinecap="round" />
        {/* 振っている腕 */}
        <path d="M-3.3,0.5 L-6,-1.5 M3.3,0.5 L5.8,2.8" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
        {/* 胴体（赤ユニフォーム） */}
        <path
          d="M-3.6,-0.5 Q-4.2,5.8 0,5.8 Q4.2,5.8 3.6,-0.5 Q2.8,-2.5 0,-2.5 Q-2.8,-2.5 -3.6,-0.5 Z"
          fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8"
        />
        {/* 顔 */}
        <circle cx="0" cy="-6" r="4" fill="#fcd7b0" />
        {/* ヘルメット（光沢付き） */}
        <path d="M-4,-6.6 A4,4 0 0 1 4,-6.6 L5,-6 Q5.3,-5.3 4.4,-5.4 L-4,-5.6 Z" fill="#dc2626" />
        <ellipse cx="-1.5" cy="-8.3" rx="1.6" ry="1" fill="#f87171" opacity="0.85" />
      </g>
    </g>
  );
}

/* ── ボール ── */
export function BallIcon({ x, y, uid }) {
  return (
    <g>
      <ellipse cx={x + 1} cy={y + 2} rx="5" ry="2" fill="rgba(0,0,0,0.2)" />
      <circle cx={x} cy={y} r="5" fill={`url(#${uid}-ball)`} stroke="#cc0000" strokeWidth="0.8" />
      <path d={`M${x - 2},${y - 4} Q${x - 4},${y} ${x - 2},${y + 4}`} fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7" />
      <path d={`M${x + 2},${y - 4} Q${x + 4},${y} ${x + 2},${y + 4}`} fill="none" stroke="#cc0000" strokeWidth="0.6" opacity="0.7" />
    </g>
  );
}

/* ── アウトカウント表示 ── */
export function OutsCounter({ outs }) {
  return (
    <g>
      <rect x="152" y="190" width="56" height="18" rx="5" fill="rgba(0,0,0,0.55)" />
      <text x="160" y="199.5" fontSize="5.5" fill="rgba(255,255,255,0.85)" fontWeight="bold">OUT</text>
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
  );
}

/* ── 選手ラベル（キャッチャーは横に出して見切れ防止） ── */
export function PlayerLabel({ x, y, label, color = '#1e3a8a', side = false, emphasized = false }) {
  return (
    <text
      x={side ? x + 10 : x}
      y={side ? y + 2 : y + 17}
      textAnchor={side ? 'start' : 'middle'}
      fontSize="6.5"
      fill="white"
      fontWeight="bold"
      opacity={emphasized ? 1 : 0.9}
      stroke={color}
      strokeWidth="2.2"
      paintOrder="stroke"
    >
      {label}
    </text>
  );
}
