import { today } from './store.js';
import { mountSim, buildDaily, buildFree } from './sim.js';
import { renderHome, renderGrowth, renderDrills, renderSeason, renderGame, renderParent } from './screens.js';
import { renderLearn, renderLearnScenes, renderQuizPick, renderQuiz, renderFormList, renderForm } from './learn.js';
import { icon } from './ui.js';

const app = document.getElementById('app');
const tabs = document.getElementById('tabs');

const TABS = [
  { hash: '#/home', label: 'ホーム', ic: icon.home },
  { hash: '#/learn', label: 'まなぶ', ic: icon.learn },
  { hash: '#/growth', label: '成長', ic: icon.growth },
  { hash: '#/drills', label: '自主練', ic: icon.drill },
  { hash: '#/season', label: 'シーズン', ic: icon.season },
];

const KNOWN = ['home', 'learn', 'growth', 'drills', 'season', 'game', 'parent', 'play', 'quiz', 'form'];

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
  else if (name === 'parent') renderParent(app, a === 'game' ? b : null);
  else renderHome(app);
}

window.addEventListener('hashchange', route);
route();
