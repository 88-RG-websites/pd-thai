# Template map

What each page and section is, what switches it on, what ground it sits on and
which `client.js` keys it reads. Read this instead of opening the components to
learn them. It is the mechanical half; the design judgment (direction, palette,
type) lives in the build skills.

**Keep it true.** When a component gains a key, a variant or a new ground,
update its row here in the same commit.

## Pages

| URL | File | Exists when | Heading | Notes |
| --- | --- | --- | --- | --- |
| `/` | `index.njk` | always | `hero_title` is the h1 | order below |
| `/menus/` | `menus.njk` | `client.menuSubdomain` off | sr-only h1 from `menus.pageHeading` (falls back to `menus.title`) | ordering iframe with `client.id`; menu cards without. `viewportPage` when the iframe shows: page scroll locked, no footer |
| `/menus/` (redirect) | `menus-moved.njk` | `client.menuSubdomain` on | — | sends old links to `menu.<domain>`; see `menus.md` |
| `/gallery/` | `gallery.njk` | always | `gallery.title` as h1 (default "Explore " + name — set it) | gallery + optional masonry, on a `bg-secondary-700` wrapper |
| `/events/` | `events.njk` | `theme.components.events` **and** `client.id` | `events.title` as h1 | `events` + `events-inquiry` (party form) |
| `/employment/` | `employment.njk` | `theme.components.employment` **and** `client.id` | `employment.title` as h1 | pitch beside the job-application form |
| `/404.html` | `404.njk` | always, out of collections | `notFound.title` | serving it is host config |
| legacy stubs | `legacy-redirects.njk` | one per `legacyRedirects.js` entry | — | out of collections; name them in `deploy.sh`'s pre-rsync loop; no `\| url` |

Gated pages use a computed `permalink` in `<page>.11tydata.js`: off means
never written, so no orphan page and no sitemap entry. Pages without a hero set
`solidHeader: true` and pad with `pt-[var(--header-height)]`. Every new page
needs a `client.seo.<slug>` entry (its title and description) and a
`client.nav` entry. `viewportPage` also puts `.viewport-page` on `<html>` to
release `scrollbar-gutter: stable`, which would otherwise paint a dark strip
beside the embed's own scrollbar.

## Homepage, in order

| # | Slot | Gate | Variants | Ground |
| --- | --- | --- | --- | --- |
| — | `seam-defs` | `style.seam` ≠ none, or `about_seam` / `menus_schedule` chosen | — | none (clip paths) |
| 1 | `hero` (+ `hero-bar`) | always; bar on `components.heroBar` and a `heroBar.hoursNote` | — | photograph; bar `heroBarTone` dark (secondary-700) / brand (primary-600) |
| 2 | `info` | `components.info` set | `info` / `info_two` | secondary-50 |
| 3 | `about` | always | `about` / `about_parallax` / `about_seam` | white / photo / secondary-50 |
| 4 | `menus` | always | `menus` / `menus_schedule` | secondary-50 / secondary-700 `ground-ink` |
| 5 | `carousel` | `components.carousel` | — | white |
| 6 | `reserve` | `client.id` | — | photo (`bg-fixed`, the one stock parallax) |
| 7 | `catering` | `components.catering` | — | secondary-800 `ground-ink` |
| 8 | `parallax-break` | `components.parallaxBreak` | — | bare photo band, no reveal |
| 9 | `visit` | `components.visit` | — | white |
| 10 | `reviews` | `client.reviews` block present (see `reviews.md`) | — | secondary-50 |
| 11 | `faq` | `components.faq` (on) and entries in `src/_data/faq.js` | — | secondary-50; white when `reviews` renders |
| 12 | `gallery` (+ `gallery-masonry`) | `components.galleryOnHome` (+ `galleryMasonry`) | — | `galleryTone` dark (secondary-700) / brand (primary-900); masonry white |
| 13 | `newsletter` | `components.newsletter` **and** `client.id` | — | primary-600 |
| 14 | `contact` | always | `contact` / `contact_with_image` / `contact_with_map` / `contact_with_parallax` | secondary-50 / white / white / photo |
| — | `footer` | always (not on `viewportPage`) | — | secondary-700 |

Stock grounds run white / secondary-50 / white / photo / white / secondary-50 /
primary-600 / secondary-50, so no two neighbours share one. Switching a
section on or off, changing a variant or reordering means re-deriving that
sequence, and checking what is *inside* the neighbours first: a section whose
cards are `bg-secondary-50` cannot sit on secondary-50. Tinted bands use
`bg-secondary-50`, never a Tailwind grey. `ground-ink` / `ground-photo`
relight the eyebrow on dark grounds.

## Shell

- **Header**: `header.njk` always (`header_center` exists but is rejected for
  builds). Both variants share `id="main-header"` and the `#mobile-menu`
  `<dialog>`; `assets/js/header.js` drives the scroll state (`.is-scrolled`
  tints and blurs the bar) and the slide-over. The dialog is what lets the menu
  clear 88's order footer; see "88 layers" in `CLAUDE.md`. `header_center`
  also sets `is-header-center` on `<body>`, which re-anchors
  `--header-height` for its taller bar. Until the bar tints, the nav and logo
  carry their own shadows; the hamburger needs a `drop-shadow` filter rather
  than `text-shadow`, because it is an SVG stroke (`.nav-toggle`).
- **Skip link**: `base.njk` opens `<body>` with a "Skip to content" link,
  visible only on focus, to `<main id="main" tabindex="-1">`. No component
  may take `id="main"`.
- **Nav and CTAs are data.** `client.nav` is `{label, href}`; the header adds
  the leading `/`. `client.ctas` is `{label, short, href}` (`[]` for none) and
  renders in **three** places (header bar, hero, mobile menu), with `href`
  interpolated verbatim, so a CTA aimed at a homepage section is written
  `/#reserve`. Only `header_center` reads `short`.
- **Hero**: only the first slide loads with the page (`fetchpriority="high"`);
  the rest ship `data-src`/`data-srcset` and `assets/js/hero.js` promotes them
  at load. A new hero variant must do the same, because `loading="lazy"` fetches
  every stacked slide at once. No scrim: text and buttons carry their own
  shadows, and `#main-header::before` is a soft top gradient that fades as the
  bar tints.
- **Footer**: `footer.{visitTitle, exploreTitle, extraLinks}`, `footerTagline`,
  logo, nav, address, socials.
- **Head, schema, scripts**: `layouts/base.njk` includes `core/head.njk`
  (title, meta, OG/Twitter, favicons, theme colour), `core/schema.njk` (the
  business node and its `@id`, in `{% block schema %}`) and `core/scripts.njk`.
  The homepage FAQ and its FAQPage schema come from `src/_data/faq.js`, which
  reads `client.js`/`theme.js`.

## client.js, block by block

Titles fall back to a template default (`{{ client.x.title or "Default" }}`);
`eyebrow` / `subtitle` / `lede` render only when truthy, so `''` hides them.
Templates hardcode nothing, so new copy means a new key here first.

**Identity and schema**: `name`, `restaurantName` (display name, any business
type), `shortName`, `businessType` (schema.org type), `cuisine` (copy label;
`''` for non-restaurants), `cuisines` (schema filing terms), `priceRange`,
`domain` (the host the box serves), `geo`, `locale`, `timezone`, `logo`
(`{src, alt, width, height}`), `ogImage` (JPEG or PNG, never webp) and
`ogImageAlt`, `socialMedia` (empty values drop out of `sameAs`),
`description` (schema, distinct from `seo.index.description`), `areaServed`,
`currenciesAccepted`, `paymentAccepted`, `acceptsReservations`.

**Contact facts**: `address`, `phone`, `email`, `hoursSchedule` (the one
source of hours: 12h rows as guests read them, printing whichever of
`lunch`/`dinner` exists; `lib/site.js` derives the schema windows and
`hours.opens`/`closes`, never typed), `googleMapsUrl`, `googleMapsEmbedUrl`.

**Platform**: `id` (88restaurants; `''` = no ordering, reserve, newsletter,
events or employment), `urls` (every platform link; templates never build
one; set only `order`/`reserve`/`menusFrame`, and `lib/site.js` derives
`menus`/`menusAbsolute`/`embedScript`), `menuLink('<slug>', <scheduleId>)` for menu links (`menus.md`),
`menuSubdomain`, `forms` (slugs for `contact`, `newsletter`, `partyInquiry`,
`employment`; `forms.md`), `questionsTab` (`{label, position}` or `null`).

**SEO**: `seo.<page-slug>` = `{title, description}` (resolved in
`eleventyComputed.js`) is each page's `<title>` and meta description, `404`
included. Pages set neither in frontmatter; an older client page's own
`seoTitle` still wins where it exists. Never `{{ client.* }}` in
frontmatter.

**Per section** (all keys optional unless noted):

| Block | Keys | Read by |
| --- | --- | --- |
| hero | `hero_eyebrow`, `hero_title`, `hero_subtitle`, `heroImages` (with `portrait` crops) | hero |
| `heroBar` | `hoursNote` (one line; `''` hides the strip), `addressLabel`, `hoursLabel`, `phoneLabel`, `social` (bool, adds a cell), `socialLabel` | hero-bar |
| `info` | `hoursTitle`, `contactTitle`, `images` | info, info_two |
| `about` | `eyebrow`, `image`, `imageAlt`, `tagline` (seam only); copy in `about_title`, `about_desc_one/two/three` | about* |
| `menus` | `eyebrow`, `title`, `subtitle`, `pageHeading`; schedule variant adds `image`, `imageAlt`, `ctaLabel`, `orderLabel` | menus* |
| `menuCards` | three `{image, pretitle, title, href}` | menus, info_two, `/menus/` without id |
| `serviceRows` | services that are true (schedule variant) | menus_schedule |
| `carousel` + `carouselImages` | `eyebrow`, `title`, `subtitle`; images as `{src, full}` pairs, `src` a ~1200px `m*.webp` (empty falls back to gallery masters, silently heavy) | carousel |
| `reserve` | `eyebrow`, `title`, `image`, `body`, `note` (`{phone}` becomes a tel: link) | reserve |
| `catering` | `eyebrow`, `title`, `lede`, `image(Alt)`, `secondImage(Alt)`, `ctaLabel`, `ctaHref`, `ctaNote` | catering |
| `parallaxBreak` | `image` | parallax-break |
| `visit` | `eyebrow`, `title`, `lede`, `addressLabel`, `hoursLabel`, `contactLabel`, `mapLinkLabel` (contact variants reuse these labels) | visit, contact_with_* |
| `reviews` | `eyebrow`, `title`, `google_maps_url` | reviews (`reviews.md`) |
| `gallery` + `galleryImages` | `eyebrow`, `title`, `moreEyebrow`, `moreTitle` | gallery, gallery-masonry |
| `newsletter` | `eyebrow`, `title`, `lede` (what the list sends) | newsletter |
| `contact` | `eyebrow`, `title`, `lede`, `reachTitle`, `formTitle`, `promo`, `image(Alt)`; map variant adds `mapTitle`, `dayLabel`, `lunchLabel`, `dinnerLabel` | contact* |
| `events` | `eyebrow`, `title`, `lede`, `image(Alt)`, `notes`, `formEyebrow`, `formTitle`, `formLede`, `reachTitle`, `reachBody` | events, events-inquiry |
| `employment` | `eyebrow`, `title`, `lede`, `pitch`, `points`, `tagline`, `emailNote` | employment page |
| `footer`, `footerTagline` | see Shell | footer |
| `notFound` | `eyebrow`, `title`, `lede`, `homeLabel` | 404 |

## Section building blocks

New or rebuilt sections use `.section` (vertical rhythm), `.container-site`
(width and gutters), `.section-head` + `.eyebrow` + `.section-title` + `.lede`,
`.card-grid` and `.panel` from `styles.scss`. Headings take one of three
shapes: a centred `.section-head` (full-width sections), a heading in the copy
column (split layouts: `text-center lg:text-left`), or a heading in a `.panel`
(parallax variants: left-aligned inside the card). A heading that leaves the
centre takes `lg:after:mx-0` (`after:mx-0` in a panel) so `titleRule` follows
it. Reveal: `data-reveal="up"` on the head and `data-reveal="up"
data-reveal-delay="1"` on the body. Hero, footer and `parallax-break` stay out
of it.
