/**
 * 自主トレのドリル記録に使う種目。6種目固定で、追加・編集の機能は持たない。
 *
 * この画面は成績表ではなく記録帳。数字に評価がつくと、フォームを崩してでも
 * 本数を稼ぐ方向に働くので、アプリは「数える」だけを提供する。
 * 制約文（constraint）はこのドリルの本体なので、画面では常時表示する。
 *
 * @typedef {'suburi'|'tee'|'shadow'|'kabeate'|'nawatobi'|'stretch'} DrillId
 * @typedef {'ratio10'|'count'|'done'} DrillInput
 *   ratio10 … 0〜10。+1 / −1。10で上限
 *   count   … 0以上。+1 / −1。上限なし
 *   done    … やった／やってない のトグル（値は 0 / 1）
 *
 * @typedef {object} DrillDef
 * @property {DrillId} id
 * @property {string} label       表示名
 * @property {string} constraint  画面に出す制約文（空文字可）
 * @property {string} unitLabel   「止まれた本数」など
 * @property {DrillInput} input
 * @property {number} [max]       ratio10 は 10
 */

/** @type {DrillDef[]} 画面に並べる順番のとおり */
export const DRILLS = [
  {
    id: 'suburi',
    label: '素振り',
    constraint: 'テープを踏みこえない／振り切って前足一本で3秒止まる',
    unitLabel: '止まれた本数',
    input: 'ratio10',
    max: 10,
  },
  {
    id: 'tee',
    label: 'ティー',
    constraint: 'テープを踏みこえない／ネットの帯をねらう',
    unitLabel: '帯に入った本数',
    input: 'ratio10',
    max: 10,
  },
  {
    id: 'shadow',
    label: 'シャドーピッチング',
    constraint: 'グラブのタオルを落とさない／フィニッシュで3秒止まる',
    unitLabel: '止まれた球数',
    input: 'ratio10',
    max: 10,
  },
  {
    id: 'kabeate',
    label: '壁当て',
    constraint: '捕ってから2歩以内で投げる',
    unitLabel: '30秒で何回',
    input: 'count',
  },
  {
    id: 'nawatobi',
    label: '二重跳び',
    constraint: '',
    unitLabel: '連続で何回',
    input: 'count',
  },
  {
    id: 'stretch',
    label: 'ストレッチ',
    constraint: '最後にひとつ、いちばん伸びた形のまま力を入れる',
    unitLabel: '',
    input: 'done',
  },
];

/**
 * 種目の入力形式に合わせて値を範囲内に収める。
 * ratio10 は 0〜max、count は 0以上、done は 0 / 1。
 */
export function clampDrillValue(def, value) {
  const n = Number.isFinite(value) ? Math.trunc(value) : 0;
  if (def.input === 'done') return n > 0 ? 1 : 0;
  const lower = Math.max(0, n);
  if (def.input === 'ratio10') return Math.min(def.max ?? 10, lower);
  return lower;
}
