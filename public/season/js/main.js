import { today } from './store.js';
import { mountSim, buildDaily, buildFree } from './sim.js';
import { renderHome, renderGrowth, renderDrills, renderSeason, renderGame } from './screens.js';
import { renderLearn, renderLearnScenes, renderQuizPick, renderQuiz, renderFormList, renderForm } from './learn.js';
import { icon } from './ui.js';
import { initCloud, onRemoteChange, onPasswordRecovery, isChild, onCloud } from './cloud.js';
import { renderLogin, passwordRecoveryModal } from './account.js';

const app = document.getElementById('app');
const tabs = document.getElementById('tabs');

const TABS = [
  { hash: '#/home', label: 'ホーム', ic: icon.home },
  { hash: '#/learn', label: 'まなぶ', ic: icon.learn },
  { hash: '#/growth', label: '成長', ic: icon.growth },
  { hash: '#/drills', label: '自主練', ic: icon.drill },
  { hash: '#/season', label: 'シーズン', ic: icon.season },
];

const KNOWN = ['home', 'learn', 'growth', 'drills', 'season', 'game', 'parent', 'play', 'quiz', 'form', 'login'];

function route() {
  const hash = (location.hash || '#/home').replace(/\?.*$/, '');
  const [, name, a, b] = hash.split('/');
  const playing = name === 'play' || name === 'quiz' || name === 'form';
  document.body.classList.toggle('playing', playing);
  tabs.innerHTML = TABS.map((t) => `<a href="${t.hash}" class="${hash.startsWith(t.hash) || (t.hash === '#/season' && name === 'game') || (t.hash === '#/home' && !KNOWN.includes(name)) ? 'on' : ''}">${t.ic}<span>${t.label}</span></a>`).join('');
  app.className = `screen s-${playing ? 'play' : name}`;
  app.innerHTML = '';
  window.scrollTo(0, 0);

  if (name === 'quiz') renderQuiz(app, a, b);
  else if (name === 'form') renderForm(app, a);
  else if (name === 'learn') {
    if (a === 'scenes') renderLearnScenes(app);
    else if (a === 'quiz') renderQuizPick(app);
    else if (a === 'form') renderFormList(app, b);
    else renderLearn(app);
  } else if (playing) {
    const set = a === 'daily' ? buildDaily(today()) : buildFree(decodeURIComponent(b ?? 'all'));
    // 「まなぶ」から入った練習は「まなぶ」へ、今日の試合はホームへ戻る
    mountSim(app, set, { onExit: () => { location.hash = a === 'daily' ? '#/home' : '#/learn/scenes'; } });
  } else if (name === 'growth') renderGrowth(app);
  else if (name === 'drills') renderDrills(app);
  else if (name === 'season') renderSeason(app);
  else if (name === 'game') renderGame(app, a);
  else if (name === 'login') renderLogin(app);
  else if (name === 'parent') {
    // 保護者メニューは管理画面（/season/admin/）に移した。前のリンクから来たら、そちらへ送る
    if (isChild()) { location.replace('#/home'); return; }
    const to = a === 'game' && b ? `#/games/${b}` : a === 'photos' || a === 'goals' ? '#/drills' : '#/overview';
    location.replace(`admin/${to}`);
    return;
  }
  else renderHome(app);
}

window.addEventListener('hashchange', route);
route();

// ログインと同期。設定がなければ何もせず、これまでどおり端末の中だけで動く。
// サーバーから記録が来たら描き直す（入力中・場面の途中・ログイン画面では描き直さない）
const quiet = ({ login = true } = {}) => {
  const name = (location.hash || '#/home').split('/')[1];
  const typing = document.activeElement?.matches?.('input, textarea, select');
  return typing || ['play', 'quiz', 'form', ...(login ? ['login'] : [])].includes(name) || document.querySelector('.modal');
};
onRemoteChange(() => { if (!quiet()) route(); });
onPasswordRecovery(() => passwordRecoveryModal());
let lastWho = '';
onCloud((C) => {
  // ログイン・ログアウトしたときだけ描き直す（同期の状態が変わるたびには描かない）
  const who = `${C.ready}|${C.enabled}|${C.member?.family_id ?? ''}|${C.member?.role ?? ''}`;
  if (who !== lastWho) { lastWho = who; if (!quiet({ login: false })) route(); }
});
initCloud();
