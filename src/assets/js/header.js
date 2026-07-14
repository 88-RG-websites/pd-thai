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
}