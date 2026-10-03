// Turns a client's raw data object (src/_data/client.js in every site built
// from this template) into the full, template-consumed `client` object.
//
// This is the one place the plumbing formulas live: the 88restaurants URL
// shapes, the menu-subdomain link builder, and the hours-schedule flattener
// that both the visible hours rows and the schema block read from. A client
// site's own client.js stays data (copy, ids, per-client toggles) and never
// re-derives any of this itself.
//
// Zero dependencies, CommonJS — this file is required directly by
// src/_data/client.js (via a relative `../../lib/site` path from every site
// built on the template, template included) and by the upgrade tool's tests,
// so it must never assume anything beyond core Node.
//
// Precedence for anything under `urls`: a derived default first (built from
// `id`/`domain`/`menuSubdomain` alone), then whatever the client's own
// client.js set (so an off-platform `urls.order`/`urls.reserve` — a Toast
// link, say — wins), then, last, the handful of keys the template always
// owns regardless of what a client file says (`menus`, `menusAbsolute`,
// `menuPagesAbsolute`, `embedScript`) — those follow the CURRENT template's
// own menu-linking scheme, not a value frozen into an old client.js.
//
// `client.js` files across the fleet also carry defaults for keys that
// didn't exist when they were written (no `seo`, no `forms`, no `urls` at
// all in the oldest ones). This module fills every one of those in so an old
// client.js still builds cleanly against a newer template, rather than
// throwing partway through eleventyComputed.js/faq.js/the schema block.

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// "2:00pm" / "2:00 PM" -> "14:00". schema.org's OpeningHoursSpecification
// wants 24h "HH:MM"; hoursSchedule rows are written the way a guest reads
// them, 12h, with or without a space before am/pm.
const to24h = (time) => {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(time).trim());
  if (!m) return null;
  let hour = Number(m[1]) % 12;
  if (m[3].toLowerCase() === 'pm') hour += 12;
  return `${String(hour).padStart(2, '0')}:${m[2]}`;
};

// "11:30am - 2:00pm" -> ["11:30", "14:00"]
const parseWindow = (range) => {
  const [opens, closes] = String(range).split(' - ').map(to24h);
  return opens && closes ? [opens, closes] : null;
};

// "Tuesday - Thursday" -> ["Tuesday", "Wednesday", "Thursday"]; a single day
// (no " - ") -> [that day].
const parseDayRange = (label) => {
  const [start, end] = String(label).split(' - ').map((s) => s.trim());
  if (!end) return [start];
  const from = WEEKDAYS.indexOf(start);
  const to = WEEKDAYS.indexOf(end);
  return from === -1 || to === -1 ? [start] : WEEKDAYS.slice(from, to + 1);
};

// Flattens a `{ day, lunch, dinner }` row schedule into one entry per (set of
// days sharing an identical window, opens, closes) — what schema.org's array
// form of OpeningHoursSpecification wants. A day covered by two windows
// (lunch + dinner) gets two entries; a day covered by neither is closed and
// is never emitted. A row this can't parse (an old client's prose, "Closed",
// an en-dash range) is skipped with a warning rather than thrown.
const flattenHours = (schedule) => {
  const byWindow = new Map(); // "opens|closes" -> { opens, closes, days: Set }
  for (const row of schedule) {
    const days = parseDayRange(row.day);
    for (const key of ['lunch', 'dinner']) {
      if (!row[key]) continue;
      const window = parseWindow(row[key]);
      if (!window) {
        console.warn(`[hours] could not parse "${row[key]}" on "${row.day}", skipped`);
        continue;
      }
      const [opens, closes] = window;
      const windowKey = `${opens}|${closes}`;
      if (!byWindow.has(windowKey)) byWindow.set(windowKey, { opens, closes, days: new Set() });
      days.forEach((d) => byWindow.get(windowKey).days.add(d));
    }
  }
  return [...byWindow.values()].map(({ opens, closes, days }) => ({
    days: WEEKDAYS.filter((d) => days.has(d)), // stable week order, de-duplicated
    opens,
    closes,
  }));
};

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
// A window that closes past midnight ("01:00" after a "22:00" open) closes
// latest, so it counts from the day it opened.
const closeMinutes = (w) => toMinutes(w.closes) + (w.closes <= w.opens ? 24 * 60 : 0);

// Normalizes every hours shape seen across the fleet into
// `{ schedule, windows, opens, closes }`:
//   - the current shape: `{ schedule: [{day, lunch, dinner}, ...] }`, windows
//     derived by flattenHours (this is what the template's own client.js
//     ships, and what a fresh build produces byte-for-byte as before).
//   - Gen1/2's `{ opens, closes, schedule }`, where `schedule` is prose the
//     flattener can't always parse (an en-dash range, "Closed") — when no
//     window could be derived from the rows, its own typed `opens`/`closes`
//     on `openDays` (all seven when unset) become the one window, the entry
//     its old base.njk emitted.
//   - mazzaros' `{ opens: '', closes: '', schedule: [{day, note}] }` — rows
//     with neither `lunch` nor `dinner` simply contribute no window, and the
//     typed (here, deliberately blank) `opens`/`closes` survive as-is.
//   - no `hours` key at all (the oldest client.js files) — everything
//     defaults to empty rather than throwing.
// Any other key a client keeps under `hours` (mazzaros' `happyHour`, which
// its visit.njk renders) passes through untouched.
const normalizeHours = (rawHours) => {
  const schedule = Array.isArray(rawHours && rawHours.schedule) ? rawHours.schedule : [];
  const typed = rawHours && rawHours.opens && rawHours.closes
    ? [{ days: Array.isArray(rawHours.openDays) ? rawHours.openDays : WEEKDAYS, opens: rawHours.opens, closes: rawHours.closes }]
    : [];
  const derived = flattenHours(schedule);
  const windows = Array.isArray(rawHours && rawHours.windows) ? rawHours.windows : derived.length ? derived : typed;
  const earliestOpen = windows.reduce((best, w) => (!best || w.opens < best.opens ? w : best), null);
  const latestClose = windows.reduce((best, w) => (!best || closeMinutes(w) > closeMinutes(best) ? w : best), null);
  return {
    ...(rawHours || {}),
    schedule,
    windows,
    opens: earliestOpen ? earliestOpen.opens : (rawHours && rawHours.opens) || '',
    closes: latestClose ? latestClose.closes : (rawHours && rawHours.closes) || '',
  };
};

// Same rule as 88's Restaurant.derive_website_domain: host, lowercased, no
// www. Only computed when the subdomain is on, so a client with no domain
// yet still builds. Switching it on without a domain fails the build, as the
// inline version did, rather than shipping "null/" as every menu link.
const deriveMenuHost = (domain, menuSubdomain) => {
  if (!menuSubdomain) return null;
  if (!domain) throw new Error('client.js: menuSubdomain is true but domain is empty; set domain first');
  return `https://menu.${new URL(domain).hostname.toLowerCase().replace(/^www\./, '')}`;
};

// Exported for client.js data (nav, menu cards, the contact promo card) to
// build its own menu hrefs: `menuLink('catering', 2690)`. `slug` is the
// schedule's slug on the menu subdomain and `scheduleId` its number for the
// ordering iframe's #menu-<id> deep link; pass both so the link survives
// flipping `menuSubdomain` later. No arguments = the menus root: the general
// "Menu" link, which on the subdomain opens whichever schedule the admin lists
// first. A card or link for one menu names it instead.
const menuLinks = ({ domain, menuSubdomain }) => {
  const menuHost = deriveMenuHost(domain, menuSubdomain);
  const menuLink = (slug, scheduleId) => {
    if (menuSubdomain) return `${menuHost}/${slug || ''}`;
    return scheduleId ? `/menus/#menu-${scheduleId}` : '/menus/';
  };
  return { menuHost, menuLink };
};

// The GA4 id a client renders. Older sites named it gaMeasurementId or
// googleAnalyticsId and rendered it from their own components/google_analytics.njk.
const ga4Of = (raw) => (raw.analytics && raw.analytics.ga4) || raw.gaMeasurementId || raw.googleAnalyticsId || '';

// The mark core/schema.njk names as the business logo. Search shows it on a
// light ground, so a client whose `src` is cut light-on-dark for the header
// sets `logo.schema` to its dark-on-light original. An older site named the
// key `schemaSrc`. Unset, it is `src`.
const logoOf = (logo) =>
  logo && typeof logo === 'object' ? { ...logo, schema: logo.schema || logo.schemaSrc || logo.src } : logo;

// schema.org `areaServed`, one shape for core/schema.njk. A string is a city
// (the documented form); `{ type, name }` names its own schema.org type, so a
// truck that works two states says State rather than City. An entry without
// a name is dropped, and a lone entry needs no array around it.
const areasOf = (areas) =>
  [].concat(areas || [])
    .map((a) => (typeof a === 'string' ? { name: a } : a || {}))
    .map((a) => ({ type: a.type || 'City', name: a.name }))
    .filter((a) => a.name);

// The address as one line, from the parts the client has: "12 Main St,
// Hoboken, NJ 07030", or "New York, NY" for a business with no street (a
// truck). '' with no address at all. The FAQ and llms.txt print it.
const addressLineOf = (a) => {
  a = a || {};
  return [a.street, a.city, [a.state, a.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
};

// servesCuisine, menu and hasMenu are FoodEstablishment properties, and
// Restaurant is only one of its subtypes: a truck, a cafe or a bakery serves
// food too. core/schema.njk emits them only when this is true.
const FOOD_TYPES = ['FoodEstablishment', 'Restaurant', 'FastFoodRestaurant', 'CafeOrCoffeeShop', 'Bakery', 'BarOrPub', 'Brewery', 'Winery', 'Distillery', 'IceCreamShop'];

// Takes the client's raw data object (client.js's own module.exports before
// this wraps it) and returns the fully derived `client` the templates read.
const site = (raw) => {
  raw = raw || {};

  const id = raw.id || '';
  const domain = raw.domain || '';
  const menuSubdomain = Boolean(raw.menuSubdomain);
  const { menuHost, menuLink } = menuLinks({ domain, menuSubdomain });
  const menuPages = Array.isArray(raw.menuPages) ? raw.menuPages : [];
  const menuPagesAbsolute =
    menuSubdomain && menuPages.length ? menuPages.map((m) => menuLink(m.slug, m.scheduleId)) : null;

  // Derived defaults, built from id/domain/menuSubdomain alone.
  const derivedUrls = {
    order: id ? `https://88restaurants.com/${id}/online_orders/new` : '',
    reserve: id ? `https://88restaurants.com/${id}/reservations/restaurants/booking_details` : '',
    menusFrame: id ? `https://88restaurants.com/${id}/online_orders/frame` : '',
    menus: menuLink(),
    menusAbsolute: menuSubdomain ? `${menuHost}/` : `${domain}/menus/`,
    menuPagesAbsolute,
    embedScript: 'https://88restaurants.com/embed/88.js',
  };
  const urls = {
    ...derivedUrls,
    ...(raw.urls || {}), // client-set values win (an off-platform order/reserve link)
    // Template-owned regardless of what an old client.js says: these follow
    // the current menu-linking scheme, not a value frozen at bootstrap time.
    menus: derivedUrls.menus,
    menusAbsolute: derivedUrls.menusAbsolute,
    menuPagesAbsolute: derivedUrls.menuPagesAbsolute,
    embedScript: derivedUrls.embedScript,
  };

  const forms = {
    contact: '',
    newsletter: '',
    partyInquiry: '',
    employment: '',
    ...(raw.forms || {}),
  };

  return {
    ...raw,
    id,
    domain,
    menuSubdomain,
    menuHost,
    menuPages,
    urls,
    forms,
    questionsTab: raw.questionsTab === undefined ? null : raw.questionsTab,
    seo: raw.seo || {},
    ogImage: raw.ogImage || '',
    ogImageAlt: raw.ogImageAlt || '',
    analytics: { ...(raw.analytics || {}), ga4: ga4Of(raw) },
    logo: logoOf(raw.logo),
    addressLine: addressLineOf(raw.address),
    areaServed: areasOf(raw.areaServed),
    servesFood: FOOD_TYPES.includes(raw.businessType),
    hours: normalizeHours(raw.hours),
  };
};

module.exports = site;
module.exports.menuLinks = menuLinks;
module.exports.ga4Of = ga4Of;
