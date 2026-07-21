/**
 * Mobile menu functionality using dialog element
 */
export function initHeader() {
  // Mobile menu dialog functionality
  const mobileMenuDialog = document.getElementById('mobile-menu');
  const openButton = document.querySelector('[command="show-modal"][commandfor="mobile-menu"]');
  const closeButton = document.querySelector('[command="close"][commandfor="mobile-menu"]');
  const mobileMenuLinks = mobileMenuDialog ? mobileMenuDialog.querySelectorAll('a[href^="#"]') : [];

  function openMobileMenu() {
    if (mobileMenuDialog) {
      mobileMenuDialog.showModal();
    }
  }

  function closeMobileMenu() {
    if (mobileMenuDialog) {
      mobileMenuDialog.close();
    }
  }

  // Open menu when open button is clicked
  if (openButton) {
    openButton.addEventListener('click', openMobileMenu);
  }

  // Close menu when close button is clicked
  if (closeButton) {
    closeButton.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking on menu links (for same-page navigation)
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu when clicking on backdrop
  if (mobileMenuDialog) {
    mobileMenuDialog.addEventListener('click', (e) => {
      // Close if clicking on the dialog backdrop (not the content)
      if (e.target === mobileMenuDialog) {
        closeMobileMenu();
      }
    });

    // Close menu when pressing Escape (handled natively by dialog, but we can add custom handling)
    mobileMenuDialog.addEventListener('cancel', (e) => {
      // Optional: prevent default and add custom behavior if needed
      // e.preventDefault();
    });
  }

  // Homepage-only: shrink the large logo down to standard size once the user scrolls,
  // swapping to the same logo.png the other pages use
  const header = document.getElementById('main-header');
  if (header && header.hasAttribute('data-shrink-header')) {
    const SCROLL_THRESHOLD = 50;
    const logoImg = document.getElementById('header-logo-img');
    // Derive both srcs from the initial (already path-prefix-correct) rendered
    // src rather than hardcoding "/assets/...", so this works whether the site
    // is deployed at the domain root or under a preview subfolder.
    const logoWebpSrc = logoImg ? logoImg.getAttribute('src') : null;
    const logoPngSrc = logoWebpSrc ? logoWebpSrc.replace('logo.webp', 'logo.png') : null;
    // index2 only: below the lg breakpoint the header always shows its solid
    // "scrolled" state, so nothing shifts on scroll
    const forceScrolledOnMobile = header.hasAttribute('data-nav-top')
      ? window.matchMedia('(max-width: 1023px)')
      : null;

    function updateHeaderScrollState() {
      const scrolled =
        (forceScrolledOnMobile && forceScrolledOnMobile.matches) ||
        window.scrollY > SCROLL_THRESHOLD;
      header.classList.toggle('is-scrolled', scrolled);
      if (logoImg && logoPngSrc) {
        logoImg.src = scrolled ? logoPngSrc : logoWebpSrc;
      }
    }

    updateHeaderScrollState();
    window.addEventListener('scroll', updateHeaderScrollState, { passive: true });
    if (forceScrolledOnMobile) {
      forceScrolledOnMobile.addEventListener('change', updateHeaderScrollState);
    }
  }
}