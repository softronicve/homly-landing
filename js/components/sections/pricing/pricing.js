import { Homly, HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';
import { uiStore, openCheckoutModal } from '../../../stores/uiStore.js';

const WA_NUMBER = '584145200715';
const FALLBACK_RATE = 100;
const RATE_API = 'https://api.homly.world/api/v1/exchange-rate';
const LS_KEY = 'homly_usd_ves_bcv';
const LS_TTL_MS = 3600 * 1000;

/** Espeja SubscriptionPlan::PERIODS/prices() del API: más meses, más ahorro, sin permanencia. */
const PERIODS = {
  monthly:    { months: 1,  label: 'mensual',    flag: 'isMonthly' },
  quarterly:  { months: 3,  label: 'trimestral', flag: 'isQuarterly' },
  semiannual: { months: 6,  label: 'semestral',  flag: 'isSemiannual' },
  annual:     { months: 12, label: 'anual',      flag: 'isAnnual' },
};
const FOREVER = { monthly: 'para siempre', quarterly: 'para siempre', semiannual: 'para siempre', annual: 'para siempre' };
const PLANS = {
  free: { name: 'Free', ves: false, usd: { monthly: 0, quarterly: 0, semiannual: 0, annual: 0 }, per: FOREVER },
  pro: {
    name: 'Pro', ves: true,
    usd: { monthly: 24.99, quarterly: 69.99, semiannual: 129.99, annual: 199 },
    per: { monthly: 'por mes', quarterly: 'por trimestre', semiannual: 'por semestre', annual: 'por año' },
  },
  agencia: {
    name: 'Agencia', ves: true,
    usd: { monthly: 9.99, quarterly: 27.99, semiannual: 54.99, annual: 99 },
    per: { monthly: 'agente/mes', quarterly: 'agente/trimestre', semiannual: 'agente/semestre', annual: 'agente/año' },
  },
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
      const s = Homly.createStore({ period: 'monthly', isMonthly: true, isQuarterly: false, isSemiannual: false, isAnnual: false, rate: FALLBACK_RATE });
      for (const key of ['pro', 'agencia']) {
        const p = PLANS[key];
        s.computed(key + 'Amt', ['period'], (period) => fmtUSD(p.usd[period]));
        s.computed(key + 'Per', ['period'], (period) => p.per[period]);
        s.computed(key + 'Ves', ['period', 'rate'], (period, rate) => (p.ves ? '≈ ' + fmtVES(p.usd[period] * rate) : ''));
        s.computed(key + 'Save', ['period'], (period) => {
          const pct = Math.round((1 - p.usd[period] / (p.usd.monthly * PERIODS[period].months)) * 100);
          return pct > 0 ? 'Ahorra ' + pct + '%' : '';
        });
      }
      s.computed('rateInfo', ['rate'], (rate) => '1 USD = ' + fmtVES(rate) + ' · BCV');
      return s;
    })());
  }

  get actions() {
    return {
      setPeriod: (target) => this._setPeriod(target.dataset.period),
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

  _setPeriod(period) {
    if (!PERIODS[period]) return;
    const st = this.store.state;
    st.period = period;
    for (const [k, def] of Object.entries(PERIODS)) st[def.flag] = k === period;
  }

  _openPlan(key) {
    const p = PLANS[key];
    if (!p) return;
    const s = this.store.state;
    const usd = p.usd[s.period];
    const per = p.per[s.period];
    const amt = fmtUSD(usd);
    const vesStr = p.ves ? '  ·  ≈ ' + fmtVES(usd * s.rate) : '';
    const msg = encodeURIComponent(`Hola, quiero activar el plan ${p.name} (${PERIODS[s.period].label}) de Homly. ${amt} ${per}.`);
    openCheckoutModal({
      plan: p.name,
      label: 'Plan ' + p.name + ' · ' + per,
      price: amt + vesStr,
      waLink: `https://wa.me/${WA_NUMBER}?text=${msg}`,
    });
  }

  async _loadRate() {
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
