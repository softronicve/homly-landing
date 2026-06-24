import { HomlyComponent } from '../../../core/homly.js';
import { revealOnScroll } from '../../../shared/reveal.js';

class Hero extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './hero.html'; }
  get styleUrl() { return './hero.css'; }
  onMount() { revealOnScroll(this, this.signal); }
}

customElements.define('homly-hero', Hero);
