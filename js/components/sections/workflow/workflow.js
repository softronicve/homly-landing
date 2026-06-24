import { HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';

class Workflow extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './workflow.html'; }
  get styleUrl() { return './workflow.css'; }
  onMount() { revealOnScroll(this, this.signal); }
}

customElements.define('homly-workflow', Workflow);
