import { HomlyComponent } from '../../core/homly.js';

// Cada sección se importa cuando se acerca al viewport.
const sections = [
  ['homly-marquee', () => import('../sections/marquee/marquee.js')],
  ['homly-modules', () => import('../sections/modules/modules.js')],
  ['homly-matching', () => import('../sections/matching/matching.js')],
  ['homly-workflow', () => import('../sections/workflow/workflow.js')],
  ['homly-pricing', () => import('../sections/pricing/pricing.js')],
  ['homly-cta', () => import('../sections/cta/cta.js')],
  ['homly-footer', () => import('../sections/footer/footer.js')],
];

class HomePage extends HomlyComponent {
  get templateUrl() { return '/js/components/pages/home-page.html'; }

  onMount() {
    let i = 0;
    const next = () => {
      if (i >= sections.length) return;
      const [tag, load] = sections[i++];
      load();
      const el = this.querySelector(tag);
      if (!el || i >= sections.length) return;
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { io.disconnect(); next(); }
      }, { rootMargin: '300px' });
      io.observe(el);
    };
    next();
  }
}

customElements.define('homly-home-page', HomePage);
