import { initFooter } from './footer.js';
import { initHeader } from './header.js';
import { initCarousel } from './carousel.js';
import { initGallery } from './gallery.js';
import { initHero } from './hero.js';
import { initHeroVideo } from './hero-video.js';
import { initMapLoader } from './map-loader.js';
import { initReviews } from './reviews.js';
import { initOrderCarousel } from './order-carousel.js';
import { initScrollReveal } from './scroll-reveal.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initFooter();
  initHeader();
  initCarousel();
  initGallery();
  initHero();
  initHeroVideo();
  initMapLoader();
  initReviews();
  initOrderCarousel();
  initScrollReveal();
});
