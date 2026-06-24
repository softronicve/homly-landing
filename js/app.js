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
router.handleRoute = async (path) => {
  if (hero) hero.hidden = path !== '/';
  await baseHandle(path);
};

router.start();
