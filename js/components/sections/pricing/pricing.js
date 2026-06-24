import { Homly, HomlyComponent } from '../../../core/homly.js';
import { revealOnScroll } from '../../../shared/reveal.js';

const WA_NUMBER = '584145200715';
const FALLBACK_RATE = 100;
const RATE_API = 'https://api.homly.world/api/v1/exchange-rate';
const LS_KEY = 'homly_usd_ves_bcv';
const LS_TTL_MS = 3600 * 1000;

const PLANS = {
  free:    { name: 'Free',    usdM: 0,     usdA: 0,   perM: 'para siempre', perA: 'para siempre', ves: false },
  pro:     { name: 'Pro',     usdM: 24.99, usdA: 199, perM: 'por mes',      perA: 'por año',      ves: true },
  agencia: { name: 'Agencia', usdM: 9.99,  usdA: 79,  perM: 'agente/mes',   perA: 'agente/año',   ves: true },
};

const fmtUSD = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');
const fmtVES = (n) => 'Bs ' + new Intl.NumberFormat('es-VE', { maximumFractionDigits: 0 }).format(n);

class Pricing extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './pricing.html'; }
  get styleUrl() { return './pricing.css'; }

  get store() {
    return (this._store ??= Homly.createStore({
      isMonthly: true, isAnnual: false, rate: FALLBACK_RATE,
      proAmt: fmtUSD(PLANS.pro.usdM), proPer: PLANS.pro.perM, proVes: '—',
      agenciaAmt: fmtUSD(PLANS.agencia.usdM), agenciaPer: PLANS.agencia.perM, agenciaVes: '—',
      rateInfo: 'Cotización BCV del día',
      modalOpen: false, modalPlan: '', modalLabel: '—', modalPrice: '—',
      waLink: `https://wa.me/${WA_NUMBER}`,
    }));
  }

  get actions() {
    return {
      setMonthly: () => { this.store.state.isMonthly = true; this.store.state.isAnnual = false; this._recompute(); },
      setAnnual: () => { this.store.state.isAnnual = true; this.store.state.isMonthly = false; this._recompute(); },
      openPlan: (target) => this._openPlan(target.dataset.plan),
      closeModal: () => { this.store.state.modalOpen = false; },
    };
  }

  onMount() {
    revealOnScroll(this, this.signal);
    const overlay = this.querySelector('.modal-ov');
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) this.store.state.modalOpen = false; }, { signal: this.signal });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.store.state.modalOpen = false; }, { signal: this.signal });
    this._loadRate();
  }

  _recompute() {
    const s = this.store.state;
    const annual = s.isAnnual;
    for (const key of ['pro', 'agencia']) {
      const p = PLANS[key];
      const usd = annual ? p.usdA : p.usdM;
      s[key + 'Amt'] = fmtUSD(usd);
      s[key + 'Per'] = annual ? p.perA : p.perM;
      s[key + 'Ves'] = p.ves ? '≈ ' + fmtVES(usd * s.rate) : '';
    }
    s.rateInfo = '1 USD = ' + fmtVES(s.rate) + ' · BCV';
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
    s.modalPlan = p.name;
    s.modalLabel = 'Plan ' + p.name + ' · ' + per;
    s.modalPrice = amt + vesStr;
    const msg = encodeURIComponent(`Hola, quiero activar el plan ${p.name} (${annual ? 'anual' : 'mensual'}) de Homly. ${amt} ${per}.`);
    s.waLink = `https://wa.me/${WA_NUMBER}?text=${msg}`;
    s.modalOpen = true;
  }

  async _loadRate() {
    const rate = await this._getRate();
    this.store.state.rate = rate;
    this._recompute();
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
