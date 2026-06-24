# homly.world

La landing de Homly, hecha con [homly.js](https://github.com/softronicve/homly-framework):
Web Components en vanilla JS, sin build.

## Cómo está armada

- `index.html` — el shell. Trae los tokens de diseño y deja inline el nav y el
  hero (lo primero que se ve) para que la pantalla pinte enseguida.
- `js/core/homly.js` — el framework.
- `js/app.js` — arranca el router.
- `js/components/sections/*` — cada sección con su `.js`, `.html` y `.css`
  (hero, nav, marquee, modules, matching, workflow, pricing, cta, footer).

Cada página se carga bajo demanda (code splitting por ruta vía dynamic import); las secciones de la home se importan al montar.

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
