// Prerender de las rutas del router. FUENTE = index.html (la shell limpia; NUNCA se modifica).
// Genera un HTML por ruta en dist/ con nav, hero y app-root horneados + data-hydration-ready,
// para el first-paint y para que cada ruta tenga su propio <title>/description/canonical (sin
// esto, /contacto se servía con el HTML de la home y su canonical apuntaba a "/", así que no
// podía rankear). Requiere puppeteer-core + Chrome — SOLO DESARROLLO (el sitio servido no
// necesita ninguno; los dist/*.html son HTML estático). Uso: node tools/prerender.cjs
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');         // fuente (read-only)
const DIST_DIR = path.join(ROOT, 'dist');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const PORT = 8099;

// Una entrada por ruta del router (ver js/app.js). `ready` es el selector que marca que la
// ruta terminó de renderizar. Las rutas que no son la home traen su propio head: heredan la
// shell y le pisan title, description, canonical, OG/Twitter y JSON-LD.
const ROUTES = [
  { path: '/', out: 'index.html', ready: 'homly-footer .foot-grid' },
  {
    path: '/contacto',
    out: 'contacto.html',
    ready: '#app-root homly-footer .foot-grid',
    title: 'Contacto · Homly — hablemos de tu inmobiliaria',
    description: 'Escribinos y te respondemos en menos de 24 horas. Consultas sobre planes, migración de tu cartera o demo del CRM inmobiliario Homly.',
    canonical: 'https://homly.world/contacto',
    ogTitle: 'Contacto · Homly',
    ogDescription: 'Consultas sobre planes, migración de cartera o demo del CRM inmobiliario Homly. Respondemos en menos de 24 horas.',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Contacto · Homly',
      url: 'https://homly.world/contacto',
      inLanguage: 'es',
      mainEntity: {
        '@type': 'Organization',
        '@id': 'https://homly.world/#organization',
        name: 'Homly',
        legalName: 'Desarrollos Softronic, C.A.',
        taxID: 'J-506650606',
        url: 'https://homly.world/',
        email: 'info@softronic.dev',
        address: { '@type': 'PostalAddress', addressLocality: 'Barquisimeto', addressRegion: 'Lara', addressCountry: 'VE' },
        contactPoint: { '@type': 'ContactPoint', contactType: 'sales', telephone: '+58-414-520-0715', availableLanguage: 'Spanish' },
      },
    },
  },
];

// Inyecta innerHTML horneado en un elemento vacío. Reemplazo por FUNCIÓN para que un `$` en
// el snapshot (precios como $24.99) no se interprete como patrón de String.replace.
function inject(html, tag, inner) {
  return html.replace(`<${tag}></${tag}>`, () => `<${tag}>${inner}</${tag}>`);
}

// Sustituye el content de un <meta>/<link> ya presente en la shell. Si el tag no está, deja
// el HTML igual: la shell es la única fuente de verdad de qué tags existen.
function setAttr(html, tagRe, value) {
  return html.replace(tagRe, (m) => m.replace(/content="[^"]*"|href="[^"]*"/, (a) =>
    `${a.startsWith('content') ? 'content' : 'href'}="${value}"`));
}

function applyHead(html, route) {
  if (!route.title) return html;                       // la home ya usa el head de la shell
  let h = html.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${route.title}</title>`);
  h = setAttr(h, /<meta name="description"[^>]*>/, route.description);
  h = setAttr(h, /<link rel="canonical"[^>]*>/, route.canonical);
  h = setAttr(h, /<meta property="og:url"[^>]*>/, route.canonical);
  h = setAttr(h, /<meta property="og:title"[^>]*>/, route.ogTitle);
  h = setAttr(h, /<meta name="twitter:title"[^>]*>/, route.ogTitle);
  h = setAttr(h, /<meta property="og:description"[^>]*>/, route.ogDescription);
  h = setAttr(h, /<meta name="twitter:description"[^>]*>/, route.ogDescription);
  h = h.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () =>
    `<script type="application/ld+json">\n${JSON.stringify(route.jsonLd, null, 1)}\n</script>`);
  return h;
}

// Minificado seguro: saca comentarios HTML y colapsa runs de whitespace a un
// espacio, PERO deja intacto el contenido de <script>/<style>/<pre>/<textarea>
// (los aparta antes y los restituye). No colapsa entre tags: preserva los
// espacios significativos de inline (<em>, <b>, <span>). ponytail: regex, no
// dependencia; si algún día hace falta minificar CSS/JS inline, meter esbuild.
function minify(html) {
  const stash = [];
  let h = html.replace(/<(script|style|pre|textarea)\b[^>]*>[\s\S]*?<\/\1>/gi,
    (m) => ` \0${stash.push(m) - 1}\0 `);
  h = h.replace(/<!--[\s\S]*?-->/g, '').replace(/\s+/g, ' ').trim();
  return h.replace(/\0(\d+)\0/g, (_, i) => stash[i]);
}

(async () => {
  const source = fs.readFileSync(INDEX, 'utf8');
  const server = spawn('node', [path.join(ROOT, 'serve.cjs'), String(PORT), ROOT], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  try {
    fs.mkdirSync(DIST_DIR, { recursive: true });
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`http://127.0.0.1:${PORT}${route.path}`, { waitUntil: 'networkidle0', timeout: 30000 });
      await page.waitForFunction((sel) => document.querySelector(sel), { timeout: 15000 }, route.ready);
      await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
      await new Promise((r) => setTimeout(r, 400));
      const snap = await page.evaluate(() => ({
        nav: document.querySelector('homly-nav').innerHTML,
        hero: document.querySelector('homly-hero').innerHTML,
        app: document.getElementById('app-root').innerHTML,
      }));
      const isHome = route.path === '/';
      let out = source.replace('<html lang="es">', () => '<html lang="es" data-hydration-ready>');
      out = applyHead(out, route);
      out = inject(out, 'homly-nav', snap.nav);
      // El hero es de la home: fuera de ella va vacío y oculto (si no, su <h1> quedaría
      // en el DOM de otra ruta y la página tendría dos H1).
      out = isHome
        ? inject(out, 'homly-hero', snap.hero)
        : out.replace('<homly-hero></homly-hero>', () => '<homly-hero hidden></homly-hero>');
      out = out.replace('<div id="app-root"></div>', () => `<div id="app-root">${snap.app}</div>`);
      out = minify(out);
      fs.writeFileSync(path.join(DIST_DIR, route.out), out);
      const n = (snap.app.match(/<homly-/g) || []).length;
      console.log(`OK · dist/${route.out} · ${route.path} · nav ${snap.nav.length} + app-root ${snap.app.length} chars · ${n} componentes`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
