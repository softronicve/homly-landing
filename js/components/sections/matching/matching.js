import { HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';

class Matching extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './matching.html'; }
  get styleUrl() { return './matching.css'; }
  onMount() { revealOnScroll(this, this.signal); }
}

customElements.define('homly-matching', Matching);
