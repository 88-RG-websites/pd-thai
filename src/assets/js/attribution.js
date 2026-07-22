(function() {
  'use strict';

  var COOKIE_NAME = '_88_attribution';
  var TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'];

  // Strip the leading subdomain so the cookie is visible to book.<registrable-domain>.
  // Assumes a single-label TLD (e.g. .com). For ccTLDs like .co.uk this would need a public-suffix list.
  function cookieDomain() {
    var parts = window.location.hostname.split('.');
    return parts.length >= 2 ? '.' + parts.slice(-2).join('.') : window.location.hostname;
  }

  function readCookie() {
    var match = document.cookie.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
    if (!match) return {};
    try { return JSON.parse(decodeURIComponent(match[1])) || {}; } catch (e) { return {}; }
  }

  function writeCookie(params) {
    var expires = new Date(Date.now() + TTL_MS).toUTCString();
    document.cookie = COOKIE_NAME + '=' + encodeURIComponent(JSON.stringify(params))
      + '; expires=' + expires
      + '; domain=' + cookieDomain()
      + '; path=/; SameSite=Lax';
  }

  var urlParams = new URLSearchParams(window.location.search);
  var fromUrl = {};
  ATTR_KEYS.forEach(function(k) {
    if (urlParams.has(k)) fromUrl[k] = urlParams.get(k);
  });

  if (Object.keys(fromUrl).length === 0) return;

  // Last-touch merge: incoming URL params override stored values for the same keys.
  writeCookie(Object.assign({}, readCookie(), fromUrl));
})();
