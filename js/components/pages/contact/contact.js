import { Homly, HomlyComponent } from '../../../core/homly.js';

class ContactPage extends HomlyComponent {
  get basePath() { return import.meta.url; }
  get templateUrl() { return './contact.html'; }
  get styleUrl() { return './contact.css'; }

  get store() {
    return (this._store ??= Homly.createStore({
      nombre: '',
      email: '',
      mensaje: '',
      botonTexto: 'Enviar mensaje',
    }));
  }

  get actions() {
    return {
      enviar: () => {
        const s = this.store.state;
        s.botonTexto = 'Enviando...';
        setTimeout(() => { s.botonTexto = '¡Enviado! ✓'; }, 900);
        setTimeout(() => { s.botonTexto = 'Enviar mensaje'; }, 2400);
      },
    };
  }
}

customElements.define('homly-contact-page', ContactPage);
