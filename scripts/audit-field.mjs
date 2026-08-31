#!/usr/bin/env node
/**
 * フィールド図とデータの食い違いを検査する。
 *
 * この監査を足した理由。守備隊形は sit.defense に文字列で入っていて、図は
 * その文字列をキーにして野手をずらす。名前が一つでも合っていないと、
 * 「バントシフト」と書いてあるのに野手が定位置のまま、という状態になる。
 * 実際に「内野は前進守備」「外野は前進」「ファーストが牽制でベースに
 * ついている」の3種類が、図に何の反映もされないまま入っていた。
 *
 * 見ているのは2つ。
 *
 *   1. 隊形名が図のキーにあるか（失敗扱い）
 *   2. 前へ出る隊形が、本当に前に描かれているか（失敗扱い）
 *      y が大きいほどホーム寄り。以前はここが逆で、前進守備もバントシフトも
 *      後ろに下がって描かれていた。向きは目で見ないと気づけないので機械で見る。
 *
 * 使い方:  npm run audit:field
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  HOME, FIELDER_POSITIONS, DEFENSE_SHIFTS, NEUTRAL_FORMATIONS, shiftedPosition,
} from '../src/data/fieldCoords.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** 前へ出るはずの隊形と、そのとき前に出る野手 */
const FORWARD = {
  '前進守備':        ['first', 'second', 'short', 'third'],
  '内野は前進守備':   ['first', 'second', 'short', 'third'],
  '定位置より少し前': ['first', 'second', 'short', 'third'],
  'バントシフト':     ['first', 'third'],
  '外野は前進':      ['left', 'center', 'right'],
};
/** 下がるはずの隊形 */
const BACKWARD = {
  'やや後ろ': ['left', 'center', 'right'],
};

async function loadScenarios() {
  const dir = path.join(ROOT, 'src/data/scenarios');
  const out = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith('.js') || file === 'index.js') continue;
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    for (const v of Object.values(mod)) if (Array.isArray(v)) out.push(...v);
  }
  return out;
}

/* ── 1. 隊形名が図のキーにあるか ── */
const scenarios = await loadScenarios();
const { inningScenarios } = await import(pathToFileURL(path.join(ROOT, 'src/data/innings.js')).href);

const used = new Map();
const note = (name, where) => {
  if (!name) return;
  if (!used.has(name)) used.set(name, []);
  used.get(name).push(where);
};
for (const s of scenarios) note(s.sit?.defense, s.id);
for (const inn of inningScenarios) for (const p of inn.plays ?? []) note(p.defense, inn.id);

const unknown = [];
for (const [name, where] of used) {
  if (NEUTRAL_FORMATIONS.includes(name)) continue;
  if (DEFENSE_SHIFTS[name]) continue;
  unknown.push({ name, count: where.length, where: [...new Set(where)] });
}

/* ── 2. 前に出る隊形が本当に前に描かれているか ── */
const wrongWay = [];
const check = (table, expectForward) => {
  for (const [name, keys] of Object.entries(table)) {
    if (!DEFENSE_SHIFTS[name]) continue;   // 1 の検査で出るので二重に出さない
    for (const key of keys) {
      const base = FIELDER_POSITIONS[key];
      const moved = shiftedPosition(key, base, name);
      const before = HOME.y - base.y;      // ホームからの距離
      const after = HOME.y - moved.y;
      if (after === before) {
        wrongWay.push({ name, key, why: '動いていません' });
      } else if (expectForward && after > before) {
        wrongWay.push({ name, key, why: `前へ出るはずが ${before} → ${after} と下がっています` });
      } else if (!expectForward && after < before) {
        wrongWay.push({ name, key, why: `下がるはずが ${before} → ${after} と前に出ています` });
      }
    }
  }
};
check(FORWARD, true);
check(BACKWARD, false);

/* ── 出力 ── */
console.log(`\nフィールド図の監査  —  隊形 ${used.size}種類`);
console.log('='.repeat(46));

console.log(`\n■ 図に登録されていない隊形名    ${String(unknown.length).padStart(3)}件  （許容 0件）`);
for (const u of unknown) {
  console.log(`\n  「${u.name}」 ${u.count}か所`);
  console.log(`    ${u.where.slice(0, 6).join(', ')}${u.where.length > 6 ? ' ほか' : ''}`);
  console.log('    図が何も動かしません。fieldCoords の DEFENSE_SHIFTS に足すか、');
  console.log('    定位置なら NEUTRAL_FORMATIONS に足してください。');
}

console.log(`\n■ ずらしの向きが逆              ${String(wrongWay.length).padStart(3)}件  （許容 0件）`);
for (const w of wrongWay) {
  console.log(`\n  「${w.name}」の ${w.key}  ${w.why}`);
}

console.log(`\n${'='.repeat(46)}`);
const failures = [];
if (unknown.length > 0) failures.push(`図に登録されていない隊形名が ${unknown.length}件`);
if (wrongWay.length > 0) failures.push(`ずらしの向きが逆のものが ${wrongWay.length}件`);
if (failures.length > 0) {
  console.log('✖ 監査に失敗しました');
  for (const f of failures) console.log(`  - ${f}`);
  console.log('');
  process.exit(1);
}
console.log('✓ 監査に合格しました\n');
