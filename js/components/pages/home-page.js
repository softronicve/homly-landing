import { HomlyComponent } from '../../core/homly.js';

// Se importan apenas monta la página (después de que el hero inline ya pintó).
const sections = [
  () => import('../sections/marquee/marquee.js'),
  () => import('../sections/modules/modules.js'),
  () => import('../sections/matching/matching.js'),
  () => import('../sections/workflow/workflow.js'),
  () => import('../sections/pricing/pricing.js'),
  () => import('../sections/cta/cta.js'),
  () => import('../sections/footer/footer.js'),
];

class HomePage extends HomlyComponent {
  get templateUrl() { return '/js/components/pages/home-page.html'; }
  onMount() { sections.forEach((load) => load()); }
}

customElements.define('homly-home-page', HomePage);
