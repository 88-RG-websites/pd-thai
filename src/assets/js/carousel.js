/**
 * Photo carousel: native scroll-snap track with arrows, dots, drag, autoplay.
 *
 * Progressive enhancement — without JS the track is still a horizontally
 * scrollable, snapping strip of photos. Autoplay pauses on hover, touch,
 * drag, and when the tab is hidden, and never starts for users who ask for
 * reduced motion.
 */
import { createLightbox } from './lightbox.js';

const AUTOPLAY_MS = 4500;
const DRAG_SLOP = 4;

export function initCarousel() {
  const viewport = document.getElementById('carousel-viewport');
  const track = document.getElementById('carousel-track');
  if (!viewport || !track) return;

  const slides = Array.from(track.children);
  if (!slides.length) return;

  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dotsWrap = document.getElementById('carousel-dots');
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  let autoplayTimer = null;
  let dragging = false;
  let dragMoved = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  const maxScroll = () => viewport.scrollWidth - viewport.clientWidth;

  function step() {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    return slides[0].getBoundingClientRect().width + gap;
  }

  function currentIndex() {
    const size = step();
    if (!size) return 0;
    return Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / size)));
  }

  function scrollToIndex(index) {
    viewport.scrollTo({ left: Math.max(0, index) * step(), behavior: 'smooth' });
  }

  function advance() {
    if (viewport.scrollLeft >= maxScroll() - 2) {
      viewport.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      scrollToIndex(currentIndex() + 1);
    }
  }

  function retreat() {
    if (viewport.scrollLeft <= 2) {
      viewport.scrollTo({ left: maxScroll(), behavior: 'smooth' });
    } else {
      scrollToIndex(currentIndex() - 1);
    }
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  function startAutoplay() {
    stopAutoplay();
    if (reducedMotion.matches || maxScroll() <= 0) return;
    autoplayTimer = setInterval(advance, AUTOPLAY_MS);
  }

  function updateDots() {
    if (!dots.length) return;
    // Slides past the last snap position are unreachable — hide their dots.
    const size = step();
    const lastReachable = size ? Math.round(maxScroll() / size) : 0;
    const active = currentIndex();
    dots.forEach((dot, i) => {
      dot.hidden = i > lastReachable;
      dot.classList.toggle('is-active', i === active);
      dot.setAttribute('aria-current', i === active ? 'true' : 'false');
    });
  }

  prevBtn?.addEventListener('click', () => {
    retreat();
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    advance();
    startAutoplay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      scrollToIndex(i);
      startAutoplay();
    });
  });

  viewport.addEventListener('scroll', () => window.requestAnimationFrame(updateDots), {
    passive: true,
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      scrollToIndex(currentIndex() - 1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      scrollToIndex(currentIndex() + 1);
    }
  });

  // Mouse drag. Touch already scrolls natively.
  viewport.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragging = true;
    dragMoved = false;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    viewport.classList.add('is-dragging');
    stopAutoplay();
  });

  viewport.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const dx = event.clientX - dragStartX;
    if (Math.abs(dx) > DRAG_SLOP) dragMoved = true;
    viewport.scrollLeft = dragStartScroll - dx;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    viewport.classList.remove('is-dragging');
    startAutoplay();
  }

  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('mouseleave', () => {
    endDrag();
  });

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('touchstart', stopAutoplay, { passive: true });
  viewport.addEventListener('touchend', startAutoplay, { passive: true });
  window.addEventListener('resize', updateDots);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  // Lightbox — clicking a photo opens the shared viewer; autoplay waits.
  const lightbox = createLightbox({
    root: document.getElementById('carousel-lightbox'),
    image: document.getElementById('carousel-lightbox-image'),
    closeBtn: document.getElementById('carousel-lightbox-close'),
    prevBtn: document.getElementById('carousel-lightbox-prev'),
    nextBtn: document.getElementById('carousel-lightbox-next'),
    counter: document.getElementById('carousel-lightbox-counter'),
    onOpen: stopAutoplay,
    onClose: startAutoplay,
  });

  if (lightbox) {
    const items = slides.map((slide) => {
      const img = slide.querySelector('img');
      // data-full-image is the master; src is the smaller strip rendition.
      return { src: img ? (img.dataset.fullImage || img.src) : '', alt: img ? img.alt : '' };
    });

    track.addEventListener('click', (event) => {
      if (dragMoved) return; // a drag just ended — not a click
      const img = event.target.closest('img[data-index]');
      if (!img) return;
      lightbox.open(Number(img.dataset.index), items);
    });
  }

  updateDots();
  startAutoplay();
}
