---
name: google-reviews
description: >
  Build-time Google reviews for a client site, in two parts run at different
  times. "Turn on" (any time, usually during 2-site-build): find the Maps URL,
  enable client.reviews, backfill and commit reviews-cache.json. "Register"
  (only after the human production deploy): add the site to the web server's
  monthly reviews cron. Runs in the client repo. Use when asked to "add
  reviews", "set up Google reviews", "put <client> on the reviews cron", or
  when a BUILD.md follow-up or the post-deploy checklist points here.
---

# Google reviews: turn on, then register

Reviews come from the private `@reservationgenie/google-reviews` package
(github.com/88-RG-websites/review_scraper), already a dependency of every
template site. A production build scrapes what is new since the last run into
`reviews-cache.json` at the repo root, and `components/reviews.njk` renders it
into the static HTML. `reviews.md` is the contract. Read it first.

Nothing refreshes by itself: a site's reviews are only as new as its last
production build. The web server rebuilds and redeploys every **registered**
site on the 3rd of each month at 06:17 UTC:

```
17 6 3 * * $HOME/bin/server-monthly.sh $HOME/sites/reviews-sites.txt 2>&1 | tee -a $HOME/logs/reviews-monthly.log
```

That crontab line is installed once for the whole server and already exists.
Setting up the cron for one site means registering it on that list (Part B).
Never add a crontab line per site.

The two parts are separate on purpose. Part A is ordinary content work and
belongs in the build. Part B hands the site's production webroot to an
unattended monthly rebuild, so it waits until the site is finished and live.

## Part A · Turn on (client repo, any phase)

1. **The Maps URL.** Search the business on maps.google.com, open its place
   card, and copy the address-bar URL. It must contain a `!1s0x…:0x…`
   segment. Short share links (`maps.app.goo.gl`) and `?cid=` URLs don't
   carry one. `client.googleMapsEmbedUrl` often has the same `0x…:0x…` pair,
   so use it to check you have the right place, not as the URL. Then verify
   the URL:

   ```bash
   npx google-reviews-verify "<maps url>"
   ```

   It fetches one page and prints the three newest reviews. Read them: a
   wrong business, or another location of the same chain, is the mistake to
   catch here.
   No listing at all is a `BLOCKING` question for the user. Never guess
   the URL.

2. **Seed from the old pipeline**, when the restaurant was on the old
   server-side widget. Check for a data file first:

   ```bash
   ssh rg@104.237.128.61 'ls /var/www/review-scraper/data/'
   scp rg@104.237.128.61:/var/www/review-scraper/data/<id>.json reviews-cache.json
   ```

   With no file, skip this step. The first build backfills the whole history.

3. **`client.js`**: uncomment the `reviews` block and fill in
   `google_maps_url`. Keep the block's `display` defaults unless the user or
   the design says otherwise (keep `max_reviews` above 9, as the comment
   explains). A quote-slider design wants `min_text_length: 60` or so. Write
   the `eyebrow` and `title` per `content.md`.

4. **Build online** (not `serve`, which never scrapes) and read the sentinel:

   ```bash
   npm run build 2>&1 | grep '\[reviews\]'
   ```

   - `[reviews] OK: <name> — N new (T total)` is the result you want. A
     first backfill of a well-reviewed place takes minutes.
   - `[reviews] FAILED:` means stop. The build succeeds anyway and renders
     from the cache (or nothing), which is exactly how a stale section ships
     unnoticed. A listing with **zero reviews** also reports FAILED. Wire it
     anyway: the section renders nothing until the first review lands, then
     backfills itself. Note it in BUILD.md.
   - `[reviews] WARN: … duplicate review(s)` means running
     `npx google-reviews-dedupe reviews-cache.json --fix` and building again.

5. **Check the output**: grep `dist/index.html` for one reviewer's name, and
   make sure no `Review`/`AggregateRating` JSON-LD went in (Google's policy,
   `reviews.md`). The section adds a ground to the page. Check the sequence
   in `template-map.md`, and if phase 4 has already run, screenshot the
   section at 375 and 1440.

6. **Commit** `client.js` and `reviews-cache.json` together, then push. The
   cache is the review history and must always be committed. It never goes
   in `src/_data/` or `.gitignore`.

7. **BUILD.md**: a Decisions line (the Maps URL, the display settings) and
   this Follow-up, which phase 5's report carries forward:
   `After the production deploy: /google-reviews Part B (monthly cron).`

## Part B · Register for the monthly cron (after production)

### Gates: all must hold, otherwise stop and say which one failed

- **The site is live on production, deployed by a human.** `PROD_DOMAIN` in
  `deploy.sh` is set, and the live page carries the section:
  `curl -s https://<domain>/ | grep -c 'id="reviews"'` returns 1 or more.
  A preview URL does not count. Registering a preview-only site makes
  the cron push the build to production.
- **Part A is done**: `client.reviews` is set and `git ls-files
  reviews-cache.json` lists the file.
- **Everything is pushed.** `git status --porcelain` is empty and
  `git rev-list @{u}..HEAD` prints nothing. The cron builds from
  `origin/main` and rsyncs over the live webroot, so unpushed work gets
  overwritten on the 3rd.
- **The webroot exists** under the name the cron will resolve from `PROD_DEST`:
  `ssh rg@104.237.128.61 'test -d /var/www/<PROD_DOMAIN>/_site && echo ok'`.
- **The repo is on GitHub** under `88-RG-websites`. The server's key
  (`rg-server-reviews-cron`) reads and writes repos there.

### Confirm with the user

Registering puts the site on a schedule of unattended production deploys.
Say that plainly and wait for a yes: *"From the 3rd of next month the server
rebuilds `<repo>` from origin/main and deploys it to `<domain>` monthly, and
commits new reviews to the repo. Once it's registered, only deploy pushed
work. Register it?"*

### Register

```bash
ssh rg@104.237.128.61
grep -qx /home/rg/sites/<repo> ~/sites/reviews-sites.txt && echo ALREADY-LISTED
git clone git@github.com:88-RG-websites/<repo>.git ~/sites/<repo>
cd ~/sites/<repo> && npm install --no-audit --no-fund
```

Verify the server can build it **without deploying** (the full
`server-monthly.sh` run also rsyncs to production, so that stays the user's
call):

```bash
cd ~/sites/<repo> && npm run build 2>&1 | grep '\[reviews\]'
git checkout -- . && git status --porcelain     # leave the clone clean
```

Expect `OK`. If the verification build fetched new reviews, the checkout
discards them and the first cron run fetches them again. A dirty clone
would make the cron's `git pull --ff-only` fail. Then add the site to the
list:

```bash
echo /home/rg/sites/<repo> >> ~/sites/reviews-sites.txt
crontab -l | grep server-monthly     # the one shared entry is still there
```

If the crontab line is missing, stop. Its one-time install is in `readme.md`
("What the server runs") and `server/README.md` in the template, and the
user sets it up.

### Record

- The client repo's `BUILD.md`: close the follow-up, with the date, in the
  Log.
- `review_scraper`'s `ROLLOUT.md` is the fleet tracker. With the user's OK,
  add or update the site's row there (`done`, the date, any notes such as
  "0 reviews, FAILED until the first lands") and commit to its `main`, as its
  history does.

## Health and troubleshooting

- **The log is the only alert.** Nothing emails. Each run appends a summary
  table to `~/logs/reviews-monthly.log` on the server
  (`ssh rg@104.237.128.61 tail -40 ~/logs/reviews-monthly.log`). Per-site
  build logs are in the `/tmp/reviews-monthly.*` directory the summary names.
- `FAILED … git pull failed` usually means the server clone diverged from
  origin, for example after a force-push or a laptop commit that rewrote
  history. Look at `git -C ~/sites/<repo> status` and `git log` before
  resetting anything, because a local commit there may be a cache update
  that never got pushed.
- `FAILED … deployed with stale reviews` means the scrape broke. The site
  still shipped with its last-good cache. Fix it once in `review_scraper`,
  tag a release, and bump the `#vX.Y.Z` ref in the template's
  `package.json`, which reaches clients on upgrade.
- `FAILED … webroot not found` means `PROD_DEST`/`PROD_DOMAIN` in the repo's
  `deploy.sh` doesn't resolve to a directory under `/var/www/`.
- Taking a site off the cron: delete its line from `reviews-sites.txt`. The
  clone can stay. To see which repos are listed across the org, copy the list
  down and run `node scripts/upgrade/fleet-status.mjs --cron-list <copy>` in
  the template checkout.
