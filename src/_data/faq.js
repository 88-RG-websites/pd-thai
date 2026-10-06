// Homepage FAQ — the single source for both the visible accordion
// (components/faq.njk) and the FAQPage JSON-LD it emits alongside it. Never
// duplicate an answer into the template: Google treats visible copy and
// schema that disagree as a structured-data violation, and the whole point
// of this block is that an answer engine (ChatGPT, Gemini, Perplexity,
// Copilot) can quote it verbatim.
//
// `answer` is HTML. Google allows a small tag set inside acceptedAnswer.text
// — <p> <br> <b> <strong> <i> <em> <ul> <ol> <li> <a> <div> <h1>-<h6> — and
// the same string is dumped straight into the JSON-LD, so keep to those and
// never introduce a literal `</script>`.
//
// Writing rules, because these answers are aimed at answer engines as much
// as at readers:
//   1. Open with a direct yes/no. Answer engines quote the first sentence.
//   2. Name the business in that first sentence — the sentence gets
//      extracted away from its page and has to identify the business alone.
//   3. Then describe what is on offer and link to where a guest acts on it.
//   4. Claim nothing client.js does not already say. Every fact below reads
//      from client.js/theme.js rather than being typed here, so an answer
//      can't go stale the way MUSASHI/docs/restaurant-schema.md describes
//      ("the schema told Google the kitchen served an hour later than it
//      does") and can't repeat a number client.js changes independently.
//   5. The FAQ is the site's search-keyword vehicle. A client's target phrases
//      ("italian restaurants near wall street", "private dining in the
//      financial district") land here, each once, in the answer whose
//      question a guest would really type it into, worded the way a person
//      would say it. Never a stuffed list, never a phrase twice, never a
//      claim client.js can't back. Three client.js hooks carry them:
//      `neighborhood` (spliced into the cuisine and location answers),
//      `faq.extra` (extra questions, appended) and `faq.extra[].replaces`
//      (rewords a generated question in place, e.g. `replaces: 'events'`).
//
// NO PRICES OR ITEM COUNTS. The menu itself — client.urls.menus, whether
// that's the ordering iframe or 88's menu subdomain pages (menus.md) — is
// the one place those live and stay current; a number typed into an answer
// here goes stale the moment the kitchen reprices. Where the site's own copy
// already states a figure (client.reserve.note, client.events.lede), this
// file quotes that field rather than retyping the number, so the two can
// never drift apart.

const client = require('./client.js');
const theme = require('./theme.js');
const time12 = require('../../lib/time12.js');

// "Nadine's" + 's would read "Nadine's's". A name already in possessive form
// ("Nadine's") stays as it is, a plural-looking one ("Dos Amigos") takes just
// the apostrophe, anything else takes 's.
const possessive = (name) => {
  if (/['’]s$/i.test(name)) return name;
  return /s$/i.test(name) ? `${name}'` : `${name}'s`;
};

// { day, lunch, dinner } rows are already guest-facing strings
// (client.hours.schedule) — no formatting needed, just listed. A day with
// both windows names each; a day with one is just the time, because the
// schedule has no key for "open all day" and the one window sits under
// whichever key the client picked, which the meal word would then misname.
const scheduleLines = client.hours.schedule
  .map((row) => {
    const windows = [row.lunch, row.dinner].filter(Boolean);
    const parts = windows.length > 1 ? [`lunch ${row.lunch}`, `dinner ${row.dinner}`] : windows;
    return `<strong>${row.day}:</strong> ${parts.join(', ')}`;
  })
  .join('<br>');

// Every generated entry carries a `key` so a client's `faq.extra` entry can
// reword it in place (`replaces`); the key is stripped before export.
const items = [];

// Gated on `id`, not `urls.reserve` — that URL is a template literal built
// from `id`, so with `id` blank it is still a non-empty (and broken)
// string. `id` is the real signal the 88restaurants reservation widget
// (and the /#reserve anchor it renders at) exists at all.
if (client.acceptsReservations && client.id) {
  const phoneLink = client.phone ? `<a href="tel:${client.phone}">${client.phone}</a>` : '';
  const note = client.reserve && client.reserve.note ? client.reserve.note.replace('{phone}', phoneLink) : '';
  items.push({
    key: 'reservations',
    question: `Does ${client.name} take reservations?`,
    answer: `<p>Yes. ${client.name} takes reservations online through the <a href="/#reserve">reservation widget</a>.${note ? ` ${note}` : ''}</p>`,
  });
}

if (client.hours.windows.length) {
  items.push({
    key: 'hours',
    question: `What are ${possessive(client.name)} hours?`,
    answer: `<p>${client.name} is open ${time12(client.hours.opens)} to ${time12(client.hours.closes)}${client.hours.schedule.length > 1 ? ', with hours varying by day' : ''}:</p><p>${scheduleLines}</p>`,
  });
}

if (client.cuisine) {
  const where = client.neighborhood ? `${client.neighborhood}, ` : '';
  items.push({
    key: 'cuisine',
    question: `What kind of food does ${client.name} serve?`,
    answer: `<p>${client.name} serves ${client.cuisine} in ${where}${client.address.city}, ${client.address.state}. <a href="${client.urls.menus}">See the full menu</a> for what's currently on offer.</p>`,
  });
}

// Gated on `onlineOrdering` (lib/site.js: the 88 id unless a client sets it
// false). A site whose live pages never mention ordering must not have the
// FAQ, which answer engines quote, say it takes online orders.
if (client.id && client.onlineOrdering) {
  // Off the subdomain, the menus page is the ordering frame. On it, the menu
  // pages only show the menu, so the link goes to the order page itself.
  const orderUrl = client.menuSubdomain ? client.urls.order : client.urls.menus;
  items.push({
    key: 'order',
    question: `Can I order online from ${client.name}?`,
    answer: `<p>Yes. ${client.name} takes online orders. <a href="${orderUrl}">Order online</a> to see the current menu and place an order.</p>`,
  });
}

if (theme.components.events && client.id && client.events) {
  items.push({
    key: 'events',
    question: `Can ${client.name} accommodate large parties or private events?`,
    answer: `<p>Yes. ${client.events.lede || 'Send the date and headcount and the team will follow up.'} <a href="/events/">Send a party inquiry</a>.</p>`,
  });
}

if (client.addressLine) {
  items.push({
    key: 'location',
    question: `Where is ${client.name} located?`,
    answer: `<p>${client.name} is ${client.address.street ? 'at' : 'based in'} ${client.addressLine}${client.neighborhood ? `, in ${client.neighborhood}` : ''}.${client.googleMapsUrl ? ` <a href="${client.googleMapsUrl}" target="_blank" rel="noopener">Get directions</a>.` : ''}</p>`,
  });
}

if (theme.components.employment && client.id && client.employment) {
  items.push({
    key: 'hiring',
    question: `Is ${client.name} hiring?`,
    answer: `<p>${client.employment.pitch || `${client.name} is always interested in hearing from people who want to join the team.`} <a href="/employment/">See open roles and apply</a>.</p>`,
  });
}

// Client-authored questions (client.faq.extra, [{ question, answer, replaces? }]).
// `replaces` names a generated entry's key and swaps it in place; when that
// entry isn't generated (no events page, no 88 id) the reword is dropped with
// it, because its answer links to the very thing that is missing. Anything
// without `replaces` is appended after the generated entries.
const extra = ((client.faq && client.faq.extra) || []).filter((e) => e && e.question && e.answer);
const reworded = new Map(extra.filter((e) => e.replaces).map((e) => [e.replaces, e]));

module.exports = items
  .map((item) => reworded.get(item.key) || item)
  .concat(extra.filter((e) => !e.replaces))
  .map(({ question, answer }) => ({ question, answer }));
