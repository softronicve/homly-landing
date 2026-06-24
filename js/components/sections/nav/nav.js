import { Homly, HomlyComponent } from 'homly';

class Nav extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './nav.html'; }
  get styleUrl() { return './nav.css'; }

  get store() {
    return (this._store ??= Homly.createStore({ scrolled: false, menuOpen: false }));
  }

  get actions() {
    return {
      toggleMenu: () => { this.store.state.menuOpen = !this.store.state.menuOpen; },
    };
  }

  onMount() {
    const onScroll = () => { this.store.state.scrolled = window.scrollY > 40; };
    window.addEventListener('scroll', onScroll, { passive: true, signal: this.signal });
    onScroll();
    this.querySelector('.nav-links')?.addEventListener('click', (e) => {
      if (e.target.closest('a')) this.store.state.menuOpen = false;
    }, { signal: this.signal });
  }
}

customElements.define('homly-nav', Nav);
