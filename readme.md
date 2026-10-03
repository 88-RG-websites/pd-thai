# Client site template

An 11ty (Eleventy) template for local-business websites. Restaurants are the
common case — ordering, reservations, menus — but the same shell builds a
salon, gym, law office or shop through `client.businessType`, data-driven nav
and CTAs, and the theme's shape/motion tokens.

Its purpose is to be *restyled*, not reused as-is. Every site built from it
should look like a different designer made it.

- **[Automated builds](#automated-builds)** — one prompt: a business's URL in,
  a themed, populated, reviewed preview site out.
- **[Hands-on builds](#hands-on-builds)** — the same work, done by you.

---

## How it works

### Two data files hold everything

| File | Owns | Rule |
| --- | --- | --- |
| `src/_data/client.js` | Content — names, copy, hours, address, photos, nav, CTAs, SEO strings, platform URLs | Templates hardcode **nothing**. New copy means a new key here first. |
| `src/_data/theme.js` | Style — color scales (`primary`, `secondary`, optional `accent`), fonts, hero overlay, radii, shadows, motion, component variants | The only file to edit for a restyle. |

`client.js` is data only: it ends with
`module.exports = require('../../lib/site')(client)`, which is what actually
derives `urls.*`, `menuHost` and `hours.windows` and fills in defaults for
keys an older client.js doesn't set. See `lib/site.js` and `template.json`.

`theme.js` emits CSS custom properties (`components/theme-vars.njk`), and
`tailwind.config.js` maps Tailwind's `primary` / `secondary` / `font-display` /
`font-body` onto those variables. That's why a restyle never touches Tailwind
config or component markup.

### Components and variants

Components live flat in `src/_includes/components/`, one per section. Sections
with alternatives keep them as siblings — `header.njk` / `header_center.njk`,
`contact.njk` / `contact_with_map.njk` / `contact_with_parallax.njk` — and
`theme.components` picks which one renders:

```js
components: {
  header: 'header',        // or 'header_center'
  info: '',                // '' | 'info' | 'info_two'
  about: 'about',          // or 'about_parallax'
  contact: 'contact',      // or contact_with_image | _with_map | _with_parallax
  galleryOnHome: false,    // photos live on /gallery/ by default
  heroBar: true,           // info strip under the hero
  carousel: true,
  visit: true,
  parallaxBreak: false,
  galleryMasonry: false,
  newsletter: true,      // email-list band; also needs client.id
  events: false,         // /events/ large-party page; also needs client.id
}
```

Sections without variants are plain includes in `src/index.njk` — reorder or
remove them there. On a client build that reordering is expected, not
exceptional: see the signature pass below.

### Layout and type are a system, not per-section guesswork

`src/assets/sass/styles.scss` defines `.section` (vertical rhythm),
`.container-site` (max width + gutters), `.section-head` / `.eyebrow` /
`.section-title` / `.lede`, `.card-grid` and `.panel` under
`@layer components`. Build new sections from those instead of re-picking
`py-*` and heading sizes. Shape tokens (`rounded-btn` / `rounded-card` /
`rounded-img`, `shadow-card`) come from `theme.js`.

### Pages

| Page | File | Notes |
| --- | --- | --- |
| `/` | `src/index.njk` | hero → about → menus → carousel → reserve → visit → [reviews] → newsletter → contact |
| `/menus/` | `src/menus.njk` | Ordering iframe when `client.id` is set; menu cards when it isn't |
| `/events/`, `/employment/` | `src/events.njk`, `src/employment.njk` | Opt-in (`theme.components.*`); each carries an 88restaurants form |
| `/gallery/` | `src/gallery.njk` | Photo grid + lightbox |
| `/404.html` | `src/404.njk` | Out of the sitemap; serving it on a miss is host config |

Add a page by creating `src/<name>.njk` extending `layouts/base.njk`, then
adding a `client.seo.<name>` entry (titles/descriptions are resolved by file
slug in `eleventyComputed.js`) and a `client.nav` entry.

### Behavior

`src/assets/js/` holds the header (scroll state + animated mobile slide-over),
carousel, gallery lightbox and scroll-reveal. Sections opt into entrance
animation with `data-reveal="up"`; `theme.style.animations` tunes it, or
`reveal: false` turns it off site-wide. Reduced-motion is respected throughout.

Everything from 88restaurants — the contact, sign-up, party and job forms, the
reservation widget, and the popups and sticky order footer the client switches
on in the admin — comes through one hosted script that `base.njk` loads when
`client.id` is set. A form is one `<div data-88-form="<slug>">` with the slug in
`client.forms`. `forms.md` has the contract, the new-site steps and the
conversion steps for a client site still on the older iframes.

---

## Automated builds

With Claude Code, the `build-client-site` skill takes a business's current
website URL (plus any social links) and returns a deployed preview URL. Say:

> Build a site for https://example-restaurant.com

A build runs as **five phase skills, one session each**, with `/clear` between
them. Each phase leaves its results on disk, and `BUILD.md` in the client repo
records status, decisions, open questions and follow-ups, so the next phase
starts from a small, fresh context instead of everything the last one read.
`build-client-site` is the router: in the template it starts phase 1, and in a
client repo it reads `BUILD.md` and names the next phase.

1. **`1-site-setup`**: derives the name and business type, runs
   `new-site.sh` (sibling repo, site name stamped into `deploy.sh` and
   `package.json`, a **private** GitHub repo under this template's org,
   dependencies), then pulls copy, photos, logo, hours, contact details and
   brand colours into `extraction.json` and retouches the photos on the way to
   webp. Anything blocked becomes a recorded gap, never a stall. Continue in a
   new session inside the client repo.
2. **`2-site-build`**: commits to a design direction (upscale-minimal,
   warm-classic, casual-expressive, bold-modern), writes `theme.js` and
   `client.js`, generates favicons and an OG image, and adds pages the
   business has content for.
3. **`3-site-signature`**: two to four deliberate structural departures from
   the stock composition, chosen for this client and different from the
   sibling builds, recorded in `design-notes.md`.
4. **`4-site-review`**: screenshots every page at 375/768/1440 in a subagent
   that returns written findings, fixes, repeats until clean, then runs the
   pre-deploy checklist.
5. **`5-site-ship`**: `./deploy.sh preview`, an image smoke test, and a report
   built from `BUILD.md`: direction, departures, sources, what was invented vs
   extracted, and the follow-ups a human owns.

A phase that needs a human decision (typically: a whole page would rest on one
source the client's site contradicts) records it in `BUILD.md` as a blocking
question and stops; answer it there and run the phase again.

**Guardrails**

- **Preview only.** `deploy.sh production` requires an interactive terminal and
  a typed **domain** confirmation (not the site name). No flag bypasses it;
  automation can't go live.
- **The result is a rework, not a clone.** The old site contributes brand
  identity — colors, logo, photos. Layout, typography and polish come from this
  template. Two consecutive builds should not look like siblings — tokens carry
  the first half of that, the signature pass carries the rest.
- **The template is the floor, not the finish.** Client repos are detached
  copies, so their `index.njk`, components and SCSS are theirs to restructure.
  What stays template-side is the plumbing: `tailwind.config.js`,
  `theme-vars.njk`, the base layout mechanics.
- **Repo creation degrades to a warning.** No `gh`, no auth, or no permission
  leaves a working local repo and a line in the report. `NO_REMOTE=1` skips it;
  `GH_ORG=<org>` targets a different org.

**What a human still owns:** the 88restaurants ordering `id` (unscrapeable), a
Google Analytics id if wanted (`client.analytics.ga4`), DNS, and the
production deploy.

Details: `.claude/skills/build-client-site/` (the router and the phase
contract) and each `.claude/skills/<n>-site-*/SKILL.md` with its references.
`template-map.md` at the root maps every section to its data.

### Photo retouching

A client's own photos usually arrive with a warm cast, crushed shadows and no
contrast — enough to make a well-built site look scraped. The
`retouch-photos` skill grades them: it measures every image, looks at it
against a contact sheet, applies a closed set of operations in professional
order (white balance before anything tonal, sharpening after the resize), then
re-measures and puts back the original for anything it made worse. Originals
are kept in `photo-originals/`, so nothing is destructive.

Run it any time, on any folder:

> Touch up the photos in src/assets/images

It needs **ImageMagick** (`brew install imagemagick`) — the only tool in this
project that isn't npm. Without it the step reports a skip and the build
carries on with the photos untouched. Grading only: no generative edits, ever.
Details: `.claude/skills/retouch-photos/SKILL.md`.

---

## Hands-on builds

```bash
.claude/skills/1-site-setup/scripts/new-site.sh <site-name>
cd ../<site-name>
npm run serve      # http://localhost:8080, live reload
```

1. **Content** — fill in `src/_data/client.js`: name, `businessType`, contact,
   hours, `nav`, `ctas`, `seo` entries per page, `heroImages` (each slide can
   carry a `portrait` crop served to phones via `<picture>`), gallery and
   carousel photos, `menuCards`, and the platform links under `urls`.
2. **Style** — set `src/_data/theme.js`: the 50–950 `primary`/`secondary`
   scales plus an optional `accent` scale (the interaction colour — the filled
   CTAs and their hovers read it, and it falls back to `primary` when unset, so
   a brand colour that makes a bad button no longer has to be repainted), `fonts` + a `googleFontsUrl` that loads the
   weights the templates use (headings are 600 — a family loaded as 400/700
   gets faux-bolded; then run `npm run fonts` to serve them from the site), `overlay`, the `style` shape/motion tokens, and the
   `components` variants. Changing the display face means re-measuring the
   leading ladder in `tailwind.config.js` — see theming.md.
3. **Images** — replace `src/assets/images/`, regenerate favicons and
   `og-image.jpg` (JPEG or PNG, never webp).
4. **Analytics (optional)** — set `client.analytics.ga4` to the GA4
   measurement id. `core/head.njk` renders the tag on the production build
   only, and the same id goes in the 88 admin.
5. **Replacing an existing website?** List its current URLs in
   `src/_data/legacyRedirects.js` before the first production deploy — the
   rsync runs `--delete`, and 11ty's `/menus/` does not answer the old site's
   `/menus.html`.
6. **Check and ship** — `npm run build`, run the pre-deploy checklist, then
   `./deploy.sh preview`.

Working in Claude Code? `CLAUDE.md` carries the conventions — read it before
changing components.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run serve` | Dev server with live reload at localhost:8080 |
| `npm run build` | Production build into `dist/` |
| `npm run build:preview` | Build for a nested preview folder (path prefix so links and assets resolve). Override with `PATH_PREFIX=/your-folder/` |
| `npm run watch` | Rebuild CSS + templates on change |
| `npm run build:css` | Compile SASS/Tailwind to `src/assets/css/styles.css` |
| `npm test` | Template checkout only (keys on `template.json`; a client repo prints a skip and exits 0). `lib/site.js` unit tests, the doc-path check, and a new-site build smoke test |

## Structure

```
├── lib/
│   ├── site.js                 # Derives client.js's urls/hours/defaults
│   └── time12.js
├── src/
│   ├── _data/
│   │   ├── client.js           # 📝 All content (START HERE) — data only
│   │   ├── theme.js            # 🎨 All style
│   │   ├── legacyRedirects.js  # Old URLs to keep alive (empty by default)
│   │   └── eleventyComputed.js # Page title/description from client.seo
│   ├── _includes/
│   │   ├── layouts/base.njk    # Page shell; includes the core/ partials below
│   │   ├── core/                # Template-owned: head, schema.org, scripts
│   │   ├── components/         # One file per section; variants are siblings
│   │   └── macros/
│   ├── index.njk               # Homepage — composes the components
│   ├── menus.njk               # /menus/
│   ├── gallery.njk             # /gallery/
│   ├── 404.njk                 # /404.html
│   ├── legacy-redirects.njk    # One stub per legacyRedirects.js entry
│   └── assets/
│       ├── images/             # 📷 The client's photos
│       ├── js/                 # Header, carousel, gallery, scroll-reveal
│       ├── sass/styles.scss    # 🎨 EDIT THIS (managed fences mark plumbing rules)
│       └── css/                # ⚠️ AUTO-GENERATED from the SASS
├── tailwind.config.js          # ⚠️ Maps Tailwind onto theme.js variables
├── .eleventy.js                # Sitemap, navigation, path prefix, minify
├── template.json                # File-ownership manifest (owned/seeded/fenced/…)
├── template.lock                # This site's own copy: template sha it was built from
├── deploy.sh                   # Preview / production rsync
└── dist/                       # ⚠️ AUTO-GENERATED build output
```

## What to edit

| Edit | Don't edit |
| --- | --- |
| `src/_data/client.js` — all content | `src/assets/css/styles.css` — compiled from SASS |
| `src/_data/theme.js` — all style | `tailwind.config.js` — it only wires Tailwind to `theme.js` |
| `src/assets/sass/styles.scss` — shared layout/type classes | `dist/` — build output |
| Components and pages in `src/` — for structure, not restyling | |

Two things that bite:

- `styles.scss` is compiled by PostCSS with the **standard CSS parser**, not
  Sass. No nesting, no `@if` — write flat selectors.
- Never hardcode a color, font family, or platform URL in a component. If a
  restyle makes you reach for component markup, the template is missing a hook.

## Deploying

```bash
./deploy.sh            # prompts for a target
./deploy.sh preview    # non-interactive; what automation uses
./deploy.sh production # human-only: needs a TTY and the typed domain
```

`SITE_NAME` near the top of `deploy.sh` is stamped in by `new-site.sh`. Preview
deploys are served from a `/${SITE_NAME}/` subfolder, so the script builds them
with a matching path prefix. Before uploading it checks that `dist/` holds the
critical files — the rsync runs with `--delete`, so a partial build would
otherwise wipe live pages.

### QA checklists

Two checklists at the repo root gate each deployment. Each item names the exact
command, file or URL to check, and Claude produces a Pass / Fail / Needs-review
table. They are report-only and never modify files.

| File | When | What it checks |
| --- | --- | --- |
| `pre-deploy-checklist.md` | Before `./deploy.sh` | Build succeeds, no leftover placeholders in `client.js`, SEO/meta, structured data, sitemap/robots, oversized images, dead links |
| `post-deploy-checklist.md` | After deploying | The live site at `client.domain`: up, meta/social tags, structured data, GA firing, every sitemap `<loc>` resolving, missing assets |

Run them by asking: `Run the pre-deploy checklist`.

## Google reviews

The template carries an opt-in, build-time Google reviews section powered by
our private `@reservationgenie/google-reviews` package
([88-RG-websites/review_scraper](https://github.com/88-RG-websites/review_scraper)).
Uncomment the `reviews` block in `src/_data/client.js` with the client's
Google Maps URL (the full address-bar URL containing `!1s0x…:0x…`) and the
next `npm run build` scrapes and renders reviews straight into the HTML — no
client-side fetch, indexable text. The full review history lives in a
committed `reviews-cache.json` at the repo root, so builds only fetch what's
new. Site-side conventions are in `CLAUDE.md`; the package README and its
`examples/eleventy/INTEGRATION.md` are the authority on the system itself.

Reviews refresh **on the server**, not from laptops: a monthly cron rebuilds
and redeploys every registered site. That splits the server work in two — a
per-site registration done for every new reviews-enabled site, and a one-time
provisioning that already exists but is inventoried below in case it ever has
to be rebuilt.

### Registering a site for the monthly refresh (per site)

`/google-reviews` Part B runs this with its gates (live on production, pushed,
webroot present) and a build check that doesn't deploy. By hand:

Wire and deploy the site first, and make sure everything is **pushed** — the
cron builds from `origin/main` and rsyncs over the live webroot, so unpushed
work is invisible to it (and, for the same reason, never deploy unpushed work
from a laptop once a site is registered):

```sh
ssh rg@104.237.128.61
git clone git@github.com:88-RG-websites/<repo>.git ~/sites/<repo>
cd ~/sites/<repo> && npm install --no-audit --no-fund
echo /home/rg/sites/<repo> >> ~/sites/reviews-sites.txt
~/bin/server-monthly.sh ~/sites/reviews-sites.txt   # optional: run once now to verify
```

The script assumes three things about the repo: `deploy.sh` carries its
`PROD_DEST="rg@…:<webroot>/"` line (that's how build output finds the live
webroot — there is no separate mapping to maintain), that webroot exists
under `/var/www/`, and `reviews-cache.json` is committed. Sites in the list
without a `reviews` config are reported SKIPPED, so listing a
not-yet-enabled site is harmless.

### What the server runs (one-time setup)

Everything lives under the `rg` user on `104.237.128.61` (li804-61,
Ubuntu 18.04):

```
/home/rg/
├── sites/                     one git clone per registered site — builds happen here
│   └── reviews-sites.txt      the list the cron iterates
├── bin/server-monthly.sh      the cron script — a copy of restaurant-template's
│                              server/client/server-monthly.sh; see that repo's
│                              server/README.md for how to check/update it
│                              (scripts/server/sync.mjs), not a manual scp
├── logs/reviews-monthly.log   every run's summary — THE place to check health
├── opt/node                   Node 22 (unofficial glibc-2.17 build, see below)
└── .ssh/id_ed25519            GitHub key, registered as rg-server-reviews-cron
/var/www/<domain>/_site/       live webroots — the rsync target per site
```

- **Cron** (`crontab -e` as `rg`) — 3rd of each month, 06:17 UTC:

  ```
  17 6 3 * * $HOME/bin/server-monthly.sh $HOME/sites/reviews-sites.txt 2>&1 | tee -a $HOME/logs/reviews-monthly.log
  ```

  Per site it runs `git pull --ff-only` → `npm install` → `npm run build` →
  rsync `dist/` into the webroot → commit/push `reviews-cache.json` if it
  changed, then prints a summary table.
- **Node** must be the
  [unofficial glibc-2.17 build](https://unofficial-builds.nodejs.org/) of
  Node 22 at `~/opt/node` — Ubuntu 18.04's glibc 2.27 cannot run official
  Node ≥ 18 binaries. `~/.bashrc` and the cron script both put
  `~/opt/node/bin` on PATH; `node: not found` in a bare shell means a missing
  PATH line, not a missing runtime. Don't apt-install node over it.
- **SSH key**: `~/.ssh/id_ed25519` is added to GitHub (titled
  `rg-server-reviews-cron`) with read access to the package repo and
  read/write on every site repo — the cron pulls sites, installs the private
  package, and pushes cache updates.
- **Git identity** is set in the server's global git config; the cache
  commits are authored with it.
- **Monitoring is the log, nothing else.** No alerts — read the summary
  tables in `~/logs/reviews-monthly.log` once in a while. A FAILED scrape
  **still deploys** (the site renders its last-good cached reviews), so the
  log is the only place breakage shows.
- The crontab also still carries the two legacy widget-pipeline entries
  (`review-scraper` weekly scrape + daily publish). They're unrelated to this
  package — keep them until the last old-widget site is migrated, then retire
  them.

If this summary and restaurant-template's `server/README.md` ever disagree,
`server/README.md` wins — that's where the script itself now lives.

## Also here

- `CLAUDE.md` — conventions for working in this repo with Claude Code.
- `forms.md` — the 88restaurants script: forms, widget, popups, order footer;
  setting up a new site and converting one off the old iframes.
- `menus.md` — menus on 88's `menu.<domain>` pages instead of the `/menus/`
  iframe: the switch, deep links, the header fragment, the rollout order.
- `git-basics.md` — the everyday git workflow, if you're new to it.
- [11ty documentation](https://www.11ty.dev/docs/) for anything deeper.
