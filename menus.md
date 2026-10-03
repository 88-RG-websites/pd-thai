# Menus on `menu.<domain>`

A site can show its menus in one of two ways, and `client.menuSubdomain` in
`src/_data/client.js` picks which:

| | `false` (default) | `true` |
|---|---|---|
| Where the menu lives | `/menus/` on the site, an iframe of `88restaurants.com/<id>/online_orders/frame` | 88's own pages on `https://menu.<domain>/`, one per menu schedule |
| Crawlable as the client's content | No — the text sits on 88restaurants.com | Yes — full HTML, schema.org JSON-LD, `.json` and `llms.txt` |
| One menu's link | `/menus/#menu-<scheduleId>` | `https://menu.<domain>/<schedule-slug>` |
| `/menus/` | the iframe page | a redirect to `https://menu.<domain>/` |

Prefer the subdomain for any restaurant whose site we build: the iframe's menu
text counts as 88restaurants.com content, so a search engine or an AI answer
never credits it to the client.

## How it works

- **Links.** Every menu link comes from `menuLink()` in `client.js`, and the
  template reads `client.urls.menus` (the general menu link) and
  `client.urls.menusAbsolute` (for schema `menu`/`hasMenu`). No template writes
  `/menus/` itself. Flip the switch and every nav entry, card, CTA and the
  schema move together.
- **Deep links** name the schedule both ways, so they survive the switch:

  ```js
  { label: 'Catering', href: menuLink('catering', 2690) }
  // false → /menus/#menu-2690        (CLAUDE.md, "Menu deep links")
  // true  → https://menu.<domain>/catering
  ```

- **General vs. named.** A general link (nav "Menu", "See the Full Menu", a
  "See the Menu" card, the FAQ) is `menuLink()` with no arguments, the menus
  root. On the subdomain the root opens whichever schedule the admin lists
  first, so a renamed schedule never breaks it. A card or link for one menu
  (Breakfast, Catering, Wine List) names that menu: `menuLink('<slug>', <id>)`.
- **The `/menus/` page** is gated like `/events/`: `menus.11tydata.js` stops
  writing the iframe page when the switch is on, and `menus-moved.njk` writes a
  redirect stub at `/menus/` instead (out of the sitemap, `noindex`, canonical
  to the subdomain). An old `/menus/#menu-<id>` link lands on the menu root,
  not its schedule: the fragment never reaches a server. Old per-menu URLs in
  `legacyRedirects.js` take `menuLink('<slug>', <id>)` for the same reason.
- **The header.** 88 fetches `https://<domain>/_88/header.html`
  (`src/_88/header.njk`, built on every site) and draws it above its menu pages
  in a shadow root, after stripping every `<script>`, `<link>`, `<iframe>`,
  `<meta>`, `<noscript>`, `<math>`, SVG animation (`<animate>`, `<set>`),
  `on*=` attribute and `javascript:` URL. If what is left does not parse back
  to the same markup (a `<form>` inside a `<form>`, say), 88 drops the whole
  fragment. The fragment's one `<link rel="icon">` (the square 192px PNG,
  https, on the site's own host) is read before the strip and becomes the menu
  pages' tab icon. So the fragment carries absolute URLs, pulls
  the site's `styles.css` and the Google Fonts through `@import`, re-scopes the
  theme's colour variables from `:root` to `:host`, and turns the mobile
  slide-over into a `popover` the hamburger opens without script. 88 caches it
  (and a miss) for ten minutes; without it the page draws a plain bar with the
  restaurant's name.
- **The domain.** `menu.<domain>` comes from `client.domain` by 88's rule:
  host, lowercased, `www.` dropped. It has to match the host of the
  restaurant's website URL in the 88 admin, which is what 88 looks the menu
  host up by.

## Naming and describing schedules in the 88 admin

- **Name a schedule for the meal it is, not when it runs** — "Lunch",
  "Dinner", "Happy Hour", "Catering" — never "Day"/"Night". The name becomes
  the slug (`menuLink()`'s `slug` argument and the URL on `menu.<domain>`),
  and "Day"/"Night" says nothing to a person landing on `/day/` from a search
  result or an answer engine, where the schedule's own page is the only
  context they have.
- **Renaming a schedule in the admin 301s its old slug automatically** — 88
  keeps the redirect, so relinking `client.js`/`faq.js` after a rename is a
  cleanup pass, not a race against a dead link. Still worth doing: a stale
  slug in this repo's own copy is one more 301 hop for no reason, and the
  llms.txt slug list (`curl -s https://menu.<domain>/llms.txt`) only ever
  shows the current name.
- **An uploaded image or PDF menu hides that schedule's items** from the page
  body, its JSON-LD, on-site search, and `llms.txt` — none of them can read
  text out of an image or a PDF. If the schedule also has real, current
  prices worth a search engine or an answer engine seeing, put the text
  version in the schedule's own **description** field in the admin (shown
  above the image on the page, and included in JSON-LD/llms.txt) — but only
  on the **premium** menu layout; the original layout does not surface a
  schedule description at all, so an image-only original-layout schedule has
  no crawlable substitute.
- **This site never types a menu price.** `client.js`/`theme.js` copy, the
  homepage FAQ (`src/_data/faq.js`) and every other page link to the menu
  (`client.urls.menus` / `menuLink()`) rather than quoting a number — see the
  header comment in `src/_data/faq.js` for why. The menu host, kept current
  in the 88 admin, is the one place prices live.

## Finding a schedule id

A restaurant with several menu schedules (lunch, catering, a second cuisine)
wants nav entries that open one of them, and on the iframe that is
`/menus/#menu-<scheduleId>`. Verify the fragment against the embed's
**JavaScript**, not its markup. `src/menus.njk` forwards a matching fragment onto the iframe's own
URL, because a hash on the parent page means nothing to a cross-origin embed.
The shape is fixed by the frame's `smart-menu-layout-c` controller, which
matches `/^#menu-(\d+)$/` and nothing else and treats the number as the
**schedule** id. The trap is that the markup's own ids look like better
answers and are not: the section carries `id="menu_schedule2690"` and each
category carries `id="menu6378"`, both real elements, neither reachable from
a URL — the frame's dropdown links to the category one through a click
handler reading `data-category-id`. Same number, different prefix, and
grepping the HTML tells you what exists rather than what is addressable.
A wrong fragment fails **silently**: the iframe loads and sits at the top,
which is what a working link landing there looks like, so it survives a full
build-and-deploy. Read the bundle, not the page — and note `curl` does not
glob, so resolve the hashed filename first:
```bash
FRAME=https://88restaurants.com/<id>/online_orders/frame
JS=$(curl -s "$FRAME" | grep -o 'https://[^"]*application-[^"]*\.js' | head -1)
curl -s "$JS" | grep -o 'location\.hash\.match([^)]*)'   # -> /^#menu-(\d+)$/
# the schedule ids themselves, anchored so data-schedule-id cannot match:
curl -s "$FRAME" | grep -oE '(^|[^-])id="menu_schedule[0-9]+"'
```
The ids belong to the restaurant's admin and change when it rebuilds a menu.
Write every menu link as `menuLink('<slug>', <scheduleId>)` in `client.js`,
never a literal: with `client.menuSubdomain` on, the same call becomes
`https://menu.<domain>/<slug>` (88's crawlable menu pages; slugs from
`curl -s https://menu.<domain>/llms.txt`). Those subdomain links 404 until
DNS, the server script and the admin toggle are done, in the order below.

## Moving a site onto the subdomain

A site whose header overlays the menu frame (ramerino-prime's legacy header,
with `/menus/` at `--header-height: 0`) moves here **before** its restaurant switches to 88's
Premium layout. Premium pins its menu bar to the frame's top edge
(`.oc-sticky-header`, `top: 0`, no offset setting), under that header; here 88
stacks it below the site header. The layout is set per restaurant, so switching
it changes the frame the live site embeds at once. Original opens with 100px of
padding and is safe under an overlay.

Order matters: the links the site publishes 404 until steps 1–3 are done.

1. **DNS.** An A record for `menu.<domain>` → the 88 production server, the
   same address as `book.` and `order.`. Check:
   `dig +short menu.<domain> @1.1.1.1` matches `dig +short 88restaurants.com`.
   (In Claude's sandbox that dig prints nothing, control included; use
   `dscacheutil -q host -a name menu.<domain>` there.)
2. **Server.** On the 88 server (`ssh deploy@88restaurants.com`):
   `sudo ./setup-menu-domain.sh <domain>` — nginx block plus a Let's Encrypt
   cert. It refuses to run until DNS resolves.
3. **Admin.** On the restaurant, tick **Menu Subdomain Enabled**, and set its
   website URL to exactly `client.domain` — same scheme, same `www.` or not
   (`curl -sI https://www.<domain>/`: the host that answers 200, not 301, is the
   one). The menu pages build their schema.org `@id` (`<url>/#restaurant`) and
   `url` from it, so a mismatch splits the business into two entities. Fill the
   Facebook URL too (and a `yelp.com/biz/…` link if there is one); they become
   `sameAs`. A client repo copied from the template before the `@id` commit
   (`feat: stable @id on the business schema node`) must pull that line into
   its own schema block first — `src/_includes/core/schema.njk` on a repo
   copied after the ownership-split PR, `layouts/base.njk` directly on an
   older one — or the menu pages' `@id` names a node the site never
   publishes. Then
   `curl -s https://menu.<domain>/llms.txt` lists every menu with its URL —
   that list is where the slugs come from.
4. **The header, first on its own.** Deploy the site with the switch still
   `false`: `/_88/header.html` goes live and nothing a visitor sees changes.
   Wait ten minutes (or clear `site_header/<domain>` in the 88 Rails cache) and
   check the header on `https://menu.<domain>/<slug>` at desktop and phone
   widths before anything links there.
5. **Flip the switch.** `menuSubdomain = true`; turn every per-menu link into
   `menuLink('<slug>', <scheduleId>)`, including links inside prose in
   `client.js` and `legacyRedirects.js`, and leave the general ones as
   `menuLink()`. Grep for `/menus/`, `#menu-` and `menuLink()`, and check each
   bare `menuLink()` is a general link, not a card for one menu:

   ```bash
   grep -rn "/menus/\|#menu-\|menuLink()" src/ --include='*.js' --include='*.njk' | grep -v "^src/menus"
   ```

6. **Deploy**, then run the checks below.

### Converting a client repo built before this

**This is automated now** (migration `060 menu-wiring`, `scripts/upgrade/run.mjs`
via `.claude/skills/upgrade-client-site/SKILL.md`): it syncs `src/_88/`,
`src/menus.11tydata.js`, `src/menus-moved.*` and `src/menus.njk` itself, and
points `index.njk`'s menus include at the theme-selectable component. It never
touches `menuSubdomain`: a site still on the iframe stays `false` (phase 1),
and one already moved keeps its redirect (see "Moving a site onto the
subdomain" above for phase 2, which is still a human-gated go-live step).
What follows is what it automates, for a repo converted entirely by hand
before this tool existed, or for a non-template site with no `client.js` at
all.

Client repos are detached copies. Bring over `src/_88/`, `src/menus.11tydata.js`,
`src/menus-moved.*`, the `menuSubdomain` / `menuLink` / `urls.menus*` block of
`client.js`, and the three template edits (`components/menus.njk` card
fallback, `components/menus_schedule.njk` CTA, the `menu`/`hasMenu` lines in
`layouts/base.njk`). A site that is not on this template (hand-built, or an
older 11ty starter) needs the same three things by hand: every menu link
pointed at `menu.<domain>`, redirects from its old menu URLs, and a
`/_88/header.html` fragment. musashidallas.com was the first one converted that
way.

## Verifying

Before deploying, with the switch on:

```bash
npm run build
grep -rl 'href="/menus' dist | grep -v '^dist/menus/'   # nothing
grep -o '"hasMenu": "[^"]*"' dist/index.html            # https://menu.<domain>/
grep -o 'url=[^"]*' dist/menus/index.html               # the redirect
npm run build:preview && grep -rl '/<site-name>/https:' dist   # nothing
```

After deploying:

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://<domain>/_88/header.html      # 200
curl -s https://menu.<domain>/<slug> | grep -o 'shadowrootmode\|site-header-fallback' | sort -u
curl -s https://menu.<domain>/<slug> | grep -o '<link rel="icon"[^>]*>'        # the site's 192px PNG
```

`shadowrootmode` means the site's header is in; `site-header-fallback` means 88
could not use the fragment (not deployed yet, cached miss, or a fetch error).
Then open a menu page in a browser: the header in the site's fonts and
colours, the hamburger opening the slide-over at phone width, and every link
in it going back to the site.
