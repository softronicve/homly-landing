import { Homly, HomlyComponent } from 'homly';

class ContactPage extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './contact.html'; }
  get styleUrl() { return './contact.css'; }

  get store() {
    return (this._store ??= Homly.createStore({
      nombre: '',
      email: '',
      mensaje: '',
      enviado: false,
    }));
  }

  get actions() {
    return {
      // El framework gestiona el estado de carga del botón (disabled +
      // is-loading + data-loading-text); acá solo simulamos el envío.
      enviarMensaje: async () => {
        const s = this.store.state;
        if (s.enviado) return;
        await new Promise((r) => setTimeout(r, 1500));
        s.enviado = true;
      },
    };
  }
}

customElements.define('homly-contact-page', ContactPage);
