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
      enviado: false,
      botonTexto: 'Enviar mensaje', // etiqueta reactiva del botón (idle / enviando / enviado)
    }));
  }

  get actions() {
    return {
      enviarMensaje: async () => {
        const s = this.store.state;
        if (s.enviado) return;
        s.botonTexto = 'Enviando...';
        await new Promise((r) => setTimeout(r, 1000));
        s.enviado = true;
        s.botonTexto = '¡Mensaje enviado!';
      },
    };
  }
}

customElements.define('homly-contact-page', ContactPage);
