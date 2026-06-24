/**
 * app.js — Punto de arranque de la SPA.
 * Importa los componentes (se auto-registran como custom elements), monta el
 * router en #app-root y define las rutas. homly.js intercepta los <a
 * data-router-link> y hace pushState sin recargar.
 */
import './components/sections/nav/nav.js'; // <homly-nav> — shell estático (above-fold)
import './components/sections/hero/hero.js'; // <homly-hero> — shell estático (above-fold)
import './components/pages/home-page.js';
import { HomlyRouter } from './core/homly.js';

const router = new HomlyRouter('app-root');

// Ruta principal → página de inicio.
router.add('/', '<homly-home-page></homly-home-page>');

// Placeholder para que el enlace /contacto del nav no caiga en 404 mientras
// construimos su propio Web Component en la fase de migración.
router.add(
  '/contacto',
  '<section class="wrap stub"><h1>Contacto</h1><p>Próximamente — esta vista pasará a ser su propio Web Component homly.js.</p></section>'
);

router.start();
