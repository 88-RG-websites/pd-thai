# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

It holds the rules that apply to any edit here. Topic- and build-phase detail
lives in the files listed under **Where the rules live**: read the one for the
area you are touching before changing it.

## Development Commands

- `npm run serve` - Start development server with live reloading at http://localhost:8080
- `npm run build` - Build the project for production (compiles CSS and generates static files)
- `npm run build:preview` - Build with the preview server's path prefix
- `npm run watch` - Watch for changes and rebuild CSS/templates automatically
- `npm run build:css` - Compile the stylesheet with PostCSS and TailwindCSS
- `npm run fonts` - Self-host the `theme.fonts` faces (after any font change)
- `npm test` - Template checkout only (a client repo prints a skip and exits
  0): `lib/site.js` unit tests, the doc-path check, a new-site build smoke
  test and the `deploy.sh` rsync check. Every plumbing PR passes it

## Project Structure and Architecture

An **11ty (Eleventy)** static site template for restaurant (and other local
business) websites: Nunjucks components, TailwindCSS through PostCSS, output
to `dist/`.

- Base layout: `src/_includes/layouts/base.njk` (HTML structure and the
  page-level blocks, with `head_extra`/`body_end_extra` as client hooks). It
  includes three template-owned partials in `src/_includes/core/`:
  `head.njk` (meta, OG/Twitter, icons, fonts), `schema.njk` (the JSON-LD
  `@graph`) and `scripts.njk` (main.js, attribution.js, the 88.js loader).
  Components in `src/_includes/components/`. Pages extend the base layout and
  compose components.
- `.eleventy.js` (plugins: sitemap, navigation, minification),
  `tailwind.config.js` (scans `.njk`, `.html`, `.md` **and `.js`** under
  `src/`), `postcss.config.js`.
- Images go in `src/assets/images/`; `src/assets` is passthrough-copied.

**Data-driven content:**
- All client data lives in `src/_data/client.js`, read as `{{ client.* }}`.
- `client.js` is data only: it ends with
  `module.exports = require('../../lib/site')(client)`. `lib/site.js` derives
  `urls.*`, `menuHost` and `hours.windows`, forces the URL keys the template
  owns, fills defaults so an old `client.js` still builds, and exports
  `menuLinks()` for `menuLink(slug, scheduleId)`. Never re-derive any of this
  in a client's `client.js`; add a default to `lib/site.js` instead.
  `hoursSchedule` is the one source of hours.
- **Templates hardcode nothing**: no copy, section headings, image paths,
  logo paths or platform URLs. Every section has its own block in
  `client.js`, and every 88restaurants link lives in `client.urls`. Adding
  copy to a component means adding the key to `client.js` first.
- Fallback convention: `title` keys use `{{ client.x.title or "Default" }}`;
  `eyebrow`/`subtitle`/`lede` render inside `{% if %}` so `''` hides them.
- Page `<title>`/meta descriptions come from `client.seo` (keyed by page file
  slug, resolved in `src/_data/eleventyComputed.js`): the rendered
  `<title>`/`og:title`/`twitter:title` read `client.seo.<slug>.title`, one
  purpose-written per page (under ~60 chars, keyword first, brand last,
  except the homepage, which leads with the brand). Pages carry no title of
  their own. Frontmatter strings are NOT template-rendered, so never write
  `{{ client.* }}` in frontmatter, and a page file left as the template's is
  one the upgrade tool can keep refreshing. An older client page's own
  frontmatter `seoTitle` (or `title:`) still wins where it exists.
- The homepage FAQ is the client's search-keyword vehicle: `src/_data/faq.js`
  generates it, and a client's keyword phrases go in through
  `client.neighborhood` and `client.faq.extra`, each phrase once in the answer
  a guest would search it for (`content.md`, "The FAQ is generated"). Never
  edit `faq.js` for one client; it is `owned`.
- Navigation and CTAs are data: `client.nav` and `client.ctas`. Never hardcode
  links in header components. `client.ctas` renders in three places (header,
  hero, mobile menu); grep before editing.
- `template-map.md` maps every page and section to its gate, ground,
  variants and `client.js` keys. Read it instead of opening components one by
  one, and keep it true when a component changes.

**Theming:**
- `src/_data/theme.js` is the ONLY file to edit when restyling a site:
  colour scales (`primary`, `secondary`, optional `accent`), fonts + Google
  Fonts URL, overlay, the `style` shape/motion tokens, `titleRule`, `seam`,
  and the `components` variant slots.
- Fonts are served from the site, not Google: after any `theme.fonts` change
  run `npm run fonts` and commit `src/assets/fonts/` and
  `src/_data/fontFaces.json`. Until then the layout sees the URL changed and
  falls back to the Google stylesheet (render-blocking, two more hosts).
- Colours and fonts flow through CSS variables from
  `components/theme-vars.njk`; `tailwind.config.js` maps `primary`/
  `secondary`/`accent`/`font-display`/`font-body` to them. Never hardcode
  colours or font families in components.
- `accent` is what everything interactive answers in (filled buttons, hover,
  lit eyebrow, card hover outline). Omitted, every `accent-*` utility falls
  back to the same step of `primary`.
- Components use the shape tokens `rounded-btn`/`rounded-card`/`rounded-img`
  and `shadow-card`/`shadow-card-hover`, never raw `rounded-lg`/`shadow-md`
  on buttons, cards or gallery images.
- Tinted bands use `bg-secondary-50`, never a Tailwind grey, and neighbouring
  sections never share a ground (the sequence is in `template-map.md`).

**Layout and type system** (`src/assets/sass/styles.scss`, `@layer
components`): `.section` (vertical rhythm), `.container-site` (max width +
gutters), `.section-head` + `.eyebrow` + `.section-title` + `.lede`,
`.card-grid`, `.panel`. Build new sections from these instead of re-picking
`py-*`/`max-w-*`/heading sizes; utilities still win over them (e.g.
`class="section-title text-white"` on a dark ground).
- Section headings come in three shapes, and a new section picks one rather
  than inventing a fourth: a centred `.section-head` (full-width sections); a
  heading in the copy column, `text-center lg:text-left` (split layouts); a
  heading left-aligned at the top of a `.panel` (parallax variants). A new
  heading uses `.section-title` so `theme.style.titleRule` reaches it; one
  that leaves the centre takes `lg:after:mx-0` (`after:mx-0` in a panel).
- Scroll reveal: `data-reveal="up"` on the `.section-head`, `data-reveal="up"
  data-reveal-delay="1"` on the content beneath it. Progressive enhancement
  via `scroll-reveal.js` + the `js-reveal` fallback in `base.njk`; tuned or
  disabled in `theme.style.animations`. Hero, footer and `parallax-break` stay
  outside it.
- Filled and outlined CTAs sit side by side, so the filled one carries
  `border border-transparent`; without it the outlined button is 2px taller.
- A new hero variant ships only its first slide eagerly; the rest go through
  `data-src`/`data-srcset` and `assets/js/hero.js` (`template-map.md`, Shell).

**Pages:** stock pages are `/`, `/menus/`, `/gallery/` and `/404.html`;
`/events/` and `/employment/` are opt-in behind a computed `permalink` in
their `.11tydata.js`. A page that should only sometimes exist uses that
pattern, never an `{% if %}` around its content. A new page:

```njk
---
permalink: /services/
---
{% extends "layouts/base.njk" %}

{% block content %}
  <!-- Your page content here -->
{% endblock %}
```

then a `client.seo.services` entry (its title and description) and a
`client.nav` entry. Pages without a
hero set `solidHeader: true` and pad with `pt-[var(--header-height)]`. A page
that is one viewport-tall embed sets `{% set viewportPage = true %}`.

**Multi-location sites** are an opt-in pattern, not built in: follow
`casa-sanchez-buena-vista` (a `locationPages` map, per-page `loc` computed
from `locationSlug`, per-location `--c-primary-*` overrides via
`body[data-location="..."]`).

## Build pipeline gotchas

- **There is no SASS compiler** despite `styles.scss` and the folder name:
  `build:css` runs `postcss` (`tailwindcss` → `autoprefixer` → `cssnano`)
  straight over the file. `@layer` / `@apply` work; **selector nesting does
  not.** Write `body.is-open #header { … }`, never nested: the nesting ships
  verbatim as CSS Nesting, which older mobile Safari drops, while desktop
  Chrome renders it fine.
- **Three plumbing rule blocks carry managed fences**,
  `/* >>> template:core <name> */ … /* <<< template:core <name> */`: the
  `:host` block for the menu-subdomain header, `html.viewport-page`'s
  `scrollbar-gutter` override, and the `.js-reveal [data-reveal]` mechanics
  (`template.json`'s `fenced` list). The upgrade tool rewrites them in place.
  Look rules stay outside any fence and are the client's to restyle.
- **A compound selector written by hand here may not survive the build.**
  `.group:hover .medallion, .medallion:hover { … }` shipped as
  `.medallion, .medallion:hover { … }`, so every element sat permanently in
  its hover state. Write element state as Tailwind's `hover:` /
  `group-hover:` utilities, and read the built CSS after writing any compound
  selector by hand.
- **An `outline` is clipped by any ancestor hiding overflow.** A carousel's
  `overflow-x-auto` viewport slices every ring unless its padding clears the
  `outline-offset`.
- **Tailwind alpha modifiers are dead on the themed scales.** `primary`,
  `secondary` and `accent` resolve to `var(--c-…)`, so `border-accent-500/40`
  or `bg-secondary-950/45` emit **no CSS at all**. Use a solid step or an
  arbitrary `[background:rgb(…/0.4)]`. `bg-white/10` and the Tailwind greys
  are fine.
- **The html minifier's `collapseWhitespace` eats the spaces around an inline
  span.** Write `&nbsp;·&nbsp;`, not ` · `.
- **Tailwind scans the content globs as raw text, comments and all**
  (`./src/**/*.js` and the `.njk` files, where `{# … #}` is not a comment to
  the extractor). A utility's name in prose ("the sticky bar", "a fixed
  header", "the container") ships a CSS rule no markup uses, and makes the
  built CSS differ between two builds of the same site. After touching a data
  file or a comment, diff the built CSS and reword rather than accept a new
  rule. `lib/` is not in the globs, one more reason derivation belongs in
  `lib/site.js` rather than `client.js`.
- **`| url` on a real `src`/`href` doubles the path prefix.**
  `EleventyHtmlBasePlugin` already rewrites those attributes; the filter is for
  what it cannot see (inline `background-image: url(…)`, `data-` attributes).
  A root build cannot reveal the double prefix: run `npm run build:preview`
  and audit every reference before any preview deploy
  (`.claude/skills/5-site-ship/scripts/prefix-audit.mjs`).
- **The base plugin turns `src=""` into `src="."` under a path prefix**, so a
  script-filled placeholder (`<img id="lb-img" src="">`) fetches the page's
  folder as an image on every preview load. Omit `src` on a placeholder a
  script fills.
- The build needs both CSS compilation and Eleventy generation (`npm run
  build` does both).

## 88restaurants and third-party embeds

- **Everything 88restaurants puts on a site comes through one script**,
  `https://88restaurants.com/embed/88.js` (last in `<body>`, from
  `core/scripts.njk`):
  forms (`<div data-88-form="<slug>">`), the reservation widget
  (`<div data-88-widget>`), popups and the sticky order footer. It renders the
  same on preview and localhost as on the live domain. `forms.md` is the
  contract; read it before touching a form slot.
- **A form paints its own card and needs no wrapper.** The site owns the slot
  width: fields pair two per row only above 575px of the form's own width.
- **The 88 layers own the top of the z-index stack**: the order footer at
  `99999`, popups and dialogs at `2147483000+`. Site chrome stacks under them
  deliberately. The mobile menu clears them only because `mobile-menu.njk` is
  a native `<dialog>` opened with `showModal()` (top layer). A header variant
  that swaps it for a positioned `<div>` gives that up silently, visible only
  on a phone on a page carrying the footer; casa-sanchez had to lift three
  layers past 99999 to recover (`09d4bea`). Keep the dialog. The gallery
  and carousel viewers clear them the same way: the owned `lightbox.js`
  moves each viewer into a `<dialog>` at runtime, whatever the component's
  markup.
- **Never float site UI over a third-party embed.** Google Maps pins its own
  place card inside the iframe, and the 88 frames have their own chrome; a
  panel over either covers it or leaves a sliver showing. Put site UI
  *beside* an embed. An overlay is only safe over an image this repo owns.

## Working rules

- **The template is the floor, not the finish.** A client repo's `seeded`
  files (`client.js`, `theme.js`, pages, components; `template.json`) are
  copied once and are theirs to restructure. What stays template-side is the
  `owned` plumbing: `lib/site.js`, the `core/` partials, `tailwind.config.js`,
  `theme-vars.njk`, `deploy.sh`, the build skills and root docs. A restyle
  need that reaches for those is a missing hook and belongs upstream.
- **Template ownership.** `template.json` lists `owned` (overwritten or
  3-way merged on upgrade), `seeded`, `fenced`, `removed` and `never` paths.
  `new-site.sh` writes a `template.lock` into each new site recording the
  template sha it started from. **Going-forward rule:** a plumbing PR edits
  `owned` files or fenced text only; a new data key gets a `lib/site.js`
  default in the same PR; anything that must touch a `seeded` file ships a
  migration in the same PR, never a note asking every site to edit by hand.
- **The upgrade tool** (`scripts/upgrade/run.mjs`, run from this checkout
  against a client path, never copied into one) applies those migrations
  (`010`–`080`), each its own commit, behind a look gate
  (`scripts/upgrade/lookdiff.mjs`). `scripts/upgrade/fleet-status.mjs` is the
  read-only org-wide view. Run it through the `upgrade-client-site` skill.
- **The go-live tool** (`scripts/golive/golive.mjs`, same shape: run from
  this checkout against a client path) takes a site from preview to its
  domain: Linode DNS (add-only), the vhost, the book/order/menu subdomains,
  the reviews cron, the 88 admin fields, `verify`. Steps read and dry-run;
  every write is a line a person runs. `status --fleet` audits every live
  site. Run it through the `go-live` skill.
  `new-site.sh` excludes both tools, their skills, `scripts/test/`,
  `scripts/server/`, `server/` and `template.json` from client repos.
- Shell scripts here (`deploy.sh`, `new-site.sh`, the skill scripts) are cloned
  into every client repo, so they must run on a stock machine: macOS still
  ships **bash 3.2**, so no `${x,,}`, no associative arrays, no `local -a`
  init. Assume nothing beyond git/npm; `jq` and `python3` are Homebrew here,
  not guaranteed elsewhere. Optional tools get detected, and their absence is
  a reported skip, never a failed build.
- **Production deploys are human-only**, enforced by `deploy.sh` (interactive
  terminal + typed **domain** confirmation). Automation deploys to preview.
  Webroots on the client server are `www-data`-owned, which is why
  `deploy.sh`'s rsync flags are tested (`scripts/test/deploy-rsync.sh`).
- Merging a template PR deletes its branch on the remote, so a merged local
  branch can no longer be pushed to (`src refspec ... does not match any`) and
  local `main` is stale behind it. Before the next piece of template work:
  `git fetch origin`, `git checkout main`, `git reset --hard origin/main`,
  then branch fresh. Carry in-flight edits across with `git stash`.

## Where the rules live

| Topic | File |
| --- | --- |
| Pages, section order, grounds, variants, `client.js` keys | `template-map.md` |
| Building a client site from a URL (five phases, `BUILD.md`) | `.claude/skills/build-client-site/` (router + phase contract) |
| Extraction: `domain`, `geo` from the place marker, legacy URLs, ordering-frame facts | `.claude/skills/1-site-setup/` |
| Design direction, palettes, accent, fonts, measuring type against the face, the `gray-*` vs `secondary` trap, dark grounds, favicons | `.claude/skills/2-site-build/references/theming.md` |
| Copy rules (numbers, Title Case), which pages exist, SEO titles/descriptions/schema, legacy redirect stubs, platform ids | `.claude/skills/2-site-build/references/content.md` |
| Variant tuple, structural departures, breakout grid (76rem), full-bleed photo `srcset` | `.claude/skills/3-site-signature/references/signature.md` |
| Screenshotting (Playwright, iOS simulator, reveal and popups), headline line breaks, phone gutters, page weight, Lighthouse | `.claude/skills/4-site-review/references/design-review.md` |
| Preview deploy and image smoke test | `.claude/skills/5-site-ship/` |
| Upgrading an existing client repo to current plumbing | `.claude/skills/upgrade-client-site/` |
| Going live: DNS, vhost, subdomains, 88 admin, verify; auditing live sites | `.claude/skills/go-live/` |
| Server scripts, installs and sync | `server/README.md` |
| Photo grading | `.claude/skills/retouch-photos/` (needs ImageMagick; originals in gitignored `photo-originals/`) |
| Forms and the 88 script | `forms.md` |
| Menu links, schedule ids, `menu.<domain>` | `menus.md` |
| Build-time Google reviews; the monthly server cron (register after production) | `reviews.md`, `.claude/skills/google-reviews/` |
| Before and after a deploy | `pre-deploy-checklist.md`, `post-deploy-checklist.md` |
