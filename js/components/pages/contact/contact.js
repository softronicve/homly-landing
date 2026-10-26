import { Homly, HomlyComponent } from 'homly';

const SUPPORT_API = 'https://api.homly.world/api/v1/support';

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
      error: '',
    }));
  }

  /**
   * El envío crea un ticket en `POST /v1/support`, que avisa al buzón de soporte.
   * Si la API responde error, el mensaje queda en pantalla y el usuario puede reintentar.
   */
  get actions() {
    return {
      enviarMensaje: async () => {
        const s = this.store.state;
        if (s.enviado) return;
        s.error = '';
        const email = s.email.trim();
        const mensaje = s.mensaje.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { s.error = 'Escribe un email válido para poder responderte.'; return; }
        if (!mensaje) { s.error = 'Cuéntanos en qué te ayudamos.'; return; }
        try {
          const res = await fetch(SUPPORT_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              email,
              subject: `Contacto desde homly.world${s.nombre.trim() ? ` · ${s.nombre.trim().slice(0, 150)}` : ''}`,
              body: mensaje.slice(0, 2000),
            }),
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            s.error = res.status === 429
              ? 'Enviaste varios mensajes seguidos. Espera un minuto y vuelve a intentar.'
              : (data.message || 'No pudimos enviar tu mensaje. Inténtalo de nuevo.');
            return;
          }
          s.enviado = true;
        } catch {
          s.error = 'No pudimos enviar tu mensaje. Revisa tu conexión e inténtalo de nuevo.';
        }
      },
    };
  }

  /** Carga el footer: /contacto es una URL indexable por sí sola y sin él quedaba con un solo enlace interno. */
  onMount() { import('../../sections/footer/footer.js'); }
}

customElements.define('homly-contact-page', ContactPage);
