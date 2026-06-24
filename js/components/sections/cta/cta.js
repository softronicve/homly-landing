import { HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';

class Cta extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './cta.html'; }
  get styleUrl() { return './cta.css'; }
  onMount() { revealOnScroll(this, this.signal); }
}

customElements.define('homly-cta', Cta);
