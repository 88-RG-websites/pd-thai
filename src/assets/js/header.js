/**
 * Mobile menu functionality using dialog element
 */
export function initHeader() {
  // Mobile menu dialog functionality
  const mobileMenuDialog = document.getElementById('mobile-menu');
  const openButton = document.querySelector('[command="show-modal"][commandfor="mobile-menu"]');
  const closeButton = document.querySelector('[command="close"][commandfor="mobile-menu"]');
  const mobileMenuLinks = mobileMenuDialog ? mobileMenuDialog.querySelectorAll('a') : [];

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

  // Close menu when clicking on menu links (covers same-page anchor
  // navigation like /#contact, which doesn't trigger a page load)
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
  }
}
