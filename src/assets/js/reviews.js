export function initReviews() {
  const section = document.getElementById('reviews');
  if (!section) return;

  const CLAMP = 'line-clamp-5';
  const toggles = section.querySelectorAll('[data-review-toggle]');

  const textFor = (button) => document.getElementById(button.getAttribute('aria-controls'));

  // Only show "Read more" on reviews the clamp actually truncates. Cards
  // still hidden behind "View more" measure 0×0, so this runs again after
  // they're revealed. Measure after the web fonts load — the loaded faces'
  // metrics shift what overflows.
  const showIfClamped = () => {
    toggles.forEach((button) => {
      const text = textFor(button);
      if (text && text.scrollHeight > text.clientHeight) {
        button.classList.remove('hidden');
      }
    });
  };
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(showIfClamped);
  } else {
    showIfClamped();
  }

  toggles.forEach((button) => {
    button.addEventListener('click', () => {
      const text = textFor(button);
      if (!text) return;
      const expanded = !text.classList.toggle(CLAMP);
      button.textContent = expanded ? 'Read less' : 'Read more';
      button.setAttribute('aria-expanded', expanded);
    });
  });

  const more = section.querySelector('[data-reviews-more]');
  if (more) {
    more.addEventListener('click', () => {
      section.querySelectorAll('[data-review-extra]').forEach((card) => card.classList.remove('hidden'));
      more.parentElement.remove();
      showIfClamped();
    });
  }
}
