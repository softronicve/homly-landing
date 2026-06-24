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

Las secciones que están más abajo se cargan cuando te acercás a ellas con el scroll.

## Correr en local

```
node serve.cjs 8080 .
```

Y abrí http://localhost:8080. Sirve cualquier servidor estático; por ejemplo
`python3 -m http.server` también funciona.
