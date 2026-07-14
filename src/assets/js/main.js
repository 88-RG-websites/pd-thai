import { initFooter } from './footer.js';
import { initHeader } from './header.js';
import { initGallery } from './gallery.js';
import { initHero } from './hero.js';
import { initReviews } from './reviews.js';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all modules
  initFooter();
  initHeader();
  initGallery();
  initHero();
  initReviews();
});
