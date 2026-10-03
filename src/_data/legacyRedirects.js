// URLs the site being replaced serves today, and where each one goes on the
// new site. EMPTY BY DEFAULT — a fresh build has nothing to redirect, and an
// empty array writes no files at all.
//
// Fill it in whenever this template replaces an existing website. Production
// rsyncs with `--delete`, and Eleventy writes directory-style paths (/menus/,
// /gallery/) while hand-built sites usually serve /menus.html and
// /gallery.html. Without a stub for each one, the deploy turns every indexed
// link, Google Business post, QR code and old email blast pointing at those
// URLs into a 404 the moment it lands.
//
// The old site is still up while you build, so its URL surface is measurable
// rather than guessable:
//
//   curl -s https://<domain>/ \
//     | grep -ohE '(href|src)="[^"]+"' | sed 's/.*="//;s/"$//' \
//     | grep -vE '^(https?:|#|javascript:|mailto:|tel:|data:)' | sort -u
//
// Repeat for each page it links to. Check the result for pages the new build
// has no equivalent of — those still want a destination, because a redirect
// to the homepage beats a 404 on a URL that may be indexed.
//
// A meta-refresh stub is a SOFT redirect. Google follows it and passes most
// signals, but a real `return 301` in the nginx vhost is better and should
// replace this wherever somebody has server access; the two coexist happily,
// since nginx answers before the file is ever read. The stub is the half of
// the fix that lives in the repo and ships with the build.
//
// Note: /index.html needs no entry — the build writes dist/index.html at the
// root, so that URL keeps answering on its own.
//
// Shape:
//   { from: '/menus.html', to: '/menus/' }
//
// Old per-menu pages go to that menu, not the menus root: build `to` with
// client.js's own menu links, so it follows `menuSubdomain` (the named page
// on menu.<domain> when on, the iframe's #menu-<id> when off):
//   const client = require('./client');
//   const { menuLink } = require('../../lib/site').menuLinks(client);
//   { from: '/menus.html', to: client.urls.menus },
//   { from: '/menus-catering.html', to: menuLink('catering', 2690) },
const client = require('./client');

module.exports = [
  // The hand-built site served the menu iframe at /menus.html.
  { from: '/menus.html', to: client.urls.menus },
];
