"""
Genera las páginas de módulo de homly.world a partir de PAGES.

Uso: python3 tools/modulos.py <directorio-salida> [--staging]
Con --staging agrega noindex. Cada página sale en <salida>/<slug>/index.html.
"""
import html
import json
import math
import os
import sys

from modulos_data import PAGES

SITE = "https://homly.world"
REG = "https://admin.homly.world/#/registro?plan="
TOOLS = ["CRM", "KYC / KYB", "MLS / Alianzas", "Machine Learning", "Contratos", "Agenda", "Integraciones", "Página web", "Firma digital"]
NAV = [("crm-inmobiliario", "CRM"), ("contratos-inmobiliarios", "Contratos"), ("pagina-web-inmobiliaria", "Página web"), ("kyc-inmobiliario", "KYC / KYB")]
EXT = 'target="_blank" rel="noopener noreferrer"'
E = html.escape

GITHUB = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.21 3.44 9.63 8.21 11.19.6.11.82-.25.82-.56 0-.28-.01-1.02-.02-2-3.34.71-4.04-1.58-4.04-1.58-.55-1.37-1.34-1.74-1.34-1.74-1.09-.73.08-.72.08-.72 1.2.08 1.84 1.21 1.84 1.21 1.07 1.8 2.81 1.28 3.5.98.11-.76.42-1.28.76-1.57-2.67-.3-5.47-1.31-5.47-5.83 0-1.29.47-2.34 1.24-3.17-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.21a11.6 11.6 0 0 1 3-.4c1.02 0 2.05.13 3 .4 2.29-1.53 3.3-1.21 3.3-1.21.66 1.66.24 2.88.12 3.18.77.83 1.24 1.88 1.24 3.17 0 4.53-2.81 5.53-5.49 5.82.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .31.22.68.83.56C20.56 21.91 24 17.5 24 12.29 24 5.78 18.63.5 12 .5z"/></svg>'
INSTAGRAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/></svg>'
SUN = '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
MOON = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>'


def ring(on):
    """Anillo de los 9 módulos con los de `on` encendidos."""
    parts = []
    for i, name in enumerate(TOOLS):
        a = -math.pi / 2 + i * 2 * math.pi / len(TOOLS)
        x, y = 360 * math.cos(a), 360 * math.sin(a)
        ty = y - 34 if y < -10 else y + 56
        cls = "tool on" if name in on else "tool"
        parts.append(
            f'<g class="{cls}"><line class="spoke" x1="0" y1="0" x2="{x * .82:.1f}" y2="{y * .82:.1f}"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="16"/><text x="{x:.1f}" y="{ty:.1f}" text-anchor="middle">{E(name)}</text></g>'
        )
    return (
        '<div class="ring" aria-hidden="true"><svg viewBox="-500 -500 1000 1000">'
        + "".join(parts)
        + '<image href="/favicon.svg" x="-82" y="-82" width="164" height="164"/></svg></div>'
    )


def head(p, staging):
    url = f"{SITE}/{p['slug']}/"
    graph = [
        {"@type": "WebPage", "@id": url, "url": url, "name": p["title"], "description": p["description"], "inLanguage": "es-VE",
         "isPartOf": {"@id": f"{SITE}/#website"}, "about": {"@id": f"{SITE}/#app"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": p["crumb"], "item": url}]},
        {"@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in p["faq"]]},
    ]
    ld = json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False)
    robots = '<meta name="robots" content="noindex, nofollow">\n' if staging else ""
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{robots}<title>{E(p['title'])}</title>
<meta name="description" content="{E(p['description'])}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#FAF8F6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121C22" media="(prefers-color-scheme: dark)">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Homly">
<meta property="og:locale" content="es_VE">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{E(p['title'])}">
<meta property="og:description" content="{E(p['description'])}">
<meta property="og:image" content="{SITE}/og-image-nucleo.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Homly, software inmobiliario para agentes y agencias">
<meta name="twitter:card" content="summary_large_image">
<script>
try {{ const t = localStorage.getItem("theme"); document.documentElement.dataset.theme = t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"); }} catch {{}}
</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="/fonts/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/nunito-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
{ld}
</script>
</head>"""


def header(p):
    links = "".join(
        f'<a href="/{s}/"{" aria-current=\"page\"" if s == p["slug"] else ""}>{E(n)}</a>' for s, n in NAV
    )
    return f"""<header class="site-head">
  <a class="logo" href="/"><img src="/logo-homly-600.png" alt="Homly" width="600" height="169"></a>
  <div class="head-end">
    <nav class="site-nav" aria-label="Módulos">{links}<a href="/#planes">Planes</a></nav>
    <button class="theme-toggle" type="button" aria-label="Cambiar a modo oscuro">{SUN}{MOON}</button>
  </div>
</header>"""


def footer():
    mods = "".join(f'<li><a href="/{s}/">{E(n)}</a></li>' for s, n in NAV)
    return f"""<footer class="site-footer alt">
  <div>
    <img src="/logo-homly-600.png" alt="Homly" width="600" height="169" loading="lazy">
    <p>Homly es un producto de Desarrollos Softronic, C.A. (RIF J-506650606), con domicilio en Barquisimeto, estado Lara, Venezuela. La misma empresa que escribe el código opera la plataforma, responde el soporte y emite la facturación.</p>
  </div>
  <div>
    <p class="foot-title">Homly</p>
    <ul><li><a href="/#recorrido">El recorrido</a></li><li><a href="/#para-quien">Para quién</a></li><li><a href="/#planes">Planes</a></li>{mods}</ul>
  </div>
  <div>
    <p class="foot-title">Productos</p>
    <ul><li><a href="https://myhomly.com" {EXT}>Buscar inmuebles</a></li><li><a href="https://api.homly.world/developers/">Homly para Desarrolladores</a></li></ul>
  </div>
  <div>
    <p class="foot-title">Empresa</p>
    <ul><li><a href="/contacto">Contacto</a></li><li><a href="mailto:info@softronic.dev">info@softronic.dev</a></li><li><a href="https://wa.me/584129296192">WhatsApp</a></li><li><a href="/seguridad.html">Verificación y firma</a></li><li><a href="/verificar">Verificar un documento</a></li><li><a href="/privacidad.html">Privacidad</a></li><li><a href="/terminos.html">Términos</a></li></ul>
  </div>
  <div class="legal">
    <p>© 2026 Homly · <a href="https://softronic.dev" {EXT}>Softronic</a>. Todos los derechos reservados.</p>
    <div class="social">
      <a href="https://www.instagram.com/homlyve" {EXT} aria-label="Homly en Instagram">{INSTAGRAM}</a>
      <a href="https://github.com/softronicve/homly-framework" {EXT} aria-label="homly-framework en GitHub" title="homly-framework">{GITHUB}</a>
      <a href="https://github.com/softronicve/homly-landing" {EXT} aria-label="homly-landing en GitHub" title="homly-landing">{GITHUB}</a>
    </div>
  </div>
</footer>"""


def page(p, staging):
    feats = "".join(f"<li><h3>{E(t)}</h3><p>{E(d)}</p></li>" for t, d in p["features"])
    steps = "".join(f"<li><h3>{E(t)}</h3><p>{E(d)}</p></li>" for t, d in p["steps"])
    related = "".join(
        f'<li><a href="{E(href)}"><strong>{E(t)}</strong><span>{E(d)}</span></a></li>' for href, t, d in p["related"]
    )
    faq = "".join(f"<details><summary>{E(q)}</summary><p>{E(a)}</p></details>" for q, a in p["faq"])
    plan = p.get("plan", "pro")
    return f"""{head(p, staging)}
<body>
{header(p)}
<main>
<section class="page-hero" aria-labelledby="page-title">
  <div>
    <ol class="crumbs"><li><a href="/">Inicio</a></li><li aria-current="page">{E(p['crumb'])}</li></ol>
    <h1 id="page-title">{p['h1']}</h1>
    <p class="lead">{E(p['lead'])}</p>
    <div class="ctas">
      <a class="btn btn-primary" href="{REG}{plan}">Prueba Homly 60 días</a>
      <a class="btn btn-ghost" href="/#planes">Ver planes</a>
    </div>
    <p class="note">La prueba no pide tarjeta ni ningún pago.</p>
  </div>
  {ring(p['on'])}
</section>

<section class="band alt" aria-labelledby="feat-title">
  <div class="wrap features">
    <div>
      <h2 id="feat-title">{p['features_title']}</h2>
      <p class="section-lead">{E(p['features_lead'])}</p>
    </div>
    <ol class="feature-list">{feats}</ol>
  </div>
</section>

<section class="band" aria-labelledby="steps-title">
  <div class="wrap">
    <h2 id="steps-title">{p['steps_title']}</h2>
    <ol class="steps">{steps}</ol>
  </div>
</section>

<section class="band alt" aria-labelledby="rel-title">
  <div class="wrap">
    <h2 id="rel-title">Se conecta con <em>el resto de Homly.</em></h2>
    <p class="section-lead">{E(p['related_lead'])}</p>
    <ul class="related">{related}</ul>
  </div>
</section>

<section class="band" aria-labelledby="faq-title">
  <div class="wrap">
    <h2 id="faq-title">Preguntas frecuentes</h2>
    <div class="faq">{faq}</div>
  </div>
</section>

<section class="band cta-band" aria-labelledby="cta-title">
  <div class="wrap">
    <h2 id="cta-title">{p['cta_title']}</h2>
    <p class="section-lead">Crea tu cuenta y prueba Homly 60 días, sin tarjeta ni pago. Al terminar eliges tu plan.</p>
    <div class="ctas">
      <a class="btn btn-primary" href="{REG}{plan}">Prueba Homly 60 días</a>
      <a class="btn btn-ghost" href="/#planes">Ver planes</a>
    </div>
  </div>
</section>
</main>
{footer()}
<script src="/assets/site.js" defer></script>
</body>
</html>
"""


def main():
    out = sys.argv[1]
    staging = "--staging" in sys.argv
    for p in PAGES:
        d = os.path.join(out, p["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w") as f:
            f.write(page(p, staging))
        print(p["slug"], len(p["title"]), len(p["description"]))


if __name__ == "__main__":
    main()
