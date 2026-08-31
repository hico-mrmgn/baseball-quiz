#!/usr/bin/env node
/**
 * 「いま自分は守備側なのか攻撃側なのか」が崩れていないかを検査する。
 *
 * この監査を足した理由。実戦シナリオは守備と攻撃が混ざっていて、
 * 今日のトレーニングはテーマをまたいで5場面を引く。立場が画面から
 * 読み取れないと、点差もアウトカウントも使いようがない。
 * 立場は sit.side が持っているので、それが欠けたりテーマと食い違ったり
 * したまま増えていかないよう、機械で止める。
 *
 * 見ているのは2つ。
 *
 *   1. 実戦シナリオの sit.side（失敗扱い）
 *      欠けている、またはテーマから決まる立場と食い違っている。
 *   2. 基本練習の立場ズレ（警告）
 *      ポジション別のテーマなのに、問題文が相手側の行為者を名指ししている。
 *      「外野編」で走者のタッチアップのタイミングを聞く、など。
 *
 * 使い方:  npm run audit:viewpoint
 *          npm run audit:viewpoint -- --warn   警告の一覧も出す
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** テーマから決まる立場。中立（ルール・審判・雑学）は立場を問わない。 */
const THEME_SIDE = {
  pitcher: 'defense', catcher: 'defense', first: 'defense', second: 'defense',
  short: 'defense', third: 'defense', outfield: 'defense',
  batting: 'offense', baserun: 'offense', coach: 'offense',
  rules: null, umpire: null, fighters: null, npb2025: null,
};

/** 問題文が名指ししている行為者 */
const ACTOR = {
  defense: /ピッチャー|投手|キャッチャー|捕手|ファースト|一塁手|セカンド|二塁手|ショート|遊撃手|サード|三塁手|外野手|レフト|センター|ライト|内野手|野手/,
  offense: /ランナー|走者|バッター|打者|コーチャー/,
};

/**
 * 正解がどちら側の行為か。判定できないときは null。
 */
const ANSWER_ACT = {
  defense: /投げ|送球|捕(球|る|り)|アウトにする|アウトを?(取|狙)|タッチ|刺す|封殺|カバー|バックアップ|ベースを踏/,
  offense: /走(る|り|ろ)|進塁|スタート|盗塁|リード|帰塁|戻る|突入|狙って走|タッチアップ|指示に従/,
};

function answerSide(q) {
  const a = q.choices?.[q.correct] ?? '';
  const d = ANSWER_ACT.defense.test(a);
  const o = ANSWER_ACT.offense.test(a);
  if (d && !o) return 'defense';
  if (o && !d) return 'offense';
  return null;
}

/**
 * 立場ズレを人が読んで確認ずみの問題。
 *
 * 2026-08-31 に一覧を読んで仕分けた。ここに載っている限り「確認ずみ」として
 * 数え、載っていないものだけを新規として出す。問題を書きかえたら外すこと。
 */

/** 本物のズレ。直すには問い自体を作りなおすので、いまは既知として置いてある。 */
const KNOWN_MISMATCH = new Set([
  // 外野編なのに走者の判断を聞いている。外野編で学ぶ価値があるのは
  // 「タッチアップされる場面で外野手はどこへ、いつ投げるか」のほう。
  'outfield-062', 'outfield-066', 'outfield-070',
  'outfield-087', 'outfield-088', 'outfield-091', 'outfield-092',
  // ファースト編で「送球が逸れたら走者は何個進めるか」。走者への問いだが、
  // 一塁手が追うかどうかの判断に直結するので、ここでは許容している。
  'first-033',
]);

/** 読んだ結果ズレではなかったもの（この検査の誤検出）。 */
const NOT_A_MISMATCH = new Set([
  // 走塁編で「一塁手がタッグしたらどうなる？」。動くのは一塁手だが、
  // 学ぶのは走者側の制約（オーバーランが許される条件）なので立場は崩れていない。
  'baserun-078',
]);

/**
 * 問い掛けの節（最後の「。」より後ろ）だけを取り出す。
 *
 * 相手側が問題文に出てくること自体はズレではない。
 * 「3塁ランナーが本塁に突入してきた。どうする？」の前半は状況説明で、
 * 聞かれているのはそのテーマの守備者。一方
 * 「3塁ランナーはどうすべき？」は走者そのものに聞いている。
 * 違いは、相手側が問い掛けの節の主語になっているかどうかに出る。
 */
function askedClause(question) {
  const parts = (question ?? '').split('。');
  return parts[parts.length - 1] || question || '';
}

/**
 * その節で、相手側が「〜は」「〜が」と主語に立っているか。
 *
 * 名前が出るだけでは足りない。「ピッチャーのパターンを読んで、どう対応する？」の
 * ピッチャーは読む対象で、動くのは打者。主語に立ってはじめて、その相手側に
 * 聞いている問いになる。括弧書きをはさむ書き方（「ランナー（バッターランナー）は」）
 * があるので、そのぶんだけ間を許す。それ以上あけると
 * 「次の打者への対応で大切なことは？」の「は」まで拾ってしまう。
 */
function isSubject(side, clause) {
  return new RegExp(`(?:${ACTOR[side].source})(?:（[^）]{0,16}）)?[はが]`).test(clause);
}

async function loadFrom(dir) {
  const out = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    for (const value of Object.values(mod)) {
      if (Array.isArray(value)) out.push(...value.filter((q) => q && q.id));
    }
  }
  return out;
}

/* ── 1. 実戦シナリオの sit.side ── */
const scenarios = await loadFrom(path.join(ROOT, 'src/data/scenarios'));
const withSit = scenarios.filter((s) => s.sit && s.question);

const sideProblems = [];
for (const s of withSit) {
  const expected = THEME_SIDE[s.theme];
  if (!s.sit.side) {
    sideProblems.push({ id: s.id, why: 'sit.side がありません' });
  } else if (!['defense', 'offense'].includes(s.sit.side)) {
    sideProblems.push({ id: s.id, why: `sit.side が想定外の値です（${s.sit.side}）` });
  } else if (expected && s.sit.side !== expected) {
    sideProblems.push({
      id: s.id,
      why: `テーマ ${s.theme} は ${expected} のはずですが sit.side は ${s.sit.side} です`,
    });
  }
}

/* ── 2. 基本練習の立場ズレ ── */
const questions = await loadFrom(path.join(ROOT, 'src/data/questions'));
const mismatches = [];
for (const q of questions) {
  const side = THEME_SIDE[q.theme];
  if (!side) continue;
  const other = side === 'defense' ? 'offense' : 'defense';
  const asked = askedClause(q.question);
  if (!isSubject(other, asked) || isSubject(side, asked)) continue;
  mismatches.push({ q, side, other });
}
const real = mismatches.filter((m) => !NOT_A_MISMATCH.has(m.q.id));
const fresh = real.filter((m) => !KNOWN_MISMATCH.has(m.q.id));
const known = real.filter((m) => KNOWN_MISMATCH.has(m.q.id));

/* ── 出力 ── */
const showWarnings = process.argv.includes('--warn');
const SIDE_JA = { defense: '守備', offense: '攻撃' };

console.log(`\n立場の監査  —  実戦シナリオ ${withSit.length}場面 / 基本練習 ${questions.length}問`);
console.log('='.repeat(46));

console.log(`\n■ 実戦シナリオの sit.side        ${String(sideProblems.length).padStart(3)}問  （許容 0問）`);
for (const p of sideProblems) console.log(`\n  ${p.id}  ${p.why}`);

console.log('\n■ 基本練習の立場ズレ（テーマと問題文の行為者が食い違い）');
console.log(`    新規       ${String(fresh.length).padStart(3)}問  ← 人が読んで判断してください`);
console.log(`    確認ずみ   ${String(known.length).padStart(3)}問  （そのテーマで扱う価値を確かめたもの）`);
if (showWarnings) {
  const show = (list, heading) => {
    if (list.length === 0) return;
    console.log(`\n  ── ${heading} ──`);
    for (const m of list) {
      console.log(`\n  ${m.q.id}  ${SIDE_JA[m.side]}のテーマなのに${SIDE_JA[m.other]}側を聞いています`);
      console.log(`    問い   : ${m.q.question}`);
      console.log(`    ★正解 : ${m.q.choices[m.q.correct]}`);
    }
  };
  show(fresh, '新規');
  show(known, '確認ずみ');
} else if (fresh.length > 0) {
  console.log(`    新規: ${fresh.map((m) => m.q.id).join(', ')}`);
}

const stale = [...KNOWN_MISMATCH, ...NOT_A_MISMATCH]
  .filter((id) => !mismatches.some((m) => m.q.id === id));
if (stale.length > 0) {
  console.log(`\n    ※ 確認ずみの一覧に、もう当てはまらないIDが ${stale.length}件あります: ${stale.join(', ')}`);
  console.log('       問題を書きかえたなら一覧から外してください。');
}

console.log(`\n${'='.repeat(46)}`);
if (sideProblems.length > 0) {
  console.log('✖ 監査に失敗しました');
  console.log(`  - sit.side に問題のあるシナリオが ${sideProblems.length}場面`);
  console.log('');
  process.exit(1);
}
console.log('✓ 監査に合格しました\n');
