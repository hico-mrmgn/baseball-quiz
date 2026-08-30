/**
 * 実戦シナリオ（構造化シチュエーション）まわりの共通ロジック。
 *
 * 従来の問題は situation が「1アウト、ランナー1塁。サードゴロ。」という
 * 1本の文字列だった。それだと点差もイニングもカウントも表現できず、
 * 「この場面の最善手」が1つに固定されてしまう。
 * 実戦シナリオでは situation を構造化して持ち、同じ打球でも
 * 点差・イニング・走者の脚で答えが変わることを扱えるようにする。
 *
 * sit = {
 *   inning: 7,                       // 回
 *   half: 'top' | 'bottom',          // 表 / 裏
 *   side: 'defense' | 'offense',     // 自分たちが守備か攻撃か
 *   score: { us: 2, them: 1 },       // 自チーム / 相手チーム
 *   outs: 0 | 1 | 2,
 *   runners: { first, second, third }, // null | 'fast' | 'normal' | 'slow'
 *   count: { b: 0-3, s: 0-2 },
 *   batter: { hand: 'R'|'L', order: 1-9, trait: '長打力' },
 *   defense: '前進守備',              // 守備隊形（任意）
 *   play: 'サード正面への強いゴロ',    // 打球（投球前の問題では null）
 *   ballArea: 'third',               // フィールド図のボール位置キー
 *   note: '相手ベンチはここまで一度もバントを使っていない',
 * }
 */

/* ── 選択肢の配点 ──
 * 実際の野球に「正解が1つだけ」の場面はまれ。最善手・許容・凡プレー・
 * 致命傷の4段階で採点することで、「間違ってはいないが物足りない判断」と
 * 「試合を壊す判断」を区別する。 */
export const CHOICE_SCORES = [3, 1, 0, -1];

export const SCORE_TIERS = {
  3:  { key: 'best',    label: '最善手',       emoji: '🎯', color: 'green',  message: 'ナイス判断！これが最善手' },
  1:  { key: 'ok',      label: 'まあOK',       emoji: '🙂', color: 'sky',    message: '悪くない。でももう一段いい手がある' },
  0:  { key: 'poor',    label: 'もったいない', emoji: '😕', color: 'amber',  message: 'アウトも取れず、状況も良くならない' },
  '-1': { key: 'fatal', label: '試合が壊れる', emoji: '💥', color: 'red',    message: 'これは失点に直結する。絶対に避けたい' },
};

export function tierOf(score) {
  return SCORE_TIERS[score] ?? SCORE_TIERS[0];
}

export const MAX_CHOICE_SCORE = 3;

/* ── 表示用の整形 ── */

export function formatInning(sit) {
  if (!sit?.inning) return '';
  return `${sit.inning}回${sit.half === 'top' ? '表' : '裏'}`;
}

/** 点差を「守備側から見た意味」に翻訳する。数字より先に意味を読ませたい。 */
export function formatScoreContext(sit) {
  if (!sit?.score) return null;
  const diff = sit.score.us - sit.score.them;
  if (diff === 0) return { text: '同点', tone: 'even' };
  if (diff > 0)   return { text: `${diff}点リード`, tone: 'lead' };
  return { text: `${-diff}点ビハインド`, tone: 'behind' };
}

export const RUNNER_SPEED = {
  fast:   { label: '足が速い', short: '速', color: '#dc2626' },
  normal: { label: 'ふつう',   short: '',   color: '#f59e0b' },
  slow:   { label: '足が遅い', short: '遅', color: '#64748b' },
};

export function runnerList(sit) {
  const out = [];
  if (sit?.runners?.first)  out.push({ base: '1塁', speed: sit.runners.first });
  if (sit?.runners?.second) out.push({ base: '2塁', speed: sit.runners.second });
  if (sit?.runners?.third)  out.push({ base: '3塁', speed: sit.runners.third });
  return out;
}

export function formatRunners(sit) {
  const list = runnerList(sit);
  if (list.length === 0) return 'ランナーなし';
  return `ランナー${list.map((r) => r.base).join('・')}`;
}

export function formatOuts(outs) {
  return outs === 0 ? 'ノーアウト' : `${outs}アウト`;
}

export function formatBatter(batter) {
  if (!batter) return null;
  const hand = batter.hand === 'L' ? '左打者' : batter.hand === 'R' ? '右打者' : null;
  const parts = [];
  if (batter.order) parts.push(`${batter.order}番`);
  if (hand) parts.push(hand);
  if (batter.trait) parts.push(batter.trait);
  return parts.join('・');
}

/** 得点圏（2塁・3塁）に走者がいるか。前進守備の判断とセットで使う。 */
export function inScoringPosition(sit) {
  return Boolean(sit?.runners?.second || sit?.runners?.third);
}

/* ── 選択肢のシャッフル ──
 * 旧データは正解が選択肢1番目に63%、一番長い選択肢が正解に74%集中していて、
 * 中身を読まなくても当たってしまう状態だった。出題のたびに順番を混ぜて、
 * 「並び順のクセ」で解けないようにする。 */
export function shuffleChoices(choices, rand = Math.random) {
  const arr = choices.map((c, i) => ({ ...c, originalIndex: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 出題直前に、シャッフル済みの選択肢を持つ問題オブジェクトを作る。 */
export function prepareScenario(scenario, rand = Math.random) {
  return { ...scenario, choices: shuffleChoices(scenario.choices, rand) };
}

/* ── 採点 ── */

export function bestChoiceIndex(choices) {
  let best = 0;
  for (let i = 1; i < choices.length; i++) {
    if (choices[i].score > choices[best].score) best = i;
  }
  return best;
}

/**
 * 回答結果を集計する。
 * answers: [{ scenario, choice, elapsedMs, inTime }]
 */
export function summarize(answers) {
  const total = answers.length;
  const gained = answers.reduce((a, x) => a + x.choice.score, 0);
  const possible = total * MAX_CHOICE_SCORE;
  const best  = answers.filter((x) => x.choice.score === 3).length;
  const ok    = answers.filter((x) => x.choice.score === 1).length;
  const poor  = answers.filter((x) => x.choice.score === 0).length;
  const fatal = answers.filter((x) => x.choice.score === -1).length;
  const inTime = answers.filter((x) => x.inTime).length;

  return {
    total,
    gained,
    possible,
    // マイナス点があるので下限を0に丸めてから％にする
    percent: possible > 0 ? Math.round((Math.max(gained, 0) / possible) * 100) : 0,
    bestRate:  total > 0 ? Math.round((best / total) * 100) : 0,
    fatalRate: total > 0 ? Math.round((fatal / total) * 100) : 0,
    inTimeRate: total > 0 ? Math.round((inTime / total) * 100) : 0,
    counts: { best, ok, poor, fatal },
  };
}

/**
 * タグごとの成績を出す。「あなたは"点差による判断の切りかえ"が弱い」と
 * 言えるようにするための集計。問題ID単位の苦手リストより粒度が粗いぶん、
 * 何を練習すればいいかが分かりやすい。
 */
export function tagBreakdown(answers) {
  const map = new Map();
  for (const a of answers) {
    for (const tag of a.scenario.tags ?? []) {
      const cur = map.get(tag) ?? { tag, gained: 0, possible: 0, count: 0 };
      cur.gained += a.choice.score;
      cur.possible += MAX_CHOICE_SCORE;
      cur.count += 1;
      map.set(tag, cur);
    }
  }
  return [...map.values()]
    .map((t) => ({ ...t, percent: Math.round((Math.max(t.gained, 0) / t.possible) * 100) }))
    .sort((a, b) => a.percent - b.percent);
}

/* ── 判断スピード ──
 * 実戦の判断は打球が飛ぶ前におおむね終わっている。読む時間は要るので
 * 時間切れでも回答はできるが、制限内に決めたときだけ「速い判断」として
 * 評価する。焦らせて当てずっぽうを誘発しないための設計。 */
export const DEFAULT_TIME_LIMIT_MS = 20000;

export function timeLimitOf(scenario) {
  return scenario.timeLimitMs ?? DEFAULT_TIME_LIMIT_MS;
}
