// Prerender opcional de la home. Renderiza #app-root desde una shell limpia y bakea
// el HTML dentro de index.html (+ data-hydration-ready) para que la home pinte en el
// primer frame. Idempotente; `--reset` vuelve a la shell. Requiere puppeteer-core +
// Chrome — SOLO DESARROLLO. El sitio servido no necesita ninguno (el output es HTML
// estático). Uso: node tools/prerender.cjs [--reset]
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const PORT = 8099;

// index.html → shell (sin prerender): vacía #app-root y quita data-hydration-ready.
function toShell(html) {
  return html
    .replace('<html lang="es" data-hydration-ready>', '<html lang="es">')
    .replace(/<div id="app-root">[\s\S]*?<div id="hydration-spinner"/,
             () => '<div id="app-root"></div>\n<div id="hydration-spinner"');
}
// shell + snapshot → prerenderizado. Reemplazos por función para que un `$` en el
// snapshot (precios como $24.99) no se interprete como patrón de replace.
function toPrerendered(shellHtml, snapshot) {
  return shellHtml
    .replace('<html lang="es">', () => '<html lang="es" data-hydration-ready>')
    .replace('<div id="app-root"></div>', () => '<div id="app-root">' + snapshot + '</div>');
}

(async () => {
  const reset = process.argv.includes('--reset');
  const shell = toShell(fs.readFileSync(INDEX, 'utf8'));
  fs.writeFileSync(INDEX, shell);           // estado fail-safe: una shell que funciona
  if (reset) { console.log('reset → shell'); return; }

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
    const snapshot = await page.evaluate(() => document.getElementById('app-root').innerHTML);
    fs.writeFileSync(INDEX, toPrerendered(shell, snapshot));
    const n = (snapshot.match(/<homly-/g) || []).length;
    console.log(`OK · #app-root = ${snapshot.length} chars · ${n} secciones`);
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
