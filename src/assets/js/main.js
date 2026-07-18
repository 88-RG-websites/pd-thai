import { initFooter } from './footer.js';
import { initHeader } from './header.js';
import { initGallery } from './gallery.js';
import { initHero } from './hero.js';
import { initReviews } from './reviews.js';
import { initMenuGallery } from './menu-gallery.js';
import { initScrollReveal } from './scroll-reveal.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initFooter();
  initHeader();
  initGallery();
  initHero();
  initReviews();
  initMenuGallery();
  initScrollReveal();
});
