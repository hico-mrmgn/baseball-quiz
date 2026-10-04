// 軸・課題・処方・ドリル・相手チーム。画面はここを読むだけにして、言葉を一か所に集める。

/** レーダーの6軸。判断の種類そのもの。 */
export const AXES = [
  { id: 'pre',    name: '先に決める',   hint: '投げる前に「来たら」「来なかったら」を両方決められたか' },
  { id: 'score',  name: '点差で変える', hint: '点差とアウトで、いつもの型を変えられたか' },
  { id: 'target', name: '投げる先',     hint: 'どのアウトを取りにいくか' },
  { id: 'runner', name: '走者を読む',   hint: '走者として、走者を相手にして' },
  { id: 'cover',  name: '動いて埋める', hint: 'カバー・バックアップ・ベースに入る' },
  { id: 'risk',   name: '危険を減らす', hint: '無理をしない、先の塁をやらない' },
];

/** 能力レーダーの5軸。試合の成績・実測値・アプリでの練習から決まる。 */
export const ABILITIES = [
  { id: 'bat', name: '打撃力', hint: '出塁・ヒット・三振の少なさ・打球速度' },
  { id: 'pit', name: '投球力', hint: '四球の少なさ・三振・失点・球数' },
  { id: 'fld', name: '守備力', hint: '捕ってから投げるまで・肩・失策・守りの判断' },
  { id: 'run', name: '走塁力', hint: '足の速さ・盗塁・走塁の判断' },
  { id: 'iq',  name: '判断力', hint: '場面の最善手率と知識クイズ' },
];
/**
 * 能力の物差し。左が 0点、右が 100点。100点は「ジュニア選考（小6）で通用する目安」に置いている。
 * 公的な統計と照らせるのは 50m と遠投だけ。ほかは仮の値なので、試合を重ねながら直す前提。
 */
export const SCALE = {
  obp: [0.15, 0.55], avg: [0.05, 0.4], contact: [0.55, 0.95], exit: [60, 100],
  bbInn: [1.8, 0.3], kInn: [0.3, 1.6], rInn: [2.2, 0.3], pInn: [30, 15],
  release: [1.4, 0.7], throw: [20, 50], err: [1.0, 0], run50: [10.4, 8.0], base: [5.6, 4.0], sb: [0, 1.0],
};
/** 相手の学年で、ヒットと四球の重みを変える。上の学年から出た1本は重い。 */
export const GRADE_WEIGHT = { 6: 1.3, 5: 1.0, 4: 0.8 };
export const RANK_WORD = { S: 'すばらしい', A: 'いい内容', B: '合格点', C: 'もう一歩', D: '次に取り返す' };

export const RANKS = [
  { id: 'S', min: 85 }, { id: 'A', min: 70 }, { id: 'B', min: 55 }, { id: 'C', min: 40 }, { id: 'D', min: 0 },
];
/** ランクを確定させるのに要るプレー数。それより少ないあいだは「仮」。 */
export const RANK_MIN_PLAYS = 12;
export const WINDOW = 20;

/** 自主練ドリル。回数と、計測型だけ数値を1つ。出来ばえは採点しない。 */
export const DRILLS = [
  { ab: 'fld', id: 'onehop',   name: 'ワンバンの落とし所',   how: '一塁ベースの3〜4m手前に目印。逆シングルの体勢からそこへ落とす。', unit: '本', measure: { label: '目印に落ちた数', unit: '本' } },
  { ab: 'fld', id: 'release',  name: '持ちかえ→ステップ→投げ', how: '捕ってから手を離れるまでを計る。10本。', unit: '本', measure: { label: 'いちばん速いタイム', unit: '秒', step: 0.01 } },
  { ab: 'pit', id: 'setlow',   name: 'セットから低めへ',     how: 'ふつうの足上げと小さい足上げで5球ずつ。', unit: '球', measure: { label: '低めに行った数', unit: '球' } },
  { ab: 'iq', id: 'callout',  name: '投げる前に声に出す',   how: '「アウトいくつ、来たらどこ、来なかったらどこ」を1球ごとに言う。', unit: '回' },
  { ab: 'fld', id: 'bunt',     name: 'バントを捕る・戻る',   how: '転がる場所を変えてもらい、捕る／戻るを切りかえる。', unit: '本' },
  { ab: 'run', id: 'steal',    name: '足の向きを見てスタート', how: 'セットから「ホームへ」「一塁へけん制」を混ぜてもらう。', unit: '本' },
  { ab: 'fld', id: 'flycharge',name: '後ろから前へ出て捕る', how: '「2アウト！」「1アウト三塁！」と声をかけてもらい、捕り方を変える。', unit: '本', measure: { label: '捕ってから投げるまで', unit: '秒', step: 0.01 } },
  { ab: 'iq', id: 'voice',    name: '外野から声を出す',     how: '1球ごとに、内野へ状況を声で伝える。', unit: '回' },
  { ab: 'bat', id: 'swing',    name: '素振り',               how: 'テープを踏みこえない。振り切って、前足一本で3秒止まる。', unit: '回', measure: { label: '10本のうち止まれた数', unit: '本' } },
  { ab: 'bat', id: 'tee',      name: 'ティー',               how: 'テープを踏みこえない。ネットの帯をねらう。', unit: '本', measure: { label: '10本のうち帯に入った数', unit: '本' } },
  { ab: 'pit', id: 'shadow',   name: 'シャドーピッチング',   how: 'グラブのタオルを落とさない。フィニッシュで3秒止まる。', unit: '球', measure: { label: '10球のうち止まれた数', unit: '球' } },
  { ab: 'fld', id: 'wall',     name: 'かべ当て',             how: '捕ってから2歩以内で投げる。', unit: '本', measure: { label: '30秒で何回', unit: '回' } },
  { ab: 'run', id: 'rope',     name: '二重跳び',             how: 'つづけて何回とべるか。', unit: '回', measure: { label: '連続で何回', unit: '回' } },
  { id: 'stretch',  name: 'ストレッチ',           how: '最後にひとつ、いちばん伸びた形のまま力を入れる。', unit: '回' },
];

/** 試合で出た課題 → 取り組む場面とドリルの組。同時に持つのは2つまで。 */
export const ISSUES = [
  { metric: 'err', id: 'onehop',   name: 'ワンバンの落とし所',     axis: 'risk',   scenes: ['real-0913-backhand'],                         drills: ['onehop'] },
  { metric: 'release', id: 'release',  name: '捕ってから投げるまで',   axis: null,     scenes: [],                                             drills: ['release', 'wall'] },
  { metric: 'bbinn', id: 'runneron', name: '走者を背負った投球',     axis: 'runner', scenes: ['real-0913-2out', 'real-0913-pb'],             drills: ['setlow'] },
  { metric: 'err', id: 'precheck', name: '投げる前の確認',         axis: 'pre',    scenes: ['real-0921-loaded', 'bunt-12', 'p-cover-first'], drills: ['callout'] },
  { metric: 'err', id: 'buntback', name: 'バント処理と戻り',       axis: 'cover',  scenes: ['real-0913-bunt', 'bunt-12', '2b-bunt'],       drills: ['bunt'] },
  { metric: 'sb', id: 'steal',    name: '盗塁スタートの見分け',   axis: 'runner', scenes: ['real-0905-steal'],                            drills: ['steal'] },
  { id: 'ofthrow',  name: '外野からの返球',         axis: 'cover',  scenes: ['real-0926-fly-a', 'real-0926-fly-b', 'cf-tie', 'cf-lead'], drills: ['flycharge'] },
  { id: 'voice',    name: '声で味方を動かす',       axis: 'pre',    scenes: ['rf-backup', 'real-0926-fly-a'],               drills: ['voice'] },
];

/** 今日の試合の相手。日付で1つ決まる。 */
export const OPPONENTS = ['グランツ', '小樽中央', '銭函', '山麓', '古平', '南後志', '本郷', '長万部', '函館本通'];

export const GAME_KINDS = [
  { id: 'regular-official',  name: 'レギュラー公式戦' },
  { id: 'regular-practice',  name: 'レギュラー練習試合' },
  { id: 'shinjin-official',  name: '新人公式戦' },
  { id: 'shinjin-practice',  name: '新人練習試合' },
  { id: 'rookie-practice',   name: 'ルーキー練習試合' },
];
export const GRADES = [
  { id: '6', name: '6年生主体' }, { id: '5', name: '5年生主体' }, { id: '4', name: '4年生以下' },
];

/** 体のカード。Tomo が実測値を入れた日にだけ点がふえる。 */
export const MEASURES = [
  { id: 'release', name: '捕ってから投げるまで', unit: '秒', better: 'low',  target: 0.79, targetLabel: '0.7秒台', step: 0.01 },
  { id: 'throw',   name: '遠投',                 unit: 'm',  better: 'high', target: 45,   targetLabel: '45m',     step: 1 },
  { id: 'run50',   name: '50m走',                unit: '秒', better: 'low',  target: 8.69, targetLabel: '8.6秒台', step: 0.01 },
  { id: 'base',    name: '塁間',                 unit: '秒', better: 'low',  target: null, step: 0.01 },
  { id: 'exit',    name: '打球速度',             unit: 'km/h', better: 'high', target: null, step: 1 },
  { id: 'height',  name: '身長',                 unit: 'cm', better: 'high', target: null, step: 0.1 },
  { id: 'weight',  name: '体重',                 unit: 'kg', better: 'high', target: null, step: 0.1 },
];
