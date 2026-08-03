// Genera og-image.png (1200x630) para las previews de redes sociales.
// Rinde una tarjeta HTML con las fuentes y los tokens de la landing en Chrome
// headless y la fotografía. Mismo stack que prerender.cjs (puppeteer-core +
// Chrome), SOLO DESARROLLO. Uso: node tools/og-image.cjs
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'og-image.png');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';

const logo = fs.readFileSync(path.join(ROOT, 'logo_homly.png')).toString('base64');

const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&family=Nunito+Sans:wght@400;700&family=Spline+Sans+Mono:wght@500&display=swap" rel="stylesheet">
<style>
  :root{--paper:#FFFFFF;--ink:#231F20;--ink-soft:#434345;--clay:#F05223;--clay-ink:#B23A0B;--line:rgba(35,31,32,.14)}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:var(--paper);color:var(--ink);
    font-family:"Manrope",system-ui,sans-serif;overflow:hidden;position:relative}
  /* Barra de marca al borde, igual que los acentos clay de la landing. */
  body::before{content:"";position:absolute;inset:0 0 auto 0;height:10px;background:var(--clay)}
  .card{height:100%;padding:60px 80px 58px;display:flex;flex-direction:column;justify-content:space-between}
  .mono{font-family:"Spline Sans Mono",monospace;font-weight:500;letter-spacing:.12em;
    text-transform:uppercase;font-size:17px}
  header{display:flex;align-items:center;justify-content:space-between}
  header img{height:52px;width:auto;display:block}
  .eyebrow{display:flex;align-items:center;gap:14px;color:var(--clay-ink);font-size:15px}
  .eyebrow::before{content:"";width:52px;height:1px;background:var(--clay)}
  h1{font-family:"Nunito Sans",sans-serif;font-weight:400;font-size:80px;line-height:1.03;
    letter-spacing:-.025em;margin:24px 0 22px}
  h1 b{font-weight:700;color:var(--clay-ink)}
  p{font-size:26px;line-height:1.45;color:var(--ink-soft);max-width:32ch}
  footer{display:flex;gap:46px;border-top:1px solid var(--ink);padding-top:24px;color:var(--ink-soft)}
  footer span{display:flex;align-items:center;gap:12px;font-size:16px}
  footer span::before{content:"";width:9px;height:9px;background:var(--clay);border-radius:50%}
</style></head><body>
<div class="card">
  <header>
    <img src="data:image/png;base64,${logo}" alt="Homly">
    <span class="mono">homly.world</span>
  </header>
  <div>
    <div class="eyebrow mono">CRM Inmobiliario</div>
    <h1>El CRM que entiende<br><b>a quién le vendes</b></h1>
    <p>Matching propiedad-cliente, perfil familiar y analítica de conversión.</p>
  </div>
  <footer class="mono">
    <span>Matching</span><span>Perfil familiar</span><span>Agenda de visitas</span><span>Analítica</span>
  </footer>
</div></body></html>`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: OUT, type: 'png' });
    console.log(`OK · og-image.png · ${(fs.statSync(OUT).size / 1024).toFixed(1)} KB`);
  } finally {
    await browser.close();
  }
})().catch((e) => { console.error('og-image failed:', e.message); process.exit(1); });
