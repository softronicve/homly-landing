# homly.world

La landing de Homly, hecha con [homly.js](https://github.com/softronicve/homly-framework):
Web Components en vanilla JS, sin build.

## Cómo está armada

- `index.html` — el shell. Trae los tokens de diseño y deja inline el nav y el
  hero (lo primero que se ve) para que la pantalla pinte enseguida.
- El framework `homly.js` se carga desde jsDelivr (CDN), fijado por versión (`@v1.1.0`) mediante un import map en `index.html`; los componentes lo importan con el specifier `homly`.
- `js/app.js` — arranca el router.
- `js/components/sections/*` — cada sección con su `.js`, `.html` y `.css`
  (hero, nav, marquee, modules, matching, workflow, pricing, cta, footer).

Cada página se carga bajo demanda (code splitting por ruta vía dynamic import); las secciones de la home se importan al montar.

## Prerender (opcional)

La home se puede **prerenderizar** para que pinte en el primer frame (y se vea sin
JS). Es **opcional**: el sitio funciona igual sin esto (client-render + la barrera de
hidratación). El framework lo soporta vía la adopción de DOM del router (homly.js ≥
v1.8.0); no hay build ni dependencia de runtime — el HTML servido es estático.

```
node tools/prerender.cjs        # bakea la home en index.html (+ data-hydration-ready)
node tools/prerender.cjs --reset # vuelve a la shell (sin prerender)
```

Requiere `puppeteer-core` + Chrome, **solo para regenerar** (no para servir). Re-corré
la tool cuando cambie el contenido de la home.

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
