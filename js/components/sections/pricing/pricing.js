import { Homly, HomlyComponent } from 'homly';
import { revealOnScroll } from '../../../shared/reveal.js';

const FALLBACK_RATE = 100;
const RATE_API = 'https://api.homly.world/api/v1/exchange-rate';
const LS_KEY = 'homly_usd_ves_bcv';
const LS_TTL_MS = 3600 * 1000;

/** Espeja SubscriptionPlan::PERIODS/prices() del API: más meses, más ahorro, sin permanencia. */
const PERIODS = {
  monthly:    { months: 1,  flag: 'isMonthly' },
  quarterly:  { months: 3,  flag: 'isQuarterly' },
  semiannual: { months: 6,  flag: 'isSemiannual' },
  annual:     { months: 12, flag: 'isAnnual' },
};
const PLANS = {
  pro: {
    usd: { monthly: 24.99, quarterly: 69.99, semiannual: 129.99, annual: 199 },
    per: { monthly: 'por mes', quarterly: 'por trimestre', semiannual: 'por semestre', annual: 'por año' },
  },
  agencia: {
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

  get store() {
    return (this._store ??= (() => {
      const s = Homly.createStore({ period: 'monthly', isMonthly: true, isQuarterly: false, isSemiannual: false, isAnnual: false, rate: FALLBACK_RATE });
      for (const key of ['pro', 'agencia']) {
        const p = PLANS[key];
        s.computed(key + 'Amt', ['period'], (period) => fmtUSD(p.usd[period]));
        s.computed(key + 'Per', ['period'], (period) => p.per[period]);
        s.computed(key + 'Ves', ['period', 'rate'], (period, rate) => '≈ ' + fmtVES(p.usd[period] * rate));
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
    };
  }

  onMount() {
    revealOnScroll(this, this.signal);
    this._loadRate();
  }

  _setPeriod(period) {
    if (!PERIODS[period]) return;
    const st = this.store.state;
    st.period = period;
    for (const [k, def] of Object.entries(PERIODS)) st[def.flag] = k === period;
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
