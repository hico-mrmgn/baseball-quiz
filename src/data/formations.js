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
    description: 'ノーアウト1塁は、相手がバントで走者を2塁へ送ってくる典型的な場面。3BとPと1Bの3人でバントを処理する「三角形の守備」が基本。\n\n誰がバントを取るかを素早く声で確認しながら動くことが大切。ボールが転がる方向と勢いを見てから判断する。サードラインに転がったら3B、一塁線なら1B、真ん中はPが処理する。捕球後は2塁のSSへすばやく送球してアウトを狙う。ただし間に合わないと判断したら無理せず1塁でアウトを確実に取る。',
    keyPoints: [
      '3B・1B・Pの3人でバント処理エリアをカバー',
      '声で「オレ！」と確認し、捕球者を決める',
      'SSは2塁ベースへ走ってカバー（2Bに戻る）',
      'Pは1塁カバーへ。1Bが前進した後ろを埋める',
      '2塁が間に合わないと見たら1塁でアウトを確実に',
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
    description: 'ノーアウト2塁は、相手がバントで走者を3塁へ進める「送りバント」を仕掛けてくる場面。2塁走者は足が速いため3塁への送球でアウトを取るのは難しい。\n\n基本方針は「まず確実にアウトを1つ取る」こと。1塁でのアウトを優先しつつ、バントが緩くてSSが3塁走者を刺せると判断した場合だけ3塁送球に切り替える。3Bは前進するが3塁ベースも意識し、SSが3塁カバーに走るため「3塁を空けない」連携が大切。',
    keyPoints: [
      '3B・1B・Pが前進してバント処理',
      'SSは3塁ベースカバーへ走る（3B前進後の穴を埋める）',
      '2Bは2塁ベースをカバー',
      '基本は1塁でアウト。3塁送球は確実な時だけ',
      '3Bが突っ込みすぎて3塁が空くのは厳禁',
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
    description: 'ノーアウト1・2塁は送りバントが最も多く出る場面で、守備側も最も複雑な判断が求められる。バントを処理した選手が「3塁か1塁か」を瞬時に決断しなければならない。\n\n2塁走者は3塁に向かい、1塁走者は2塁に向かう。捕球後に3塁走者を刺すのが理想だが、判断が遅れると全ランナーをセーフにしてしまう。SSは3塁カバーに走り、2Bは2塁カバーに入る。迷ったら1塁でアウトを確実に取り、「1アウトランナー2・3塁」に切り替える冷静さも大切。',
    keyPoints: [
      '3B・1B・Pが前進してバント処理エリアをカバー',
      'SSは3塁ベース、2Bは2塁ベースをカバー',
      '3塁送球が間に合うと判断したら3塁へ、迷ったら1塁',
      '「声を出して」捕球者を決めることで混乱を防ぐ',
      '無理な送球は禁物。確実に1アウトを取ることを優先',
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
    description: '1アウト3塁はスクイズで同点・逆転を狙われる「最も危険な場面」のひとつ。バッターがバントの構えをしたら守備側は素早く反応しなければならない。\n\nCはキャッチング後に素早く前に出てボールをさばく。Pも投球後すぐにバント処理のポジションに動く。3Bはサードラインのバントをカバー。スクイズを外す「ウエストボール」（外角への高めの球）で走者を挟む作戦を取ることもある。捕球後はホームでタッチアウトが第1優先、間に合わなければ1塁でアウトを取る。',
    keyPoints: [
      'Cが前に出てバントを素早く処理',
      'Pも投球後すぐにバント処理の動き',
      '3Bはサードライン方向のバントをカバー',
      'SSは3塁ランナー暴走に備えて3塁後方へ',
      'ホームタッチが第1優先。無理なら1塁でアウト',
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
    description: 'ノーアウト満塁でのバント守備は、スクイズも送りバントも考えられる最も難しい局面。相手の目的は「最低でも1点」なので守備はホームゲッツーを狙いつつ現実的な判断が求められる。\n\nバントが転がったらCまたはPが処理し、ホームへ送球してタッチアウト→1塁転送でゲッツーを狙う。ただし送球が乱れると大量失点につながるため、無理にホームを刺しにいくより1塁でアウトを確実に取る判断も必要。試合状況（点差・イニング）に応じて守り方を変えることが重要。',
    keyPoints: [
      'Cがバントを処理してホームタッチ→1塁転送でゲッツー狙い',
      'PはCが取れなかった場合のカバー役として前進',
      '3B・1Bはそれぞれのラインをカバー',
      'SSは3塁、2Bは2塁をカバー',
      '送球が難しい場合は迷わず1塁でアウトを確実に取る',
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
    description: 'サードゴロでのゲッツーは、3Bから2塁（SS）→1塁の2段送球で完成する。3Bはゴロを捕ったらすぐに体を2塁方向に向けてSSへ送球する。\n\nSSは2塁ベースを踏みながら捕球し（または踏んでから捕球し）、素早く体を回して1Bへ転送する。これを「ピボット動作」と呼ぶ。走者との接触を避けながらもコンパクトに素早く送球することがポイント。3Bとの距離が長いため、3Bが素早くコントロールよく投げることが成功の鍵。',
    keyPoints: [
      '3Bがゴロを捕ったらすぐ体を2塁へ向けてSSへ送球',
      'SSは2塁ベースを踏みながらピボット動作で1塁へ転送',
      '2Bは右方向（1塁後方）へ移動してカバー',
      '3Bからの距離が長いので素早いコントロール送球が重要',
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
    description: 'ショートゴロのゲッツーは、SSが捕球した後に2Bへ送り、2Bが2塁ベースでアウトにしてから1塁へ転送する流れ。SSから2塁への距離が比較的短いため、時間があればきれいなゲッツーを狙いやすい。\n\n2Bはあらかじめ2塁ベース寄りに動いてカバーに備える。2塁でアウトにしたら走者との衝突を避けつつ素早く1塁へ転送する（ピボット動作）。SSは捕球後に立ち止まらず、流れるような動きで2Bへ送球することが大切。',
    keyPoints: [
      'SSが捕球後、すぐ体を2塁方向へ向けて2Bへ送球',
      '2Bはあらかじめ2塁寄りに移動して待機',
      '2Bが2塁ベースを踏んで1塁へ転送（ピボット）',
      '3Bは3塁ベースのカバーへ。走者の逆走に備える',
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
    description: 'セカンドゴロのゲッツーは、2Bが捕球してSSへ送り、SSが2塁ベースを踏んで1塁へ転送する流れ。2BとSSのどちらが2塁ベースをカバーするかは事前に決めておく必要がある。\n\n2Bの位置から2塁ベースまで距離があるため、SSが素早く2塁ベースに入ることが重要。2Bは捕球後すぐに体を左（2塁方向）へ回転させてSSへ送球する。走者が2塁へ向かってくるため、SSは走者のスライディングをかわしながらすばやく1塁へ転送する。「素早さ」と「安全」のバランスが求められる。',
    keyPoints: [
      '2BはSSへ素早く送球。捕球後すぐ体を左へ回転',
      'SSは2塁ベースカバーへ動いてから捕球',
      'SSが2塁を踏んだらすぐ1塁へ転送（ピボット）',
      '3Bは3塁カバーへ。走者が戻ることもある',
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
    description: 'ファーストゴロのゲッツーは、1Bが前進して捕球しSSへ送球、SSが2塁でアウトにして1塁へ転送する流れ。1Bが前進するため、1塁ベースが空いてしまうのが最大のポイント。\n\nPが投球後すぐに1塁ベースカバーへ走ることが絶対に必要。Pが間に合わない場合は2Bがカバーするが、基本はPが走る。1Bは送球後も素早く1塁へ戻れることもあるが、Pに任せた方が確実。SSと1B（またはPの1塁）の連携と声がけが特に大切なゲッツーパターン。',
    keyPoints: [
      '1Bがゴロを捕球後、素早くSSへ送球',
      'SSは2塁ベースを踏んでから1塁（P）へ転送',
      'Pは投球後すぐに1塁ベースカバーへダッシュ（最重要）',
      '1Bが間に合う場合もあるが基本はPカバー',
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
    description: 'ピッチャーゴロでのゲッツーは、Pが捕球してSSへ送球し、SSが2塁でアウトにしてから1塁へ転送する流れ。Pはマウンド付近からの送球になるため、比較的距離が短く送球しやすい。\n\nPは捕球後「2塁！2塁！」と声でSSに呼びかけながらすばやく送球する。Pがゴロを処理した後は1塁カバーに走れないため、2Bが1塁後方へ動いてカバーに備える。状況によって1Bに直接送球してゲッツーを狙うこともある（P→1B→2B）が、難易度は上がる。',
    keyPoints: [
      'Pが捕球後「2塁！」と声を出しながらSSへ送球',
      'SSは2塁ベースを踏んでから1塁へ転送',
      '2Bは1塁後方へ動いてカバー（Pは1塁に行けない）',
      '3Bは3塁ベースをカバー',
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
    description: '1アウト3塁で同点・逆転がかかった大事な場面に使う守備隊形。内野手4人全員がホームプレート寄りに前進し、内野ゴロをホームで処理してタッチアウトを狙う。\n\n最大のリスクは「内野の間を抜けると長打になる」こと。通常守備より内野が前に出るため、強い打球や打ち取れなかった打球が外野まで転がると長打・本塁打になる可能性が上がる。そのためPは「ゴロを打たせる」ように配球を組み立て、外野は少し前進して深い打球に備える。',
    keyPoints: [
      '内野4人が全員ホーム寄りに前進して「前進守備隊形」を形成',
      '内野ゴロが来たら迷わずホームへ送球してタッチアウト',
      '強い打球は間を抜ける可能性があるので判断が重要',
      '外野は通常位置か少し前進して深い打球に備える',
      '2アウトなら普通はこの守備はしない（アウトを取れば3アウト）',
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
    description: '完全に前進するのではなく「ホームへ投げられるが内野の間を抜けにくい」絶妙な位置取りが「中間守備」。前進守備と通常守備の中間地点に構え、強いゴロが来ればホームへ投げてタッチアウトを狙う。\n\n前進守備との違いは「リスクの度合い」。前進守備は内野の間を抜けると長打になるリスクがあるが、中間守備なら抜けても単打で止まることが多い。点差に余裕があるときや、1点は仕方ないが2点以上は防ぎたい場面などで使う「バランスの取れた守備隊形」。',
    keyPoints: [
      '通常守備よりやや前、前進守備より後ろの位置',
      '強いゴロならホームへ投げてタッチアウトを狙える',
      '抜けても単打止まりなので内野の間は比較的守れる',
      '点差・イニング・打者の傾向を見て前進か中間かを判断',
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
    description: '強い左打者が「引っ張り（ライト方向）」に打球を集中させる傾向があるとき、内野をライト方向にまとめてずらす守備シフト。打球データに基づいて「打ちそうなコース」に守備を集中させる考え方。\n\nMLBで爆発的に広まり、NPBでも採用するチームが増えている。3B（サード）がSSの定位置付近まで移動するのが特徴的。ただしレフト線や左中間が大きく空くため、相手が「逆方向」に打てるバッターの場合は逆に大きなヒットを許してしまうリスクもある。',
    keyPoints: [
      '3BがSSの位置付近まで右に移動',
      'SS・2Bもさらに右（ライト方向）へシフト',
      '1Bはファウルゾーン寄りに移動',
      '左中間・レフト線方向が大きく空くリスクあり',
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
    description: 'レフト前ヒットで2塁走者がホームへ突入してくる場面。外野から直接ホームへ投げると距離が長くコントロールが難しいため、SSが「中継（カットマン）」として間に入る。\n\nSSはLFとホームの中間・直線上の位置に素早く走り込む。LFはSSに向けて素早く低い送球を届ける。3BはSSへの送球ラインに立ち「カット（途中でボールを受け取り別の塁へ送球）」するか「通す（そのままホームへ）」かを判断・指示する。2Bは空いた2塁ベースをカバーする。',
    keyPoints: [
      'SSがLFとホームを結ぶ直線上の「中継位置」へ走る',
      'LFはSSへ素早く低い送球（ノーバウンドか1バウンド）',
      '3BはSSへの送球ライン上に立ってカット判断・指示',
      '2BはSSが離れた後の2塁ベースをカバー',
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
    description: 'ライト前ヒットで2塁走者がホームへ突入してくる場面。RFからホームまでの距離は長く直接送球は難しいため、2Bが「中継（カットマン）」として間に入る。\n\n2BはRFとホームを結ぶ直線上の浅いライト方向へ素早く走る。RFはなるべく素早く2Bへ低い送球をする。1BはRFからの送球ライン上に立ち「カット」か「通す」かを判断・声で指示する。SSは2Bが離れた後の2塁ベースをカバーする。ライトからの中継はSSではなく2Bが担当することを覚えておく。',
    keyPoints: [
      '2BがRFとホームを結ぶ直線上の「中継位置」へ走る',
      'RFは2Bへ素早く低い送球',
      '1Bは送球ライン上でカット判断・指示（カットマン補助）',
      'SSは2Bが離れた後の2塁ベースをカバー',
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
    description: 'センターへの長打でフェンス際まで転がる場面。1塁走者が一気に3塁・ホームを狙ってくる。CFからホームまでは非常に距離が長いため、SSが第1中継・2Bが第2中継として2段構えで対応する。\n\nSSはセンター方向の浅い位置へ素早く走り込む。2Bはその後方に控えてSSが取り損なった場合の第2中継として準備する。3Bは3塁ベースのカバーへ。CFはとにかく素早くSSへの送球を優先する。状況に応じてSSが3塁で止める判断（カット）をすることもある。',
    keyPoints: [
      'SSがセンター方向の浅い位置へ走って第1中継',
      '2Bがその後方に控えて第2中継（SS失球に備える）',
      '3Bは3塁ベースをカバー',
      'CFは距離が長いので素早くSSへ低い送球を届ける',
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
    description: '1塁走者の2塁盗塁に対して、SSか2Bが2塁ベースカバーに入る。どちらがカバーするかは打者の打席（右・左）で変えるのが一般的。\n\n右打者のときは、打者がCの送球の邪魔になるため「打者の反対側」のSSが2塁に入ることが多い。左打者の場合は逆で2Bがカバーに入る。事前にサインや決めごとでSSと2Bが「どちらが行くか」を確認しておくことが大切。カバーに入らない方はポジションを守り、打球への準備を怠らない。',
    keyPoints: [
      '右打者ならSSが2塁カバー（Cの送球ラインが開く）',
      '左打者なら2Bが2塁カバー',
      'SS・2B間でサインや声がけで事前に確認',
      'カバーしない方はポジションを守って打球に備える',
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
    description: '2塁走者が3塁を盗もうとする場面。2塁から3塁への盗塁は距離が短く、走者が離塁するタイミングを見極めないとCが送球しても間に合わないことも多い。\n\n3Bが3塁ベースカバーに入り、Cが素早く送球する。SSは3B後方に控えてバックアップ。走者が2塁で大きなリードを取り始めたり、ウォームアップで足が速そうと判断した場合は早めに牽制や「ピッチアウト」（わざとボールを外してCが投げやすくする）を使う作戦もある。',
    keyPoints: [
      '3Bが3塁ベースカバーへ素早く動く',
      'Cが捕球後すぐに3塁へ送球',
      'SSは3B後方でバックアップ',
      '走者の離塁・スタートを早めに察知することが重要',
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
    description: '1塁への牽制球は、走者のリードが大きいときや盗塁のサインが出ていると読んだときに使う。Pが突然1塁に素早く送球することで走者を挟んだり、出塁する気を消極的にさせる効果がある。\n\n右投手は軸足を外してから送球するか、セットポジションから素早く振り向いて1塁へ投げる。1Bはあらかじめベース付近に構え、牽制球を受けてすぐタッチできる体勢を取る。2Bは1塁後方のポジションへ動いてオーバースローのカバーに備える。何度も牽制して走者を揺さぶるのも作戦のひとつ。',
    keyPoints: [
      '1Bはベースへ入って牽制を受けてすぐタッチできる体勢',
      '2Bは1塁後方へ動いてカバー（暴投対策）',
      '右投手はセットポジションから素早く振り向いて投げる',
      '何度も牽制して走者を揺さぶる「心理戦」も重要',
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
    description: 'レフトフライでランナー3塁がタッチアップ（フライが捕球された瞬間に走り出す）してホームを狙う場面。LFはフライを捕球した直後にホームへ向かって素早く正確に送球しなければならない。\n\nLFからホームへの送球ラインの途中に3Bが立ち「カット（途中でカットして別の塁へ転送）」か「そのまま通す」かを判断する。ランナーが明らかに余裕でホームに入れそうなら3Bがカットして他の走者を封じる。Cはホームベースの前に構えてタッチアウトを狙う。SSはカバーとして後方に控える。',
    keyPoints: [
      'LFはフライ捕球の瞬間にホームへ送球（助走をつけて勢いよく）',
      '3BはLFとホームの送球ライン上に立ちカット判断・指示',
      'Cはホームベース前に構えてタッチアウトを狙う',
      '走者がセーフと判断したら3Bがカットして他塁へ転送',
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
    description: 'ライトフライでランナー2塁がタッチアップして3塁を狙う場面。RFから3塁は距離が長い（ほぼ対角線）ため、2Bが中継として間に入り正確にボールを3塁へ届ける。\n\n2BはRFと3塁を結ぶ直線上の浅いライト方向へ走り中継に入る。SSは3Bベースカバーへ移動し、3Bは後方のバックアップへ。RFはなるべく早く2Bへ送球し、2Bはそのまま3塁へ転送するか「カット」して他の対応をとるか判断する。タッチアップを刺すのは難しいが、2塁走者の進塁を1塁に止める場合には有効。',
    keyPoints: [
      '2BがRFと3塁を結ぶ直線上の中継位置へ走る',
      'RFは捕球後すぐ2Bへ送球',
      'SSは3塁ベースカバーへ移動',
      '2Bがカットして走者を挟む判断をすることもある',
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
    description: 'センターフライで3塁走者がタッチアップしてホームに突入する「犠牲フライ」の場面。CFからホームまでは直線距離が長く、ノーバウンドでは届かないことも多い。\n\nCFが捕球後すぐホームへ向けて送球する。SSがセンターとホームを結ぶ中間点に中継として入り、CFの送球を受けてホームへ転送する。3Bはその手前のカット位置で「通す」か「カット」かを判断・指示する。Cはホームベースで構えてランナーをタッグアウトに備える。犠牲フライを諦めてアウトカウントを増やすことを優先することもある。',
    keyPoints: [
      'CFはフライ捕球後すぐホームへ送球',
      'SSがセンター方向の浅い位置で中継に入る',
      '3Bはカット位置に立ち「通す」か「カット」か指示',
      'Cはホームベースで構えてタッチアウトを狙う',
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
