import { HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';

class Modules extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './modules.html'; }
  get styleUrl() { return './modules.css'; }
  onMount() { revealOnScroll(this, this.signal); }
}

customElements.define('homly-modules', Modules);
