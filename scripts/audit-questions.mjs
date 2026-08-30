#!/usr/bin/env node
/**
 * 出題データの偏りを測る監査スクリプト。
 *
 * 問題は「正解が分かる」ことではなく「中身を読まなくても当たってしまう」こと。
 * 以下の抜け道が広がっていないかを数字で見張る。
 *
 *   1. 正解インデックスの偏り  … 「迷ったら2番目」で当たる
 *   2. 選択肢の長さの偏り      … 「一番長いのを選ぶ」で当たる
 *
 * 1 は出題時のシャッフル（src/utils/questionPrep.js）で解消済みなので、
 * ここではデータそのものの状態を参考値として出す。
 * 2 はシャッフルでは消えないデータ自身の欠陥なので、こちらを閾値で守る。
 *
 * 使い方:  npm run audit:questions
 *          npm run audit:questions -- --list      閾値超えの問題を一覧表示
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUESTION_DIR = path.join(ROOT, 'src/data/questions');

/** 「一番長い選択肢を選ぶ」戦略の期待正答率の上限（％）。偶然なら25%。 */
const MAX_LONGEST_STRATEGY_RATE = 45;
/** 正解が2位より何文字も長い問題の許容件数。 */
const GAP_THRESHOLD = 10;
const MAX_GAP_OFFENDERS = 5;

async function loadQuestions() {
  const questions = [];
  for (const file of fs.readdirSync(QUESTION_DIR).sort()) {
    if (!file.endsWith('.js')) continue;
    const mod = await import(pathToFileURL(path.join(QUESTION_DIR, file)).href);
    for (const value of Object.values(mod)) {
      if (Array.isArray(value)) questions.push(...value);
    }
  }
  return questions;
}

/** 正解の長さ − 誤答の最大長。正なら「正解がいちばん長い」。 */
function lengthGap(q) {
  const lens = q.choices.map((c) => c.length);
  const others = lens.filter((_, i) => i !== q.correct);
  return lens[q.correct] - Math.max(...others);
}

/** 一番長い選択肢を選び続けたときの期待正答率。同点は等分して数える。 */
function longestStrategyRate(questions) {
  let expected = 0;
  for (const q of questions) {
    const lens = q.choices.map((c) => c.length);
    const max = Math.max(...lens);
    const tied = lens.filter((l) => l === max).length;
    if (lens[q.correct] === max) expected += 1 / tied;
  }
  return (expected / questions.length) * 100;
}

function pct(n, total) {
  return `${((n / total) * 100).toFixed(1)}%`;
}

const questions = await loadQuestions();
const total = questions.length;
const showList = process.argv.includes('--list');

console.log(`\n出題データ監査  —  ${total}問\n${'='.repeat(46)}`);

/* ── 1. 正解インデックスの偏り（参考値） ── */
const indexDist = {};
for (const q of questions) indexDist[q.correct] = (indexDist[q.correct] ?? 0) + 1;
const maxIndexShare = Math.max(...Object.values(indexDist)) / total * 100;
console.log('\n■ 正解インデックスの分布（データそのもの / 参考値）');
for (const [i, n] of Object.entries(indexDist).sort()) {
  console.log(`    [${i}] ${String(n).padStart(4)}問  ${pct(n, total)}`);
}
console.log(`    最大シェア ${maxIndexShare.toFixed(1)}%`);
console.log('    ※ 出題時にシャッフルするため、この偏りは実プレーには出ない');

/* ── 2. 選択肢の長さの偏り（本命） ── */
const rate = longestStrategyRate(questions);
const isLongest = questions.filter((q) => lengthGap(q) > 0).length;
const offenders = questions
  .filter((q) => lengthGap(q) >= GAP_THRESHOLD)
  .sort((a, b) => lengthGap(b) - lengthGap(a));

console.log('\n■ 選択肢の長さの偏り（シャッフルでは消えない）');
console.log(`    正解がいちばん長い問題        ${String(isLongest).padStart(4)}問  ${pct(isLongest, total)}`);
console.log(`    「一番長いのを選ぶ」期待正答率  ${rate.toFixed(1)}%  （偶然なら25%・上限${MAX_LONGEST_STRATEGY_RATE}%）`);
console.log(`    正解が2位より${GAP_THRESHOLD}文字以上長い  ${String(offenders.length).padStart(4)}問  （上限${MAX_GAP_OFFENDERS}問）`);

if (showList && offenders.length > 0) {
  console.log('\n    -- 閾値超えの問題 --');
  for (const q of offenders) {
    console.log(`\n    ${q.id}  gap=${lengthGap(q)}`);
    q.choices.forEach((c, i) => {
      console.log(`      ${i === q.correct ? '★' : ' '} (${String(c.length).padStart(3)}) ${c}`);
    });
  }
}

/* ── 判定 ── */
const failures = [];
if (rate > MAX_LONGEST_STRATEGY_RATE) {
  failures.push(`「一番長いのを選ぶ」期待正答率が ${rate.toFixed(1)}%（上限 ${MAX_LONGEST_STRATEGY_RATE}%）`);
}
if (offenders.length > MAX_GAP_OFFENDERS) {
  failures.push(`正解が2位より${GAP_THRESHOLD}文字以上長い問題が ${offenders.length}問（上限 ${MAX_GAP_OFFENDERS}問）`);
}

console.log(`\n${'='.repeat(46)}`);
if (failures.length > 0) {
  console.log('✖ 監査に失敗しました');
  for (const f of failures) console.log(`  - ${f}`);
  console.log('\n  --list を付けると対象の問題を一覧できます。');
  console.log('  誤答を具体的にして長さをそろえるか、正解から説明を解説側へ移してください。\n');
  process.exit(1);
}
console.log('✓ 監査に合格しました\n');
