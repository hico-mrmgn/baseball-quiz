// 保護者の管理画面の入口（/season/admin/）。選手の画面（/season/）の main.js とは別に動く。

import { renderAdmin, ADMIN_TABS } from './admin.js';
import { initCloud, onRemoteChange, onPasswordRecovery, onCloud, signedIn, cloud, isChild } from './cloud.js';
import { passwordRecoveryModal } from './account.js';

const app = document.getElementById('app');
const tabs = document.getElementById('tabs');

function route() {
  const hash = (location.hash || '#/overview').replace(/\?.*$/, '');
  const [, name, arg] = hash.split('/');
  const tab = ADMIN_TABS.some((t) => t.id === name) ? name : 'overview';
  // ログインが要るあいだは、メニューを出さない
  const gated = (cloud().enabled && !signedIn()) || isChild();
  tabs.classList.toggle('hide', gated);
  tabs.innerHTML = ADMIN_TABS.map((t) => `<a href="#/${t.id}" class="${t.id === tab ? 'on' : ''}">${t.ic}<span>${t.label}</span></a>`).join('');
  app.className = `screen a-${tab}`;
  app.innerHTML = '';
  window.scrollTo(0, 0);
  renderAdmin(app, tab, arg ? decodeURIComponent(arg) : undefined);
}

window.addEventListener('hashchange', route);
route();

const quiet = () => document.activeElement?.matches?.('input, textarea, select') || document.querySelector('.modal');
onRemoteChange(() => { if (!quiet()) route(); });
onPasswordRecovery(() => passwordRecoveryModal());
let lastWho = '';
onCloud((C) => {
  const who = `${C.ready}|${C.enabled}|${C.member?.family_id ?? ''}|${C.member?.role ?? ''}`;
  if (who !== lastWho) { lastWho = who; if (!document.activeElement?.matches?.('input, textarea, select')) route(); }
});
initCloud();
