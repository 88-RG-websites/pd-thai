/**
 * Reveals [data-reveal] elements (fade/slide) as they scroll into view.
 * Progressive enhancement: elements are only hidden once JS adds the
 * `js-reveal` class to <html>, so content stays visible without JS.
 */
export function initScrollReveal() {
  // Tells the fallback in base.njk that reveal handling is live, so it
  // won't strip the hiding class out from under us.
  window.__scrollRevealReady = true;

  const elements = document.querySelectorAll('[data-reveal]');
  if (!elements.length) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || prefersReducedMotion) {
    elements.forEach((el) => el.classList.add('is-revealed'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -10% 0px',
  });

  elements.forEach((el) => observer.observe(el));
}
