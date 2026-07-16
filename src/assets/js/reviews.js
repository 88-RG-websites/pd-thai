/**
 * Reviews carousel: 3 slides visible on desktop, 1 on mobile.
 * Every review has its own dot; the centered card is the "selected" one.
 * Autoplay loops continuously in one direction (never snaps backward) by
 * scrolling into cloned copies of the leading slides, then silently
 * resetting position once the clones are fully in view.
 */
export function initReviews() {
  const viewport = document.getElementById('reviews-viewport');
  const track = document.getElementById('reviews-track');
  const dotsWrap = document.getElementById('reviews-dots');
  const realSlides = track ? Array.from(track.children) : [];
  const realCount = realSlides.length;

  if (!viewport || !track || realCount === 0) {
    return;
  }

  const AUTOPLAY_MS = 5000;
  const TRANSITION_MS = 500;
  const MAX_VISIBLE = 3;
  const desktopQuery = window.matchMedia('(min-width: 640px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let autoplayTimer = null;
  let wrapTimeout = null;

  // Clone the leading slides and append them so autoplay can keep scrolling
  // forward past the "end" into what looks like a natural continuation.
  for (let i = 0; i < Math.min(MAX_VISIBLE, realCount); i++) {
    const clone = realSlides[i].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
    track.appendChild(clone);
  }

  function getVisibleCount() {
    return desktopQuery.matches ? Math.min(MAX_VISIBLE, realCount) : 1;
  }

  function getCenterOffset() {
    return Math.floor(getVisibleCount() / 2);
  }

  function getStep() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return realSlides[0].getBoundingClientRect().width + gap;
  }

  function getCenterRealIndex() {
    return (currentIndex + getCenterOffset()) % realCount;
  }

  function updateDots() {
    if (!dotsWrap) return;
    const centerIndex = getCenterRealIndex();
    Array.from(dotsWrap.children).forEach((dot, i) => {
      const isActive = i === centerIndex;
      const bullet = dot.firstElementChild;
      bullet.classList.toggle('bg-white', isActive);
      bullet.classList.toggle('bg-white/40', !isActive);
      dot.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function render(instant) {
    if (instant) track.style.transitionDuration = '0ms';
    track.style.transform = `translateX(-${currentIndex * getStep()}px)`;
    if (instant) {
      void track.offsetHeight; // force reflow before restoring the transition
      track.style.transitionDuration = '';
    }
    updateDots();
  }

  // Direct navigation (dot click): jump straight to the target, no looping tricks needed
  function setIndex(realIndex) {
    clearTimeout(wrapTimeout);
    const offset = getCenterOffset();
    currentIndex = ((realIndex - offset) % realCount + realCount) % realCount;
    render();
  }

  // Autoplay step: always moves forward, looping seamlessly via the cloned slides
  function advance() {
    currentIndex += 1;
    render();
    if (currentIndex === realCount) {
      wrapTimeout = setTimeout(() => {
        currentIndex = 0;
        render(true);
      }, TRANSITION_MS);
    }
  }

  function buildDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = '';
    realSlides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Go to review ${i + 1}`);
      dot.className = 'flex h-6 w-6 items-center justify-center';
      dot.innerHTML = '<span class="h-2 w-2 rounded-full bg-white/40 transition-colors"></span>';
      dot.addEventListener('click', () => manualGoTo(i));
      dotsWrap.appendChild(dot);
    });
  }

  function startAutoplay() {
    stopAutoplay();
    if (reducedMotionQuery.matches || realCount <= getVisibleCount()) return;
    autoplayTimer = setInterval(advance, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // Manual navigation restarts the autoplay clock so pacing stays consistent
  function manualGoTo(realIndex) {
    setIndex(realIndex);
    startAutoplay();
  }

  viewport.addEventListener('mouseenter', stopAutoplay);
  viewport.addEventListener('mouseleave', startAutoplay);
  viewport.addEventListener('focusin', stopAutoplay);
  viewport.addEventListener('focusout', startAutoplay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      render(true);
      startAutoplay();
    }, 150);
  });

  buildDots();
  render(true);
  startAutoplay();
}
