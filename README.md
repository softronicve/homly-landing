# homly.world

La landing de Homly, hecha con [homly.js](https://github.com/softronicve/homly-framework):
Web Components en vanilla JS, sin build.

## Cómo está armada

- `index.html` — el shell normal. Trae los tokens y primitivas de diseño globales; el
  nav, el hero y las secciones son componentes que renderizan de sus propios archivos.
- El framework `homly.js` se carga desde jsDelivr (CDN), fijado por versión (`@v1.8.0`) mediante un import map en `index.html`; los componentes lo importan con el specifier `homly`.
- `js/app.js` — arranca el router.
- `js/components/sections/*` — cada sección con su `.js`, `.html` y `.css`
  (hero, nav, modules, matching, workflow, pricing, cta, footer).

Cada página se carga bajo demanda (code splitting por ruta vía dynamic import); las secciones de la home se importan al montar.

## Prerender (opcional) — dos index

Hay dos entradas:

- **`index.html`** — el sitio normal (client-render). `<homly-nav>`/`<homly-hero>` y las
  secciones renderizan de sus componentes. Es la **fuente** que editás.
- **`dist/index.html`** — el **compilado**: el mismo sitio con nav, hero y `#app-root`
  **horneados** (+ `data-hydration-ready`) para que pinte en el primer frame. Se genera
  con la tool y se commitea. **Caddy sirve este.**

```
node tools/prerender.cjs   # genera dist/index.html desde index.html (NO modifica index.html)
```

Requiere `puppeteer-core` + Chrome, **solo para regenerar** (no para servir). Re-corré la tool
cuando cambie el contenido de la home. Para servir el normal en vez del compilado, apuntá Caddy
a `/index.html` en vez de `/dist/index.html`.

Caddy (sirve el compilado; assets del root):

```
homly.world {
  root * /var/www/homly-landing
  @notFile not file {path}
  rewrite @notFile /dist/index.html
  file_server
}
```

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
