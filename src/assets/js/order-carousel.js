/**
 * Order-online carousel (index3): 3 circular dish photos visible on desktop,
 * 1 on mobile. Auto-advances on a timer with no play/pause control, and wraps
 * infinitely in both directions via cloned slides at each end of the track.
 */
export function initOrderCarousel() {
  const viewport = document.getElementById('order-carousel-viewport');
  const track = document.getElementById('order-carousel-track');
  const prevBtn = document.getElementById('order-carousel-prev');
  const nextBtn = document.getElementById('order-carousel-next');
  const dotsWrap = document.getElementById('order-carousel-dots');
  const dots = dotsWrap ? Array.from(dotsWrap.children) : [];
  const lightbox = document.getElementById('order-lightbox');
  const lightboxImage = document.getElementById('order-lightbox-image');
  const lightboxCaption = document.getElementById('order-lightbox-caption');
  const lightboxClose = document.getElementById('order-lightbox-close');
  const lightboxPrev = document.getElementById('order-lightbox-prev');
  const lightboxNext = document.getElementById('order-lightbox-next');
  const realSlides = track ? Array.from(track.children) : [];
  const realCount = realSlides.length;

  if (!viewport || !track || !prevBtn || !nextBtn || realCount === 0) {
    return;
  }

  const AUTOPLAY_MS = 4000;
  const TRANSITION_MS = 500;
  const MAX_VISIBLE = 3;
  const CLONES = Math.min(MAX_VISIBLE, realCount);
  const desktopQuery = window.matchMedia('(min-width: 640px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0; // drifts to -1 or realCount mid-wrap, then snaps back in range
  let autoplayTimer = null;
  let wrapTimeout = null;

  function makeClone(slide) {
    const clone = slide.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button, img').forEach((el) => el.setAttribute('tabindex', '-1'));
    return clone;
  }

  // Clones at both ends let next-on-last and prev-on-first keep sliding in the
  // same visual direction before snapping (instantly) to the real slide.
  for (let i = 0; i < CLONES; i++) {
    track.appendChild(makeClone(realSlides[i]));
  }
  for (let i = realCount - 1; i >= realCount - CLONES; i--) {
    track.insertBefore(makeClone(realSlides[i]), track.firstChild);
  }

  function getVisibleCount() {
    return desktopQuery.matches ? Math.min(MAX_VISIBLE, realCount) : 1;
  }

  function getStep() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return realSlides[0].getBoundingClientRect().width + gap;
  }

  // Dot styling lives in the template so Tailwind generates the classes; JS only swaps them
  const DOT_ACTIVE = ['bg-primary-600'];
  const DOT_INACTIVE = ['bg-[#241b16]/20', 'hover:bg-[#241b16]/40'];

  function updateDots() {
    const active = ((currentIndex % realCount) + realCount) % realCount;
    dots.forEach((dot, i) => {
      DOT_ACTIVE.forEach((cls) => dot.classList.toggle(cls, i === active));
      DOT_INACTIVE.forEach((cls) => dot.classList.toggle(cls, i !== active));
    });
  }

  function render(instant) {
    if (instant) track.style.transitionDuration = '0ms';
    track.style.transform = `translateX(-${(currentIndex + CLONES) * getStep()}px)`;
    if (instant) {
      void track.offsetHeight; // force reflow before restoring the transition
      track.style.transitionDuration = '';
    }
    updateDots();
  }

  // If we're sitting on a clone (mid-wrap), snap instantly to its real slide
  function normalize() {
    clearTimeout(wrapTimeout);
    if (currentIndex === realCount) {
      currentIndex = 0;
      render(true);
    } else if (currentIndex === -1) {
      currentIndex = realCount - 1;
      render(true);
    }
  }

  function move(delta) {
    normalize();
    currentIndex += delta;
    render();
    if (currentIndex === realCount || currentIndex === -1) {
      wrapTimeout = setTimeout(normalize, TRANSITION_MS);
    }
  }

  function goTo(index) {
    normalize();
    currentIndex = index;
    render();
  }

  function isLightboxOpen() {
    return lightbox && !lightbox.classList.contains('hidden');
  }

  function startAutoplay() {
    stopAutoplay();
    if (reducedMotionQuery.matches || isLightboxOpen() || realCount <= getVisibleCount()) return;
    autoplayTimer = setInterval(() => move(1), AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Restart the timer on manual navigation so autoplay doesn't fire right after a click
  prevBtn.addEventListener('click', () => {
    move(-1);
    startAutoplay();
  });
  nextBtn.addEventListener('click', () => {
    move(1);
    startAutoplay();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      startAutoplay();
    });
  });

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', startAutoplay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // --- Lightbox ---
  if (lightbox && lightboxImage && lightboxClose && lightboxPrev && lightboxNext) {
    const images = realSlides.map((slide) => {
      const img = slide.querySelector('img');
      return { src: img ? img.src : '', alt: img ? img.alt : '' };
    });
    let lightboxIndex = 0;

    const updateLightbox = () => {
      const image = images[lightboxIndex];
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      if (lightboxCaption) lightboxCaption.textContent = image.alt;
    };

    const openLightbox = (index) => {
      lightboxIndex = index;
      updateLightbox();
      lightbox.classList.remove('hidden');
      lightbox.classList.add('flex');
      document.body.style.overflow = 'hidden';
      stopAutoplay();
    };

    const closeLightbox = () => {
      lightbox.classList.add('hidden');
      lightbox.classList.remove('flex');
      document.body.style.overflow = '';
      startAutoplay();
    };

    const showPrev = () => {
      lightboxIndex = (lightboxIndex - 1 + images.length) % images.length;
      updateLightbox();
    };

    const showNext = () => {
      lightboxIndex = (lightboxIndex + 1) % images.length;
      updateLightbox();
    };

    // Delegate from the track so cloned slides work too; data-index maps a
    // clone back to the real slide it was copied from.
    track.addEventListener('click', (e) => {
      const img = e.target.closest('img[data-index]');
      if (!img) return;
      openLightbox(Number(img.dataset.index));
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrev);
    lightboxNext.addEventListener('click', showNext);

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!isLightboxOpen()) return;
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          showPrev();
          break;
        case 'ArrowRight':
          showNext();
          break;
      }
    });
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      normalize();
      render(true);
      startAutoplay();
    }, 150);
  });

  render(true);
  startAutoplay();
}
