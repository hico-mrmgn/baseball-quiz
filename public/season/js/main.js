import { today } from './store.js';
import { mountSim, buildDaily, buildFree } from './sim.js';
import { renderHome, renderGrowth, renderDrills, renderSeason, renderGame, renderParent } from './screens.js';
import { icon } from './ui.js';

const app = document.getElementById('app');
const tabs = document.getElementById('tabs');

const TABS = [
  { hash: '#/home', label: 'ホーム', ic: icon.home },
  { hash: '#/growth', label: '成長', ic: icon.growth },
  { hash: '#/drills', label: '自主練', ic: icon.drill },
  { hash: '#/season', label: 'シーズン', ic: icon.season },
];

function route() {
  const hash = (location.hash || '#/home').replace(/\?.*$/, '');
  const [, name, a, b] = hash.split('/');
  const playing = name === 'play';
  document.body.classList.toggle('playing', playing);
  tabs.innerHTML = TABS.map((t) => `<a href="${t.hash}" class="${hash.startsWith(t.hash) || (t.hash === '#/season' && name === 'game') ? 'on' : ''}">${t.ic}<span>${t.label}</span></a>`).join('');
  app.className = `screen s-${name}`;
  app.innerHTML = '';
  window.scrollTo(0, 0);

  if (playing) {
    const set = a === 'daily' ? buildDaily(today()) : buildFree(decodeURIComponent(b ?? 'all'));
    mountSim(app, set, { onExit: () => { location.hash = '#/home'; } });
  } else if (name === 'growth') renderGrowth(app);
  else if (name === 'drills') renderDrills(app);
  else if (name === 'season') renderSeason(app);
  else if (name === 'game') renderGame(app, a);
  else if (name === 'parent') renderParent(app, a === 'game' ? b : null);
  else renderHome(app);
}

window.addEventListener('hashchange', route);
route();
