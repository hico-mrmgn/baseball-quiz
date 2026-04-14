// 守備フォーメーション解説データ
// moves: 動く選手の定義 { player, to: {x,y}, color, role }
// color: '#ef4444'=赤(積極的に動く), '#3b82f6'=青(カバー), '#10b981'=緑(ベースカバー)
// throws: 送球ライン { from: {x,y}, to: {x,y} }

export const formationCategories = [
  { id: 'bunt',     name: 'バント守備',   icon: '🏹' },
  { id: 'dp',       name: 'ゲッツー',    icon: '⚡' },
  { id: 'infield',  name: '前進守備',    icon: '🔥' },
  { id: 'relay',    name: '中継プレー',  icon: '🎯' },
  { id: 'steal',    name: '盗塁対応',    icon: '🏃' },
  { id: 'fly',      name: 'タッチアップ', icon: '☁️' },
];

// デフォルト守備位置
export const DEFAULT_POSITIONS = {
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

export const formations = [

  // ── バント守備 ─────────────────────────────────────

  {
    id: 'bunt-1',
    categoryId: 'bunt',
    title: 'バント守備',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 95, y: 162 },
    description: 'ノーアウト1塁では相手がバントで2塁に進めてくる可能性が高い。サードとファーストが突進し、ショートが2塁をカバーする。ピッチャーは1塁カバーに走る。',
    keyPoints: [
      '3B・1Bが前進してバントを処理',
      'SSが2塁ベースカバーへ走る',
      'Pは1塁カバーに向かう',
      '捕球後はすばやく2塁送球が基本',
    ],
    moves: [
      { player: 'third',   to: { x: 65, y: 152 },  color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 148, y: 158 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 100, y: 162 }, color: '#ef4444', role: '前進' },
      { player: 'short',   to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'second',  to: { x: 155, y: 105 }, color: '#3b82f6', role: '1塁後方' },
    ],
    throws: [
      { from: { x: 65, y: 152 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'bunt-2',
    categoryId: 'bunt',
    title: 'バント守備',
    subtitle: 'ノーアウト2塁',
    outs: 0,
    runners: { first: false, second: true, third: false },
    ballPos: { x: 95, y: 162 },
    description: 'ノーアウト2塁のバント守備。2塁走者を3塁に進めないことを優先する場合と、まずアウトを確実に取る場合で対応が変わる。基本は前進してバントを処理し、3塁走者を刺すか1塁でアウトを取る。',
    keyPoints: [
      '3Bは前進しながら3塁ベースを意識',
      '1Bも前進。Pがカバーに動く',
      'SSは3塁ランナーを牽制しつつ3塁カバー',
      '送球は1塁でアウトを取るのが基本',
    ],
    moves: [
      { player: 'third',   to: { x: 60, y: 150 },  color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 148, y: 158 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 100, y: 160 }, color: '#ef4444', role: '前進' },
      { player: 'short',   to: { x: 60, y: 118 },  color: '#10b981', role: '3塁カバー' },
      { player: 'second',  to: { x: 110, y: 82 },  color: '#3b82f6', role: '2塁カバー' },
    ],
    throws: [
      { from: { x: 60, y: 150 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'bunt-3',
    categoryId: 'bunt',
    title: 'バント守備',
    subtitle: 'ノーアウト1・2塁',
    outs: 0,
    runners: { first: true, second: true, third: false },
    ballPos: { x: 95, y: 162 },
    description: 'ノーアウト1・2塁のバント守備。最もよく出てくる場面。3塁に送球して走者をアウトにするか、難しければ確実に1塁でアウトを取る。ショートは3塁カバー。',
    keyPoints: [
      '3B・1B・Pが前進',
      'SSは3塁ベースカバー（2塁走者の進塁を防ぐ）',
      '2Bは2塁ベースカバー',
      '3塁への送球が基本、無理なら1塁',
    ],
    moves: [
      { player: 'third',   to: { x: 65, y: 152 },  color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 148, y: 158 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 100, y: 160 }, color: '#ef4444', role: '前進' },
      { player: 'short',   to: { x: 60, y: 118 },  color: '#10b981', role: '3塁カバー' },
      { player: 'second',  to: { x: 110, y: 82 },  color: '#3b82f6', role: '2塁カバー' },
    ],
    throws: [
      { from: { x: 65, y: 152 }, to: { x: 60, y: 118 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'bunt-4',
    categoryId: 'bunt',
    title: 'スクイズ守備',
    subtitle: '1アウト3塁',
    outs: 1,
    runners: { first: false, second: false, third: true },
    ballPos: { x: 110, y: 168 },
    description: '1アウト3塁でスクイズの気配がある場面。3塁走者が突進してくるので、キャッチャーがバントをさばき、ホームでタッチするかファーストへ送球する。ピッチャーも前進して対応。',
    keyPoints: [
      'Cがすばやく前に出てバントを処理',
      'Pも前進してカバー',
      '3Bはバント方向に突進',
      '1Bはラインを守りつつ前進',
      'ホームでタッチか1塁送球かを即判断',
    ],
    moves: [
      { player: 'catcher', to: { x: 110, y: 178 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 106, y: 155 }, color: '#ef4444', role: '前進' },
      { player: 'third',   to: { x: 62, y: 150 },  color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 152, y: 156 }, color: '#3b82f6', role: '前進' },
      { player: 'short',   to: { x: 80, y: 110 },  color: '#3b82f6', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 110, y: 178 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'bunt-5',
    categoryId: 'bunt',
    title: 'バント守備',
    subtitle: 'ノーアウト満塁',
    outs: 0,
    runners: { first: true, second: true, third: true },
    ballPos: { x: 95, y: 162 },
    description: 'ノーアウト満塁のバント守備。相手はホームに1点入れてきたいのでスクイズを警戒。基本はCがバントを処理してホームアウト→1塁でゲッツーを狙う。',
    keyPoints: [
      'Cがバントを処理してホームタッチ',
      'その後すぐ1塁送球でゲッツー狙い',
      '3B・1Bも前進してカバー',
      '難しければ1塁でアウトを取る',
    ],
    moves: [
      { player: 'catcher', to: { x: 110, y: 180 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 100, y: 158 }, color: '#ef4444', role: '前進' },
      { player: 'third',   to: { x: 62, y: 152 },  color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 148, y: 158 }, color: '#3b82f6', role: '前進' },
      { player: 'short',   to: { x: 60, y: 118 },  color: '#10b981', role: '3塁カバー' },
      { player: 'second',  to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
    ],
    throws: [
      { from: { x: 110, y: 180 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  // ── ゲッツー ──────────────────────────────────────

  {
    id: 'dp-1',
    categoryId: 'dp',
    title: 'ゲッツー（サードゴロ）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 55, y: 132 },
    description: '3Bがゴロを処理し、2塁でアウト→1塁でアウトのゲッツーを狙う。SSが2塁ベースカバーに入る。3Bはすばやく2塁送球することが大切。',
    keyPoints: [
      '3Bがゴロを捕球してSSへ送球',
      'SSは2塁ベース手前で捕球してから1塁へ送球',
      '2BはSS送球後に1塁カバーへ',
      'PはCの後方カバー',
    ],
    moves: [
      { player: 'short',  to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'second', to: { x: 158, y: 100 }, color: '#3b82f6', role: '1塁後方へ' },
    ],
    throws: [
      { from: { x: 55, y: 132 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
      { from: { x: 110, y: 82 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'dp-2',
    categoryId: 'dp',
    title: 'ゲッツー（ショートゴロ）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 75, y: 114 },
    description: 'SSがゴロを処理して2塁へ送球。2Bが2塁ベースでアウトにしてから1塁へ転送。SSは足を止めずにすばやく送球するのがポイント。',
    keyPoints: [
      'SSがゴロを処理して2Bへ送球',
      '2Bは2塁ベースを踏んで1塁へ転送',
      '3Bは3塁カバー',
      '1Bは1塁ベースで待つ',
    ],
    moves: [
      { player: 'second', to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 75, y: 114 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
      { from: { x: 110, y: 82 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'dp-3',
    categoryId: 'dp',
    title: 'ゲッツー（セカンドゴロ）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 128, y: 104 },
    description: '2Bがゴロを処理してSSに送球。SSが2塁でアウトにしてから1塁へ転送。2Bは捕球後すぐ体を回してSSへ送球する。',
    keyPoints: [
      '2Bがゴロを捕ってSSへ送球',
      'SSは2塁ベースを踏んで1塁へ転送',
      '3Bは3塁カバー',
    ],
    moves: [
      { player: 'short',  to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 128, y: 104 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
      { from: { x: 110, y: 82 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'dp-4',
    categoryId: 'dp',
    title: 'ゲッツー（ファーストゴロ）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 160, y: 130 },
    description: '1Bがゴロを処理してSSへ送球。SSが2塁でアウトにしてからPがカバーする1塁へ転送。1Bは送球後すぐ1塁ベースへ戻れない場合はPがカバー。',
    keyPoints: [
      '1Bがゴロを捕ってSSへ送球',
      'SSは2塁ベースを踏んで1塁へ転送',
      'Pは1塁ベースカバーへ走る（重要！）',
      'SSは2塁アウト後に1塁送球',
    ],
    moves: [
      { player: 'short',   to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'pitcher', to: { x: 165, y: 140 }, color: '#3b82f6', role: '1塁カバー' },
      { player: 'second',  to: { x: 138, y: 96 },  color: '#3b82f6', role: 'バックアップ' },
    ],
    throws: [
      { from: { x: 160, y: 130 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
      { from: { x: 110, y: 82 }, to: { x: 165, y: 140 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'dp-5',
    categoryId: 'dp',
    title: 'ゲッツー（ピッチャーゴロ）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 110, y: 148 },
    description: 'Pがゴロを処理してSSへ送球。SSが2塁でアウトにしてから1塁へ転送。Pは送球後、1塁カバーに走れないため2BがカバーすることもあるSSの送球先は1Bか2Bのカバー。',
    keyPoints: [
      'Pがゴロを捕ってSSへ送球',
      'SSは2塁ベースを踏んで1塁へ転送',
      '2Bは1塁後方カバー',
      '3Bは3塁カバー',
    ],
    moves: [
      { player: 'short',  to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'second', to: { x: 155, y: 105 }, color: '#3b82f6', role: '1塁後方' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 110, y: 148 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
      { from: { x: 110, y: 82 }, to: { x: 168, y: 126 }, color: '#f59e0b' },
    ],
  },

  // ── 前進守備 ──────────────────────────────────────

  {
    id: 'infield-1',
    categoryId: 'infield',
    title: '前進守備（内野全員）',
    subtitle: '1アウト3塁',
    outs: 1,
    runners: { first: false, second: false, third: true },
    ballPos: null,
    description: '1アウト3塁の同点や逆転がかかった場面で使う守備隊形。内野手が全員ホーム寄りに前進し、内野ゴロが来たらホームでタッチアウトを狙う。ただし内野の間を抜けると長打になるリスクがある。',
    keyPoints: [
      '内野4人が全員ホーム寄りに前進',
      '内野ゴロはホームへ送球してタッチアウト',
      'ゴロの速さや状況によってはアウトを諦める判断も必要',
      '外野は通常位置を保つ',
    ],
    moves: [
      { player: 'third',   to: { x: 44, y: 152 },  color: '#ef4444', role: '前進' },
      { player: 'short',   to: { x: 82, y: 112 },  color: '#ef4444', role: '前進' },
      { player: 'second',  to: { x: 136, y: 112 }, color: '#ef4444', role: '前進' },
      { player: 'first',   to: { x: 172, y: 152 }, color: '#ef4444', role: '前進' },
      { player: 'pitcher', to: { x: 110, y: 148 }, color: '#3b82f6', role: '前進' },
    ],
    throws: [],
  },

  {
    id: 'infield-2',
    categoryId: 'infield',
    title: '中間守備',
    subtitle: '1アウト3塁',
    outs: 1,
    runners: { first: false, second: false, third: true },
    ballPos: null,
    description: '完全な前進守備より少し後ろの「中間守備」。内野ゴロはホームに投げられるが、抜けても単打止まりの距離感。1アウト3塁で点差に余裕があるときなど柔軟に使う。',
    keyPoints: [
      '前進守備より少し後ろの位置取り',
      '強いゴロはホームへ投げられる',
      '外野への打球は通常通り処理',
      '試合の点差・状況で前進か中間かを判断',
    ],
    moves: [
      { player: 'third',   to: { x: 42, y: 144 },  color: '#3b82f6', role: '中間' },
      { player: 'short',   to: { x: 82, y: 104 },  color: '#3b82f6', role: '中間' },
      { player: 'second',  to: { x: 136, y: 104 }, color: '#3b82f6', role: '中間' },
      { player: 'first',   to: { x: 174, y: 144 }, color: '#3b82f6', role: '中間' },
    ],
    throws: [],
  },

  {
    id: 'infield-3',
    categoryId: 'infield',
    title: '内野シフト（左打者対策）',
    subtitle: '通常守備',
    outs: 0,
    runners: { first: false, second: false, third: false },
    ballPos: null,
    description: '強い左打者に対して内野をライト方向にずらすシフト。引っ張り方向の打球に備える守備隊形。MLBでは頻繁に使われるが日本でも採用チームが増えている。',
    keyPoints: [
      'SS・2Bが右側（ライト方向）にシフト',
      '3Bがショートの定位置あたりに移動',
      '1Bはファウルゾーン寄りに',
      '左打者の引っ張り打球を想定',
    ],
    moves: [
      { player: 'third',  to: { x: 80,  y: 110 }, color: '#3b82f6', role: 'SS位置へ' },
      { player: 'short',  to: { x: 128, y: 100 }, color: '#3b82f6', role: '右寄り' },
      { player: 'second', to: { x: 158, y: 104 }, color: '#3b82f6', role: '右寄り' },
      { player: 'first',  to: { x: 186, y: 140 }, color: '#3b82f6', role: 'ライン寄り' },
    ],
    throws: [],
  },

  // ── 中継プレー ────────────────────────────────────

  {
    id: 'relay-1',
    categoryId: 'relay',
    title: '中継プレー（レフト前ヒット）',
    subtitle: 'ノーアウト2塁',
    outs: 0,
    runners: { first: false, second: true, third: false },
    ballPos: { x: 28, y: 38 },
    description: 'レフト前ヒットで2塁走者がホームを狙う場面。SSが中継に入りLFからの送球を受けてホームへ転送する。SSの位置取りと送球の正確さが鍵。',
    keyPoints: [
      'SSがレフト方向へ走って中継位置に入る',
      '3Bはホームへの送球ラインを確認してカットするか指示',
      '2BはSS離脱後の2塁カバー',
      'LFはSSへすばやく送球',
    ],
    moves: [
      { player: 'short',  to: { x: 56, y: 65 },   color: '#ef4444', role: '中継位置' },
      { player: 'second', to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 28, y: 38 }, to: { x: 56, y: 65 }, color: '#f59e0b' },
      { from: { x: 56, y: 65 }, to: { x: 110, y: 196 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'relay-2',
    categoryId: 'relay',
    title: '中継プレー（ライト前ヒット）',
    subtitle: 'ノーアウト2塁',
    outs: 0,
    runners: { first: false, second: true, third: false },
    ballPos: { x: 192, y: 38 },
    description: 'ライト前ヒットで2塁走者がホームを狙う場面。2Bが中継に入りRFからの送球を受けてホームへ転送する。1Bは1塁ベースを守りつつカット判断をサポート。',
    keyPoints: [
      '2Bがライト方向へ走って中継位置に入る',
      '1Bはホームへの送球ラインを確認して指示',
      'SSは2塁カバーへ',
      'RFはすばやく中継の2Bへ送球',
    ],
    moves: [
      { player: 'second', to: { x: 162, y: 65 },  color: '#ef4444', role: '中継位置' },
      { player: 'short',  to: { x: 110, y: 82 },  color: '#10b981', role: '2塁カバー' },
      { player: 'first',  to: { x: 168, y: 126 }, color: '#3b82f6', role: '1塁カバー' },
    ],
    throws: [
      { from: { x: 192, y: 38 }, to: { x: 162, y: 65 }, color: '#f59e0b' },
      { from: { x: 162, y: 65 }, to: { x: 110, y: 196 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'relay-3',
    categoryId: 'relay',
    title: '中継プレー（センター長打）',
    subtitle: 'ノーアウト1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: { x: 110, y: 14 },
    description: 'センターへの長打（フェンス際）で走者が一気にホームを狙う場面。SSが浅いセンター方向に走って中継に入り、CFからの長い送球を受けてホームへ転送する。',
    keyPoints: [
      'SSが浅いセンター方向に走って中継位置へ',
      '2Bも後方に控えて第2中継',
      '3Bは3塁をカバー',
      'CFはとにかく早くSSへ送球',
    ],
    moves: [
      { player: 'short',  to: { x: 92, y: 50 },   color: '#ef4444', role: '第1中継' },
      { player: 'second', to: { x: 112, y: 78 },  color: '#3b82f6', role: '第2中継' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#10b981', role: '3塁カバー' },
    ],
    throws: [
      { from: { x: 110, y: 14 }, to: { x: 92, y: 50 }, color: '#f59e0b' },
      { from: { x: 92, y: 50 }, to: { x: 110, y: 196 }, color: '#f59e0b' },
    ],
  },

  // ── 盗塁対応 ──────────────────────────────────────

  {
    id: 'steal-1',
    categoryId: 'steal',
    title: '1塁ランナー盗塁（右投手）',
    subtitle: 'ランナー1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: null,
    description: '右投手の場合、2塁への盗塁はショートか2Bがカバーに入る。一般的に左打者のとき2B、右打者のときSSがカバーに入ることが多いが、チームによって決め方が異なる。',
    keyPoints: [
      '右打者のときはSSが2塁カバー（バッターの体が邪魔にならないため）',
      '左打者のときは2Bが2塁カバー',
      'カバーに入らない方はベースから離れずポジションを守る',
      'Cの送球ラインを確保することが大事',
    ],
    moves: [
      { player: 'short',  to: { x: 110, y: 82 },  color: '#ef4444', role: '2塁カバー（右打者時）' },
    ],
    throws: [
      { from: { x: 110, y: 196 }, to: { x: 110, y: 82 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'steal-2',
    categoryId: 'steal',
    title: '2塁ランナー盗塁',
    subtitle: 'ランナー2塁',
    outs: 0,
    runners: { first: false, second: true, third: false },
    ballPos: null,
    description: '2塁走者が3塁を狙う場面。3Bか SSが3塁カバーに入る。一般的に 3Bが3塁ベースを守り、Cが送球する。サインによりSSが動くことも。',
    keyPoints: [
      '3Bが3塁ベースをカバー',
      'CがすばやくC→3塁送球',
      'SSはカバーをサポート',
      '2塁走者の動きを早めに察知することが大切',
    ],
    moves: [
      { player: 'third',  to: { x: 52, y: 126 },  color: '#ef4444', role: '3塁カバー' },
      { player: 'short',  to: { x: 66, y: 108 },  color: '#3b82f6', role: 'バックアップ' },
    ],
    throws: [
      { from: { x: 110, y: 196 }, to: { x: 52, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'steal-3',
    categoryId: 'steal',
    title: '牽制球（1塁）',
    subtitle: 'ランナー1塁',
    outs: 0,
    runners: { first: true, second: false, third: false },
    ballPos: null,
    description: '1塁への牽制球。1Bはベースに入りPの牽制を受ける。SSや2Bはランナーの動きを見てフォローの動きをする。牽制のタイミングはキャッチャーや内野手がサインで合わせることも。',
    keyPoints: [
      '1Bはベースに入って牽制を受ける準備',
      '2Bは1塁後方のカバーポジションへ',
      'Pは素早く1塁へ牽制（右投手はクイックモーション）',
      'ランナーの足の動きをよく見る',
    ],
    moves: [
      { player: 'first',  to: { x: 168, y: 130 }, color: '#ef4444', role: 'ベースカバー' },
      { player: 'second', to: { x: 155, y: 110 }, color: '#3b82f6', role: 'バックアップ' },
    ],
    throws: [
      { from: { x: 110, y: 136 }, to: { x: 168, y: 130 }, color: '#f59e0b' },
    ],
  },

  // ── タッチアップ ──────────────────────────────────

  {
    id: 'fly-1',
    categoryId: 'fly',
    title: '外野フライ（ランナー3塁）',
    subtitle: '1アウト3塁',
    outs: 1,
    runners: { first: false, second: false, third: true },
    ballPos: { x: 28, y: 38 },
    description: 'レフトフライでランナー3塁がタッチアップしてくる場面。LFはすばやく送球してホームでアウトを狙う。内野手は送球ラインを確保してカットの判断をサポート。',
    keyPoints: [
      'LFはフライを捕ったらすぐホームへ送球',
      '3Bはカット（カットか通すか）の判断をする',
      'Cはホームベースでタッチアウトを狙う',
      '走者が早ければカットして1塁などの判断も',
    ],
    moves: [
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: 'カット判断' },
      { player: 'short',  to: { x: 72, y: 100 },  color: '#3b82f6', role: 'バックアップ' },
    ],
    throws: [
      { from: { x: 28, y: 38 }, to: { x: 52, y: 126 }, color: '#f59e0b' },
      { from: { x: 52, y: 126 }, to: { x: 110, y: 196 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'fly-2',
    categoryId: 'fly',
    title: '外野フライ（ランナー2塁）',
    subtitle: 'ノーアウト2塁',
    outs: 0,
    runners: { first: false, second: true, third: false },
    ballPos: { x: 192, y: 38 },
    description: 'ライトフライでランナー2塁がタッチアップして3塁へ。RFはすばやく3塁への送球ラインを意識してCFかRFから2Bを中継に使い3塁を狙う。2Bが中継位置へ。',
    keyPoints: [
      'RFはフライ捕球後すばやく3塁方向へ送球',
      '2Bが中継位置（ライト寄り）に入る',
      'SSまたは3Bが3塁ベースカバー',
      '1Bは1塁カバーに残る',
    ],
    moves: [
      { player: 'second', to: { x: 162, y: 65 },  color: '#ef4444', role: '中継位置' },
      { player: 'short',  to: { x: 52, y: 126 },  color: '#10b981', role: '3塁カバー' },
      { player: 'third',  to: { x: 64, y: 112 },  color: '#3b82f6', role: 'バックアップ' },
    ],
    throws: [
      { from: { x: 192, y: 38 }, to: { x: 162, y: 65 }, color: '#f59e0b' },
      { from: { x: 162, y: 65 }, to: { x: 52, y: 126 }, color: '#f59e0b' },
    ],
  },

  {
    id: 'fly-3',
    categoryId: 'fly',
    title: '犠牲フライ（センターフライ）',
    subtitle: '1アウト3塁',
    outs: 1,
    runners: { first: false, second: false, third: true },
    ballPos: { x: 110, y: 14 },
    description: 'センターフライでランナー3塁がタッチアップしてくる場面。CFが捕球したらホームへの送球ルートを確保する。SSまたは2Bが中継に入ることもある。',
    keyPoints: [
      'CFはフライ捕球後すぐにホームへ送球',
      '距離が長い場合はSSや2Bが中継に入る',
      'Cはホームベースで構えてタッチアウトを狙う',
      '3Bはカット判断',
    ],
    moves: [
      { player: 'short',  to: { x: 96, y: 52 },   color: '#ef4444', role: '中継位置' },
      { player: 'third',  to: { x: 52, y: 126 },  color: '#3b82f6', role: 'カット判断' },
    ],
    throws: [
      { from: { x: 110, y: 14 }, to: { x: 96, y: 52 }, color: '#f59e0b' },
      { from: { x: 96, y: 52 }, to: { x: 110, y: 196 }, color: '#f59e0b' },
    ],
  },
];
