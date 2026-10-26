// Punto di ingresso dell'interfaccia.
import { mountChat } from './chat.js';
import { mountVerifier } from './verifier.js';
import { h } from './dom.js';
import { icon } from './icons.js';
import { loadSemantic } from '../semantic/browser-load.js';
import { loadConfig } from '../log/logger.js';

const app = document.getElementById('app');
const panels = {};
const tabs = {};

const lightbox = h('div', { class: 'lightbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Carta ingrandita', onclick: () => closeLightbox() }, h('img', { alt: '' }));
const closeLightbox = () => lightbox.classList.remove('open');
const openImage = (src) => {
  lightbox.querySelector('img').src = src;
  lightbox.classList.add('open');
};
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeLightbox());

function select(id) {
  for (const k of Object.keys(panels)) {
    panels[k].hidden = k !== id;
    tabs[k].setAttribute('aria-selected', String(k === id));
  }
  seg.dataset.active = id;
}

// stato della comprensione semantica: un pallino discreto con descrizione accessibile
const status = h('span', { class: 'sem', role: 'status', 'data-stato': 'attesa' }, h('i'), h('span', { class: 'sem-text' }, ''));
const newChat = h('button', { class: 'iconbtn', type: 'button', 'aria-label': 'Nuova chat', title: 'Nuova chat', html: icon('refresh', { size: 18 }) });

const seg = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Sezioni', 'data-active': 'chat' },
  (tabs.chat = h('button', { class: 'seg-btn', role: 'tab', 'aria-selected': 'true', 'aria-controls': 'p-chat', onclick: () => select('chat'), html: `${icon('chat', { size: 16 })}<span>Chat</span>` })),
  (tabs.verifica = h('button', { class: 'seg-btn', role: 'tab', 'aria-selected': 'false', 'aria-controls': 'p-verifica', onclick: () => select('verifica'), html: `${icon('tools', { size: 16 })}<span>Strumenti</span>` })),
  h('span', { class: 'seg-thumb', 'aria-hidden': 'true' }));

const header = h('header', { class: 'top' },
  h('div', { class: 'brandbar' },
    h('div', { class: 'brandmark' },
      h('picture', {},
        h('img', { src: 'brand/tsc-logo-3d.web.png', alt: 'The Social Contract', width: 960, height: 178 })),
      h('span', { class: 'kicker' }, 'Assistente alle regole')),
    h('div', { class: 'actions' }, status, newChat)),
  seg);

panels.chat = h('section', { class: 'panel chatpanel', id: 'p-chat', role: 'tabpanel', 'aria-label': 'Chat' });
panels.verifica = h('section', { class: 'panel', id: 'p-verifica', role: 'tabpanel', 'aria-label': 'Strumenti', hidden: true });
const verWrap = h('div', { class: 'verifier' });
panels.verifica.append(verWrap);

app.append(header, panels.chat, panels.verifica, lightbox, h('div', { class: 'grain', 'aria-hidden': 'true' }));

const verifier = mountVerifier(verWrap);
const chat = mountChat(panels.chat, {
  openVerifier: (pre) => { verifier.open(pre); select('verifica'); },
  onImage: openImage,
  onStarted: (on) => (app.dataset.started = on ? '1' : ''),
});
newChat.addEventListener('click', () => { select('chat'); chat.reset(); });

// Comprensione semantica: parte dopo il primo disegno della pagina.
const setStatus = ({ stato, progresso }) => {
  status.dataset.stato = stato;
  const text = stato === 'caricamento' ? `Preparo la ricerca ${Math.round(progresso * 100)}%` : stato === 'attivo' ? 'Ricerca avanzata attiva' : 'Ricerca di base';
  status.querySelector('.sem-text').textContent = text;
  status.title = `${text}: un piccolo modello che gira nel tuo browser, senza inviare dati.`;
};
const start = () => loadSemantic('model/', setStatus);
if ('requestIdleCallback' in window) requestIdleCallback(start, { timeout: 1500 });
else setTimeout(start, 300);

// Registro anonimo: attivo solo se config.json lo configura.
loadConfig('config.json').then(() => chat.updateNote());

// Strada A (facoltativa): Haiku sceglie tra le voci tramite il Worker, se config.json ha "ai": {"url": "…"}.
fetch('config.json', { cache: 'no-store' })
  .then((r) => (r.ok ? r.json() : {}))
  .then((cfg) => chat.setAi(cfg?.ai?.url))
  .catch(() => {});
