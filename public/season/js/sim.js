// 状況判断シミュレーター「先に動け」。
// 投げる前に「来たら」「来なかったら」を決める → 打球が出る → 結果が動く。

import { SCENES, sceneById } from './scenes.js';
import { ISSUES, OPPONENTS } from './catalog.js';
import { get, update, profile, otherProfiles, today, seeded } from './store.js';
import { collectRankUps } from './growth.js';
import { sfx } from './sound.js';
import {
  renderField, fielderPos, POS, AREA, SPOT, RUNTO, LEAD, BATBOX, HOME, FIRST, SECOND, THIRD, MOUND,
  optLabel, isSpot, tween, sleep, W, H,
} from './field.js';
import { h, esc, icon, flash, modal, go } from './ui.js';

/* ───────── 出題を組む ───────── */

function groupsOf(list) {
  const seen = new Set(); const out = [];
  for (const s of list) {
    if (!s.pair) { out.push([s]); continue; }
    if (seen.has(s.pair)) continue;
    seen.add(s.pair);
    out.push(SCENES.filter((x) => x.pair === s.pair).sort((a, b) => a.pairRole.localeCompare(b.pairRole)));
  }
  return out;
}
function shuffle(arr, rand) {
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/** 今日の試合。日付で決まり、処方中の課題の場面を前に寄せる。守備5〜6場面＋攻撃2場面。 */
export function buildDaily(date) {
  const rand = seeded(`daily-${date}`);
  const rxScenes = new Set(get().rx.flatMap((r) => ISSUES.find((i) => i.id === r.issue)?.scenes ?? []));
  const weight = (g) => (g.some((s) => rxScenes.has(s.id)) ? 1 : 0);
  const pickGroups = (side, n) => {
    const groups = shuffle(groupsOf(SCENES.filter((s) => s.side === side)), rand)
      .map((g, i) => ({ g, i, w: weight(g) })).sort((a, b) => b.w - a.w || a.i - b.i).map((x) => x.g);
    const out = [];
    for (const g of groups) { if (out.flat().length + g.length > n) continue; out.push(g); if (out.flat().length >= n) break; }
    return shuffle(out, rand);
  };
  const def = pickGroups('def', 5), off = pickGroups('off', 2);
  const seq = [];
  def.forEach((g, i) => { seq.push(...g); if ((i === 1 || i === 3) && off.length) seq.push(...off.shift()); });
  off.forEach((g) => seq.push(...g));
  return { title: '今日の試合', opp: OPPONENTS[Math.floor(rand() * OPPONENTS.length)], scenes: seq, daily: date };
}

export function buildFree(kind) {
  const rand = Math.random;
  let pool = SCENES;
  let title = 'ぜんぶの場面';
  if (kind === 'real') { pool = SCENES.filter((s) => s.real || SCENES.some((x) => x.pair && x.pair === s.pair && x.real)); title = 'じっさいの試合'; }
  else if (kind === 'off') { pool = SCENES.filter((s) => s.side === 'off'); title = '走る・打つ'; }
  else if (kind?.startsWith('rx:')) {
    const issue = ISSUES.find((i) => i.id === kind.slice(3));
    pool = (issue?.scenes ?? []).map((id) => sceneById[id]).filter(Boolean);
    title = issue?.name ?? '課題の場面';
  } else if (kind?.startsWith('one:')) {
    pool = [sceneById[kind.slice(4)]].filter(Boolean); title = 'この場面';
  }
  const groups = shuffle(groupsOf(pool), rand);
  const scenes = [];
  for (const g of groups) { if (scenes.length + g.length > 8) continue; scenes.push(...g); }
  return { title, opp: null, scenes, daily: null };
}

/* ───────── 画面 ───────── */

const TIER = { 3: ['best', '最善手！'], 1: ['ok', 'まあOK'], 0: ['poor', 'もったいない'], '-1': ['fatal', '試合が壊れる'] };
const VOICES = {
  pitcher: ['ホーム！', 'ファースト！', '任せた！'], catcher: ['ファースト！', 'サード！', 'オーライ！'],
  first: ['オーライ！', 'ベース入った！', 'ホーム！'], second: ['ベース入った！', 'オーライ！', 'セカン！'],
  short: ['セカン！', 'オーライ！', 'ファースト！'], third: ['ファースト！', 'サード戻る！', 'ホーム！'],
  left: ['カット！', 'オーライ！', 'バック！'], center: ['カット！', 'オーライ！', 'セカン！'], right: ['カット！', 'オーライ！', 'バック！'],
};
const BASES = ['first', 'second', 'third'];
const BASE_PT = { first: FIRST, second: SECOND, third: THIRD, home: HOME };
const LEAD_OF = { first: LEAD.r1, second: LEAD.r2, third: LEAD.r3 };
const RID = { first: 'r1', second: 'r2', third: 'r3' };

export function mountSim(root, set, { onExit }) {
  const me = profile();
  const G = { i: 0, us: 0, them: 0, log: [], plan: {}, voice: null, busy: false };
  root.innerHTML = `
    <div class="sim">
      <div class="sim-eyebrow"><button class="iconbtn" data-quit aria-label="やめる">${icon.x}</button><span>BASEBALL IQ / 先読みトレーニング</span><div class="tally" aria-live="polite"></div></div>
      <div class="simleft">
        <div class="simhead"><div><div class="simtitle">先に動け</div><div class="simsub">考えるのは、ボールが来る前。</div></div><div class="prog led"></div></div>
        <div class="stagebar"><span>01 状況を見る</span><span>02 先に決める</span><span>03 声を出す</span></div>
        <div class="stage">
          <div class="field-wrap">
            <div class="match-hud"></div>
            <svg viewBox="0 0 ${W} ${H}" class="field" aria-label="グラウンド"></svg>
            <div class="field-caption"><span><i class="dot"></i> 自分</span><span><i class="dot white"></i> 味方</span><span><i class="dot red"></i> ランナー</span></div>
          </div>
          <div class="position-caption"><small>YOUR POSITION</small><b class="poslabel"></b></div>
        </div>
      </div>
      <div class="simpanel"></div>
    </div>`;
  const svg = root.querySelector('.field'), panel = root.querySelector('.simpanel');
  let view = null;

  root.querySelector('[data-quit]').onclick = () => {
    if (G.log.length === 0 || G.done) return onExit();
    const m = modal(`<h3>やめる？</h3><p class="muted">ここまでの記録はのこります。</p>
      <div class="row"><button class="btn ghost" data-close>つづける</button><button class="btn" data-yes>やめる</button></div>`);
    m.el.querySelector('[data-yes]').onclick = () => { m.close(); onExit(); };
  };

  const scene = () => set.scenes[G.i];
  const paint = () => { svg.innerHTML = renderField(view); bindTargets(); };
  let onTap = null;
  function bindTargets() {
    svg.querySelectorAll('.tgt').forEach((el) => el.addEventListener('click', () => { sfx.pick(); onTap?.(el.dataset.t); }));
  }

  const ROLE = { pitcher: 'ピッチャー', catcher: 'キャッチャー', first: 'ファースト', second: 'セカンド', third: 'サード', short: 'ショート', left: 'レフト', center: 'センター', right: 'ライト', batter: 'バッター', r1: '一塁ランナー', r2: '二塁ランナー', r3: '三塁ランナー' };
  function header(phase) {
    const sc = scene(), sit = sc.sit;
    root.querySelector('.prog').textContent = `${G.i + 1} / ${set.scenes.length}`;
    root.querySelector('.tally').innerHTML = set.opp
      ? `<span>${esc(me.name)}</span><b class="led">${G.us}</b><i>-</i><b class="led">${G.them}</b><span>${esc(set.opp)}</span>`
      : `<span>とった</span><b class="led">${G.us}</b><i>-</i><b class="led">${G.them}</b><span>とられた</span>`;
    root.querySelector('.poslabel').textContent = ROLE[sc.role] ?? '';
    const has = sit.us !== null && sit.us !== undefined;
    root.querySelector('.match-hud').innerHTML = `<div class="inning">GAME SITUATION<strong>${sit.inning}回 ${sit.half === '表' ? 'オモテ' : 'ウラ'}</strong></div>
      <div class="match-score"><div><small>自分のチーム</small><b>${has ? sit.us : '—'}</b></div><em>:</em><div><small>相手チーム</small><b>${has ? sit.them + (G.sceneRuns ?? 0) : '—'}</b></div></div>
      <div class="outcount">OUT<div>${[0, 1, 2].map((o) => `<i class="${o < (view?.outs ?? sit.outs) ? 'lit' : ''}"></i>`).join('')}</div></div>`;
    if (phase !== undefined) root.querySelectorAll('.stagebar span').forEach((el, i) => el.classList.toggle('active', i === phase));
  }

  function baseView(sc) {
    const sit = sc.sit;
    const fielders = Object.fromEntries(Object.keys(POS).map((k) => [k, fielderPos(k, sit)]));
    const runners = BASES.filter((b) => sit.runners[b]).map((b) => ({
      id: RID[b], ...LEAD_OF[b], speed: sit.runners[b] === 'me' ? null : sit.runners[b], me: sit.runners[b] === 'me', action: 'ready',
    }));
    // 打席の打者。自分が打者の場面は自分に輪をつける
    runners.push({ id: 'bat', ...BATBOX, bat: true, me: sc.role === 'batter', action: 'ready' });
    return { sit, role: sc.role, fielders, runners, outs: sit.outs, targets: [], action: 'ready' };
  }

  function sitCard(sc) {
    const sit = sc.sit;
    const d = sit.us === null || sit.us === undefined ? null : sit.us - sit.them;
    const diff = d === null ? '' : d === 0 ? '同点' : d > 0 ? `${d}点リード` : `${-d}点ビハインド`;
    const tone = d === null ? '' : d > 0 ? 'lead' : d < 0 ? 'behind' : '';
    const bases = BASES.filter((b) => sit.runners[b]).map((b) => ({ first: '一', second: '二', third: '三' }[b]));
    const baseTxt = bases.length === 3 ? '満塁' : bases.length ? `${bases.join('・')}塁` : 'ランナーなし';
    const src = sc.real || sc.whatIf ? `<span class="chip src">${sc.whatIf ? '' : 'じっさいの試合：'}${esc(sc.src)}</span>` : `<span class="chip">${esc(sc.src)}</span>`;
    const twin = sc.pairRole === 'b' ? '<div class="twin">さっきと同じ打球。ちがうのは状況だけ</div>' : '';
    return `${twin}<div class="card sit">
      <div class="chips"><span class="chip ${sc.side}">${sc.side === 'def' ? '守り' : '攻め'}</span>${src}</div>
      <div class="sitrow"><b class="diff ${tone}">${diff}</b><span>${sit.outs}アウト</span><span>${baseTxt}</span>${sit.defense !== '定位置' ? `<span class="shift">${esc(sit.defense)}</span>` : ''}</div>
      <p class="note">${esc(sc.note)}</p></div>`;
  }

  const planChips = (sc) => {
    const chip = (label, key) => {
      const o = G.plan[key];
      return `<span class="plan ${o ? 'on' : ''}">${label}<b>${o ? esc(optLabel(o)) : '？'}</b></span>`;
    };
    return `<div class="plans">${chip(sc.side === 'def' ? '来たら' : 'きめたこと', 'ball')}${sc.not ? chip('来なかったら', 'not') : ''}</div>`;
  };

  function ask(kind) {
    const sc = scene(); const q = sc[kind];
    const spots = q.opts.filter(isSpot), btns = q.opts.filter((o) => !isSpot(o));
    const lead = sc.side === 'off' ? '自分ならどうする' : kind === 'ball' ? '自分に来たら' : '自分に来なかったら';
    const text = q.q ?? (kind === 'ball' ? 'どこへ投げる？' : 'どこへ動く？');
    view.targets = spots.map((o) => ({ id: o.id }));
    const choose = (id) => { G.plan[kind] = q.opts.find((o) => o.id === id); view.targets = []; next(kind); };
    onTap = choose; paint(); header(kind === 'ball' && !G.plan.ball && sc.side === 'def' ? 1 : 1);
    panel.innerHTML = `${kind === 'ball' ? sitCard(sc) : ''}
      <div class="card ask">${planChips(sc)}
        <div class="q"><small>${lead}</small>${esc(text)}</div>
        ${spots.length ? `<p class="hint">${icon.ball} グラウンドの塁名をタップ</p>` : ''}
        ${btns.length ? `<div class="opts">${btns.map((o) => `<button class="opt" data-o="${o.id}">${esc(optLabel(o))}</button>`).join('')}</div>` : ''}
      </div>`;
    panel.querySelectorAll('.opt').forEach((b) => { b.onclick = () => { sfx.pick(); choose(b.dataset.o); }; });
    panel.scrollTop = 0;
  }

  function next(kind) {
    const sc = scene();
    if (kind === 'ball' && sc.not) return ask('not');
    if (sc.side === 'def') return askVoice();
    return play();
  }

  function askVoice() {
    const sc = scene(); view.targets = []; onTap = null; paint(); header(2);
    const v = VOICES[sc.role] ?? VOICES.third;
    panel.innerHTML = `<div class="card ask">${planChips(sc)}
      <div class="q"><small>きめた。あとは声</small>なんて言う？</div>
      <div class="opts three">${v.map((x) => `<button class="opt" data-v="${x}">${x}</button>`).join('')}</div></div>`;
    panel.querySelectorAll('.opt').forEach((b) => { b.onclick = () => { sfx.pick(); G.voice = b.dataset.v; play(); }; });
  }

  const pickOutcome = (ocs) => { let r = Math.random() * ocs.reduce((a, o) => a + o.w, 0); for (const o of ocs) { r -= o.w; if (r <= 0) return o; } return ocs[0]; };
  const runnerOf = (id) => view.runners.find((r) => r.id === id);
  const moveRunner = (id, to, ms = 700) => { const r = runnerOf(id); if (!r) return Promise.resolve(); r.bat = false; r.action = 'run'; r.flip = to.x < r.x; return tween({ x: r.x, y: r.y }, to, ms, (p) => { r.x = p.x; r.y = p.y; paint(); }); };
  const moveBall = (from, to, ms, arc = 0) => tween(from, to, ms, (p) => { view.ball = p; paint(); }, { arc });
  const moveFielder = (key, to, ms) => { const f = view.fielders[key]; return tween({ ...f }, to, ms, (p) => { view.fielders[key] = { x: p.x, y: p.y }; paint(); }); };

  async function play() {
    if (G.busy) return; G.busy = true;
    const sc = scene(), sit = sc.sit; const oc = pickOutcome(sc.outcomes);
    const kind = oc.kind; const opt = G.plan[kind];
    panel.innerHTML = `<div class="card playcall"><div class="q">${esc(oc.play)}</div></div>`;
    onTap = null; view.targets = [];
    const myKey = POS[sc.role] ? sc.role : null;
    const myPos = myKey ? view.fielders[myKey] : null;
    if (G.voice && myPos) view.bubble = { x: myPos.x, y: myPos.y, t: G.voice };

    // 投球
    view.ball = { ...MOUND }; paint(); await sleep(350);
    await moveBall(MOUND, { x: HOME.x, y: HOME.y - 6 }, 420);
    const area = AREA[oc.area] ?? AREA.home;
    let result;
    if (sc.side === 'def') result = await playDefense(sc, oc, opt, area, myKey);
    else result = await playOffense(sc, oc, opt, area);
    view.bubble = null; view.line = null; paint();

    const tone = result.tone ?? (opt.s === 3 ? 'good' : opt.s < 0 ? 'bad' : '');
    flash(result.msg, tone);
    if (tone === 'good') (result.gain ? sfx.run : sfx.out)(); else sfx.safe();
    G.us += result.gain ?? 0; G.them += result.runs ?? 0; G.sceneRuns = result.runs ?? 0;
    view.action = opt.s === 3 ? 'cheer' : 'ready'; view.runners.forEach((r) => { if (r.me) r.action = opt.s === 3 ? 'cheer' : 'ready'; }); paint();

    const both = sc.side === 'def' && sc.not ? G.plan.ball.s === 3 && G.plan.not.s === 3 : null;
    const rec = { t: new Date().toISOString(), p: me.id, scene: sc.id, kind, score: opt.s, both, axes: sc.axes?.[kind] ?? [] };
    update((s) => { s.plays.push(rec); });
    G.log[G.i] = { ...rec, key: sc.key };
    G.review = { oc, kind, opt };
    header(2);
    await sleep(950);
    G.busy = false;
    showResult(sc, oc, opt, result);
  }

  async function playDefense(sc, oc, opt, area, myKey) {
    const sit = sc.sit; const fast = opt.s === 3;
    const r = opt.r ?? (opt.s === 3 ? (oc.noOut ? { out: 0, adv: 0, msg: '止めた！' } : { out: 1, adv: 0, msg: 'アウト！' })
      : opt.s === 1 ? { out: 0, adv: 1, msg: 'セーフ…' } : opt.s === 0 ? { out: 0, adv: 1, msg: '間に合わない' } : { out: 0, adv: 2, msg: 'やられた！' });
    const inPlay = !oc.noOut;
    if (inPlay) sfx.bat();
    // 打球
    await moveBall({ x: HOME.x, y: HOME.y - 6 }, area, oc.fly ? 1100 : 600, oc.fly ? 26 : 0);
    view.bubble = null;
    const jobs = [];
    // 打者は一塁へ
    if (inPlay) jobs.push(moveRunner('bat', RUNTO.first, 1500));
    const mePos = { ...view.fielders[myKey] };
    let ballAt = area;

    if (oc.kind === 'ball') {
      view.action = 'run'; view.flip = area.x < view.fielders[myKey].x;
      await moveFielder(myKey, area, fast ? 320 : 560); sfx.catch(); view.action = 'catch'; paint();
      const to = SPOT[opt.to ?? opt.id];
      if (opt.id === 'chase' || opt.id === 'tag') {
        await tween(area, { x: area.x + 16, y: area.y + 14 }, 620, (p) => { view.fielders[myKey] = { x: p.x, y: p.y }; view.ball = p; paint(); });
      } else if (opt.id === 'stepthird') {
        await tween(area, THIRD, 420, (p) => { view.fielders[myKey] = { x: p.x, y: p.y }; view.ball = p; paint(); });
      } else if (to && (to.x !== area.x || to.y !== area.y)) {
        await sleep(fast ? 90 : 430);
        view.action = 'throw'; view.flip = to.x < area.x; view.line = { x1: area.x, y1: area.y, x2: to.x, y2: to.y };
        const hop = opt.id === 'onehop' || opt.id === 'wild' ? 5 : opt.id === 'home' && sc.role === 'right' ? 22 : 9;
        await moveBall(area, to, fast ? 420 : 560, hop); sfx.catch();
        ballAt = to; view.line = null;
        if (opt.id === 'cut' && opt.s === 3) { view.line = { x1: to.x, y1: to.y, x2: HOME.x, y2: HOME.y }; await moveBall(to, HOME, 380, 6); view.line = null; }
      } else { await sleep(600); }
    } else {
      // ほかの人が処理する。自分は決めておいた場所へ動く
      const by = oc.by; const dest = opt.id === 'chase' ? area : (SPOT[opt.id] ?? mePos);
      view.action = dest === mePos ? 'ready' : 'run'; view.flip = dest.x < mePos.x;
      const mine = moveFielder(myKey, dest, fast ? 520 : 760).then(() => { view.action = 'ready'; });
      if (by) {
        await moveFielder(by, area, 420); sfx.catch();
        await mine;
        if (inPlay) {
          const base = oc.toMe ? SPOT[opt.id] && opt.s === 3 ? dest : FIRST : (SPOT[oc.to ?? 'first']);
          view.line = { x1: area.x, y1: area.y, x2: base.x, y2: base.y };
          await moveBall(area, base, 480, 8); sfx.catch(); view.line = null;
        } else if (opt.id === 'cover-home') {
          view.line = { x1: area.x, y1: area.y, x2: HOME.x, y2: HOME.y };
          await moveBall(area, HOME, 420, 6); sfx.catch(); view.line = null;
        }
      } else { await mine; await sleep(250); }
    }

    // 走者を動かす
    const R = sit.runners; let runs = 0; const moves = [];
    const occupied = BASES.filter((b) => R[b]);
    const nextOf = { first: 'second', second: 'third', third: 'home' };
    if (r.load) {
      const lead = occupied[occupied.length - 1];
      occupied.forEach((b) => moves.push({ id: RID[b], to: BASE_PT[nextOf[b]], gone: b === lead }));
    } else {
      occupied.forEach((b) => {
        let cur = b; for (let k = 0; k < (r.adv ?? 0) && cur !== 'home'; k++) cur = nextOf[cur];
        if (cur === b) return;
        if (cur === 'home') runs++;
        moves.push({ id: RID[b], to: cur === 'home' ? RUNTO.home : BASE_PT[cur], gone: cur === 'home' });
      });
    }
    await Promise.all(moves.map((m) => moveRunner(m.id, m.to, 720)));
    await Promise.all(jobs);
    if (r.extra) await moveRunner('bat', RUNTO.second, 700);
    // 消える人：ホームに還った走者、フォースアウトの走者、アウトになった打者
    const gone = new Set(moves.filter((m) => m.gone).map((m) => m.id));
    if (!inPlay && !r.walk) { /* 打者はそのまま打席 */ }
    else if (r.out >= 1 && !r.load && inPlay) gone.add('bat');
    if (r.out >= 2 && R.first) gone.add('r1');
    view.runners = view.runners.filter((x) => !gone.has(x.id));
    view.outs = Math.min(3, sit.outs + (r.out ?? 0));
    return { msg: r.msg, runs, tone: opt.s === 3 ? 'good' : opt.s < 0 ? 'bad' : '' };
  }

  async function playOffense(sc, oc, opt, area) {
    const meId = sc.role === 'batter' ? 'bat' : sc.role;
    const dest = RUNTO[opt.to] ?? RUNTO.first;
    if (oc.pitchOnly) {
      await moveRunner(meId, dest, opt.s === 0 ? 1200 : 820);
    } else {
      sfx.bat();
      const hit = moveBall({ x: HOME.x, y: HOME.y - 6 }, area, oc.fly ? 1200 : 650, oc.fly ? 28 : 0);
      const others = view.runners.filter((r) => r.id !== meId && r.id !== 'bat');
      const jobs = [hit];
      if (sc.role === 'batter') {
        jobs.push((async () => { await moveRunner('bat', RUNTO.first, 900); })());
        others.forEach((r) => jobs.push(moveRunner(r.id, RUNTO.home, 1500)));
      } else {
        jobs.push(moveRunner('bat', RUNTO.first, 1300));
      }
      await Promise.all(jobs); sfx.catch();
      if (oc.throwTo) { const to = SPOT[oc.throwTo]; view.line = { x1: area.x, y1: area.y, x2: to.x, y2: to.y }; moveBall(area, to, 900, 24).then(() => { view.line = null; }); }
      if (sc.role === 'batter') { if (opt.to !== 'first') await moveRunner('bat', dest, 760); view.runners = view.runners.filter((r) => r.id === 'bat' || r.id === meId); }
      else await moveRunner(meId, dest, opt.s === 3 ? 900 : 1100);
    }
    if (opt.outMe || (opt.s < 0 && opt.to !== 'second' && opt.to !== 'first')) { /* そのまま表示 */ }
    if (opt.to === 'home' && opt.s === 3) view.runners = view.runners.filter((r) => r.id !== meId);
    return { msg: opt.msg ?? (opt.s === 3 ? 'ナイス！' : '…'), gain: opt.gain ?? 0, tone: opt.s === 3 ? 'good' : opt.s < 0 ? 'bad' : '' };
  }

  function showResult(sc, oc, opt, result) {
    const [cls, label] = TIER[opt.s]; const q = sc[oc.kind];
    const vid = get().sceneVideos[sc.id];
    const last = G.i >= set.scenes.length - 1;
    const other = sc.not ? G.plan[oc.kind === 'ball' ? 'not' : 'ball'] : null;
    panel.innerHTML = `
      <div class="verdict ${cls}"><span>${label}</span></div>
      <div class="keycard"><small>おぼえること</small>${esc(sc.key)}</div>
      <div class="card why">
        <p><b>${esc(optLabel(opt))}</b>　${esc(opt.fb ?? '')}</p>
        ${other ? `<p class="also">${oc.kind === 'ball' ? '来なかったら' : '来たら'}の「${esc(optLabel(other))}」は <b class="t${other.s}">${TIER[other.s][1].replace('！', '')}</b></p>` : ''}
        <details><summary>くわしく</summary>
          <p>${esc(sc.why)}</p>
          <ul class="fbs">${q.opts.map((o) => `<li><b class="t${o.s}">${o.s > 0 ? '+' : ''}${o.s}</b><span><b>${esc(optLabel(o))}</b>　${esc(o.fb ?? '')}</span></li>`).join('')}</ul>
        </details>
        ${vid ? `<a class="btn ghost small" href="https://www.youtube.com/watch?v=${encodeURIComponent(vid.id)}&t=${vid.t | 0}s" target="_blank" rel="noopener">${icon.video} じっさいの動画で見る</a>` : ''}
      </div>
      ${sc.side === 'def' ? `<div class="route-legend"><i></i> 黄色のルート＝正しい動き</div><button class="btn replay" data-replay>${icon.play} 正しい動きを見る</button>` : ''}
      <button class="btn primary" data-next>${last ? '試合の結果 ' : '次の場面 '}${icon.right}</button>`;
    showRoute(sc, oc);
    const rp = panel.querySelector('[data-replay]'); if (rp) rp.onclick = () => { sfx.tap(); replayBest(sc, oc, opt, result); };
    panel.querySelector('[data-next]').onclick = () => { sfx.tap(); if (last) finish(); else { G.i++; start(); } };
    panel.scrollTop = 0;
  }

  /** 正しい動きを黄色い矢印で残す */
  function showRoute(sc, oc) {
    if (sc.side !== 'def' || !view) return;
    const q = sc[oc.kind]; const best = q.opts.find((o) => o.s === 3); const area = AREA[oc.area] ?? AREA.home;
    const from = oc.kind === 'ball' ? area : fielderPos(sc.role, sc.sit); const to = SPOT[best.to ?? best.id];
    view.route = to && (to.x !== from.x || to.y !== from.y) ? { from, to } : null; paint();
  }

  /** お手本プレー。場面を最初の形に戻して、最善手だけを動かして見せる */
  async function replayBest(sc, oc, opt, result) {
    if (G.busy) return; G.busy = true;
    const q = sc[oc.kind]; const best = q.opts.find((o) => o.s === 3); const area = AREA[oc.area] ?? AREA.home;
    const keepOuts = view.outs;
    view = baseView(sc); const myKey = sc.role; const from = { ...view.fielders[myKey] };
    const say = (t) => { const el = panel.querySelector('.live-action'); if (el) el.textContent = t; };
    panel.innerHTML = `<div class="card live-card"><div class="q"><small>お手本プレー</small>${oc.kind === 'ball' ? '自分に来たら' : '自分に来なかったら'}</div><div class="live-action">まず自分の位置を確認</div></div>`;
    panel.scrollTop = 0; paint(); await sleep(600);
    view.ball = { ...area }; const to = SPOT[best.to ?? best.id];
    if (oc.kind === 'ball') {
      view.action = 'run'; view.flip = area.x < from.x; say('自分のボールを捕りに行く');
      await moveFielder(myKey, area, 700); view.action = 'catch'; say('しっかり捕る'); paint(); sfx.catch(); await sleep(500);
      if (to && (to.x !== area.x || to.y !== area.y)) {
        view.action = 'throw'; view.flip = to.x < area.x; say(`${optLabel(best)}`); paint(); await sleep(400);
        view.line = { x1: area.x, y1: area.y, x2: to.x, y2: to.y }; await moveBall(area, to, 650, 8); view.line = null; sfx.catch();
      } else { say(optLabel(best)); await sleep(700); }
    } else if (to && (to.x !== from.x || to.y !== from.y)) {
      view.action = 'run'; view.flip = to.x < from.x; say(`ボールを追わず、${optLabel(best)}`);
      await moveFielder(myKey, to, 1100);
    } else { view.action = 'ready'; say(optLabel(best)); paint(); await sleep(1100); }
    view.action = 'cheer'; say('これが、自分の仕事！'); paint(); await sleep(800);
    view.outs = keepOuts; G.busy = false;
    showResult(sc, oc, opt, result);
  }

  function finish() {
    G.done = true;
    const best = G.log.filter((l) => l.score === 3).length, total = G.log.length;
    let ups = [];
    update((s) => {
      if (set.daily) {
        s.daily[set.daily] = s.daily[set.daily] ?? {};
        if (!s.daily[set.daily][me.id]) s.daily[set.daily][me.id] = { us: G.us, them: G.them, best, total, opp: set.opp };
      }
      ups = collectRankUps(me.id, s);
      ups.forEach((u) => s.events.push({ date: today(), p: me.id, type: 'rank', axis: u.axis.id, text: `「${u.axis.name}」${u.from} → ${u.to}` }));
    });
    const res = G.us > G.them ? '勝ち' : G.us < G.them ? '負け' : '引き分け';
    const others = set.daily ? otherProfiles().map((o) => ({ o, d: get().daily[set.daily]?.[o.id] })).filter((x) => x.d) : [];
    view = null; root.querySelector('.simleft').classList.add('hide'); root.querySelector('.sim').classList.add('ended');
    panel.innerHTML = `
      <div class="final card">
        <small>${set.opp ? esc(set.title) : 'おつかれさま'}</small>
        <div class="finalscore"><span>${esc(me.name)}</span><b class="led">${G.us}</b><i>-</i><b class="led">${G.them}</b><span>${esc(set.opp ?? 'あいて')}</span></div>
        ${set.opp ? `<div class="finalres">${res}</div>` : ''}
        <div class="finalsub">最善手 <b class="led">${best}</b> / ${total}</div>
        ${others.map(({ o, d }) => `<div class="rival">${esc(o.name)}は <b class="led">${d.us}-${d.them}</b>、最善手 ${d.best}/${d.total}</div>`).join('')}
      </div>
      <div class="card"><h4>きょうの合言葉</h4><ul class="keys">${G.log.map((l) => `<li><i class="k${l.score}"></i>${esc(l.key)}</li>`).join('')}</ul></div>
      <div class="row"><button class="btn ghost" data-again>${set.daily ? 'ほかの練習' : 'もう一度'}</button><button class="btn primary" data-home>ホームへ</button></div>`;
    panel.querySelector('[data-home]').onclick = onExit;
    panel.querySelector('[data-again]').onclick = () => go(set.daily ? '#/play/free/all' : location.hash.replace(/\?.*$/, '') + `?${Date.now()}`);
    if (ups.length) setTimeout(() => showRankUps(ups), 500);
  }

  function showRankUps(ups) {
    sfx.rank();
    const u = ups[0];
    const m = modal(`<div class="rankup"><small>成長</small><h3>${esc(u.axis.name)}</h3>
      <div class="rankrow"><span class="rk">${u.from}</span>${icon.right}<span class="rk to">${u.to}</span></div>
      <p class="muted">${esc(u.axis.hint)}</p><button class="btn primary" data-close>やった</button></div>`,
    { onClose: () => { if (ups.length > 1) showRankUps(ups.slice(1)); } });
    return m;
  }

  function start() {
    G.plan = {}; G.voice = null; G.sceneRuns = 0; G.review = null;
    view = baseView(scene());
    header(0); ask('ball');
  }
  if (!set.scenes.length) { panel.innerHTML = '<div class="card"><p>この練習に入る場面がまだありません。</p></div>'; return; }
  start();
}
