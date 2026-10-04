// 場面データ。
//
// role   自分の立場。野手のキー（pitcher/third/…）か、攻撃なら batter / r1 / r2 / r3
// ball   自分に来たら（守備）／自分の判断（攻撃）
// not    自分に来なかったら（守備のみ）
// opts   id が塁やカットマンなどフィールド上の場所ならタップで、そうでなければボタンで答える
//        s は配点（3 最善手 / 1 まあOK / 0 もったいない / -1 試合が壊れる）
//        r は結果の上書き { out, adv, msg }。無ければ配点から決める
// outcomes 打球の候補。kind が ball なら自分へ、not ならほかへ。noOut はアウトにならない出来事
// axes   レーダーのどの軸を動かすか（先に決める=pre は全場面で自動）
//
// 書き方の約束：だれがどうしたかは書かない。場面と打球だけを置く。

const R = (first, second, third) => ({ first: first || null, second: second || null, third: third || null });

import { CLASSIC } from '../data/classic.js';

/** 「来たら／来なかったら」を両方きめる、動きまで作りこんだ場面 */
const RICH = [
  /* ───────── じっさいの試合 ───────── */
  {
    id: 'real-0913-bunt', role: 'third', side: 'def', real: true, src: '9/13 グランツ戦 4回ウラ',
    sit: { inning: 4, half: '裏', us: 0, them: 5, outs: 1, runners: R('fast'), defense: 'バントシフト', batter: '代打' },
    note: '相手はバントの構え。サードは前に出ている。',
    ball: { opts: [
      { id: 'first', s: 3, fb: '前に出たら一塁へ。一番確実なアウト。' },
      { id: 'second', s: 1, fb: '一塁ランナーは足が速い。二塁は間に合わないことが多い。' },
      { id: 'hold', s: 0, fb: 'アウトが1つも増えない。' },
    ] },
    not: { opts: [
      { id: 'third-base', s: 3, fb: '自分のボールじゃない。空けた三塁へ戻る。', r: { out: 1, adv: 1, msg: 'アウト！' } },
      { id: 'stay', s: 0, fb: '三塁が空いたまま。足の速いランナーは三塁までねらう。', r: { out: 1, adv: 2, msg: '三塁まで行かれた' } },
      { id: 'chase', s: -1, fb: 'キャッチャーとぶつかる。三塁はがら空き。', r: { out: 0, adv: 2, msg: 'ぶつかった！' } },
    ] },
    outcomes: [
      { kind: 'not', play: 'バントは本塁のすぐ前で止まった。キャッチャーが拾う', area: 'home', by: 'catcher', w: 2 },
      { kind: 'ball', play: 'バントは三塁線にころがった', area: 'bunt3', w: 1 },
    ],
    key: '前に出たら、捕らないと分かった瞬間に三塁へ戻る',
    why: '本塁の前で止まったバントはキャッチャーのボール。サードは三塁ベースを空けてきているから、戻らないと一塁ランナーは三塁まで行ける。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'real-0913-backhand', role: 'third', side: 'def', real: true, src: '9/13 グランツ戦 4回ウラ',
    sit: { inning: 4, half: '裏', us: 0, them: 5, outs: 1, runners: R(), defense: '定位置', batter: '1番・足が速い' },
    note: '1番バッター。三塁線に来たら、一塁まで一番遠い送球になる。',
    ball: { q: 'どう投げる？', opts: [
      { id: 'onehop', l: 'ワンバンで、ベースの3〜4m手前に落とす', s: 3, to: 'first', fb: 'ギリギリのときはワンバン。落とす場所まで決める。' },
      { id: 'nobound', l: 'ノーバンで思いきり', s: 1, to: 'first', fb: '届けば一番速い。体が流れたままだと高くそれやすい。', r: { out: 0, adv: 0, msg: 'セーフ…' } },
      { id: 'steps', l: '2〜3歩ステップして立て直す', s: 0, to: 'first', fb: '送球は安定する。でも足の速い打者には間に合わない。' },
      { id: 'wild', l: '落とす場所は決めず、とにかく低く', s: -1, to: 'first', fb: '一塁手の手前で何回もはねる。後ろへそれれば二塁へ。', r: { out: 0, adv: 0, extra: 1, msg: 'それた！' } },
    ] },
    not: { opts: [
      { id: 'stay', s: 3, fb: 'ランナーがいないなら、そのまま次に備える。' },
      { id: 'third-base', s: 1, fb: 'ランナーはいない。ベースに入る場面じゃない。' },
      { id: 'chase', s: -1, fb: 'ほかの人のボール。' },
    ] },
    outcomes: [
      { kind: 'ball', play: '三塁線への強いゴロ！ベースの前で逆シングル', area: 'line3', w: 3 },
      { kind: 'not', play: 'ショートゴロ', area: 'short', by: 'short', w: 1 },
    ],
    key: 'ワンバン送球は「落とす場所」まで決めて投げる',
    why: '届くならノーバン、あやしければワンバン。ワンバンは、はねる場所で良い送球にも悪い送球にもなる。ベースの3〜4m手前なら、一塁手はベースについたまま捕れる。',
    axes: { ball: ['risk'], not: ['cover'] },
  },
  {
    id: 'real-0913-pb', role: 'pitcher', side: 'def', real: true, src: '9/13 グランツ戦 1回ウラ',
    sit: { inning: 1, half: '裏', us: 0, them: 0, outs: 1, runners: R(null, 'fast'), defense: '定位置', batter: '3番' },
    note: '0対0。四球で出たランナーが盗塁で二塁にいる。',
    ball: { opts: [
      { id: 'first', s: 3, fb: 'ピッチャーゴロは一塁で確実に。', r: { out: 1, adv: 1, msg: 'アウト！' } },
      { id: 'third', s: 1, fb: 'ランナーが飛び出していれば刺せる。見ずに投げると全員セーフ。' },
      { id: 'hold', s: 0, fb: 'アウトが増えない。' },
    ] },
    not: { opts: [
      { id: 'cover-home', s: 3, fb: 'キャッチャーが離れたホームを守れるのはピッチャーだけ。', r: { out: 0, adv: 1, msg: '三塁で止めた！' } },
      { id: 'stay', s: 0, fb: 'ホームが空いている。ランナーは一気に2つ進める。', r: { out: 0, adv: 2, msg: 'ホームイン…' } },
      { id: 'chase', s: -1, fb: '2人で追うとホームにだれもいない。', r: { out: 0, adv: 2, msg: 'ホームががら空き！' } },
    ] },
    outcomes: [
      { kind: 'not', play: 'キャッチャーが投球を後ろへそらした！', area: 'backstop', by: 'catcher', noOut: true, w: 2 },
      { kind: 'ball', play: 'ピッチャー正面へのゴロ', area: 'pitcher', w: 1 },
    ],
    key: 'ランナー二塁・三塁でそらしたら、ピッチャーはホームへ',
    why: '考えてから動くと間に合わない。投げる前に「そらしたらホーム」と決めておく。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'real-0913-2out', role: 'pitcher', side: 'def', real: true, src: '9/13 グランツ戦 2回ウラ',
    sit: { inning: 2, half: '裏', us: 0, them: 0, outs: 2, runners: R('fast'), defense: '定位置', batter: '8番' },
    note: '三振を2つ取ったあとの四球。相手はよく走ってくる。',
    ball: { opts: [
      { id: 'first', s: 3, fb: '2アウト。打者をアウトにすればチェンジ。' },
      { id: 'second', s: 1, fb: '走っているランナーは、もう二塁に着いている。' },
      { id: 'hold', s: 0, fb: 'アウトが増えない。' },
    ] },
    not: { q: 'ランナーが走ったら？', opts: [
      { id: 'stay', l: '追わない。打者に低めを投げる', s: 3, fb: '2アウトのランナーは追いかけない。打者を打ち取ればチェンジ。', r: { out: 1, adv: 1, msg: '三振！チェンジ' } },
      { id: 'pickoff', l: 'けん制を何球もつづける', s: 1, fb: 'リードは小さくなる。でも自分のリズムのほうがくずれる。', r: { out: 0, adv: 1, msg: '走られた' } },
      { id: 'quick', l: '全部の球を急いで投げる', s: 0, fb: '急ぐほど球は高くうく。四球でランナーが2人になる。', r: { out: 0, adv: 1, walk: true, msg: '四球…' } },
    ] },
    outcomes: [
      { kind: 'not', play: '一塁ランナーがスタートを切った！', area: 'home', noOut: true, w: 2 },
      { kind: 'ball', play: 'ピッチャー前のゴロ', area: 'pitcher', w: 1 },
    ],
    key: '2アウトのランナーは追いかけない。打者を打ち取ればチェンジ',
    why: 'ランナーが二塁へ進んでも、打者をアウトにすれば点は入らない。投げる相手は打者。',
    axes: { ball: ['target'], not: ['runner', 'risk'] },
  },
  {
    id: 'real-0921-loaded', role: 'pitcher', side: 'def', real: true, src: '9/21 小樽中央戦 3回オモテ',
    sit: { inning: 3, half: '表', us: 1, them: 5, outs: 1, runners: R('normal', 'normal', 'normal'), defense: '定位置', batter: '4年生' },
    note: 'イニングの途中でマウンドへ。バントの処理でアウトが取れず満塁。',
    ball: { opts: [
      { id: 'home', s: 3, fb: '満塁はどこもフォース。ホームは踏むだけでアウト、点も入らない。', r: { out: 1, adv: 0, load: true, msg: 'ホームでアウト！' } },
      { id: 'first', s: 1, fb: 'アウトは増えるが1点入る。', r: { out: 1, adv: 1, msg: 'アウト。でも1点' } },
      { id: 'hold', s: 0, fb: '全員が走っている。見ている間に1点。' },
      { id: 'tag', s: -1, fb: 'フォースだからタッチはいらない。追いつけない。', r: { out: 0, adv: 1, msg: '追いつけない！' } },
    ] },
    not: { opts: [
      { id: 'cover-home', s: 3, fb: '三塁ランナーがいる。そらしたらホームへ。', r: { out: 0, adv: 0, msg: 'ランナーを止めた！' } },
      { id: 'stay', s: 0, fb: 'ホームが空く。1点。', r: { out: 0, adv: 1, msg: 'ホームイン…' } },
      { id: 'chase', s: -1, fb: 'ホームにだれもいない。', r: { out: 0, adv: 2, msg: '2点入った！' } },
    ] },
    outcomes: [
      { kind: 'ball', play: 'ピッチャー正面へのゴロ！', area: 'pitcher', w: 2 },
      { kind: 'not', play: 'キャッチャーが後ろへそらした！', area: 'backstop', by: 'catcher', noOut: true, w: 1 },
    ],
    key: '満塁で自分にゴロが来たら、ホーム',
    why: '満塁では打った瞬間に全員が走る。捕ってから考えると間に合わない。投げる前に決めておく。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'real-0926-fly-a', role: 'right', side: 'def', real: true, pair: 'tw-rf', pairRole: 'a', src: '9/26 グランツ戦 2回オモテ',
    sit: { inning: 2, half: '表', us: null, them: null, outs: 2, runners: R('normal'), defense: '定位置', batter: '5年生' },
    note: '2アウト。一塁ランナーは、打った瞬間に走り出す。',
    ball: { q: 'フライが来たら、どう捕る？', opts: [
      { id: 'sure', l: '早く入って止まり、頭の上で確実に', s: 3, fb: '捕ればチェンジ。投げる必要はない。一番落としにくい捕り方を選ぶ。' },
      { id: 'charge', l: '前へ走りながら捕って、すぐ投げる形', s: 1, fb: 'ランナーを刺したい場面なら正しい。でもここは捕ったら3アウト。', r: { out: 1, adv: 0, msg: 'アウト！' } },
      { id: 'onebound', l: '無理せずワンバウンドで捕る', s: 0, fb: '捕ればチェンジの打球をヒットにしてしまう。', r: { out: 0, adv: 2, msg: 'ヒットになった' } },
      { id: 'peek', l: 'ランナーを見ながら片手で', s: -1, fb: 'ボールから目をはなすと落とす。2アウトのランナーは還ってくる。', r: { out: 0, adv: 3, msg: '落とした！' } },
    ] },
    not: { opts: [
      { id: 'backup-first', s: 3, fb: '内野ゴロのとき、ライトは一塁の後ろへ。' },
      { id: 'stay', s: 1, fb: '悪くないが、一塁の後ろにいればもっと安心。' },
      { id: 'chase', s: -1, fb: '内野のボールは追わない。' },
    ] },
    outcomes: [
      { kind: 'ball', play: 'ライトへの高いフライ。落ちるのは定位置の少し前', area: 'right', fly: true, w: 3 },
      { kind: 'not', play: 'セカンドゴロ', area: 'second', by: 'second', w: 1 },
    ],
    key: '2アウトのフライは、投げることを考えずに確実に捕る',
    why: '2アウトのフライは、捕った瞬間にイニングが終わる。考えるのは「どう落とさないか」だけ。',
    axes: { ball: ['score'], not: ['cover'] },
  },
  {
    id: 'real-0926-fly-b', role: 'right', side: 'def', real: true, whatIf: true, pair: 'tw-rf', pairRole: 'b', src: '9/26 グランツ戦の「もしも」',
    sit: { inning: 2, half: '表', us: null, them: null, outs: 1, runners: R(null, null, 'normal'), defense: '定位置', batter: '5年生' },
    note: 'もしも1アウト三塁だったら。三塁ランナーはベースについて、捕るのを待っている。',
    ball: { q: '同じフライ。捕ったら、どこへ投げる？', opts: [
      { id: 'cut', s: 3, fb: '前へ出ながら捕って、カットマンへ低く強く。本塁で勝負できる。', r: { out: 2, adv: 0, msg: 'ホームでアウト！' } },
      { id: 'home', s: 1, fb: 'ライトから直接は遠い。山なりになって間に合わない。', r: { out: 1, adv: 1, msg: '間に合わない' } },
      { id: 'second', s: -1, fb: '1点が入る。三塁ランナーを忘れている。', r: { out: 1, adv: 1, msg: 'ホームイン…' } },
      { id: 'hold', s: 0, fb: 'ランナーは歩いてでもホームに還る。', r: { out: 1, adv: 1, msg: 'ホームイン…' } },
    ] },
    not: { opts: [
      { id: 'backup-first', s: 3, fb: '内野ゴロのとき、ライトは一塁の後ろへ。' },
      { id: 'stay', s: 1, fb: '悪くないが、一塁の後ろにいればもっと安心。' },
      { id: 'chase', s: -1, fb: '内野のボールは追わない。' },
    ] },
    outcomes: [
      { kind: 'ball', play: 'さっきと同じ、ライトへの高いフライ', area: 'right', fly: true, w: 3 },
      { kind: 'not', play: 'セカンドゴロ', area: 'second', by: 'second', w: 1 },
    ],
    key: 'タッチアップがある場面のフライは、後ろから前へ出ながら捕る',
    why: '三塁ランナーは捕った瞬間にスタートする。捕ってから投げるまでが短いほど、本塁で刺せる。',
    axes: { ball: ['score', 'target'], not: ['cover'] },
  },
  {
    id: 'real-0926-run', role: 'batter', side: 'off', real: true, src: '9/26 山麓戦 4回ウラ',
    sit: { inning: 4, half: '裏', us: 5, them: 3, outs: 2, runners: R(null, 'normal'), defense: '定位置', batter: '自分' },
    note: '2アウト二塁で自分の打席。打ったあと、どこまで行くかを先に決めておく。',
    ball: { q: 'ヒットを打った。センターがホームへ高く投げたら？', opts: [
      { id: 'run-second', s: 3, to: 'second', fb: '高い送球はカットマンが止められない。その間、二塁はだれも守れない。', msg: '二塁セーフ！', gain: 1 },
      { id: 'round-first', s: 1, to: 'round1', fb: '安全。でも通った送球なら二塁へ行けた。', msg: '一塁ストップ', gain: 1 },
      { id: 'stay-first', s: 0, to: 'first', fb: 'ヒットで止まるのは、一塁を回ってから。', msg: '一塁ストップ', gain: 1 },
      { id: 'blind', l: '送球を見ずに二塁へ全力', s: -1, to: 'second', fb: 'カットされたら二塁でアウト。2アウトなので攻撃が終わる。', msg: '二塁でアウト！', gain: 0 },
    ] },
    outcomes: [{ kind: 'ball', play: 'センター前ヒット！センターはホームへ高い送球', area: 'center', throwTo: 'home', w: 1 }],
    key: '外野の送球が高ければ次の塁へ。低ければ止まる',
    why: '見るのは「投げたか」ではなく「カットマンが捕れる高さか」。一塁を回りながら送球の高さを見る。',
    axes: { ball: ['runner'] },
  },
  {
    id: 'real-0905-steal', role: 'r1', side: 'off', real: true, src: '9/5 山麓戦 2回オモテ',
    sit: { inning: 2, half: '表', us: null, them: null, outs: 2, runners: R('me', null, 'normal'), defense: '定位置', batter: '次の打者' },
    note: '自分は一塁ランナー。相手は右ピッチャーで、セットに入って止まっている。',
    ball: { q: '二塁へ盗塁。どこでスタートを切る？', opts: [
      { id: 'leg-home', l: '左足がホームへ動き出したのを見て', s: 3, to: 'second', fb: '左足がホームへ向かったら、もう一塁へは投げられない。', msg: '盗塁成功！', gain: 0 },
      { id: 'early', l: 'セットで止まったら、足が上がる前に', s: 1, to: 'second', fb: 'けん制をしない投手なら決まる。けん制が来たら戻れない。', msg: '盗塁成功', gain: 0 },
      { id: 'late', l: 'ミットに入ったのを見てから', s: 0, to: 'second', fb: 'それでは遅い。二塁で待たれる。', msg: '二塁でアウト', gain: 0, outMe: true },
      { id: 'walk', l: 'セットに入る前から歩き出す', s: -1, to: 'mid12', fb: '一塁と二塁の間ではさまれる。', msg: 'はさまれた！', gain: 0, outMe: true },
    ] },
    outcomes: [{ kind: 'ball', play: 'ピッチャーがセットに入った', area: 'home', pitchOnly: true, w: 1 }],
    key: '一塁ランナー・右ピッチャーは、左足がホームへ向かってからスタート',
    why: '二塁ランナーのときと同じ「足が動いたら出る」だと、その足が一塁へのけん制だったときに戻れない。見るのは「どっちへ動いたか」。',
    axes: { ball: ['runner', 'risk'] },
  },

  /* ───────── 双子：同じ打球、点差で変わる ───────── */
  {
    id: 'third-lead', role: 'third', side: 'def', pair: 'tw-3b', pairRole: 'a', src: '同じ打球・その1',
    sit: { inning: 6, half: '裏', us: 7, them: 2, outs: 1, runners: R(null, null, 'normal'), defense: '定位置', batter: '5番' },
    note: '5点リード。ここを乗り切れば楽になる。',
    ball: { opts: [
      { id: 'first', s: 3, fb: '5点差なら1点はあげていい。アウトを1つずつ増やす。', r: { out: 1, adv: 1, msg: 'アウト！1点はOK' } },
      { id: 'home', s: 1, fb: '定位置からの本塁送球はきわどい。5点差でとるリスクではない。', r: { out: 0, adv: 1, msg: 'セーフ…' } },
      { id: 'hold', s: 0, fb: '失点は防げるがアウトが増えない。', r: { out: 0, adv: 0, msg: 'オールセーフ' } },
      { id: 'stepthird', s: -1, fb: 'ランナー三塁だけはフォースじゃない。踏んでもアウトにならない。', r: { out: 0, adv: 1, msg: 'ホームイン！' } },
    ] },
    not: { opts: [
      { id: 'stay', s: 3, fb: 'ほかへ行ったら、そのまま構えて次に備える。' },
      { id: 'third-base', s: 1, fb: 'ランナーはベースにいる。あわてて戻る必要はない。' },
      { id: 'chase', s: -1, fb: 'ほかの人のボール。' },
    ] },
    outcomes: [
      { kind: 'ball', play: 'サード正面へのゴロ', area: 'third', w: 3 },
      { kind: 'not', play: 'セカンドゴロ', area: 'second', by: 'second', w: 1 },
    ],
    key: '点差が大きいときは、1点よりアウトを積む',
    why: '定位置のサードゴロなら一塁が一番確実。これで2アウト。',
    axes: { ball: ['score', 'target'], not: ['cover'] },
  },
  {
    id: 'third-close', role: 'third', side: 'def', pair: 'tw-3b', pairRole: 'b', src: '同じ打球・その2',
    sit: { inning: 7, half: '裏', us: 3, them: 2, outs: 1, runners: R(null, null, 'normal'), defense: '前進守備', batter: '5番' },
    note: '1点リードの最終回。ベンチの指示で前進守備。',
    ball: { opts: [
      { id: 'home', s: 3, fb: 'この1点が同点。前進守備は「ホームで刺す」と決めているから。', r: { out: 1, adv: 0, msg: 'ホームでアウト！' } },
      { id: 'hold', s: 1, fb: 'ランナーが走っていなければ悪くない。でも刺せるなら勝負。', r: { out: 0, adv: 0, msg: 'オールセーフ' } },
      { id: 'first', s: 0, fb: '最終回に同点にされてはリードの意味がない。', r: { out: 1, adv: 1, msg: '同点…' } },
      { id: 'stepthird', s: -1, fb: 'フォースじゃない。その間にホームに還られる。', r: { out: 0, adv: 1, msg: '同点！' } },
    ] },
    not: { opts: [
      { id: 'stay', s: 3, fb: 'そのまま構えて次に備える。' },
      { id: 'third-base', s: 1, fb: 'ランナーはベースにいる。' },
      { id: 'chase', s: -1, fb: 'ほかの人のボール。' },
    ] },
    outcomes: [{ kind: 'ball', play: 'さっきと同じ、サード正面へのゴロ', area: 'third', w: 1 }],
    key: '前進守備は「ホームで刺す」というサイン',
    why: '守る前に「何点差？何アウト？どこに投げる？」を声に出しておく。隊形を見れば投げる先は決まっている。',
    axes: { ball: ['score', 'target'], not: ['cover'] },
  },
  {
    id: 'cf-tie', role: 'center', side: 'def', pair: 'tw-cf', pairRole: 'a', src: '同じ打球・その1',
    sit: { inning: 7, half: '裏', us: 2, them: 2, outs: 1, runners: R(null, 'normal'), defense: '定位置', batter: '3番' },
    note: '同点の最終回。この1点でサヨナラ負け。',
    ball: { opts: [
      { id: 'cut', s: 3, fb: '低く強くカットマンへ。途中で切れるし、抜ければホームでアウトにできる。', r: { out: 1, adv: 0, msg: 'ホームでアウト！' } },
      { id: 'home', s: 0, fb: '山なりの送球は遅い。カットマンもさわれない。', r: { out: 0, adv: 2, msg: 'サヨナラ…' } },
      { id: 'second', s: -1, fb: 'この1点でサヨナラ負け。打者を止めても意味がない。', r: { out: 0, adv: 2, msg: 'サヨナラ…' } },
      { id: 'hold', s: 0, fb: '同点の最終回に、無条件で還してはいけない。', r: { out: 0, adv: 2, msg: 'サヨナラ…' } },
    ] },
    not: { opts: [
      { id: 'second-base', l: '二塁ベースの後ろへ', s: 3, fb: '内野ゴロなら、センターは二塁の後ろをカバー。' },
      { id: 'stay', s: 1, fb: '悪くないが、送球がそれたときに止められない。' },
      { id: 'chase', s: -1, fb: '内野のボールは追わない。' },
    ] },
    outcomes: [
      { kind: 'ball', play: 'センター前へ落ちるヒット', area: 'centerFront', w: 3 },
      { kind: 'not', play: 'ショートゴロ', area: 'short', by: 'short', w: 1 },
    ],
    key: '外野からの送球は低く強く。カットマンに選べるようにする',
    why: '高い送球は選べる手を1つに減らす。低ければカットマンが切ることも、そのままホームで刺すこともできる。',
    axes: { ball: ['score', 'target'], not: ['cover'] },
  },
  {
    id: 'cf-lead', role: 'center', side: 'def', pair: 'tw-cf', pairRole: 'b', src: '同じ打球・その2',
    sit: { inning: 7, half: '裏', us: 6, them: 3, outs: 1, runners: R(null, 'normal'), defense: '定位置', batter: '3番' },
    note: '3点リードの最終回。二塁ランナーはホームへ走っている。',
    ball: { opts: [
      { id: 'second', s: 3, fb: '3点差なら1点はあげていい。打者を一塁に止めるほうが大事。', r: { out: 0, adv: 2, hold1: true, msg: '打者は一塁ストップ' } },
      { id: 'cut', s: 1, fb: '悪くない。でもホームは間に合わず、打者が二塁へ行くかもしれない。', r: { out: 0, adv: 2, msg: '1点。打者は二塁へ' } },
      { id: 'home', s: 0, fb: '間に合わないホームへ投げる間に、打者は二塁へ。', r: { out: 0, adv: 2, msg: '打者は二塁へ' } },
      { id: 'hold', s: -1, fb: '持っている間に、打者まで進む。', r: { out: 0, adv: 2, msg: 'どんどん進まれた' } },
    ] },
    not: { opts: [
      { id: 'second-base', l: '二塁ベースの後ろへ', s: 3, fb: '内野ゴロなら、センターは二塁の後ろをカバー。' },
      { id: 'stay', s: 1, fb: '悪くないが、送球がそれたときに止められない。' },
      { id: 'chase', s: -1, fb: '内野のボールは追わない。' },
    ] },
    outcomes: [{ kind: 'ball', play: 'さっきと同じ、センター前ヒット', area: 'centerFront', w: 1 }],
    key: 'リードが大きいときは、ランナーより打者を止める',
    why: '3点差の1点は痛くない。こわいのは、ランナーがたまって大きな回になること。',
    axes: { ball: ['score', 'risk'], not: ['cover'] },
  },

  /* ───────── 基本の場面 ───────── */
  {
    id: 'bunt-12', role: 'pitcher', side: 'def', src: 'ノーアウト一・二塁のバント',
    sit: { inning: 3, half: '表', us: 2, them: 2, outs: 0, runners: R('normal', 'normal'), defense: 'バントシフト', batter: '2番' },
    note: '相手はバントの構え。サードが三塁ベースに入る約束。',
    ball: { opts: [
      { id: 'third', s: 3, fb: '前のランナーを三塁でフォースアウト。三塁寄りなら距離も短い。', r: { out: 1, adv: 0, load: true, msg: '三塁でアウト！' } },
      { id: 'first', s: 1, fb: '確実だが、二人とも進む。', r: { out: 1, adv: 1, msg: 'アウト。二・三塁' } },
      { id: 'second', s: 0, fb: '遠いし、セカンドが入っているか分からない。' },
      { id: 'home', s: -1, fb: 'ホームへ走っているランナーはいない。', r: { out: 0, adv: 1, msg: 'オールセーフ' } },
    ] },
    not: { opts: [
      { id: 'backup-first', l: '一塁の後ろへ', s: 3, fb: 'サードが捕ったら一塁送球。ピッチャーはそのカバーへ。', r: { out: 1, adv: 1, msg: 'アウト！' } },
      { id: 'stay', s: 1, fb: '悪くないが、まだ仕事がある。', r: { out: 1, adv: 1, msg: 'アウト' } },
      { id: 'chase', s: -1, fb: 'サードのボール。ぶつかる。', r: { out: 0, adv: 1, msg: 'ぶつかった！' } },
    ] },
    outcomes: [
      { kind: 'ball', play: 'バントはマウンドの前、三塁寄りにころがった', area: 'bunt3', w: 2 },
      { kind: 'not', play: 'バントは三塁線。サードが捕る', area: 'line3', by: 'third', w: 1 },
    ],
    key: '一・二塁のバントは、前のランナーを三塁で',
    why: '三塁ベースにサードかショートが入っているのを確かめてから投げる。いなければ一塁で確実に。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'p-cover-first', role: 'pitcher', side: 'def', src: '一塁側のゴロ',
    sit: { inning: 4, half: '表', us: 3, them: 2, outs: 1, runners: R(), defense: '定位置', batter: '左打者' },
    note: '左打者。引っぱった打球は一塁側へ飛ぶ。',
    ball: { opts: [
      { id: 'first', s: 3, fb: 'ランナーなしのピッチャーゴロは一塁へ。' },
      { id: 'hold', s: -1, fb: '投げなければアウトにならない。' },
    ] },
    not: { opts: [
      { id: 'first-base', s: 3, fb: 'ファーストが打球を追ったら、一塁ベースに入るのはピッチャー。' },
      { id: 'backup-home', s: 0, fb: 'ランナーはいない。ホームのカバーはいらない。', r: { out: 0, adv: 0, msg: 'だれもベースにいない！' } },
      { id: 'stay', s: -1, fb: 'ベースにだれもいない。打者はセーフ。', r: { out: 0, adv: 0, msg: 'だれもベースにいない！' } },
    ] },
    outcomes: [
      { kind: 'not', play: '一塁線のゴロ！ファーストがベースを離れて捕る', area: 'line1', by: 'first', toMe: true, w: 2 },
      { kind: 'ball', play: 'ピッチャーゴロ', area: 'pitcher', w: 1 },
    ],
    key: '一塁側へ打球が飛んだら、ピッチャーは一塁ベースへ走る',
    why: '打球が自分の左へ行ったら、考える前に一塁へ走り出す。ファーストが自分で踏めるなら止まればいい。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'ss-dp', role: 'short', side: 'def', src: '1アウト一塁のショートゴロ',
    sit: { inning: 5, half: '表', us: 1, them: 1, outs: 1, runners: R('normal'), defense: '定位置', batter: '6番' },
    note: '同点の5回。ここを2つ取れればチェンジ。',
    ball: { opts: [
      { id: 'second', s: 3, fb: '二塁でまず1つ。一塁へつないでダブルプレー。', r: { out: 2, adv: 0, msg: 'ダブルプレー！' } },
      { id: 'first', s: 1, fb: 'アウトは1つ。ランナーは二塁へ進む。', r: { out: 1, adv: 1, msg: 'アウト。ランナー二塁' } },
      { id: 'hold', s: 0, fb: 'アウトが増えない。' },
      { id: 'third', s: -1, fb: '三塁へ走っているランナーはいない。', r: { out: 0, adv: 1, msg: 'オールセーフ' } },
    ] },
    not: { opts: [
      { id: 'second-base', s: 3, fb: 'セカンドゴロなら、二塁ベースに入るのはショート。', r: { out: 2, adv: 0, msg: 'ダブルプレー！' } },
      { id: 'stay', s: 0, fb: '二塁ベースにだれもいない。', r: { out: 1, adv: 1, msg: 'アウトは1つだけ' } },
      { id: 'chase', s: -1, fb: 'セカンドのボール。二塁が空く。', r: { out: 0, adv: 1, msg: 'オールセーフ' } },
    ] },
    outcomes: [
      { kind: 'ball', play: 'ショート正面へのゴロ', area: 'short', w: 2 },
      { kind: 'not', play: 'セカンドゴロ', area: 'second', by: 'second', to: 'second', w: 1 },
    ],
    key: '一塁にランナーがいたら、ゴロは二塁から',
    why: '自分に来たら二塁へ。来なかったら自分が二塁ベースへ。どちらでも体は二塁に向かう。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: '2b-bunt', role: 'second', side: 'def', src: 'ノーアウト一塁のバント',
    sit: { inning: 2, half: '表', us: 0, them: 0, outs: 0, runners: R('normal'), defense: 'バントシフト', batter: '9番' },
    note: '相手はバントの構え。ファーストは前に出ている。',
    ball: { q: 'セカンドゴロが来たら？', opts: [
      { id: 'second', s: 3, fb: '一塁ランナーを二塁でフォースアウト。', r: { out: 1, adv: 0, load: true, msg: '二塁でアウト！' } },
      { id: 'first', s: 1, fb: '確実。ただしランナーは二塁へ進む。', r: { out: 1, adv: 1, msg: 'アウト。ランナー二塁' } },
      { id: 'hold', s: 0, fb: 'アウトが増えない。' },
    ] },
    not: { q: 'バントなら？', opts: [
      { id: 'first-base', s: 3, fb: 'ファーストが前に出たら、一塁ベースに入るのはセカンド。', r: { out: 1, adv: 1, msg: 'アウト！' } },
      { id: 'second-base', s: 1, fb: '二塁はショートが入る。一塁がだれもいなくなる。', r: { out: 0, adv: 1, msg: '一塁にだれもいない！' } },
      { id: 'stay', s: -1, fb: '一塁にだれもいない。投げる相手がいない。', r: { out: 0, adv: 1, msg: '一塁にだれもいない！' } },
    ] },
    outcomes: [
      { kind: 'not', play: 'バントは一塁側。ファーストが前で捕る', area: 'bunt1', by: 'first', toMe: true, w: 2 },
      { kind: 'ball', play: 'バントをやめて打った。セカンドゴロ', area: 'second', w: 1 },
    ],
    key: 'バントでファーストが出たら、一塁ベースはセカンド',
    why: '前に出る人がいれば、空いたベースに入る人がいる。バントの構えを見たら、打つ前から一塁へ寄っておく。',
    axes: { ball: ['target'], not: ['cover'] },
  },
  {
    id: 'rf-backup', role: 'right', side: 'def', src: 'ランナーなしの内野ゴロ',
    sit: { inning: 3, half: '裏', us: 2, them: 1, outs: 0, runners: R(), defense: '定位置', batter: '1番・足が速い' },
    note: 'ランナーなし。ライトは「関係ない」と思いやすい場面。',
    ball: { q: 'ライト前ヒットなら？', opts: [
      { id: 'second', s: 3, fb: '二塁へ返す。打者を一塁に止める。', r: { out: 0, adv: 0, msg: '一塁ストップ' } },
      { id: 'first', s: 1, fb: '一塁を大きく回っていれば刺せることもある。それると二塁へ行かれる。', r: { out: 0, adv: 0, msg: '一塁ストップ' } },
      { id: 'hold', s: -1, fb: '持っている間に二塁まで行かれる。', r: { out: 0, adv: 0, extra: 1, msg: '二塁まで行かれた' } },
    ] },
    not: { opts: [
      { id: 'backup-first', s: 3, fb: '内野ゴロはぜんぶ一塁の後ろへ走る。それたボールを止められるのはライトだけ。' },
      { id: 'stay', s: 0, fb: '送球がそれたら、打者は二塁まで行く。', r: { out: 1, adv: 0, msg: 'アウト' } },
      { id: 'chase', s: -1, fb: '内野のボールは追わない。' },
    ] },
    outcomes: [
      { kind: 'not', play: 'ショートゴロ。一塁へ送球', area: 'short', by: 'short', w: 2 },
      { kind: 'ball', play: 'ライト前ヒット', area: 'rightFront', w: 1 },
    ],
    key: '内野ゴロのたびに、ライトは一塁の後ろへ走る',
    why: '10回走って9回は何も起きない。残りの1回で、打者を二塁へ行かせない。',
    axes: { ball: ['risk'], not: ['cover'] },
  },
  {
    id: '1b-grounder', role: 'first', side: 'def', src: '1アウト二塁のファーストゴロ',
    sit: { inning: 4, half: '裏', us: 4, them: 3, outs: 1, runners: R(null, 'normal'), defense: '定位置', batter: '7番' },
    note: '1点リード。二塁ランナーは打球を見て三塁をねらう。',
    ball: { opts: [
      { id: 'first-base', l: '自分でベースを踏む', s: 3, fb: '自分で踏めるなら一番確実。踏んだらすぐ二塁ランナーを見る。', r: { out: 1, adv: 1, msg: 'アウト！' } },
      { id: 'third', s: -1, fb: '遠い。間に合わず、打者も生きる。', r: { out: 0, adv: 1, msg: 'オールセーフ' } },
      { id: 'hold', s: 0, fb: 'アウトが増えない。' },
    ] },
    not: { opts: [
      { id: 'first-base', s: 3, fb: '内野ゴロなら、ベースに入って送球を待つ。' },
      { id: 'stay', s: -1, fb: 'ベースにいないと、送球を受けられない。', r: { out: 0, adv: 1, msg: 'ベースにいない！' } },
      { id: 'chase', s: -1, fb: 'ショートのボール。', r: { out: 0, adv: 1, msg: 'ベースにいない！' } },
    ] },
    outcomes: [
      { kind: 'ball', play: 'ファースト正面へのゴロ', area: 'first', w: 2 },
      { kind: 'not', play: 'ショートゴロ', area: 'short', by: 'short', toMe: true, w: 1 },
    ],
    key: 'ファーストゴロは、踏めるなら自分で踏む',
    why: 'トスは落とすことがある。自分で踏めば、すぐ次のランナーを見られる。',
    axes: { ball: ['target', 'risk'], not: ['cover'] },
  },

  /* ───────── 攻撃 ───────── */
  {
    id: 'r2-2out', role: 'r2', side: 'off', src: '2アウト二塁でレフト前',
    sit: { inning: 5, half: '表', us: 1, them: 2, outs: 2, runners: R(null, 'me'), defense: '定位置', batter: '4番' },
    note: '1点ビハインド。自分は二塁ランナー。',
    ball: { q: 'ヒットが出たら？', opts: [
      { id: 'go-home', l: '打った瞬間から全力でホームへ', s: 3, to: 'home', fb: '2アウトは打った瞬間にスタート。迷わずホーム。', msg: '同点！', gain: 1 },
      { id: 'stop-third', l: '三塁で止まって様子を見る', s: 1, to: 'third', fb: '安全。でも2アウトで止まると、次の打者にかけることになる。', msg: '三塁ストップ', gain: 0 },
      { id: 'watch', l: '打球が落ちるのを見てから走る', s: 0, to: 'third', fb: '2アウトなら見る必要はない。その一歩で三塁止まり。', msg: '三塁止まり', gain: 0 },
      { id: 'back', l: '二塁へ戻る', s: -1, to: 'second', fb: '2アウトで戻る理由はない。', msg: '進めなかった', gain: 0 },
    ] },
    outcomes: [{ kind: 'ball', play: 'レフト前ヒット！', area: 'leftFront', w: 1 }],
    key: '2アウトのランナーは、打った瞬間にスタート',
    why: 'フライでもゴロでも、捕られたらどうせチェンジ。だから打球を見ずに走れる。',
    axes: { ball: ['runner', 'score'] },
  },
  {
    id: 'r3-tagup', role: 'r3', side: 'off', src: '1アウト三塁で外野フライ',
    sit: { inning: 6, half: '表', us: 2, them: 2, outs: 1, runners: R(null, null, 'me'), defense: '定位置', batter: '5番' },
    note: '同点。自分は三塁ランナー。',
    ball: { q: '深い外野フライが上がったら？', opts: [
      { id: 'tag', l: 'ベースに戻り、捕った瞬間にスタート', s: 3, to: 'home', fb: 'タッチアップ。ベースについて、捕るのを見てから。', msg: '勝ちこし！', gain: 1 },
      { id: 'half', l: 'ベースを離れて、落ちるか見る', s: 0, to: 'third', fb: '捕られたら戻るだけ。タッチアップの1点を逃す。', msg: '戻っただけ', gain: 0 },
      { id: 'stay', l: '三塁ベースから動かない', s: 1, to: 'third', fb: 'アウトにはならない。でも深いフライなら還れた。', msg: '三塁のまま', gain: 0 },
      { id: 'go', l: '打った瞬間にホームへ走る', s: -1, to: 'home', fb: '捕られたら三塁に戻れない。ダブルプレー。', msg: 'ダブルプレー！', gain: 0 },
    ] },
    outcomes: [{ kind: 'ball', play: 'センターへの深いフライ', area: 'centerDeep', fly: true, w: 1 }],
    key: '1アウト三塁のフライは、ベースに戻ってタッチアップ',
    why: 'ノーアウト・1アウトでフライが上がったら、まずベースへ。捕るのを見てから走る。',
    axes: { ball: ['runner'] },
  },
  {
    id: 'r1-liner', role: 'r1', side: 'off', src: '1アウト一塁でライナー',
    sit: { inning: 3, half: '表', us: 0, them: 1, outs: 1, runners: R('me'), defense: '定位置', batter: '3番' },
    note: '自分は一塁ランナー。リードを取っている。',
    ball: { q: '内野の頭の高さのライナーが飛んだら？', opts: [
      { id: 'back', l: 'まず一歩戻る', s: 3, to: 'first', fb: 'ライナーバック。捕られたら戻れないので、まず戻る。抜けてから走っても間に合う。', msg: '戻ってセーフ', gain: 0 },
      { id: 'freeze', l: 'その場で止まって見る', s: 1, to: 'lead1', fb: '悪くない。でも捕られたら一塁へ投げられる。', msg: 'きわどい', gain: 0 },
      { id: 'go', l: 'そのまま二塁へ走る', s: -1, to: 'mid12', fb: '捕られたら一塁に戻れない。ダブルプレー。', msg: 'ダブルプレー！', gain: 0, outMe: true },
    ] },
    outcomes: [{ kind: 'ball', play: 'セカンドの頭の上へライナー！捕られた', area: 'second', w: 1 }],
    key: 'ライナーは、まず戻る',
    why: 'ゴロは走る、フライはハーフウェイ、ライナーは戻る。打球の高さで体が動くようにしておく。',
    axes: { ball: ['runner', 'risk'] },
  },
  {
    id: 'r2-grounder', role: 'r2', side: 'off', src: 'ノーアウト二塁でゴロ',
    sit: { inning: 4, half: '表', us: 2, them: 2, outs: 0, runners: R(null, 'me'), defense: '定位置', batter: '2番' },
    note: '同点、ノーアウト。自分は二塁ランナー。',
    ball: { q: '自分より三塁側（ショート・サード）へゴロが飛んだら？', opts: [
      { id: 'hold', l: '止まって、二塁へ戻れる位置にいる', s: 3, to: 'second', fb: '自分の前（三塁側）のゴロは止まる。走ると三塁でタッチされる。', msg: '二塁のまま', gain: 0 },
      { id: 'half', l: '少し出て、一塁へ投げたら三塁へ', s: 1, to: 'third', fb: '投げたのを見てから走れば行けることもある。きわどい。', msg: '三塁セーフ', gain: 0 },
      { id: 'go', l: '打った瞬間に三塁へ走る', s: -1, to: 'third', fb: 'ボールを持った人の前へ走ることになる。三塁でアウト。', msg: '三塁でアウト！', gain: 0, outMe: true },
    ] },
    outcomes: [{ kind: 'ball', play: 'ショート正面へのゴロ', area: 'short', w: 1 }],
    key: '二塁ランナーは、自分より右のゴロで進む。左のゴロは止まる',
    why: 'セカンド・ファースト側のゴロは、ボールが自分から遠ざかるので三塁へ行ける。ショート・サード側は、ボールのほうへ走ることになる。',
    axes: { ball: ['runner', 'risk'] },
  },
];

/** RICH に、旧アプリから移した判断の場面（data/classic.js）を足したもの */
export const SCENES = [...RICH, ...CLASSIC];
export const sceneById = Object.fromEntries(SCENES.map((s) => [s.id, s]));
