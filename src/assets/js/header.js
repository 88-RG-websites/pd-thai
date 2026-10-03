/**
 * Mobile menu functionality using dialog element
 */
export function initHeader() {
  // Mobile menu: a native <dialog> (focus trap, inert background, Escape) whose
  // panel is moved by a CSS transition keyed to `.is-open`, not by animations.
  //
  // The previous version ran an `animation: … both` entrance on the panel and
  // added `.is-closing` to run an exit, then removed that class immediately
  // before .close(). Removing it re-matched the entrance rule, so the panel
  // snapped back to open for one frame before the dialog left the top layer —
  // "it jumps back after it closes, then goes away" in Safari, which paints
  // that frame where Chrome coalesces it. A transition cannot restart like
  // that: the open state is a class that is either set or not.
  const mobileMenuDialog = document.getElementById('mobile-menu');
  const openButton = document.querySelector('[data-mobile-open]');
  const closeButton = mobileMenuDialog ? mobileMenuDialog.querySelector('[data-mobile-close]') : null;
  // Every link in the panel, not just anchors: nav hrefs are prefixed with /
  // so they resolve from any page, and the panel should slide away either way.
  const mobileMenuLinks = mobileMenuDialog ? mobileMenuDialog.querySelectorAll('a[href]') : [];
  const panel = mobileMenuDialog ? mobileMenuDialog.querySelector('el-dialog-panel') : null;

  // Fallback for the close that transitionend should drive. Must exceed the
  // panel's transition duration in styles.scss.
  const EXIT_FALLBACK_MS = 500;
  let exitTimer = null;

  const prefersReducedMotion = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function openMobileMenu() {
    if (!mobileMenuDialog || mobileMenuDialog.open) return;
    clearTimeout(exitTimer);
    mobileMenuDialog.showModal();
    if (openButton) openButton.setAttribute('aria-expanded', 'true');
    // showModal() renders the dialog in this same tick, so adding .is-open
    // without a reflow transitions from nothing and the panel appears already
    // open. Reading offsetHeight forces the pre-transition style to commit.
    if (panel) void panel.offsetHeight;
    mobileMenuDialog.classList.add('is-open');
  }

  function finishClose() {
    if (!mobileMenuDialog) return;
    clearTimeout(exitTimer);
    exitTimer = null;
    if (mobileMenuDialog.open) mobileMenuDialog.close();
  }

  function closeMobileMenu() {
    if (!mobileMenuDialog || !mobileMenuDialog.open) return;
    if (openButton) openButton.setAttribute('aria-expanded', 'false');
    mobileMenuDialog.classList.remove('is-open');

    // With transitions disabled there is no transitionend to wait for.
    if (prefersReducedMotion()) {
      finishClose();
      return;
    }

    clearTimeout(exitTimer);
    exitTimer = setTimeout(finishClose, EXIT_FALLBACK_MS);
  }

  if (panel) {
    panel.addEventListener('transitionend', (e) => {
      // Only the panel's own slide ends the close — link fades and hover
      // colours bubble up here too.
      if (e.target !== panel || e.propertyName !== 'transform') return;
      if (!mobileMenuDialog.classList.contains('is-open')) finishClose();
    });
  }

  if (openButton) {
    openButton.addEventListener('click', openMobileMenu);
  }

  if (closeButton) {
    closeButton.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking on menu links (for same-page navigation)
  mobileMenuLinks.forEach((link) => {
    link.addEventListener('click', closeMobileMenu);
  });

  if (mobileMenuDialog) {
    mobileMenuDialog.addEventListener('click', (e) => {
      // Anything outside the panel counts as backdrop: the ::backdrop pseudo
      // element, the dialog box itself, and the transparent wrapper div the
      // panel sits inside.
      if (!e.target.closest('el-dialog-panel')) {
        closeMobileMenu();
      }
    });

    // Escape would close the dialog instantly — route it through the animated
    // close instead.
    mobileMenuDialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeMobileMenu();
    });

    // Whatever closed it (including a native path this file didn't drive),
    // leave no stale open state behind.
    mobileMenuDialog.addEventListener('close', () => {
      mobileMenuDialog.classList.remove('is-open');
      if (openButton) openButton.setAttribute('aria-expanded', 'false');
      clearTimeout(exitTimer);
      exitTimer = null;
    });
  }

  // Header scroll state: transparent over the hero, tinted + blurred once the
  // page scrolls. Styling lives in styles.scss under #main-header.is-scrolled.
  const header = document.getElementById('main-header');

  if (header) {
    let ticking = false;

    // Pages without a hero (data-solid) keep the tinted bar at every position.
    const alwaysSolid = header.dataset.solid === 'true';

    function applyScrollState() {
      header.classList.toggle('is-scrolled', alwaysSolid || window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(applyScrollState);
        }
      },
      { passive: true }
    );

    // Initial check in case page loads scrolled
    applyScrollState();
  }
}