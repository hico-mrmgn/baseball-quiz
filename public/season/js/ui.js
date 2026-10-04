// 画面づくりの小道具。

import { sfx } from './sound.js';

export function h(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const I = (d, extra = '') => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
export const icon = {
  home: I('<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'),
  growth: I('<path d="M12 3l8.5 6.2-3.2 10H6.7l-3.2-10z"/><path d="M12 8l3.6 2.6-1.4 4.2H9.8l-1.4-4.2z"/>'),
  learn: I('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M20 18v3H6.5"/><path d="M9 8h6"/>'),
  drill: I('<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12"/>'),
  season: I('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  gear: I('<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.5 2 3.4 2.3-.9c.6.6 1.4 1 2.2 1.3L10 21h4l.4-2.4c.8-.3 1.6-.7 2.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3z"/>'),
  play: I('<path d="M7 4l13 8-13 8z" fill="currentColor"/>'),
  right: I('<path d="M9 5l7 7-7 7"/>'),
  left: I('<path d="M15 5l-7 7 7 7"/>'),
  x: I('<path d="M6 6l12 12M18 6L6 18"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  minus: I('<path d="M5 12h14"/>'),
  video: I('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/>'),
  sound: I('<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16 9a4 4 0 0 1 0 6"/>'),
  mute: I('<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M17 9l4 6M21 9l-4 6"/>'),
  check: I('<path d="M5 12l5 5 9-10"/>'),
  swap: I('<path d="M7 7h13l-3-3M17 17H4l3 3"/>'),
  flag: I('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'),
  pen: I('<path d="M4 20l4-1 11-11-3-3L5 16z"/>'),
  ball: I('<circle cx="12" cy="12" r="9"/><path d="M6 5.5c2.5 3 2.5 10 0 13M18 5.5c-2.5 3-2.5 10 0 13"/>'),
};

export function toast(text) {
  const el = h(`<div class="toast">${esc(text)}</div>`);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('on'));
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 300); }, 2200);
}

export function modal(inner, { onClose } = {}) {
  const wrap = h(`<div class="modal"><div class="modal-card">${inner}</div></div>`);
  const close = () => { wrap.remove(); onClose?.(); };
  wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  document.body.append(wrap);
  return { el: wrap, close };
}

export function flash(text, tone = '') {
  const el = h(`<div class="flash ${tone}"><span>${esc(text)}</span></div>`);
  document.body.append(el);
  setTimeout(() => el.remove(), 1100);
}

/** ランクが上がったことを、上がった数だけ順に知らせる */
export function rankUpModal(ups) {
  if (!ups?.length) return;
  sfx.rank();
  const u = ups[0];
  modal(`<div class="rankup"><small>成長</small><h3>${esc(u.axis.name)}</h3>
    <div class="rankrow"><span class="rk">${u.from}</span>${icon.right}<span class="rk to">${u.to}</span></div>
    <p class="muted">${esc(u.axis.hint ?? '')}</p><button class="btn primary" data-close>やった</button></div>`,
  { onClose: () => rankUpModal(ups.slice(1)) });
}

export const go = (hash) => { location.hash = hash; };
