// Prerender opcional de la home. La FUENTE es index.shell.html (la shell limpia que
// editás); esta tool la renderiza y bakea el resultado en index.html (+ data-hydration-
// ready) para que la home pinte en el primer frame. Idempotente (siempre parte de la
// shell). `--reset` deja index.html = la shell (sin prerender). Requiere puppeteer-core
// + Chrome — SOLO DESARROLLO. El sitio servido no necesita ninguno (index.html es HTML
// estático). NO edites index.html a mano: es generado. Uso: node tools/prerender.cjs [--reset]
const puppeteer = require('puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SHELL = path.join(ROOT, 'index.shell.html');   // fuente (editable)
const INDEX = path.join(ROOT, 'index.html');         // artefacto deployado (generado)
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const PORT = 8099;

// shell + snapshot → index.html prerenderizado. Reemplazos por función para que un `$`
// en el snapshot (precios como $24.99) no se interprete como patrón de replace.
function toPrerendered(shellHtml, snapshot) {
  return shellHtml
    .replace('<html lang="es">', () => '<html lang="es" data-hydration-ready>')
    .replace('<div id="app-root"></div>', () => '<div id="app-root">' + snapshot + '</div>');
}

(async () => {
  const reset = process.argv.includes('--reset');
  const shell = fs.readFileSync(SHELL, 'utf8');
  fs.writeFileSync(INDEX, shell);           // index.html = shell (sin prerender / estado fail-safe)
  if (reset) { console.log('reset → index.html = shell (sin prerender)'); return; }

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
    console.log(`OK · index.html generado desde index.shell.html · #app-root = ${snapshot.length} chars · ${n} secciones`);
  } finally {
    await browser.close();
    server.kill();
  }
})().catch((e) => { console.error('prerender failed:', e.message); process.exit(1); });
