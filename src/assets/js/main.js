import { initFooter } from './footer.js';
import { initHeader } from './header.js';
import { initGallery } from './gallery.js';
import { initHero } from './hero.js';
import { initHeroVideo } from './hero-video.js';
import { initReviews } from './reviews.js';
import { initMenuGallery } from './menu-gallery.js';
import { initOrderCarousel } from './order-carousel.js';
import { initScrollReveal } from './scroll-reveal.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initFooter();
  initHeader();
  initGallery();
  initHero();
  initHeroVideo();
  initReviews();
  initMenuGallery();
  initOrderCarousel();
  initScrollReveal();
});
