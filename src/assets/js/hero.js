export function initHero() {
  const heroSlider = document.getElementById('hero-slider');
  if (!heroSlider) return;
  
  const slides = heroSlider.querySelectorAll('.hero-slide');
  if (slides.length <= 1) return;

  // Slides after the first ship with data-src so they don't compete with the
  // LCP image (see the comment in components/hero.njk). Promote them once the
  // page has loaded — well before the first rotation at 4s.
  function loadDeferredSlides() {
    heroSlider.querySelectorAll('source[data-srcset]').forEach((source) => {
      source.srcset = source.dataset.srcset;
      source.removeAttribute('data-srcset');
    });
    heroSlider.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }

  if (document.readyState === 'complete') {
    loadDeferredSlides();
  } else {
    window.addEventListener('load', loadDeferredSlides, { once: true });
  }

  let currentSlide = 0;
  
  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.style.opacity = i === index ? '1' : '0';
    });
  }
  
  function nextSlide() {
    const candidate = (currentSlide + 1) % slides.length;
    const img = slides[candidate].querySelector('img');
    // Deferred slides start downloading at the load event, and on a slow
    // connection a hero photo can still be in flight when the first rotation
    // comes round at 4s. Fading to it then would show an empty pane, so hold
    // on the current slide and try again next tick.
    //
    // The test is `complete` alone, not naturalWidth: a broken image is also
    // complete, and holding for one would stall the rotation permanently.
    // Those advance as they always did.
    if (img && !img.complete) return;
    currentSlide = candidate;
    showSlide(currentSlide);
  }
  
  // Auto-advance slides every 4 seconds
  const interval = setInterval(nextSlide, 4000);
  
  // Clean up interval when page changes (for SPAs)
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });
}