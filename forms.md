# 88restaurants on a client site: forms, widget, popups, order footer

One script draws everything the platform puts on a client site. This file is
the contract for it: how it works, what a new site sets, and how to convert a
site that still carries the older iframes and body-injection scripts.

## How it works

`base.njk` ships one tag, last in `<body>`, whenever `client.id` is set:

```html
<script src="https://88restaurants.com/embed/88.js" data-restaurant="<id>" async></script>
```

`88.js` reads the restaurant id off its own tag and then:

- **Draws every form tag on the page.** A form is one empty div placed where
  the form goes; the script fills it from the restaurant's Forms settings.

  ```html
  <div data-88-form="<slug>"></div>
  ```

  The slug is per form and per restaurant. A form made from the admin's own
  template gets its default: `contact-us`, `email-list`, `party-inquiry`,
  `job-application`. Anything else, read it from the admin (Settings →
  Website → Forms → the form → its tag). Either way it goes in
  `client.forms`; templates never hardcode one. A slug that names no active form draws a short
  "unavailable" line in its place, so a wrong slug is visible on the page.
- **Draws the reservation widget** wherever `<div data-88-widget></div>` sits.
  No widget id any more: the script knows the restaurant. The widget caps
  itself at 340px and paints its own card from the Widget settings. When the
  restaurant has no bookable schedule it shows "Online booking is unavailable"
  in the same box: an admin fix, not a site one.
- **Adds the restaurant's popups and sticky order footer by itself**, on every
  page that carries the script, whenever the admin has them switched on. There
  is nothing to paste for either, and nothing to remove to turn them off: the
  client does that from the admin without a deploy. A site that must never show
  one adds `data-88-popups="off"` or `data-88-footer="off"` to the script tag.
- **Counts the site visit.** One Client Visit beacon per page view, the number
  the website-visit reports use. The older `popup.js` produced this as a side
  effect of its own fetch, which is why it had to stay shipped even on accounts
  with popups off; `88.js` does it directly, so `popup.js` goes.
- **Works on preview and localhost.** The form, site and visit endpoints answer
  CORS `*`. Nothing here is origin-allowlisted the way the old discount button
  was, so what you see on preview is what production shows.

Every tag can also open its content in a dialog instead of drawing it inline:
`data-88-layout="button"` (a themed button in the tag's place),
`"tab"` (a tab pinned to the screen edge) or `"floating"` (a floating button),
with `data-88-position` for the two fixed ones and `data-88-label` to override
the button text. `client.questionsTab` is the template's one built-in use: a
contact tab on every page, off unless set.

### What the form draws, and what the site frames

The form paints its own card: background, border, corners, padding, field and
button colours, font (the admin's "Match my site" inherits the page font). So a
form tag needs **no wrapper**, and the wrappers the old iframes needed — the
white card that hid the embed's square corners, the fixed `height`,
`scrolling="no"`, the `min-h-[…]` that matched the admin's number — all go. The
only wrapper the template keeps is `contact.njk`'s card, which is the site's
own frame around the form, not a fix for it.

While the form loads the tag holds a skeleton at the form's height, so nothing
below it jumps; the host is `display: grid` for the same reason. Colours and
fonts are the client's Forms settings, not `theme.js`: if they fight the
palette, that is an admin change, flagged in the report.

### Desktop layout: the slot has to be wide enough

The form lays its fields **two per row above 575px of its own width** and one
per row below (a container query on the form, not a viewport breakpoint). A
slot that lands under 576px at desktop gives a phone layout on a laptop, and
nothing looks broken — it just stacks. The template's slots at 1440:

| Slot | Width at lg | Why |
| --- | --- | --- |
| `contact.njk` | ~700px | two of three columns, inside the card's `p-10` |
| `contact_with_image` / `_with_map` | ~600px | `lg:px-12 2xl:px-20` — the old `px-24` left 528px |
| `contact_with_parallax` | 640px | panel is `w-full max-w-3xl`; a flex item without `w-full` shrank to its content and left 461px |
| `newsletter.njk` | ~700px | three of five columns; a half column sat right on the line |
| `events-inquiry.njk` | ~800px | two of three columns |
| `employment.njk` | ~650px | seven of twelve columns |

Restyling a slot: keep it at or above 576px from `lg`, or accept a one-column
form there on purpose. Measure the tag's width in the browser, don't guess
from the grid.

### z-index

The order footer is `position: fixed` at `z-index: 99999`, the same number the
old discount bar used. Popups, dialogs and the tab launcher sit at
`2147483000+`, above every layer a site defines. `mobile-menu.njk` still wins
while open because a `<dialog>` shown with `showModal()` renders in the
browser's top layer; a header variant that swaps the dialog for a positioned
div gives that up (see CLAUDE.md).

### Fallback for a builder that strips scripts

Not needed on this template. For a Wix/Squarespace-type host that drops
`<script>` tags, the admin's form page offers an iframe snippet of the hosted
form (`/restaurants/<id>/event_forms/<slug>`) plus a height listener.

## Setting up a new site

1. **`client.id`** is the restaurant's 88restaurants id (or slug). Unknowable
   from scraping; `''` until the client gives it, and everything below is
   skipped while it is blank.
2. **In the admin, Settings → Website:**
   - **Forms** — one form per slot the site uses, from the templates there:
     Contact us (`contact`), Email sign-up (`newsletter`), a party form for
     `/events/`, a job application for `/employment/`. Copy each form's slug
     (the defaults are `contact-us`, `email-list`, `party-inquiry`,
     `job-application`).
     Set the theme (font "Match my site", colours) to the site's palette.
   - **Reservation widget** — needs a schedule and table sizes before it is
     "Ready"; until then the reserve section draws the unavailable message.
   - **Popups** and **Order footer** — whatever the client wants; nothing on
     the site changes either way.
3. **`client.forms`** — the four slugs. Delete a key whose page is off; the
   `/events/` and `/employment/` tags only render when their
   `theme.components.*` flag is on.
4. **Build and look:** `npm run build`, then

   ```bash
   grep -o '<div[^>]*data-88-[^>]*>' dist/index.html
   grep -o 'embed/88.js[^>]*>' dist/index.html      # data-restaurant="<id>"
   ```

   and open the site (`npm run serve` is fine — preview works). Each form
   draws with the client's colours; a slug typo draws the unavailable line.
5. Run the pre-deploy checklist §8 and, after cutover, post-deploy §7.

## Converting a site that still uses the older embeds

**This is automated now.** `scripts/upgrade/run.mjs` (migration `040 88js`,
run via `.claude/skills/upgrade-client-site/SKILL.md`) does the swap below
for every "actually rendered" component, atomically, gated on each form slug
answering 200 at `/api/event_forms/<slug>` — it refuses a partial swap rather
than leaving old and new embeds on the page together. The steps that follow
are what it automates (read them to understand what to check by hand when a
restyled component conflicts and becomes an agentStep) and what's still
manual: creating the forms in the 88 admin in the first place ("Setting up a
new site" §2, above) is a human, admin-side action no tool here can do.

Client repos are detached copies, so each one used to be converted entirely
by hand. The whole change is: one script in, every iframe and body-injection
out, wrappers gone, slots wide enough.

1. **Find everything the old way shipped:**

   ```bash
   git grep -n 'contact_forms\|email_list_forms\|party_inquiry_forms\|employment_submissions\|/widgets/\|popup.js\|discount_button\|marketing-popup\|reservationWidgetId\|widgetWidth' -- src
   ```

2. **`src/_data/client.js`:** delete `reservationWidgetId`; delete
   `urls.reservationWidget`, `contactForm`, `newsletterForm`,
   `partyInquiryForm`, `employmentForm`, `popupScript`, `discountButton`; add
   `urls.embedScript`, the `forms` block and the `forms` export; drop
   `reserve.widgetWidth` / `widgetHeight`. Copy the shapes from this repo's
   `client.js`.
3. **`base.njk`:** add the loader block (this repo's `base.njk`, right after
   `attribution.js`). `attribution.js` stays — it is a different thing.
4. **Swap each tag:**

   | Was | Becomes |
   | --- | --- |
   | `<iframe src="{{ client.urls.contactForm }}" …>` | `<div data-88-form="{{ client.forms.contact }}"></div>` |
   | `<iframe src="{{ client.urls.newsletterForm }}" …>` | `<div data-88-form="{{ client.forms.newsletter }}"></div>` |
   | `<iframe src="{{ client.urls.partyInquiryForm }}" …>` | `<div data-88-form="{{ client.forms.partyInquiry }}"></div>` |
   | `<iframe src="{{ client.urls.employmentForm }}" …>` | `<div data-88-form="{{ client.forms.employment }}"></div>` |
   | `<iframe id="widget" src="{{ client.urls.reservationWidget }}" …>` | `<div class="w-full max-w-[340px]" data-88-widget></div>` |
   | `<script id="marketing-popup-script" … popup.js>` | nothing |
   | the `discount_button` fetch script | nothing |

   The ordering iframe on `/menus/` (`urls.menusFrame`) is not a form and
   stays.
5. **Remove the wrappers the iframes needed** — the corner-cropping card
   around the contact and newsletter embeds, `height="…"`, `scrolling="no"`,
   `min-h-[…]` floors, load-bearing padding comments — and widen any slot
   under 576px at `lg` (the table above lists the template's numbers; a
   client's restyled sections need measuring).
6. **Take both old scripts out in the same deploy as the new one goes in.**
   `88.js` holds back its own order footer while the legacy
   `.cta-footer-container` is on the page, so a half-converted site keeps the
   old bar and never shows the new one; and an old `popup.js` beside a live
   new popup shows the guest two.
7. **Build, then prove the negative with a control:**

   ```bash
   npm run build
   grep -l 'popup.js\|discount_button\|contact_forms\|email_list_forms\|/widgets/' dist/*.html dist/*/*.html   # nothing
   grep -c 'data-88-' dist/index.html                                                                            # > 0
   ```

8. Deploy; then post-deploy §7 on the live page.

## Verifying on a live page

In the browser console on the live (or preview) page:

```js
window.EightyEight.restaurant                        // the id the script read
document.querySelectorAll('[data-88-mounted]').length // every form/widget tag drew
await window.EightyEight.site                        // { popups, footer, widget } the admin has on
document.querySelector('[data-88-footer]')           // the order footer, when it is on
document.querySelector('[data-88-popup]')            // a popup, once its rules fire
```

`88.js` itself is a redirect to the current build, so `curl -sI
https://88restaurants.com/embed/88.js` answers 302, not 200; follow it with
`-L` to see the script.
