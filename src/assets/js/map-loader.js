/**
 * Stabilized loader for the Google Maps embeds.
 *
 * The embed sometimes dies mid-init on flaky connections (its internal
 * InitMapsJwt RPC fails and the place card never renders). That happens inside
 * Google's cross-origin frame, so it can't be observed directly — but a load
 * that dies that way usually never fires the iframe's `load` event, or leaves
 * it having loaded nothing. The reliable lever we do have is the src
 * attribute: setting it (again) restarts the whole embed.
 *
 * So instead of loading="lazy", the map components ship the URL in
 * `data-map-src` and this module:
 *   1. starts the load shortly before the frame scrolls into view
 *      (IntersectionObserver, generous margin — same effect as lazy), and
 *   2. if `load` hasn't fired within the timeout, re-sets src to restart the
 *      embed, up to MAX_ATTEMPTS total tries.
 *
 * Every `iframe[data-map-src]` on the page is handled, since a layout can
 * carry more than one (visit and contact both render a map).
 */
const LOAD_TIMEOUT_MS = 12000;
const MAX_ATTEMPTS = 3;

function watch(frame) {
  const src = frame.dataset.mapSrc;
  if (!src) return;

  let attempts = 0;
  let timer = null;

  frame.addEventListener('load', () => clearTimeout(timer));

  const start = () => {
    attempts += 1;
    frame.src = src;
    clearTimeout(timer);
    if (attempts < MAX_ATTEMPTS) {
      timer = setTimeout(start, LOAD_TIMEOUT_MS);
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      // Start loading well before the map is on screen so it's usually ready
      // by the time the user scrolls to it.
      { rootMargin: '800px 0px' }
    );
    observer.observe(frame);
  } else {
    start();
  }
}

export function initMapLoader() {
  document.querySelectorAll('iframe[data-map-src]').forEach(watch);
}
