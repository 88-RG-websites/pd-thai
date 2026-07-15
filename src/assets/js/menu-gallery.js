/**
 * Menu gallery carousel: 3 circular dish photos visible on desktop, 1 on mobile.
 * Autoplay loops continuously in one direction via cloned leading slides
 * (same technique as the reviews carousel), with an explicit play/pause toggle.
 */
export function initMenuGallery() {
  const viewport = document.getElementById('menu-gallery-viewport');
  const track = document.getElementById('menu-gallery-track');
  const prevBtn = document.getElementById('menu-gallery-prev');
  const nextBtn = document.getElementById('menu-gallery-next');
  const toggleBtn = document.getElementById('menu-gallery-toggle');
  const pauseIcon = document.getElementById('menu-gallery-pause-icon');
  const playIcon = document.getElementById('menu-gallery-play-icon');
  const realSlides = track ? Array.from(track.children) : [];
  const realCount = realSlides.length;

  if (!viewport || !track || !prevBtn || !nextBtn || !toggleBtn || realCount === 0) {
    return;
  }

  const AUTOPLAY_MS = 3500;
  const TRANSITION_MS = 500;
  const MAX_VISIBLE = 3;
  const desktopQuery = window.matchMedia('(min-width: 640px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = 0;
  let autoplayTimer = null;
  let wrapTimeout = null;
  let isPlaying = !reducedMotionQuery.matches;

  // Clone the leading slides so autoplay can keep scrolling forward seamlessly
  for (let i = 0; i < Math.min(MAX_VISIBLE, realCount); i++) {
    const clone = realSlides[i].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.querySelectorAll('a, button, img').forEach((el) => el.setAttribute('tabindex', '-1'));
    track.appendChild(clone);
  }

  function getVisibleCount() {
    return desktopQuery.matches ? Math.min(MAX_VISIBLE, realCount) : 1;
  }

  function getMaxIndex() {
    return Math.max(0, realCount - getVisibleCount());
  }

  function getStep() {
    const gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || '0') || 0;
    return realSlides[0].getBoundingClientRect().width + gap;
  }

  function render(instant) {
    if (instant) track.style.transitionDuration = '0ms';
    track.style.transform = `translateX(-${currentIndex * getStep()}px)`;
    if (instant) {
      void track.offsetHeight; // force reflow before restoring the transition
      track.style.transitionDuration = '';
    }
  }

  // Direct navigation (arrow click): jump straight to the target, no looping tricks needed
  function setIndex(index) {
    clearTimeout(wrapTimeout);
    currentIndex = Math.max(0, Math.min(index, getMaxIndex()));
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

  function updateToggleUI() {
    pauseIcon.classList.toggle('hidden', !isPlaying);
    playIcon.classList.toggle('hidden', isPlaying);
    toggleBtn.setAttribute('aria-label', isPlaying ? 'Pause carousel' : 'Play carousel');
    toggleBtn.setAttribute('aria-pressed', String(isPlaying));
  }

  function startAutoplay() {
    stopAutoplay();
    if (!isPlaying || realCount <= getVisibleCount()) return;
    autoplayTimer = setInterval(advance, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  prevBtn.addEventListener('click', () => setIndex(currentIndex - 1));
  nextBtn.addEventListener('click', () => setIndex(currentIndex + 1));

  toggleBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    updateToggleUI();
    if (isPlaying) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else if (isPlaying) {
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

  updateToggleUI();
  render(true);
  startAutoplay();
}
