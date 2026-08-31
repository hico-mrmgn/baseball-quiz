#!/usr/bin/env node
/**
 * 解説と正解が食い違っている問題を機械的に洗い出す。
 *
 * 出題データの誤りは、選択肢の長さの偏り（audit-questions.mjs が見ている）より
 * 学習への害が直接的なので、別の監査として分けている。
 *
 * 検出のしかたは3つ。
 *
 *   1. 選択肢が他の選択肢をラベル（A・B・C）で指している
 *      出題時にシャッフルするため、並び順に依存した選択肢は意味が壊れる。
 *   2. 解説が正解を打ち消している
 *      「フォースではない」と書いてあるのに正解が「フォースアウト」など、
 *      野球でよくある食い違いをパターンで持っている。
 *   3. 解説が正解にほとんど触れず、誤答のほうをよく説明している
 *      文字のバイグラムの一致度で測る。誤検出も出るので警告どまりにして、
 *      人が確認するための一覧として出す。
 *
 * 使い方:  npm run audit:explanations
 *          npm run audit:explanations -- --warn   警告（3）も一覧表示する
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const QUESTION_DIR = path.join(ROOT, 'src/data/questions');

/** 並び順に依存した選択肢（シャッフルで壊れる） */
const LABEL_REFERENCE =
  /(^|[^A-Za-z])[ABCD](と[ABCD])?[はがのも、]|上記|前述|上の選択肢|[1-4]番目の(選択肢|答え)/;

/**
 * 解説が正解を打ち消しているパターン。
 *
 *   inExplanation … 解説に出てくる打ち消しの表現
 *   inAnswer      … 正解に出てくる、打ち消されているはずの表現
 *   unlessAnswer  … 正解がこの条件を書いていれば矛盾ではない（誤検出よけ）
 *
 * 解説は「例外はこうだ」と補足するために否定形を使うことが多い。
 * 正解が同じ条件を書いているなら食い違っていないので、unlessAnswer で外す。
 */
const CONTRADICTIONS = [
  {
    inExplanation: /フォース(状態|プレー)?では(ない|なく)/,
    inAnswer: /フォースアウト/,
    why: '解説はフォースではないと書いているのに、正解がフォースアウト',
  },
  {
    inExplanation: /フォースアウトにはならない/,
    inAnswer: /フォースアウト/,
    why: '解説はフォースアウトにならないと書いているのに、正解がフォースアウト',
  },
  {
    inExplanation: /タッ[チグ]が必要/,
    inAnswer: /踏むだけ/,
    why: '解説はタッチが必要と書いているのに、正解がベースを踏むだけ',
  },
  {
    inExplanation: /振り逃げ(は)?でき(ない|ません)/,
    inAnswer: /走れる|振り逃げできる/,
    unlessAnswer: /空いて|二死|2アウト|いなければ|いない場合/,
    why: '解説は振り逃げできないと書いているのに、正解が無条件に走れる',
  },
  {
    inExplanation: /宣告され(ない|ません)/,
    inAnswer: /宣告される/,
    unlessAnswer: /とき|場合|なら/,
    why: '解説は宣告されないと書いているのに、正解が宣告される',
  },
  {
    inExplanation: /得点は認められ(ない|ません)/,
    inAnswer: /得点(が入る|になる)/,
    unlessAnswer: /とき|場合|なら/,
    why: '解説は得点が認められないと書いているのに、正解が得点になる',
  },
  {
    inExplanation: /ボークでは(ない|ありません)/,
    inAnswer: /ボークになる/,
    unlessAnswer: /とき|場合|なら/,
    why: '解説はボークではないと書いているのに、正解がボークになる',
  },
];

/**
 * 3番目の検査を人が読んで確認ずみの問題。
 *
 * この検査は文字の一致度で測っているので、次の2つは必ず引っかかる。
 *   - 解説が誤答をわざと引用して打ち消している
 *     （例：「『2アウトだから投げなくていい』は大きな間違い」）
 *   - 正解を解説が別の言葉で言いかえている
 *     （例：正解「走者の速さと位置を見て決める」／解説「勢いと送球の時間を判断する」）
 * どちらも良い問題なので、直す必要はない。
 *
 * 2026-08-30 に当時の20問すべてを出題データと突き合わせて読み、
 * 野球としての誤りが無いことを確認した（1問はこの確認で見つかり修正済み）。
 * ここに載っているものは「確認ずみ」として数え、載っていないものだけを
 * 新規として出す。問題の中身を書きかえたらここから外し、もう一度読むこと。
 */
const REVIEWED_WARNINGS = new Set([
  'baserun-088', 'batting-030', 'batting-058', 'coach-074', 'coach-096',
  'fighters-018', 'first-011', 'first-085', 'outfield-026', 'outfield-038',
  'pitcher-016', 'rules-012', 'rules-013', 'second-063', 'third-030',
  'third-035', 'third-051', 'umpire-031', 'umpire-041',
]);

async function loadQuestions() {
  const out = [];
  for (const file of fs.readdirSync(QUESTION_DIR).sort()) {
    if (!file.endsWith('.js')) continue;
    const mod = await import(pathToFileURL(path.join(QUESTION_DIR, file)).href);
    for (const value of Object.values(mod)) {
      if (Array.isArray(value)) out.push(...value.map((q) => ({ ...q, _file: file })));
    }
  }
  return out;
}

/* ── 文字バイグラムでの一致度 ── */
const normalize = (s) => s.replace(/[（）()、。「」『』・！？\s]/g, '');
function bigrams(s) {
  const t = normalize(s);
  const set = new Set();
  for (let i = 0; i < t.length - 1; i++) set.add(t.slice(i, i + 2));
  return set;
}
/** その選択肢が解説にどれだけ含まれているか（0〜1） */
function coverage(choice, explanation) {
  const c = bigrams(choice);
  if (c.size === 0) return null; // 「5」のような短すぎる選択肢は測れない
  const e = bigrams(explanation);
  let hit = 0;
  for (const g of c) if (e.has(g)) hit++;
  return hit / c.size;
}

const questions = await loadQuestions();
const showWarnings = process.argv.includes('--warn');

const labelIssues = [];
const contradictions = [];
const warnings = [];

for (const q of questions) {
  // 1. ラベル参照
  const labeled = q.choices.filter((c) => LABEL_REFERENCE.test(c));
  if (labeled.length > 0) labelIssues.push({ q, labeled });

  // 2. 解説と正解の打ち消し
  const answer = q.choices[q.correct];
  for (const rule of CONTRADICTIONS) {
    if (!rule.inExplanation.test(q.explanation)) continue;
    if (!rule.inAnswer.test(answer)) continue;
    if (rule.unlessAnswer?.test(answer)) continue;
    contradictions.push({ q, why: rule.why });
    break;
  }

  // 3. 解説が誤答のほうをよく説明している
  const scores = q.choices.map((c) => coverage(c, q.explanation));
  const correctScore = scores[q.correct];
  if (correctScore === null) continue;
  let bestOther = -1;
  let bestOtherIdx = -1;
  scores.forEach((s, i) => {
    if (i !== q.correct && s !== null && s > bestOther) { bestOther = s; bestOtherIdx = i; }
  });
  if (bestOtherIdx >= 0 && bestOther - correctScore >= 0.30) {
    warnings.push({ q, correctScore, bestOther, bestOtherIdx, gap: bestOther - correctScore });
  }
}

console.log(`\n解説と正解の監査  —  ${questions.length}問\n${'='.repeat(46)}`);

console.log(`\n■ 並び順に依存した選択肢        ${String(labelIssues.length).padStart(3)}問  （許容 0問）`);
for (const { q, labeled } of labelIssues) {
  console.log(`\n  ${q.id}  ${q.question}`);
  for (const c of labeled) console.log(`    ✗ ${c}`);
  console.log('    出題時にシャッフルするため、A・Bなどの並び順を指す選択肢は成立しません。');
}

console.log(`\n■ 解説が正解を打ち消している    ${String(contradictions.length).padStart(3)}問  （許容 0問）`);
for (const { q, why } of contradictions) {
  console.log(`\n  ${q.id}  ${why}`);
  console.log(`    ★正解 : ${q.choices[q.correct]}`);
  console.log(`    解説   : ${q.explanation.slice(0, 80)}`);
}

const fresh = warnings.filter((w) => !REVIEWED_WARNINGS.has(w.q.id));
const reviewed = warnings.filter((w) => REVIEWED_WARNINGS.has(w.q.id));

console.log('\n■ 要確認（解説が誤答のほうをよく説明している）');
console.log(`    新規       ${String(fresh.length).padStart(3)}問  ← 人が読んで判断してください`);
console.log(`    確認ずみ   ${String(reviewed.length).padStart(3)}問  （読んだうえで誤検出と判断したもの）`);
if (showWarnings) {
  const show = (list, heading) => {
    if (list.length === 0) return;
    console.log(`\n  ── ${heading} ──`);
    list.sort((a, b) => b.gap - a.gap);
    for (const w of list) {
      console.log(`\n  ${w.q.id}  差=${w.gap.toFixed(2)}（正解 ${w.correctScore.toFixed(2)} / 誤答 ${w.bestOther.toFixed(2)}）`);
      console.log(`    問い   : ${w.q.question}`);
      console.log(`    ★正解 : ${w.q.choices[w.q.correct]}`);
      console.log(`    ?誤答 : ${w.q.choices[w.bestOtherIdx]}`);
      console.log(`    解説   : ${w.q.explanation.slice(0, 80)}`);
    }
  };
  show(fresh, '新規');
  show(reviewed, '確認ずみ');
} else if (fresh.length > 0) {
  console.log(`    新規: ${fresh.map((w) => w.q.id).join(', ')}`);
}

// 確認ずみのIDが残っていない場合、問題が消えたか書きかえられている。
// 一覧が古いまま新しい問題を見のがすのを防ぐため知らせる。
const stale = [...REVIEWED_WARNINGS].filter((id) => !warnings.some((w) => w.q.id === id));
if (stale.length > 0) {
  console.log(`\n    ※ 確認ずみの一覧に、もう引っかからないIDが ${stale.length}件あります: ${stale.join(', ')}`);
  console.log('       問題を書きかえたなら REVIEWED_WARNINGS から外してください。');
}

const failures = [];
if (labelIssues.length > 0) failures.push(`並び順に依存した選択肢が ${labelIssues.length}問`);
if (contradictions.length > 0) failures.push(`解説が正解を打ち消している問題が ${contradictions.length}問`);

console.log(`\n${'='.repeat(46)}`);
if (failures.length > 0) {
  console.log('✖ 監査に失敗しました');
  for (const f of failures) console.log(`  - ${f}`);
  console.log('');
  process.exit(1);
}
console.log('✓ 監査に合格しました\n');
