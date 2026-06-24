import { HomlyComponent } from '../../../core/homly.js';

class Marquee extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './marquee.html'; }
  get styleUrl() { return './marquee.css'; }
}

customElements.define('homly-marquee', Marquee);
