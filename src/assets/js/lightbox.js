/**
 * Shared lightbox behaviour for the gallery grid and the photo carousel.
 *
 * Both viewers work the same way: click (or Enter/Space on a thumbnail) opens,
 * arrows / arrow keys / 48px swipes move through the set, Escape or a backdrop
 * click closes, and page scroll is locked while open. Index wraps at both ends.
 *
 * The viewer opens in the browser's top layer, the way the mobile menu does:
 * the 88.js order footer is position:fixed at z-index 99999 and its popups
 * and launcher sit above 2147483000, so on a phone they covered the viewer's
 * own arrows and counter. No z-index on the viewer can win that. Each
 * component's markup is a full-screen `<div>` (seeded, and client-owned once
 * customised), so the fix lives here, in the owned script: the div is moved
 * into a native <dialog> opened with showModal(). The dialog is a zero-size
 * shell and the div stays the full-screen ground, because the div's
 * flex/inset classes on the dialog itself would beat the UA's display:none
 * and show it while closed.
 */
const SWIPE_THRESHOLD = 48;

function topLayerShell(root) {
  const dialog = document.createElement('dialog');
  dialog.className = 'm-0 max-h-none max-w-none bg-transparent p-0 backdrop:bg-transparent';
  dialog.setAttribute('aria-label', root.getAttribute('aria-label') || 'Image viewer');
  // The dialog carries the modal semantics now; a role="dialog" inside it
  // would announce a second one.
  root.removeAttribute('role');
  root.removeAttribute('aria-modal');
  root.removeAttribute('aria-label');
  root.before(dialog);
  dialog.append(root);
  // A closed dialog is display:none, so the ground no longer hides itself.
  root.classList.remove('hidden');
  root.classList.add('flex');
  return dialog;
}

export function createLightbox({ root, image, closeBtn, prevBtn, nextBtn, counter, onOpen, onClose }) {
  if (!root || !image || !closeBtn || !prevBtn || !nextBtn) return null;
  // Without <dialog> (Safari before 15.4) the shell below would be an inline
  // element that hides nothing, and the full-screen ground would cover the
  // page. No viewer at all is the better failure: the grid still shows.
  if (typeof HTMLDialogElement !== 'function') return null;

  const dialog = topLayerShell(root);

  let items = [];
  let index = 0;
  let lastFocused = null;

  const isOpen = () => dialog.open;

  function render() {
    const item = items[index];
    if (!item) return;
    image.src = item.src;
    // No visible caption — alt carries the description for screen readers.
    image.alt = item.alt || '';
    if (counter) counter.textContent = `${index + 1} / ${items.length}`;
  }

  function open(nextIndex, nextItems) {
    if (nextItems) items = nextItems;
    if (!items.length || dialog.open) return;
    index = nextIndex;
    lastFocused = document.activeElement;
    render();
    dialog.showModal();
    // showModal() does not lock background scroll; the viewer owns that.
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    onOpen?.();
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  // Every close path ends here: the close button, a backdrop click and the
  // browser's own Escape all fire the dialog's `close` event, so the cleanup
  // runs exactly once whichever one it was.
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    if (lastFocused && document.contains(lastFocused)) lastFocused.focus();
    onClose?.();
  });

  function show(step) {
    if (!items.length) return;
    index = (index + step + items.length) % items.length;
    render();
  }

  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(-1));
  nextBtn.addEventListener('click', () => show(1));

  root.addEventListener('click', (event) => {
    if (event.target === root) close();
  });

  let swipeStartX = null;
  root.addEventListener(
    'touchstart',
    (event) => {
      swipeStartX = event.touches[0].clientX;
    },
    { passive: true }
  );

  root.addEventListener(
    'touchend',
    (event) => {
      if (swipeStartX === null) return;
      const dx = event.changedTouches[0].clientX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      show(dx > 0 ? -1 : 1);
    },
    { passive: true }
  );

  // Escape is the dialog's own (it fires `close`, above).
  document.addEventListener('keydown', (event) => {
    if (!isOpen()) return;
    if (event.key === 'ArrowLeft') show(-1);
    else if (event.key === 'ArrowRight') show(1);
  });

  return { open, close, isOpen, setItems: (next) => { items = next; } };
}
