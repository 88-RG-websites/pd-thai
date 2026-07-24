export function initHeroVideo() {
  const video = document.getElementById('hero-video');
  if (!video) return;

  // Skip the background video on constrained connections — the poster image
  // stands in, which saves bandwidth on slow / data-saver networks.
  const conn = navigator.connection;
  const prefersReducedData =
    conn && (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType));

  if (prefersReducedData) return;

  // On phones, use the cropped, more-square video so it fills the shorter hero.
  const isMobile = window.matchMedia('(max-width: 767px)').matches;

  // Build <source> elements at runtime (rather than shipping empty <source>
  // tags in the markup, which makes the browser warn about a missing src).
  const sources = [
    { type: 'video/webm', src: (isMobile && video.dataset.webmMobile) || video.dataset.webm },
    { type: 'video/mp4', src: (isMobile && video.dataset.mp4Mobile) || video.dataset.mp4 },
  ];
  let loaded = 0;
  sources.forEach(({ type, src }) => {
    if (!src) return;
    const source = document.createElement('source');
    source.type = type;
    source.src = src;
    video.appendChild(source);
    loaded += 1;
  });
  if (!loaded) return;

  video.load();

  // Play/pause toggle — only shown once we know the video actually has sources
  // (on data-saver connections the poster stands in and the button stays hidden).
  const toggle = document.getElementById('hero-video-toggle');
  let userPaused = false;
  if (toggle) {
    toggle.classList.remove('hidden');
    toggle.classList.add('flex');
    const updateToggle = () => {
      toggle.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
      toggle.querySelector('[data-icon="play"]').classList.toggle('hidden', !video.paused);
      toggle.querySelector('[data-icon="pause"]').classList.toggle('hidden', video.paused);
    };
    toggle.addEventListener('click', () => {
      if (video.paused) {
        userPaused = false;
        video.play().catch(() => {});
      } else {
        userPaused = true;
        video.pause();
      }
    });
    video.addEventListener('play', updateToggle);
    video.addEventListener('pause', updateToggle);
    updateToggle();
  }

  // Muted, inline videos may autoplay programmatically. If the browser still
  // blocks it (e.g. Safari Low Power Mode), start on the first user interaction —
  // unless the user has explicitly paused it themselves.
  const play = () => {
    if (!userPaused) video.play().catch(() => {});
  };
  play();
  ['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
    window.addEventListener(evt, play, { once: true })
  );
}
