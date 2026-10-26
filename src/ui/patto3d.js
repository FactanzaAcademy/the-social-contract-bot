// Patto in 3D: nel benvenuto e poi in piedi accanto alla casella di scrittura. Una sola istanza
// <model-viewer> viva, spostata dove serve: più contesti WebGL costano e i browser ne tengono pochi.
// Senza WebGL o con prefers-reduced-motion resta l'immagine statica (stesso Patto, stessa inquadratura)
// e model-viewer non viene nemmeno scaricato.
import { h } from './dom.js';

// la build mette la versione nell'indirizzo (tools/build.js); senza build valgono i nomi semplici
const POSTER = typeof __PATTO_POSTER__ === 'string' ? __PATTO_POSTER__ : 'patto/patto-poster.webp';
const GLB = typeof __PATTO_GLB__ === 'string' ? __PATTO_GLB__ : 'patto/patto.glb';
const LIB = 'vendor/model-viewer.min.js';

// stato → animazione. "riposo" è "Idle" (respiro e leggero ondeggiare, creata in Blender da tools/patto/idle.py,
// in ciclo); le altre sono di Meshy. Finita un'animazione che non va in ciclo, Patto torna a riposo.
const STATI = {
  saluto: { anim: 'Big_Wave_Hello', volte: 1 },
  confuso: { anim: 'Confused_Scratch', volte: 1 },
  attesa: { anim: 'Walking', volte: Infinity },
  riposo: { anim: 'Idle', volte: Infinity },
};

// ?statico nell'indirizzo forza l'immagine di ripiego (per provarla)
const statico = () => new URLSearchParams(location.search).has('statico');
const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function webgl() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    gl?.getExtension('WEBGL_lose_context')?.loseContext(); // libera subito il contesto di prova
    return !!gl;
  } catch {
    return false;
  }
}

export function createPatto() {
  const attivo = !statico() && !reduceMotion() && webgl();
  let mv = null; // l'unico <model-viewer>
  let caricamento = null;
  let slotVivo = null; // il riquadro che ora contiene model-viewer
  let destinazione = null; // l'ultimo riquadro chiesto, anche prima che model-viewer sia pronto
  let stato = 'riposo';

  function applica(nuovo) {
    const s = STATI[nuovo];
    if (!mv?.loaded || !s) return;
    if (nuovo === 'riposo' && stato === 'riposo' && mv.animationName === s.anim) return; // già a riposo: il ciclo continua
    mv.animationName = s.anim;
    mv.play({ repetitions: s.volte });
    mv.currentTime = 0; // dopo play(): cambiando animazione model-viewer non riparte sempre da capo
  }

  function carica() {
    return new Promise((resolve, reject) => {
      const script = h('script', { type: 'module', src: LIB, onerror: reject });
      document.head.append(script);
      customElements.whenDefined('model-viewer').then(resolve);
    }).then(() => {
      // Il decodificatore meshopt è già dentro model-viewer: la libreria vuole solo uno script da caricare
      // prima di usarlo (altrimenti lo cerca su un CDN). Uno script vuoto basta.
      customElements.get('model-viewer').meshoptDecoderLocation = 'data:text/javascript,';
      mv = h('model-viewer', {
        src: GLB, poster: POSTER, alt: '', 'aria-hidden': 'true', loading: 'eager', reveal: 'auto',
        'camera-target': '0.15m 0.76m 0m', 'camera-orbit': '0deg 84deg 3.05m', 'field-of-view': '30deg',
        'min-camera-orbit': 'auto auto 3.05m', 'max-camera-orbit': 'auto auto 3.05m',
        'disable-zoom': true, 'disable-pan': true, 'disable-tap': true, 'interaction-prompt': 'none',
        'shadow-intensity': '0.55', 'shadow-softness': '1', exposure: '1.05', 'animation-crossfade-duration': '350',
      });
      mv.addEventListener('load', () => applica(stato), { once: true });
      // finito il saluto (o il dubbio) Patto torna a riposo
      mv.addEventListener('finished', () => {
        stato = 'riposo';
        applica('riposo');
      });
      // se il modello non arriva, restano le immagini statiche
      mv.addEventListener('error', () => { slotVivo?.classList.remove('vivo'); mv.remove(); mv = null; slotVivo = null; });
      if (destinazione) monta(destinazione);
    }).catch(() => {});
  }

  function monta(slot) {
    if (!mv) return;
    slotVivo?.classList.remove('vivo');
    slot.append(mv);
    slot.classList.add('vivo');
    slotVivo = slot;
  }

  // nuovo posto per Patto: un riquadro con l'immagine statica (grande = benvenuto)
  const slot = ({ grande = false, ...attrs } = {}) =>
    h('div', { class: `avatar${grande ? ' grande' : ''}`, 'aria-hidden': 'true', ...attrs },
      h('img', { src: POSTER, alt: '', width: 240, height: 288, decoding: 'async', draggable: 'false' }));

  return {
    slot,
    // sposta il Patto 3D in questo riquadro e gli fa fare l'animazione dello stato
    vivo(el, nuovo = 'riposo') {
      if (!attivo) return;
      destinazione = el;
      if (mv) monta(el);
      else if (!caricamento) {
        // dopo il primo disegno: la chat non aspetta il modello
        caricamento = new Promise((r) => ('requestIdleCallback' in window ? requestIdleCallback(r, { timeout: 1500 }) : setTimeout(r, 300))).then(carica);
      }
      applica(nuovo);
      stato = nuovo;
    },
    stato(nuovo) {
      applica(nuovo);
      stato = nuovo;
    },
  };
}
