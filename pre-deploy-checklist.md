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
  command output). Items in **§9 Manual checks** can't be automated — list them
  as **⚠️ Manual check** reminders for the user to do by hand; don't try to
  pass/fail them.
- **Report only — do not modify any files.** After the table, list the
  recommended fixes so the user can approve them separately.

---

## 1. Build integrity

- [ ] `npm run build` exits 0 with no errors or warnings.
- [ ] `dist/` is generated and contains `index.html` and `menus/index.html`.
- [ ] `dist/sitemap.xml` exists after the build.
- [ ] `dist/robots.txt` exists after the build.

## 2. Client data completeness — `src/_data/client.js`

- [ ] No template placeholders remain. Grep `src/_data/client.js` for:
      `Test Restaurant`, `testrestaurant.com`, `test.com`, `1234 Testing Ln`,
      `Test City`, `(555) 123-4567`, `info@testrestaurant.com`. **Any hit = Fail.**
- [ ] `client.domain` is the real production URL and starts with `https://`.
- [ ] `address` (street/city/state/zip), `phone`, and `email` are the client's
      real details.
- [ ] `hours.schedule` reflects the client's actual opening hours.
- [ ] `socialMedia.*` (facebook, instagram, twitter, yelp, googleBusiness) are
      real URLs — not `test.com`.
- [ ] `googleMapsUrl` points to the client's real location.
- [ ] `id` is the correct 88restaurants ordering ID for this client.

## 3. SEO / meta tags — `src/_includes/layouts/base.njk`

- [ ] Each page has a populated `description`. Check the frontmatter of
      `src/index.njk` and `src/menus.njk`.
- [ ] `keywords` (`base.njk:9`) is no longer empty. **Empty = Fail.**
- [ ] `canonical` (`base.njk:10`) and `og:url` (`base.njk:16`) resolve to
      absolute `client.domain` URLs.
- [ ] `og:image` (`base.njk:17-18`) uses an **absolute** URL
      (`{{ client.domain }}/assets/images/og-image.webp`), not a relative path.
      A leading-slash-only value = Fail (breaks social-share previews).
- [ ] Recommended tags present — flag as Needs review if missing: `robots`,
      Twitter Card (`twitter:card`, `twitter:title`, `twitter:description`,
      `twitter:image`), and `og:site_name`.
- [ ] Each page `<title>` is unique and ≤ ~60 characters.
- [ ] Each page `description` is ≤ ~160 characters.

## 4. Structured data — `src/_includes/layouts/base.njk:38-51`

- [ ] After build, extract the `application/ld+json` block from
      `dist/index.html` and confirm it parses as valid JSON.
- [ ] `name`, `url`, and `logo` resolve to the real `client.domain`
      (no `example.com`/placeholder).
- [ ] **Needs review:** the schema type is generic `Organization`. Recommend
      upgrading to `Restaurant` / `LocalBusiness` with `address`,
      `openingHoursSpecification` (data already in `client.js`), `telephone`,
      and `priceRange` for richer search results.

## 5. Google Analytics — `src/_includes/components/google_analytics.njk`

- [ ] The GA snippet is **uncommented** (not wrapped in `{# ... #}`).
      Fully commented = Fail.
- [ ] It contains a real measurement ID (`G-…` or `GA_…`), not the
      `GA_TRACKING_ID` placeholder.
- [ ] After build, confirm the gtag script actually renders in `dist/index.html`.

## 6. Sitemap / robots config

- [ ] `.eleventy.js:9` `hostname` matches `client.domain`. The default
      `https://www.example.com` = Fail.
- [ ] `src/robots.txt` `Sitemap:` line resolves to the real domain.
- [ ] `robots.txt` `Disallow` rules are intentional (currently `/private/`).

## 7. Images — `src/assets/images/`

- [ ] Run `ls -la src/assets/images/` (and `gallery/`) and flag any file
      larger than ~250 KB for compression review. Report only — the user
      decides. (Known large files today: `slider-bg.jpg` ~685 KB,
      `kobe-trio.jpg` ~315 KB, `parallax-bg-2.jpg` ~299 KB.)
- [ ] `og-image.webp` and `logo.png` exist.
- [ ] The favicon set exists in `src/assets/favicons/`.
- [ ] Grep templates for image `src` paths and confirm each referenced file
      exists in `src/assets/images/` (catch broken `<img>` references).

## 8. Links & content

- [ ] Grep templates (`src/**/*.njk`) for `href="#"`, `href=""`, `example.com`,
      `localhost`, `TODO`, and `Lorem`. Any hit = Needs review.
- [ ] All social links in `client.js` are real (not `test.com`).
- [ ] The 88restaurants ordering iframe in `src/menus.njk` uses the correct
      `client.id`.

## 9. Manual checks (human — Claude just reminds)

These can't be verified automatically. Claude should **surface them as
reminders** in the results table (state: **⚠️ Manual check**) for the user to
perform by hand — not attempt to pass/fail them.

- [ ] **Menu iframe — no double scroll bar.** Open the menu page(s) in a browser
      and confirm the ordering iframe does not show a second, inner scroll bar.
      Fix by making sure the header is the proper size (an oversized header
      shrinks the iframe viewport and triggers the double scroll).
- [ ] **Rebuild of an old site — link parity.** If this is replacing an existing
      site, confirm all URLs still match the old ones. 11ty uses directory-style
      paths (e.g. `/menus/`) while the old site may have used `/menus.html` —
      set up redirects or matching paths so old links don't 404. Also check any
      **email marketing** for links, since those may point to pages that aren't
      linked anywhere on the site itself.

---

## Recommended fixes

After running, Claude lists here every ❌ Fail and ⚠️ Needs review item with a
concrete suggested fix, for the user to approve before deploying.
