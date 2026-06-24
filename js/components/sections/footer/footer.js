import { HomlyComponent } from 'homly';

class Footer extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './footer.html'; }
  get styleUrl() { return './footer.css'; }
}

customElements.define('homly-footer', Footer);
