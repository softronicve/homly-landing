// Anima los elementos .reveal de un contenedor cuando entran al viewport.
export function revealOnScroll(container, signal) {
  const els = container.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('in'), (i % 4) * 90);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach((el) => {
    // En prod el prerender hornea `.in` en TODOS los .reveal (evita FOUC en el
    // first-paint). Eso mataba la animación al scrollear: si un elemento vino con
    // `.in` pero está fuera del viewport, lo reseteamos para que anime al entrar.
    // (En dev no hay nada horneado → no-op.) Usa el viewport real del usuario.
    if (el.classList.contains('in') && el.getBoundingClientRect().top >= window.innerHeight) {
      el.classList.remove('in');
    }
    io.observe(el);
  });
  signal?.addEventListener('abort', () => io.disconnect(), { once: true });
}
