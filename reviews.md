# Build-time Google reviews

An opt-in section that renders the business's Google reviews into the static
HTML at build time. Off unless `client.reviews` is set.

## Turning it on

The `google-reviews` skill runs this end to end (Part A). By hand:

Uncomment `client.reviews` in `src/_data/client.js`. Its `google_maps_url` is
the full maps.google.com address-bar URL, the one carrying a `!1s0x…:0x…`
segment, not a short link. That switches on `components/reviews.njk`, rendered
between visit and newsletter on `bg-secondary-50`.

## Where the data comes from

`src/_data/reviews.js` calls the private `@reservationgenie/google-reviews`
package, and returns `null` without a `client.reviews` block, which renders
nothing.

- Production builds (`ELEVENTY_RUN_MODE === "build"`) fetch what's new.
- Dev and serve builds render from the cache.
- `REVIEWS_OFFLINE=1` keeps a production build offline too.

The full review history lives at the **repo root** as `reviews-cache.json` and
is committed. Never put it in `src/_data/`, where Eleventy would ingest it as a
global.

A first build with no seeded cache backfills the whole history, which takes
minutes for a well-reviewed place. Sites migrated from the old server pipeline
get seeded from `rg@104.237.128.61:/var/www/review-scraper/data/<id>.json`.
New sites must also be registered for the monthly refresh cron, once they're
live on production. `.claude/skills/google-reviews/` does both parts: turning
reviews on, and registering the site after launch.

**A `[reviews] FAILED:` line in build output means the scrape broke.** Stop and
investigate. Never ship a silently stale or empty section.

## The component

`assets/js/reviews.js` (wired in `main.js`) drives the Read-more clamp and the
View-more button. It needs `id="reviews"`, the `data-review-*` attributes, the
`review-text-N` ids and the `line-clamp-5` / `hidden` classes kept intact.

Review text renders through `escape | nl2br`, not the package reference's
`whitespace-pre-line`: the htmlmin transform's `collapseWhitespace` flattens
literal newlines in text nodes, so only a `<br>` survives to the shipped HTML.
Dates format through the `readableDate` filter in `.eleventy.js`, in
`client.timezone`.

## No review markup

Do **not** add schema.org `Review` / `AggregateRating` markup. Reviews sourced
from Google must not be marked up (Google structured-data policy).
