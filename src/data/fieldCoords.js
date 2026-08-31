// フィールド図の基準座標（viewBox 220 x 210）
export const HOME   = { x: 110, y: 182 };
export const FIRST  = { x: 168, y: 126 };
export const SECOND = { x: 110, y: 70 };
export const THIRD  = { x: 52,  y: 126 };
export const MOUND  = { x: 110, y: 136 };

export const FENCE_R = 176; // ホームベース中心のフェンス半径

/**
 * 定位置（9人）。ScenarioField / FieldDiagram / 解説編 が共通で使う。
 *
 * 以前は同じ座標が3か所に写してあり、直すと必ずどこかが取り残された。
 *
 * 位置は実際の守備位置に寄せている。以前は二塁手・遊撃手がベースラインの
 * 真上に立っていて（一二塁間の中点 (139,98) に対し 2B が (138,96)）、
 * 一塁手・三塁手はベースより手前だった。つまり定位置がすでに前進守備の
 * 深さまで来ていて、「前へ出す」余白が残っていなかった。
 * 塁間 = 80.6（ホーム(110,182) → 一塁(168,126)）を1として、
 * コーナーは約1.15、二遊間は約1.30の距離に置いている。
 */
export const FIELDER_POSITIONS = {
  pitcher: { x: 110, y: 136, label: 'P'  },
  catcher: { x: 110, y: 196, label: 'C'  },
  first:   { x: 170, y: 116, label: '1B' },
  second:  { x: 142, y: 83,  label: '2B' },
  short:   { x: 78,  y: 83,  label: 'SS' },
  third:   { x: 50,  y: 116, label: '3B' },
  left:    { x: 36,  y: 44,  label: 'LF' },
  center:  { x: 110, y: 24,  label: 'CF' },
  right:   { x: 184, y: 44,  label: 'RF' },
};

/**
 * 守備隊形によるずらし。
 *
 * y が大きいほどホーム寄りなので、**前に出る＝dy を +**、下がる＝dy を −。
 * 以前はここが逆で、「前進守備」「バントシフト」「定位置より少し前」の
 * 3種類（19場面中14場面）が後ろに下がって描かれていた。解説が
 * 「前進守備は1点もやらないというチームの約束」と書いている横で、
 * 図は逆を描いていたことになる。
 *
 * at を持つものは、ずらしではなく位置そのものを指定する。
 */
export const DEFENSE_SHIFTS = {
  '前進守備':        { first: { dy: 14 }, second: { dy: 16 }, short: { dy: 16 }, third: { dy: 14 } },
  '内野は前進守備':   { first: { dy: 14 }, second: { dy: 16 }, short: { dy: 16 }, third: { dy: 14 } },
  '定位置より少し前': { first: { dy: 6 },  second: { dy: 7 },  short: { dy: 7 },  third: { dy: 6 } },
  'バントシフト':     { first: { dy: 28 }, third: { dy: 28 } },
  'やや後ろ':        { left: { dy: -8 }, center: { dy: -6 }, right: { dy: -8 } },
  '外野は前進':      { left: { dy: 12 }, center: { dy: 10 }, right: { dy: 12 } },
  'ファーストが牽制でベースについている': { first: { at: { x: 166, y: 129 } } },
};

/** 定位置。ずらしを持たないが、図に反映されなくても正しい状態。 */
export const NEUTRAL_FORMATIONS = ['定位置', '内野は定位置'];

/** 隊形名から野手のずらしを引く。 */
export function shiftedPosition(key, pos, defense) {
  const shift = DEFENSE_SHIFTS[defense]?.[key];
  if (!shift) return pos;
  if (shift.at) return { ...pos, ...shift.at };
  return { ...pos, x: pos.x + (shift.dx ?? 0), y: pos.y + (shift.dy ?? 0) };
}

/**
 * 守備位置のキーから描き方を決める。
 * 捕手はしゃがんでミットを構え、投手はプレートを踏む。ほかは野手の構え。
 */
export function poseOf(key) {
  if (key === 'catcher') return 'catcher';
  if (key === 'pitcher') return 'pitcher';
  return 'field';
}
