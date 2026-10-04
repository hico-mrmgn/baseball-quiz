// MY SEASON（public/season/）が読むデータを、src/data から作る。
//
//   npm run season:data
//
// 元データは src/data のまま。場面・問題・フォーメーションを直したら、これを回して
// public/season/data/ を作り直す（出力もコミットする。MY SEASON はビルドなしで動くため）。

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'public/season/data');
mkdirSync(join(OUT, 'q'), { recursive: true });

/** src/data のファイルは拡張子なしの import を持つので、import 行を外して読む。 */
async function load(rel, prelude = '') {
  const src = prelude + readFileSync(join(root, rel), 'utf8').replace(/^import .*$/gm, '');
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
}

/* ───────── 1. 判断の場面 ───────── */

// すでに「先に動け」用に作り直してある場面は入れない（scenes.js のほうが動きが細かい）
const SKIP = (s) => s.id.startsWith('sc-real-') || s.pairId === 'tw-third-01' || s.pairId === 'tw-outfield-01';

// 自分の立場。テーマだけでは決まらない場面はここで指定する
const ROLE = {
  'sc-outfield-02': 'left', 'sc-outfield-03': 'center', 'sc-outfield-04': 'right',
  'sc-outfield-05a': 'second', 'sc-outfield-05b': 'second', 'sc-outfield-06': 'center', 'sc-outfield-07': 'center',
  'sc-baserun-01a': 'r2', 'sc-baserun-01b': 'r2', 'sc-baserun-02a': 'r1', 'sc-baserun-02b': 'r1',
  'sc-baserun-03a': 'r3', 'sc-baserun-03b': 'r3', 'sc-baserun-04': 'r1',
  'sc-coach-01a': 'coach3', 'sc-coach-01b': 'coach3', 'sc-coach-02': 'coach3', 'sc-coach-03': 'coach1',
};
// 打球を処理する野手。指定がなければ、打球にいちばん近い野手が捕る
const BY = { 'sc-outfield-05a': 'center', 'sc-outfield-05b': 'center', 'sc-first-02a': 'first', 'sc-first-02b': 'first' };
const THEME_ROLE = { batting: 'batter' };
const THEME_NAME = {
  third: 'サード', short: 'ショート', second: 'セカンド', first: 'ファースト', pitcher: 'ピッチャー', catcher: 'キャッチャー',
  outfield: '外野', baserun: '走塁', coach: 'コーチャー', batting: 'バッティング',
};
const AREA = { bunt: 'bunt1', none: null };
const DEFENSE = { '内野は定位置': '定位置', '内野は前進守備': '前進守備' };

// タグ → レーダーの軸
const AXIS = {
  '点差判断': 'score', 'アウトカウント判断': 'score',
  '優先アウトの選択': 'target', 'ゲッツー': 'target', '中継・カットプレー': 'target',
  '走塁判断': 'runner', '走者の脚を読む': 'runner', '盗塁・けん制': 'runner', 'タッチアップ': 'runner',
  'カバーリング': 'cover', 'バックアップ': 'cover', 'バント処理': 'cover',
  'リスク管理': 'risk', '先の塁を止める': 'risk', '守備隊形を読む': 'risk', 'ルールを判断に使う': 'risk',
  '打球の予測': 'cover', '打者の狙い': 'score', 'サインプレー': 'cover',
};
const RUNNER_BASE = { r1: 'first', r2: 'second', r3: 'third' };

function toScene(s) {
  const role = ROLE[s.id] ?? THEME_ROLE[s.theme] ?? s.theme;
  const sit = s.sit;
  const runners = { ...sit.runners };
  if (RUNNER_BASE[role]) runners[RUNNER_BASE[role]] = 'me';
  const pre = s.phase === 'pre' || (s.tags ?? []).includes('投球前の準備');
  const area = sit.ballArea ? (AREA[sit.ballArea] ?? sit.ballArea) : null;
  const axes = [...new Set((s.tags ?? []).map((t) => AXIS[t]).filter(Boolean))];
  return {
    id: s.id.replace(/^sc-/, 'c-'),
    classic: true,
    role,
    side: sit.side === 'offense' ? 'off' : 'def',
    pair: s.pairId ?? undefined,
    pairRole: s.pairRole ?? undefined,
    level: s.level,
    theme: s.theme,
    pre,
    src: `${THEME_NAME[s.theme]}${s.level === 'select' ? '・セレクション級' : ''}`,
    sit: {
      inning: sit.inning, half: sit.half === 'top' ? '表' : '裏',
      us: sit.score?.us ?? null, them: sit.score?.them ?? null,
      outs: sit.outs, runners, defense: DEFENSE[sit.defense] ?? sit.defense ?? '定位置',
    },
    note: sit.note,
    play: sit.play ?? null,
    ball: { q: s.question, opts: s.choices.map((c, i) => ({ id: `o${i}`, l: c.text, s: c.score, fb: c.fb })) },
    outcomes: [{ kind: 'ball', play: sit.play ?? '投げた', area, by: BY[s.id], pitchOnly: !area, steal: /スタート/.test(sit.play ?? '') && !area, fly: /フライ/.test(sit.play ?? ''), w: 1 }],
    key: s.explain.key, why: s.explain.why, drill: s.explain.drill,
    axes: { ball: axes },
  };
}

const scen = [];
for (const f of ['infield', 'outfieldPlay', 'offense', 'battery', 'realGames']) {
  const m = await load(`src/data/scenarios/${f}.js`);
  scen.push(...Object.values(m).flat());
}
const classic = scen.filter((s) => !SKIP(s)).map(toScene);
writeFileSync(join(OUT, 'classic.js'),
  `// scripts/build-season-data.mjs が作るファイル。直すときは src/data/scenarios を直して作り直す。\nexport const CLASSIC = ${JSON.stringify(classic, null, 1)};\n`);

/* ───────── 2. 知識クイズ ───────── */

const themeMeta = {};
const counts = {};
for (const f of readdirSync(join(root, 'src/data/questions')).sort()) {
  const theme = f.replace(/\.js$/, '');
  const m = await load(`src/data/questions/${f}`);
  const qs = Object.values(m).flat();
  counts[theme] = { all: qs.length };
  qs.forEach((q) => { counts[theme][q.difficulty] = (counts[theme][q.difficulty] ?? 0) + 1; });
  writeFileSync(join(OUT, 'q', `${theme}.json`), JSON.stringify(qs.map((q) => ({
    id: q.id, s: q.situation ?? '', q: q.question, c: q.choices, a: q.correct, e: q.explanation, d: q.difficulty,
  }))));
  themeMeta[theme] = { counts: counts[theme] };
}
writeFileSync(join(OUT, 'quiz-index.json'), JSON.stringify(themeMeta));

/* ───────── 3. 守備フォーメーション ───────── */

// 旧アプリの図は MY SEASON の図より 2 だけ上にある（ホーム y=182 と 184）
const DY = 2;
const sh = (p) => ({ x: p.x, y: p.y + DY });
const KIND = { '#ef4444': 'ball', '#3b82f6': 'cover', '#10b981': 'base' };
const fm = await load('src/data/formations.js', 'const FIELDER_POSITIONS = {};');
const formations = {
  cats: fm.formationCategories.map((c) => ({ id: c.id, name: c.name })),
  list: fm.formations.map((f) => ({
    id: f.id, cat: f.categoryId, title: f.title, outs: f.outs,
    runners: [f.runners.first, f.runners.second, f.runners.third].map((x) => (x ? 1 : 0)),
    ball: sh(f.ballPos), desc: f.description, keys: f.keyPoints,
    moves: f.moves.map((m) => ({ p: m.player, to: sh(m.to), k: KIND[m.color] ?? 'cover', role: m.role })),
    throws: (f.throws ?? []).map((t) => ({ from: sh(t.from), to: sh(t.to) })),
  })),
};
writeFileSync(join(OUT, 'formations.json'), JSON.stringify(formations));

console.log(`場面 ${classic.length}（元 ${scen.length}）／問題 ${Object.values(counts).reduce((a, c) => a + c.all, 0)}（${Object.keys(counts).length}テーマ）／フォーメーション ${formations.list.length}`);
