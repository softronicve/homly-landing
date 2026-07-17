import { HomlyComponent } from 'homly';

class Hero extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './hero.html'; }
  get styleUrl() { return './hero.css'; }
}

customElements.define('homly-hero', Hero);
