/**
 * app.js — arranque de la SPA. Monta el router y define las rutas con lazy
 * loading (cada página se descarga bajo demanda). El nav y el hero viven inline
 * en el shell (above-the-fold) y se importan acá para hidratarse.
 */
import './components/sections/nav/nav.js';
import './components/sections/hero/hero.js';
import { HomlyRouter } from 'homly';

const router = new HomlyRouter('app-root');

router.add('/', 'homly-home-page', () => import('./components/pages/home-page.js'));
router.add('/contacto', 'homly-contact-page', () => import('./components/pages/contact/contact.js'));

// El hero vive inline en el shell; se oculta fuera de la home.
const hero = document.querySelector('homly-hero');
const baseHandle = router.handleRoute.bind(router);
let currentPath = null;
router.handleRoute = async (path) => {
  // Mismo path: no re-renderizamos (el router haría scrollTo(0,0) y mataría el
  // salto del ancla). Con hash es una navegación in-page (#seccion) → deja que el
  // browser scrollee. Sin hash es el logo/home estando ya en home → scroll arriba.
  if (path === currentPath) {
    if (!location.hash) window.scrollTo(0, 0);
    return;
  }
  currentPath = path;
  if (hero) hero.hidden = path !== '/';
  await baseHandle(path);
};

router.start();

// Hydration barrier: revela #app-root (y oculta el spinner) cuando el contenido
// inicial ya renderizó, así las secciones lazy aparecen juntas en vez de una por
// una. Heurística: en la home esperamos a que la última sección (<homly-footer>)
// tenga contenido; en otras rutas, a que el componente de ruta tenga contenido.
// Timeout de seguridad: nunca queda colgado, pase lo que pase.
const appRoot = document.getElementById('app-root');
let revealed = false;
const reveal = () => {
  if (revealed) return;
  revealed = true;
  document.documentElement.setAttribute('data-hydration-ready', '');
};
const isReady = () => {
  const page = appRoot.firstElementChild;
  if (!page) return false;
  const footer = page.querySelector('homly-footer');
  return footer ? footer.children.length > 0 : page.children.length > 0;
};
if (isReady()) reveal();
else {
  const obs = new MutationObserver(() => { if (isReady()) { obs.disconnect(); reveal(); } });
  obs.observe(appRoot, { childList: true, subtree: true });
  setTimeout(() => { obs.disconnect(); reveal(); }, 4000);
}
