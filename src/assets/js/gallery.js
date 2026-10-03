import { createLightbox } from './lightbox.js';

/**
 * Gallery grid: opens the shared lightbox on click or Enter/Space, using each
 * thumbnail's data-full-image as the full-size source.
 */
export function initGallery() {
  const thumbs = document.querySelectorAll('#gallery-grid figure img');
  if (!thumbs.length) return;

  const lightbox = createLightbox({
    root: document.getElementById('gallery-modal'),
    image: document.getElementById('modal-image'),
    closeBtn: document.getElementById('modal-close'),
    prevBtn: document.getElementById('modal-prev'),
    nextBtn: document.getElementById('modal-next'),
    counter: document.getElementById('modal-counter'),
  });
  if (!lightbox) return;

  const items = Array.from(thumbs).map((img) => ({
    src: img.dataset.fullImage || img.src,
    alt: img.alt,
  }));

  thumbs.forEach((img, index) => {
    img.addEventListener('click', () => lightbox.open(index, items));
    // Thumbnails carry role="button" + tabindex="0" — finish the contract.
    img.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        lightbox.open(index, items);
      }
    });
  });
}
