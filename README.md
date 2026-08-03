# homly.world

La landing de Homly, hecha con [homly.js](https://github.com/softronicve/homly-framework):
Web Components en vanilla JS, sin build.

## Cómo está armada

- `index.html` — el shell normal. Trae los tokens y primitivas de diseño globales; el
  nav, el hero y las secciones son componentes que renderizan de sus propios archivos.
- El framework `homly.js` vive en `js/vendor/homly-<version>.js`, apuntado por un import map
  en `index.html`; los componentes lo importan con el specifier `homly`. Está vendorizado y no
  en un CDN para no meter un origen de terceros (DNS + TLS) en el camino crítico de la
  hidratación. **Para subir de versión:** bajar el `homly.js` del tag nuevo de
  [homly-framework](https://github.com/softronicve/homly-framework) a `js/vendor/` y cambiar
  el path del import map.
- Las fuentes también son self-hosted (`fonts/*.woff2`, subset latin, variables). Son los
  mismos archivos que servía Google Fonts, declarados con `@font-face` en cada página.
- `js/app.js` — arranca el router.
- `js/components/sections/*` — cada sección con su `.js`, `.html` y `.css`
  (hero, nav, modules, matching, workflow, pricing, cta, footer).

Cada página se carga bajo demanda (code splitting por ruta vía dynamic import); las secciones de la home se importan al montar.

## Prerender — un HTML por ruta

- **`index.html`** — el shell (client-render). `<homly-nav>`/`<homly-hero>` y las secciones
  renderizan de sus componentes. Es la **fuente** que editás; la tool nunca la modifica.
- **`dist/*.html`** — los **compilados**: un archivo por ruta del router con nav, hero y
  `#app-root` **horneados** (+ `data-hydration-ready`) para que pinte en el primer frame.
  Se generan con la tool y se commitean. **Caddy sirve estos.**

```
node tools/prerender.cjs   # dist/index.html + dist/contacto.html
```

Cada ruta lleva su propio `<title>`, `description`, `canonical`, OG/Twitter y JSON-LD: van
declaradas en el array `ROUTES` de la tool. Sin eso, `/contacto` se servía con el HTML de la
home y su canonical apuntaba a `/`, así que no podía rankear. **Al agregar una ruta al router
(`js/app.js`) hay que agregarla también a `ROUTES` y al `Caddyfile`.**

Requiere `puppeteer-core` + Chrome, **solo para regenerar** (no para servir). Re-corré la tool
cuando cambie el contenido de la home o de una ruta prerenderizada.

`tools/og-image.cjs` regenera `og-image.png` (1200×630) con el mismo stack.

### Caddy (producción)

Los `handle` son excluyentes y se evalúan en el orden del archivo. **No usar un `try_files`
catch-all hacia `dist/index.html`:** servía la home para cualquier path, o sea que las URLs
inexistentes devolvían 200 (soft 404) y las rutas reales quedaban canonicalizadas a `/`.

```
homly.world, www.homly.world {
  root * /var/www/homly.world-landing
  import common
  # La landing no versiona sus assets (sin ?v=); por eso revalidan en vez de ser immutable.
  @assets path *.js *.css
  header @assets Cache-Control "no-cache"
  @www host www.homly.world
  redir @www https://homly.world{uri} permanent

  handle / {
    rewrite * /dist/index.html
    file_server
  }
  handle /contacto {
    rewrite * /dist/contacto.html
    file_server
  }
  handle /contacto/ {
    redir * /contacto permanent
  }
  handle {
    file_server {
      hide .git
    }
  }
  handle_errors {
    rewrite * /404.html
    file_server {
      status {err.status_code}
    }
  }
}
```

El working tree es lo que Caddy sirve: editar acá publica al instante. `dist/` va commiteado.

## Correr en local

```
node serve.cjs 8080 .
```

Y abrí http://localhost:8080. Sirve cualquier servidor estático; por ejemplo
`python3 -m http.server` también funciona.

## 🤝 Contribuir

La rama `main` está protegida: todo cambio entra por Pull Request, validado por el creador (o quien tenga permiso de escritura).

1. Hacé un fork. 2. Creá tu rama (`feature/...`). 3. Commiteá. 4. Pusheá. 5. Abrí un Pull Request hacia `main`.

Estándares de código del framework: [guías de homly.js](https://github.com/softronicve/homly-framework/blob/main/CONTRIBUTING.md).
