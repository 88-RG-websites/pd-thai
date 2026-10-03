# Post-Deploy Checklist

QA pass to run **after** deploying, against the **live** site. It fetches the
production URL and verifies the deployed result matches the source.

## How to use

Tell Claude: **"Run the post-deploy checklist."**

**Rules for Claude:**
- First, read **`client.domain`** from `src/_data/client.js` — this is the base
  URL for every check below. Substitute it for `{domain}` throughout.
- **Second, establish which build is actually live before checking anything.**
  `curl -sI {domain}/ | grep -i last-modified` dates the deploy; compare it to
  `git log -1 --format=%cI`. A commit newer than the deploy is **not live**, and
  a checklist run that ignores that reports the repo's state as the site's. Do
  not assume the last deploy this session ran is the current one — the user may
  have deployed, and a preview URL is not the deployed artifact either.
- Use **`curl`**, not WebFetch, for anything whose answer is a status code or
  exact bytes. WebFetch summarises a page through a model; it cannot tell you
  that an image 404s, and it will describe a stale deploy as though it were the
  new one. WebFetch is fine for "does this page read correctly".
- Produce a results table with three states: **✅ Pass**, **❌ Fail**,
  **⚠️ Needs review** — each with the evidence (status code, the value found).
- **Report only — do not modify any files.** After the table, list recommended
  fixes for the user to approve.

---

## 1. Site is live

- [ ] Fetch **every** page the site serves → HTTP 200, not just the homepage.
      Derive the list from `dist/` rather than from memory, since a client site
      may have moved off the stock directory-style URLs to flat `.html` ones:

      (cd dist && find . -name '*.html' | sed 's|^\./||') | while IFS= read -r f; do
        printf '%-42s %s\n' "/$f" "$(curl -s -o /dev/null -w '%{http_code}' "{domain}/$f")"
      done

- [ ] The rendered `<title>` contains the correct restaurant name (matches
      `client.name`).
- [ ] **The deployed bytes are the bytes you built.** A partial rsync and a
      stale `dist/` both leave a site that answers 200 on every URL while
      serving the previous release:

      curl -s {domain}/ | md5 -q
      md5 -q dist/index.html
- [ ] **The same, per page, with a control.** One page can match while
      others don't (a partial rsync), so hash every page rather than just
      the homepage — and hash one URL that is expected to differ (an
      external og:image cache-buster query string aside, the *page* itself
      never should) as the control: a check that reports every page
      "matching" including one you know you changed is checking nothing.

      (cd dist && find . -name '*.html' | sed 's|^\./||') | while IFS= read -r f; do
        live=$(curl -s "{domain}/$f" | shasum -a 1 | cut -d' ' -f1)
        built=$(shasum -a 1 "dist/$f" | cut -d' ' -f1)
        [ "$live" = "$built" ] && echo "match  /$f" || echo "DIFFER /$f  live=$live built=$built"
      done

## 2. Live meta & social

- [ ] The live `<title>`, `description`, and `canonical` match the client and
      use `{domain}`.
- [ ] `og:title`, `og:description`, `og:url`, and `og:image` are present in the
      live HTML.
- [ ] `og:image` is an **absolute** URL and is **reachable** — fetch it → 200.
- [ ] `og:image` is the size `base.njk` declares (1200x630). Fetch it and
      measure rather than trusting the tag — they are separate facts:

      curl -s {domain}{{ client.ogImage }} -o /tmp/og && magick identify -format '%wx%h %m\n' /tmp/og

- [ ] **Manual (note in report):** run `{domain}` through the
      [Google Rich Results Test](https://search.google.com/test/rich-results)
      and a social-share debugger (e.g. Facebook Sharing Debugger) to confirm
      the preview renders. **If `og:image` changed in this release, the debugger
      re-scrape is not optional** — Facebook and LinkedIn cache the old card
      indefinitely and will keep serving it until something forces a refetch.

## 3. Live structured data

- [ ] **Every `application/ld+json` block on every live page parses as valid
      JSON** — not just the homepage's first block. A page can carry more
      than one (base.njk's `@graph` of Restaurant + WebSite in `<head>`, and
      a second FAQPage block wherever `components/faq.njk` renders), and a
      hand-checked "view source" pass tends to stop at the first:

      (cd dist && find . -name '*.html' | sed 's|^\./||') | while IFS= read -r f; do
        curl -s "{domain}/$f"
      done | python3 -c "
import sys, re, json
html = sys.stdin.read()
blocks = re.findall(r'<script type=\"application/ld\+json\">(.*?)</script>', html, re.S)
print(f'{len(blocks)} ld+json blocks found')
for i, b in enumerate(blocks):
    try: json.loads(b)
    except Exception as e: print(f'block {i}: FAIL {e}')
"

- [ ] Every URL inside the schema (`url`, `logo`) resolves to `{domain}` — no
      `example.com` or placeholder values.
- [ ] **Hours in the site's JSON-LD (`openingHoursSpecification`) match the
      menu host's own visible hours**, if `client.menuSubdomain` is on — two
      hand-maintained copies of the same fact are exactly how
      MUSASHI/docs/restaurant-schema.md's hours bug happened (the page said
      one closing time, the schema said another). Compare
      `dist/index.html`'s `opens`/`closes` against whatever the menu host
      itself declares for hours, where it publishes them.
- [ ] **The FAQPage block's answers equal the visible accordion text**, on
      whichever page renders `components/faq.njk` — the whole point of
      generating both from `src/_data/faq.js` is that they can't disagree;
      confirm it rather than assume it (a preview-only build is exempt: its
      links carry the preview path prefix in the visible HTML but not inside
      the JSON string, which is expected — see faq.njk's own comment).

## 4. Google Analytics (live)

- [ ] The live HTML for `{domain}/` includes the gtag script
      (`googletagmanager.com/gtag/js?id=…`) with the real measurement ID.
- [ ] **Manual (note in report):** confirm a hit appears in GA Realtime after
      loading the page.

## 5. Sitemap & robots (live)

- [ ] Fetch `{domain}/sitemap.xml` → 200 and confirm it parses as valid XML
      (well-formed `<urlset>` with `<url>` entries).
- [ ] Every `<loc>` URL uses the production `{domain}` — no `www.example.com`,
      `localhost`, or other placeholder hosts.
- [ ] **Fetch every `<loc>` URL in the sitemap and confirm each returns 200**
      (no 404/redirect to a dead page). Report any that fail.
- [ ] The sitemap covers all live pages — at minimum the homepage (`{domain}/`)
      and the menu page (`{domain}/menus/`). Flag any published page missing
      from the sitemap.
- [ ] `<lastmod>` dates (if present) are sane — not in the future.
- [ ] Fetch `{domain}/robots.txt` → 200; the `Sitemap:` line points to
      `{domain}/sitemap.xml` (and that URL is the one verified above).

## 6. Dead links & assets

- [ ] **Every internal reference on every live page returns 200** — not just
      the homepage's. Gallery lightboxes hold their full-size images in
      `data-full-image`, which no `<img>` scan sees, and a release that prunes
      unused assets is exactly the one that can strand them:

      (cd dist && find . -name '*.html' | sed 's|^\./||') | while IFS= read -r f; do
        curl -s "{domain}/$f"
      done > /tmp/all.html
      grep -ohE '(src|href|data-src|data-full-image|data-thumb)="/[^"]+"' /tmp/all.html \
        | sed -E 's/^[a-z-]+="//;s/"$//' | sort -u > /tmp/refs.txt
      while IFS= read -r u; do
        c=$(curl -s -o /dev/null -w '%{http_code}' "{domain}$u")
        [ "$c" = 200 ] || echo "$c $u"
      done < /tmp/refs.txt
      echo "checked $(wc -l < /tmp/refs.txt)"

- [ ] External links from those same pages resolve (2xx after redirects).
      Bare `preconnect` origins — `fonts.googleapis.com`, `fonts.gstatic.com` —
      answer 404 to a plain GET and are **not** failures; they are hostname
      hints, not URLs.
- [ ] `{domain}/assets/css/styles.css` and `/assets/js/main.js` → 200.
- [ ] The hosted attribution script,
      `https://88restaurants.com/uploads/attribution.js`, → 200.
- [ ] The platform script, `https://88restaurants.com/embed/88.js`, → 302 to
      the current build (it is a redirect, not the file; `curl -sIL` ends 200).
- [ ] **Every entry in `src/_data/legacyRedirects.js` 301s (or its
      meta-refresh stub 200s and points at the right destination) from the
      old URL to its new one, live.** This is the check that proves the
      redirect actually shipped — `dist/` containing the stub file only
      proves the build wrote it:

      node -e "for (const r of require('./src/_data/legacyRedirects.js')) console.log(r.from + '\t' + r.to)" \
        | while IFS=$'\t' read -r from to; do
            code=$(curl -s -o /dev/null -w '%{http_code}' -L "{domain}$from")
            landed=$(curl -s -o /dev/null -w '%{url_effective}' -L "{domain}$from")
            printf '%-30s -> %-30s  %s  landed:%s\n' "$from" "$to" "$code" "$landed"
          done

      A server-side `return 301` (deploy.sh, production only) redirects
      before the file is ever read; the meta-refresh stub is what a build
      with no server access falls back to — either is fine, but the
      destination must match `to` and the final status must be 200.

## 7. Render & integration spot-checks

- [ ] `{domain}/_88/header.html` → 200. With `client.menuSubdomain` on, every
      `menu.<domain>` URL in the built HTML → 200, and one of them serves the
      site header: `curl -s https://menu.<domain>/<slug> | grep -o
      'shadowrootmode\|site-header-fallback' | sort -u` prints
      `shadowrootmode` (88 caches a miss ten minutes), and `grep -o '<link
      rel="icon"[^>]*>'` on the same page names
      `https://<domain>/assets/favicons/android-chrome-192x192.png`. See `menus.md`.
- [ ] The `og:image` named by `client.ogImage`, `/assets/images/logo.png`,
      `/assets/favicons/favicon.ico` and `/assets/favicons/site.webmanifest`
      → 200. (Gallery photos are covered by the §6 sweep.)
- [ ] The ordering link resolves. On sites migrated to FriendlyId slugs this is
      `https://88restaurants.com/<slug>/online_orders/new`, **not** the numeric
      `client.id` — read the URL out of the built HTML rather than composing it
      from the id, or you will verify a URL the site does not use:

      grep -ohE 'https://88restaurants\.com/[^"]*online_orders[^"]*' dist/*.html \
        | sort -u | while IFS= read -r u; do
            printf '%-70s %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' -L "$u")"
          done

- [ ] On a multi-location site, the platform script carries **that page's**
      restaurant id and is absent from any page that has not yet asked which
      location the visitor wants:

      grep -o 'embed/88.js" data-restaurant="[^"]*"' dist/*.html dist/*/*.html

- [ ] **The script ran and drew everything.** In the browser console on the
      live page:

      window.EightyEight.restaurant                          // the id
      document.querySelectorAll('[data-88-mounted]').length  // = the page's form/widget tags
      await window.EightyEight.site                          // { popups, footer, widget }
      document.querySelector('[data-88-footer]')             // the order footer, if the admin has it on

      `footer: null` / an empty `popups` means the account has them switched
      off — nothing on the site changes when the client turns them on. A
      widget showing "Online booking is unavailable" means the restaurant has
      no bookable schedule in the admin, not a site bug.

- [ ] **Reviews** (only with `client.reviews` set): the live homepage carries
      `id="reviews"`, and the site is on the monthly cron:
      `ssh rg@104.237.128.61 cat ~/sites/reviews-sites.txt` lists
      `/home/rg/sites/<repo>`. Unlisted = ⚠️ Needs review, fixed by
      `/google-reviews` Part B (it asks before registering).
- [ ] The site is served over **HTTPS**.
- [ ] **Manual (note in report):** open `{domain}` in a browser and confirm it
      renders with no console errors.

## 8. What the deploy removed

The production rsync runs `--delete`, so a release can take files off the live
site that no page of the *new* build references but something outside it might.

- [ ] Confirm the pre-deploy backup still exists and is the version that was
      live before this deploy. Keep it until this checklist passes.
- [ ] Spot-check that the removals were the intended ones — old CSS/JS from the
      site being replaced, not a page. Every URL in §1 and §5 returning 200 is
      the real proof no page was lost.
- [ ] **Manual (note in report):** anything that used to sit at the web root
      (loose `.jpg`s the old site served) is now a 404. If Google Business
      posts, an email blast or a social post hot-linked one, it is broken now —
      restore that single file from the backup rather than reverting.

---

## Recommended fixes

After running, Claude lists here every ❌ Fail and ⚠️ Needs review item with a
concrete suggested fix, for the user to approve.
