import { Homly, HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';
import { uiStore, openCheckoutModal } from '../../../stores/uiStore.js';

const WA_NUMBER = '584145200715';
const FALLBACK_RATE = 100;
const RATE_API = 'https://api.homly.world/api/v1/exchange-rate';
const LS_KEY = 'homly_usd_ves_bcv';
const LS_TTL_MS = 3600 * 1000;

const PLANS = {
  free:    { name: 'Free',    usdM: 0,     usdA: 0,   perM: 'para siempre', perA: 'para siempre', ves: false },
  pro:     { name: 'Pro',     usdM: 24.99, usdA: 199, perM: 'por mes',      perA: 'por año',      ves: true },
  agencia: { name: 'Agencia', usdM: 9.99,  usdA: 99,  perM: 'agente/mes',   perA: 'agente/año',   ves: true },
};

const fmtUSD = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');
const fmtVES = (n) => 'Bs ' + new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 }).format(n);

class Pricing extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './pricing.html'; }
  get styleUrl() { return './pricing.css'; }

  get globalStores() { return [uiStore]; }

  get store() {
    return (this._store ??= (() => {
      // Solo el estado fuente; los precios mostrados se derivan con computed.
      const s = Homly.createStore({ isMonthly: true, isAnnual: false, rate: FALLBACK_RATE });
      for (const key of ['pro', 'agencia']) {
        const p = PLANS[key];
        s.computed(key + 'Amt', ['isAnnual'], (annual) => fmtUSD(annual ? p.usdA : p.usdM));
        s.computed(key + 'Per', ['isAnnual'], (annual) => (annual ? p.perA : p.perM));
        s.computed(key + 'Ves', ['isAnnual', 'rate'], (annual, rate) =>
          p.ves ? '≈ ' + fmtVES((annual ? p.usdA : p.usdM) * rate) : '');
        // Ahorro real del pago anual vs 12 meses (honesto, por plan). Vacío en mensual.
        s.computed(key + 'Save', ['isAnnual'], (annual) =>
          annual && p.usdM > 0 ? 'Ahorra ' + Math.round((1 - p.usdA / (p.usdM * 12)) * 100) + '%' : '');
      }
      s.computed('rateInfo', ['rate'], (rate) => '1 USD = ' + fmtVES(rate) + ' · BCV');
      return s;
    })());
  }

  get actions() {
    return {
      // Solo cambia el estado fuente; los precios se recalculan solos (computed).
      setMonthly: () => { this.store.state.isMonthly = true; this.store.state.isAnnual = false; },
      setAnnual: () => { this.store.state.isAnnual = true; this.store.state.isMonthly = false; },
      openPlan: (target) => this._openPlan(target.dataset.plan),
      closeModal: () => { uiStore.state.modalOpen = false; },
    };
  }

  onMount() {
    revealOnScroll(this, this.signal);
    const overlay = this.querySelector('.modal-ov');
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) uiStore.state.modalOpen = false; }, { signal: this.signal });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') uiStore.state.modalOpen = false; }, { signal: this.signal });
    this._loadRate();
  }

  _openPlan(key) {
    const p = PLANS[key];
    if (!p) return;
    const s = this.store.state;
    const annual = s.isAnnual;
    const usd = annual ? p.usdA : p.usdM;
    const per = annual ? p.perA : p.perM;
    const amt = fmtUSD(usd);
    const vesStr = p.ves ? '  ·  ≈ ' + fmtVES(usd * s.rate) : '';
    const msg = encodeURIComponent(`Hola, quiero activar el plan ${p.name} (${annual ? 'anual' : 'mensual'}) de Homly. ${amt} ${per}.`);
    openCheckoutModal({
      plan: p.name,
      label: 'Plan ' + p.name + ' · ' + per,
      price: amt + vesStr,
      waLink: `https://wa.me/${WA_NUMBER}?text=${msg}`,
    });
  }

  async _loadRate() {
    // Setear la tasa basta: los precios en VES y la info de tasa son computed.
    this.store.state.rate = await this._getRate();
  }

  async _getRate() {
    try {
      const cached = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (cached && Date.now() - cached.t < LS_TTL_MS) return cached.r;
    } catch (_) {}
    try {
      const res = await fetch(RATE_API, { headers: { Accept: 'application/json' } });
      const data = await res.json();
      const r = data?.data?.usd_ves;
      if (typeof r === 'number' && r > 0) {
        localStorage.setItem(LS_KEY, JSON.stringify({ r, t: Date.now() }));
        return r;
      }
    } catch (_) {}
    return FALLBACK_RATE;
  }
}

customElements.define('homly-pricing', Pricing);
