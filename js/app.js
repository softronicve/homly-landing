/**
 * app.js — Punto de arranque de la SPA.
 * Importa los componentes (se auto-registran como custom elements), monta el
 * router en #app-root y define las rutas. homly.js intercepta los <a
 * data-router-link> y hace pushState sin recargar.
 */
import './components/sections/nav/nav.js'; // <homly-nav> — shell estático (above-fold)
import './components/sections/hero/hero.js'; // <homly-hero> — shell estático (above-fold)
import './components/pages/home-page.js';
import './components/pages/contact/contact.js';
import { HomlyRouter } from './core/homly.js';

const router = new HomlyRouter('app-root');

// Ruta principal → página de inicio.
router.add('/', '<homly-home-page></homly-home-page>');

router.add('/contacto', '<homly-contact-page></homly-contact-page>');

// El hero vive inline en el shell (primer render rápido); se oculta fuera de la home.
const hero = document.querySelector('homly-hero');
const baseHandle = router.handleRoute.bind(router);
router.handleRoute = (path) => {
  baseHandle(path);
  if (hero) hero.hidden = path !== '/';
};

router.start();
