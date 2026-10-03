# Pre-Deploy Checklist

QA gate to run **before** deploying this site (`./deploy.sh`). It verifies the
source, client data, and production build — catching client-specific mistakes
before they ship.

## How to use

Tell Claude: **"Run the pre-deploy checklist."**

**Rules for Claude:**
- Work through every item below and execute the stated check (run the command,
  read the `file:line`, or grep as described).
- Produce a results table with these states: **✅ Pass**, **❌ Fail**,
  **⚠️ Needs review** — each with the evidence (the value found, the line, the
  command output). Items in **§11 Manual checks** can't be automated — list them
  as **⚠️ Manual check** reminders for the user to do by hand; don't try to
  pass/fail them.
- **Report only — do not modify any files.** After the table, list the
  recommended fixes so the user can approve them separately.

---

## 1. Build integrity

- [ ] `npm run build` exits 0 with no errors or warnings.
- [ ] `dist/` is generated and contains an `index.html` for every page in
      `client.nav` — the stock set is `index.html`, `menus/index.html` and
      `gallery/index.html`, plus `404.html` (which is deliberately not in
      `client.nav`).
- [ ] `dist/sitemap.xml` exists after the build.
- [ ] `dist/robots.txt` exists after the build.
- [ ] **If `src/assets/css/styles.css` is tracked in git, it equals a clean
      rebuild.** A `npm run serve`/`watch:css` process left running while
      editing accumulates Tailwind classes a plain `npm run build` alone
      would also produce, so this only actually catches drift when the
      committed file was hand-edited or saved from a stale watcher run:

      npx postcss src/assets/sass/styles.scss -o /tmp/styles-clean.css
      cmp src/assets/css/styles.css /tmp/styles-clean.css && echo "clean"

      A diff = **Fail**; rebuild and commit `npm run build:css`'s output
      before deploying.
- [ ] **The required-pages/legacy-stub guard `deploy.sh` runs before its
      rsync, read-only.** It aborts the real deploy if any of these are
      missing from `dist/`, so failing it here first is cheaper than
      finding out mid-deploy:

      node -p "require('./src/_data/legacyRedirects.js').map(r => { const f = r.from.replace(/^\//, ''); return f === '' || /\/$/.test(f) ? f + 'index.html' : f; }).join(' ')"
      # then, for REQUIRED_PAGES (deploy.sh) plus every path the command above printed:
      for f in index.html 404.html menus/index.html assets/css/styles.css <legacy paths…>; do
        [ -f "dist/$f" ] && echo "ok  $f" || echo "MISSING $f"
      done

## 2. Client data completeness — `src/_data/client.js`

- [ ] No template placeholders remain. Grep `src/_data/client.js` for:
      `Test Restaurant`, `testrestaurant.com`, `test.com`, `1234 Testing Ln`,
      `Test City`, `(555) 123-4567`, `info@testrestaurant.com`. **Any hit = Fail.**
- [ ] `client.domain` is the real production URL, starts with `https://`, and
      **names the hostname the server actually serves** — apex or `www`, not
      whichever one was typed first. It is the canonical tag, `og:url`, the
      sitemap hostname and every absolute URL in the schema block, so getting
      it wrong makes every page declare a canonical that 301s away from
      itself. Measure both:

      for h in <domain> www.<domain>; do
        curl -s -o /dev/null -w "$h %{http_code} %{redirect_url}\n" "https://$h/"
      done

      The one that answers 200 is the canonical host. **Fail** if `client.domain`
      names the one that redirects.
- [ ] `address` (street/city/state/zip), `phone`, and `email` are the client's
      real details.
- [ ] `hours.schedule` reflects the client's actual opening hours.
- [ ] `socialMedia.*` (facebook, instagram, twitter, yelp, googleBusiness) are
      real URLs — not `test.com`.
- [ ] `googleMapsUrl` points to the client's real location.
- [ ] `id` is the correct 88restaurants ordering ID for this client. It is set
      (non-empty) — it drives the ordering iframe and the platform script that
      draws every form, the widget, popups and the order footer.
- [ ] `forms.*` slugs are the client's own, read off their admin (Settings →
      Website → Forms), not the template's placeholders — a wrong slug ships
      an "unavailable" line where the form should be.

## 3. SEO / meta tags — `src/_includes/layouts/base.njk`

- [ ] Every page has a populated title + `description`. The rendered
      `<title>`/`og:title`/`twitter:title` and the description come from
      `client.seo`, keyed by the page's file slug (`index`, `menus`,
      `gallery`, `404`, plus any page this client added); an older page's
      own frontmatter `seoTitle` still wins. A page with neither falls back
      to the bare business name and an empty description. **Missing both =
      Fail.**
- [ ] `canonical` and `og:url` resolve to absolute `client.domain` URLs.
- [ ] `og:image` uses an **absolute** URL
      (`{{ client.domain }}{{ client.ogImage }}`), not a relative path.
      A leading-slash-only value = Fail (breaks social-share previews).
- [ ] **`og:image` is a real 1200x630 file.** `base.njk` hardcodes
      `og:image:width` 1200 and `og:image:height` 630, so pointing
      `client.ogImage` at a slideshow frame (one client site had a 1920x1080
      one) makes the declaration a lie and scrapers lay the card out against
      the wrong ratio. No page renders wrong, so nothing surfaces it but this
      check:

      magick identify -format '%wx%h\n' src/assets/images/og-image.jpg

      Keep it **JPEG or PNG, not webp** — this file is fetched by link
      scrapers rather than browsers, and LinkedIn/Slack-class crawlers still
      skip webp cards.
- [ ] Recommended tags present — flag as Needs review if missing: `robots`,
      Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`,
      `twitter:image`), and `og:site_name`.
- [ ] Each page `<title>` is unique and ≤ ~60 characters.
- [ ] Each page `description` is ≤ ~160 characters.

## 4. Structured data — `src/_includes/core/schema.njk`

- [ ] After build, extract the `application/ld+json` block from
      `dist/index.html` and confirm it parses as valid JSON.
- [ ] `name`, `url`, and `logo` resolve to the real `client.domain`
      (no `example.com`/placeholder).
- [ ] The `@type` is `client.businessType` (`Restaurant`/`LocalBusiness`/a
      subtype) — not the generic `Organization`. `address`,
      `openingHoursSpecification`, `telephone` and `priceRange` are already
      emitted from `client.js`; confirm none of them are still placeholder
      values.

## 5. Google Analytics — `client.analytics.ga4`

- [ ] If the client wants GA, `client.analytics.ga4` holds a real GA4
      measurement id (`G-…`). Empty is allowed and renders no tag.
- [ ] No hand-written gtag anywhere else (an old
      `components/google_analytics.njk`, a pasted block in a layout):
      `core/head.njk` renders the tag, and a second copy double-counts.
- [ ] `node scripts/golive/golive.mjs ../<client> preflight` shows the id
      as ok; after the production deploy, `verify` finds exactly one tag.
      (`npm run build` only renders the tag when `PATH_PREFIX` is unset, so
      preview builds on preview.88restaurants.com never carry it.)

## 6. Sitemap / robots config

- [ ] `.eleventy.js` sitemap `hostname` matches `client.domain`. The default
      `https://www.example.com` = Fail.
- [ ] `src/robots.txt` `Sitemap:` line resolves to the real domain.
- [ ] `robots.txt` `Disallow` rules are intentional (currently `/private/`).
- [ ] **`dist/sitemap.xml` parses as XML**, and `<?xml` is the very first byte:

      xxd dist/sitemap.xml | head -1
      python3 -c "import xml.dom.minidom as m;d=m.parse('dist/sitemap.xml');print(len(d.getElementsByTagName('url')),'urls')"

      The stock `{% sitemap collections.all %}` is fine. This is for the site
      that replaces it with a hand-rolled `sitemap.xml.njk` to pin an old
      site's URL list — a Nunjucks `{# comment #}` above the declaration leaves
      its newline in the output, and `\n<?xml` is rejected outright ("XML or
      text declaration not at start of entity"). The build succeeds, the file
      looks right in an editor, and Search Console refuses it on the first
      submit. Put the comment below the declaration and use `{#- -#}`.

## 7. Images — `src/assets/images/`

- [ ] Run `ls -la src/assets/images/` (and `gallery/`) and flag any file
      larger than ~250 KB for compression review. Report only — the user
      decides. (Known large files today: `slider-bg.jpg` ~685 KB,
      `kobe-trio.jpg` ~315 KB, `parallax-bg-2.jpg` ~299 KB.)
- [ ] The `og-image` file named by `client.ogImage`, and `logo.png`, exist.
- [ ] **Nothing ships that no page references.** `src/assets/images/` is
      passthrough-copied wholesale, so every stray file lands on the client's
      live domain and is publicly fetchable. Diff what the build references
      against what it copied:

      python3 - <<'PY'
      import re,os,glob
      pat=re.compile(r'/assets/images/[A-Za-z0-9_./%-]+\.(?:webp|jpg|jpeg|png|svg|gif|ico)')
      refs=set()
      for f in glob.glob('dist/**/*',recursive=True):
          if os.path.isfile(f) and f.rsplit('.',1)[-1] in ('html','css','js','xml','txt','webmanifest','json'):
              refs.update(pat.findall(open(f,errors='ignore').read()))
      refs={r[len('/assets/images/'):] for r in refs}
      have={os.path.relpath(os.path.join(r,f),'dist/assets/images')
            for r,_,fs in os.walk('dist/assets/images') for f in fs}
      print(f'{len(have-refs)} unused, {sum(os.path.getsize("dist/assets/images/"+f) for f in have-refs)/1e6:.1f} MB')
      print('\n'.join(sorted(have-refs)))
      PY

      Safe to trust only because nothing here builds an image path at runtime —
      confirm that before deleting if a site has added JS or SCSS that does.
      A site built by copying an earlier one carries the earlier one's photos:
      this found 18.8 MB of dead files on one build, including two *other*
      restaurants' folders, all a URL guess away from being public.
- [ ] The favicon set exists in `src/assets/favicons/`.
- [ ] `dist/assets/favicons/site.webmanifest` carries this client's `name` /
      `short_name`, and `theme_color` / `background_color` equal their
      `secondary-700` (the page ground — a stock `#ffffff` flashes white behind
      an installed PWA):

      cat dist/assets/favicons/site.webmanifest

      All four are rendered from `client.js` and `theme.js` by
      `src/site.webmanifest.njk`, so they cannot drift from the site the way
      the old static JSON did — it shipped for months with the favicon
      generator's empty name strings, because nothing on the page reveals them.
      Check the output anyway: a client build that replaced the file with a
      generator's copy is back to static. `icons[].src` must stay **relative**
      (`android-chrome-192x192.png`) — a leading slash 404s on the preview
      server's subfolder.
- [ ] Grep templates for image `src` paths and confirm each referenced file
      exists in `src/assets/images/` (catch broken `<img>` references).
- [ ] **Path prefix.** `npm run build:preview`, then grep the output for every
      image reference:

      grep -ohE '(src|data-src|srcset|data-srcset|data-full-image)="[^"]*\.(webp|png|jpg|svg)[^"]*"|url\([^)]*\.(webp|png|jpg)[^)]*\)' dist/*.html dist/*/*.html | sort -u

      Every one must carry exactly one `/<site-name>/` prefix. A bare
      `/assets/…` 404s on the preview server and a doubled
      `/<site-name>/<site-name>/…` is the same bug inverted — neither shows up
      in a default root build. `.eleventy.js` documents which references need
      `| url`. Rebuild with `npm run build` when done.
- [ ] **Path prefix, internal links.** Same preview build. This is a separate
      bullet because the grep above matches images only, which is exactly how a
      broken page link once reached a client's preview:

      grep -ohE 'href="[^"]*\.html"' dist/*.html dist/*/*.html | sort -u

      Every internal page link must carry exactly one `/<site-name>/` prefix. A
      link with no leading slash at all is the failure mode — see §8.
      Absolute `https://<production-domain>/…` URLs also appear in that output —
      canonical tags and JSON-LD — and are correct as they are; they are not
      preview links.

## 8. Links & content

- [ ] **Menu links go through `menuLink()`.** With `client.menuSubdomain` on,
      `grep -rl 'href="/menus' dist | grep -v '^dist/menus/'` finds nothing,
      and `https://menu.<domain>/llms.txt` already lists every slug the site
      links to — if it does not answer, DNS, the server script or the admin
      toggle is not done and this deploy would publish 404s. See `menus.md`.
- [ ] **With `client.menuSubdomain` on, every `menu.<domain>` URL the built
      site links to actually resolves — not just the host.** A schedule
      renamed in the 88 admin since the site was last linked 404s at its old
      slug until the rename is picked up here (`menus.md`, "Naming and
      describing schedules"); the check above only proves the *host*
      answers, not each *slug*:

      grep -rohE 'https://menu\.[^"]+' dist/*.html dist/*/*.html | sort -u \
        | while IFS= read -r u; do printf '%-70s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' "$u")"; done
- [ ] Grep templates (`src/**/*.njk`) for `href="#"`, `href=""`, `example.com`,
      `localhost`, `TODO`, and `Lorem`. Any hit = Needs review.
- [ ] **Internal page links are root-relative.**

      grep -rnE 'href="[a-z0-9_-]+\.html' src/

      Any hit = Fail. A bare `href="menu.html"` resolves against the current
      *directory*, so on a preview URL without its trailing slash the browser
      drops the last segment and asks for `/menu.html` — a 404. It also hides
      the link from `EleventyHtmlBasePlugin`, which only rewrites paths that
      already begin with `/`. Write `href="/menu.html"`.
- [ ] **Legacy URL parity — only if this replaces an existing website.** The
      old site is still up while you build, so its URL surface is measurable,
      not a manual check. Production rsyncs with `--delete` and 11ty writes
      `/menus/` where a hand-built site served `/menus.html`, so every URL the
      old site answers and the new build does not becomes a 404 on cutover:

      curl -s https://<domain>/ \
        | grep -ohE '(href|src)="[^"]+"' | sed 's/.*="//;s/"$//' \
        | grep -vE '^(https?:|#|javascript:|mailto:|tel:|data:)' | sort -u

      Repeat for each page that turns up. Every `.html` page in the result
      needs an entry in `src/_data/legacyRedirects.js` — including pages the
      new build has no equivalent of, which redirect to the nearest real page
      or the homepage, because a redirect beats a 404 on an indexed URL. Then
      confirm the build wrote them (`ls dist/*.html`) and that each is named in
      `deploy.sh`'s pre-rsync check loop. A meta-refresh stub is a soft
      redirect; recommend an nginx `return 301` alongside it where somebody has
      server access.
- [ ] All social links in `client.js` are real (not `test.com`).
- [ ] The 88restaurants ordering iframe in `src/menus.njk` uses the correct
      `client.id`.
- [ ] The 88restaurants script is in the base layout and renders on every
      page with the real id (empty or missing = Fail):

      grep -o 'embed/88.js" data-restaurant="[^"]*"' dist/index.html

- [ ] Every form slot rendered a tag, and none of the older embeds is left
      (a legacy `popup.js` or `discount_button` beside the new script shows
      the guest two popups, or keeps the old order bar and hides the new):

      grep -o '<div[^>]*data-88-[^>]*>' dist/*.html dist/*/*.html
      grep -l 'popup.js\|discount_button\|contact_forms\|email_list_forms\|party_inquiry_forms\|employment_submissions\|/widgets/' dist/*.html dist/*/*.html   # nothing

- [ ] Each form draws in the browser (`npm run serve` is enough — the form
      endpoints are not origin-restricted) with the client's colours, and on a
      desktop width its fields sit two per row. One per row at 1440 means the
      slot is under 576px: widen it (`forms.md`, "Desktop layout").

## 9. Attribution tracking

Which check applies depends on the type of site being deployed.

### If this is a **restaurant** website

- [ ] The base layout (`src/_includes/layouts/base.njk`) includes the hosted
      88restaurants attribution script:
      `<script src="https://88restaurants.com/uploads/attribution.js" defer></script>`
- [ ] There is no local `src/assets/js/attribution.js` — the snippet is hosted
      now, so a leftover copy would ship a second, stale attribution writer.
- [ ] After build, confirm the script tag renders in `dist/index.html` and the
      hosted URL answers 200.

### If this is a **tour** website

- [ ] The base layout includes the hosted ReservationGenie attribution script,
      with `data-booking-host` set to the client's real booking subdomain:

```html
<script src="https://reservationgenie.com/attribution.js" data-booking-host="book.domain.com" defer></script>
```

- [ ] `data-booking-host` is **not** the `book.domain.com` placeholder — it must
      be the client's actual booking host.

## 10. The production server — read-only checks

`deploy.sh` rsyncs into a box it does not configure, so a passing build says
nothing about what the box does with it. All of this is `ssh` + `curl` and
**must stay read-only** — never edit server config from an agent session.

- [ ] **Take a backup first.** A read-only pull of what is currently live,
      before anything overwrites it. `--delete` has no undo and the box has no
      snapshot:

      rsync -az <user>@<host>:/var/www/<site>/_site/ ~/<site>-backup-$(date +%Y%m%d)-pre-deploy/

      Keep it until the post-deploy checklist passes — §8 there is what uses it,
      and it is what turns "a hot-linked image broke" into restoring one file
      rather than reverting a release.
- [ ] **Tag parity with the site being replaced.** Until you deploy, the old
      site is still up and still answerable, so do not defer to a manual check
      what its HTML will tell you. Conversion tracking is the one that fails
      silently — a missing pixel breaks no page and shows up weeks later as
      campaign data that stopped:

      for p in / <a-few-real-pages>; do curl -s "https://<domain>$p"; done \
        | grep -ohE 'googletagmanager|facebook\.net|connect\.facebook|fbq\(|AW-[0-9]+|G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+|UA-[0-9-]+|hotjar|clarity\.ms|snap\.sc|tiktok' | sort -u
      grep -rhoE 'googletagmanager|facebook\.net|connect\.facebook|fbq\(|AW-[0-9]+|G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+|UA-[0-9-]+|hotjar|clarity\.ms|snap\.sc|tiktok' dist/ | sort -u

      The two lists must match. A tag the old site carries and the new build
      lacks is a pre-deploy fix, not a post-deploy discovery. The general form
      is worth remembering: during a rebuild, anything about the old site's
      behaviour is **measurable**, not manual.
- [ ] **What `--delete` will remove.** The production rsync uses `--delete`, so
      anything live and absent from `dist/` is gone. List it before deploying,
      not after:

      ssh <user>@<host> 'cd /var/www/<site>/_site && find . -type f | sed "s|^\./||" | LC_ALL=C sort' > /tmp/prod.txt
      (cd dist && find . -type f | sed 's|^\./||' | LC_ALL=C sort) > /tmp/dist.txt
      comm -23 /tmp/prod.txt /tmp/dist.txt

      **Use `LC_ALL=C` on both sides.** macOS and Linux `sort` disagree on
      collation for dotfiles, and `comm` over differently-ordered input invents
      differences — the first run of this reported a page as being deleted that
      was present in both trees. Read the list for anything nobody can
      regenerate: Search Console verification files (`google*.html`),
      `.well-known/`, `.htaccess`, and images that old email blasts or Google
      Business posts may hot-link. Old CSS/JS from the site being replaced is
      *meant* to go.
- [ ] **The same, straight from rsync, as a second read on the `comm` list
      above rather than a replacement for it** — `--dry-run
      --itemize-changes` runs the exact transfer `deploy.sh` would, without
      writing anything, and its `*deleting` lines are rsync's own answer to
      "what would `--delete` remove," immune to the `comm`/`sort`-collation
      trap the bullet above calls out:

      rsync -avz --delete --dry-run --itemize-changes --filter='P /_versions/**' dist/ <user>@<host>:/var/www/<site>/_site/

      No `*deleting` line beyond what the bullet above already explained =
      **Pass**. Read-only — `--dry-run` never writes to the target.
- [ ] **`PROD_DOMAIN` at the top of `deploy.sh` is the live domain**, not left
      empty and not the slug. Production is `/var/www/<domain>/_site`, keyed by
      domain; the slug only ever names the preview folder, and on most clients
      the two are different strings. The script refuses production while it is
      empty — that is the intended failure, and filling it in is a human step.
- [ ] **The vhost's doc root matches `PROD_DEST` in `deploy.sh`.**
- [ ] **`error_page 404 /404.html;` is present.** A bare
      `try_files $uri $uri/index.html =404;` never serves the 404 page the
      build ships — nginx returns its own. Nothing in the build reveals this.
- [ ] **Compression covers CSS/JS, not just HTML.** `gzip on` with `gzip_types`
      left commented out means nginx's default, which is `text/html` alone:

      curl -sI -H 'Accept-Encoding: gzip' https://<domain>/assets/css/styles.css | grep -i 'content-encoding'

      No header = the stylesheet ships uncompressed.
- [ ] **Static assets carry `Cache-Control` or `Expires`**, not just `ETag` —
      otherwise every asset costs a revalidation round-trip per visit.
- [ ] **TLS and redirects**, from outside the box:

      echo | openssl s_client -servername <domain> -connect <domain>:443 2>/dev/null | openssl x509 -enddate -noout
      curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' http://<domain>/<a-real-page>.html
      curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://www.<domain>/<a-real-page>.html

      Both redirects must **preserve the path**. A retired domain pointed at
      the new one with `return 301 https://<domain>;` and no `$request_uri`
      dumps every deep link on the homepage.

These boxes host many client vhosts, so compression and cache headers are global
config touching every site on them — report those, don't chase them.

## 11. Manual checks (human — Claude just reminds)

These can't be verified automatically. Claude should **surface them as
reminders** in the results table (state: **⚠️ Manual check**) for the user to
perform by hand — not attempt to pass/fail them.

- [ ] **Menu iframe — no double scroll bar.** Open the menu page(s) in a browser
      and confirm the ordering iframe does not show a second, inner scroll bar.
      Fix by making sure the header is the proper size (an oversized header
      shrinks the iframe viewport and triggers the double scroll).
- [ ] **Favicon is updated.** Open the site in a browser and confirm the
      favicon shown in the tab is the client's own logo/icon — not the template
      default or a previous client's. (§7 only checks the files exist in
      `src/assets/favicons/`, not that they're the right ones.)
- [ ] **Conversions still record.** §10 proves the new build carries the same
      tags the old site did — that part is not manual. Only the ad platform can
      confirm they still fire: check Google Ads and Meta Events Manager after
      cutover.
- [ ] **Hot-linked orphans.** If §10's `comm` shows the deploy deleting images
      the old site kept at the web root, check whether anything outside the site
      points at them — Google Business posts, past email blasts, a social post.
      Nothing on the server records who links in from outside.
- [ ] **Rebuild of an old site — the links nothing on the web points at.**
      §8's legacy-URL check covers every URL the old site links to itself.
      What it cannot see: **email marketing**, printed QR codes, and Google
      Business posts, which may point at pages the old site never linked. Dig
      those out of the client's own materials and add them to
      `src/_data/legacyRedirects.js` before deploying.

---

## Recommended fixes

After running, Claude lists here every ❌ Fail and ⚠️ Needs review item with a
concrete suggested fix, for the user to approve before deploying.
