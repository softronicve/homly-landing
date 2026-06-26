// Prerender opcional de la home. FUENTE = index.html (la shell limpia; NUNCA se modifica).
// Genera dist/index.html con nav, hero y app-root horneados + data-hydration-ready, para el
// first-paint. Caddy sirve dist/index.html. Requiere puppeteer-core + Chrome — SOLO DESARROLLO
// (el sitio servido no necesita ninguno; dist/index.html es HTML estático). Uso: node tools/prerender.cjs
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');         // fuente (read-only)
const DIST_DIR = path.join(ROOT, 'dist');
const DIST = path.join(DIST_DIR, 'index.html');       // artefacto generado
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const PORT = 8099;

// Inyecta innerHTML horneado en un elemento vacío. Reemplazo por FUNCIÓN para que un `$` en
// el snapshot (precios como $24.99) no se interprete como patrón de String.replace.
function inject(html, tag, inner) {
  return html.replace(`<${tag}></${tag}>`, () => `<${tag}>${inner}</${tag}>`);
}

(async () => {
  const source = fs.readFileSync(INDEX, 'utf8');
  const server = spawn('node', [path.join(ROOT, 'serve.cjs'), String(PORT), ROOT], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForFunction(() => document.querySelector('homly-footer .foot-grid'), { timeout: 15000 });
    await page.evaluate(() => document.querySelectorAll('.reveal').forEach((e) => e.classList.add('in')));
    await new Promise((r) => setTimeout(r, 400));
    const snap = await page.evaluate(() => ({
      nav: document.querySelector('homly-nav').innerHTML,
      hero: document.querySelector('homly-hero').innerHTML,
      app: document.getElementById('app-root').innerHTML,
    }));
    let out = source.replace('<html lang="es">', () => '<html lang="es" data-hydration-ready>');
    out = inject(out, 'homly-nav', snap.nav);
    out = inject(out, 'homly-hero', snap.hero);
    out = out.replace('<div id="app-root"></div>', () => `<div id="app-root">${snap.app}</div>`);
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.writeFileSync(DIST, out);
    const n = (snap.app.match(/<homly-/g) || []).length;
    console.log(`OK · dist/index.html · nav ${snap.nav.length} + hero ${snap.hero.length} + app-root ${snap.app.length} chars · ${n} secciones`);
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
