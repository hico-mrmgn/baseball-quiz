import { infieldScenarios } from './infield';
import { outfieldScenarios } from './outfieldPlay';
import { offenseScenarios } from './offense';

export const scenarios = [
  ...infieldScenarios,
  ...outfieldScenarios,
  ...offenseScenarios,
];

/** レベル表示（学童向けの言葉づかいのまま、判断の難度だけを上げていく） */
export const SCENARIO_LEVELS = {
  high:   { label: 'ハイレベル',   emoji: '⭐',  color: 'bg-orange-100 text-orange-700' },
  select: { label: 'セレクション級', emoji: '🔥', color: 'bg-red-100 text-red-700' },
};

/** 出題ジャンル。テーマ（守備位置）とは別に、判断の種類でまとめたもの。 */
export const SCENARIO_TRACKS = [
  {
    id: 'all',
    name: 'ぜんぶ',
    emoji: '🎯',
    description: '守備も攻撃も混ぜて、実戦のまま出題する',
    filter: () => true,
  },
  {
    id: 'defense',
    name: '守備の判断',
    emoji: '🧤',
    description: '内野・外野の送球先とカバーリング',
    filter: (s) => ['third', 'second', 'short', 'first', 'pitcher', 'catcher', 'outfield'].includes(s.theme),
  },
  {
    id: 'offense',
    name: '攻撃の判断',
    emoji: '🏏',
    description: '走塁・打席の狙い・三塁コーチャー',
    filter: (s) => ['baserun', 'batting', 'coach'].includes(s.theme),
  },
  {
    id: 'score',
    name: '点差で変わる判断',
    emoji: '📊',
    description: '点差とイニングで答えがひっくり返る問題だけ',
    filter: (s) => (s.tags ?? []).includes('点差判断'),
  },
  {
    id: 'prepitch',
    name: '投球前の準備',
    emoji: '⏱️',
    description: '打球が飛ぶ前に決めておくこと',
    filter: (s) => s.phase === 'pre',
  },
];

/**
 * 双子問題（同じ打球・違う状況）のペアをまとめる。
 *
 * 絞り込みで片方だけが残ると「さっきと同じ打球。ただし…」が成立しないので、
 * 相方は必ず全問題リストから引っぱってきて組にする。
 */
export function pairsOf(list) {
  const seenPairs = new Set();
  const groups = [];
  for (const s of list) {
    if (!s.pairId) {
      groups.push([s]);
      continue;
    }
    if (seenPairs.has(s.pairId)) continue;
    seenPairs.add(s.pairId);
    const group = scenarios
      .filter((x) => x.pairId === s.pairId)
      // ペアは a → b の順を保つ（「さっきと同じ打球」が成立するように）
      .sort((x, y) => (x.pairRole ?? '').localeCompare(y.pairRole ?? ''));
    groups.push(group);
  }
  return groups;
}

/**
 * 出題リストを作る。
 * 双子問題は必ず連続で出す（バラバラに出すと「さっきと答えが違う」が成立しない）。
 * ペアの塊ごとシャッフルするので、ペアの中身の順番は崩れない。
 */
export function buildScenarioSet(trackId = 'all', count = 10, rand = Math.random) {
  const track = SCENARIO_TRACKS.find((t) => t.id === trackId) ?? SCENARIO_TRACKS[0];
  const pool = scenarios.filter(track.filter);
  const groups = pairsOf(pool);

  for (let i = groups.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [groups[i], groups[j]] = [groups[j], groups[i]];
  }

  const out = [];
  for (const group of groups) {
    // ペアは途中で切らない。入りきらないなら次の塊を探す。
    if (out.length + group.length > count) continue;
    out.push(...group);
    if (out.length >= count) break;
  }
  return out;
}

export function scenarioCount(trackId = 'all') {
  const track = SCENARIO_TRACKS.find((t) => t.id === trackId) ?? SCENARIO_TRACKS[0];
  return scenarios.filter(track.filter).length;
}
