import { HomlyComponent } from 'homly';
import { uiStore, openCheckoutModal } from '../../../stores/uiStore.js';

const WA_NUMBER = '584145200715';

class Hero extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './hero.html'; }
  get styleUrl() { return './hero.css'; }
  get globalStores() { return [uiStore]; }

  get actions() {
    return {
      openProPlan: () => openCheckoutModal({
        plan: 'Pro',
        label: 'Plan Pro · por mes',
        price: '$24.99',
        waLink: `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, quiero activar el plan Pro (mensual) de Homly. $24.99 por mes.')}`,
      }),
    };
  }
}

customElements.define('homly-hero', Hero);
