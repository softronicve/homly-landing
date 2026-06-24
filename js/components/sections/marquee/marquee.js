import { HomlyComponent } from 'homly';

class Marquee extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './marquee.html'; }
  get styleUrl() { return './marquee.css'; }
}

customElements.define('homly-marquee', Marquee);
