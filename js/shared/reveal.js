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
  els.forEach((el) => io.observe(el));
  signal?.addEventListener('abort', () => io.disconnect(), { once: true });
}
