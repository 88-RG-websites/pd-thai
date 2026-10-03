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

// { day, lunch, dinner } rows are already guest-facing strings
// (client.hours.schedule) — no formatting needed, just listed.
// SITE PATCH (template drift, reported): the lunch/dinner labels are only true
// when a row can hold both. PD Thai is open one window all day (10am-3am,
// written in the `lunch` slot), so the label is dropped unless some row has a
// lunch AND a dinner window.
const labelWindows = client.hours.schedule.some((row) => row.lunch && row.dinner);
const scheduleLines = client.hours.schedule
  .map((row) => {
    const parts = [];
    if (row.lunch) parts.push(labelWindows ? `lunch ${row.lunch}` : row.lunch);
    if (row.dinner) parts.push(labelWindows ? `dinner ${row.dinner}` : row.dinner);
    return `<strong>${row.day}:</strong> ${parts.join(', ')}`;
  })
  .join('<br>');

const items = [];

// Gated on `id`, not `urls.reserve` — that URL is a template literal built
// from `id`, so with `id` blank it is still a non-empty (and broken)
// string. `id` is the real signal the 88restaurants reservation widget
// (and the /#reserve anchor it renders at) exists at all.
if (client.acceptsReservations && client.id) {
  const phoneLink = client.phone ? `<a href="tel:${client.phone}">${client.phone}</a>` : '';
  const note = client.reserve && client.reserve.note ? client.reserve.note.replace('{phone}', phoneLink) : '';
  items.push({
    question: `Does ${client.name} take reservations?`,
    answer: `<p>Yes. ${client.name} takes reservations online through the <a href="/#reserve">reservation widget</a>.${note ? ` ${note}` : ''}</p>`,
  });
}

if (client.hours.windows.length) {
  items.push({
    question: `What are ${client.name}'s hours?`,
    answer: `<p>${client.name} is open ${time12(client.hours.opens)} to ${time12(client.hours.closes)}${client.hours.schedule.length > 1 ? ', with hours varying by day' : ''}:</p><p>${scheduleLines}</p>`,
  });
}

if (client.cuisine) {
  items.push({
    question: `What kind of food does ${client.name} serve?`,
    answer: `<p>${client.name} serves ${client.cuisine} in ${client.address.city}, ${client.address.state}. <a href="${client.urls.menus}">See the full menu</a> for what's currently on offer.</p>`,
  });
}

if (client.id) {
  // Off the subdomain, the menus page is the ordering frame. On it, the menu
  // pages only show the menu, so the link goes to the order page itself.
  const orderUrl = client.menuSubdomain ? client.urls.order : client.urls.menus;
  items.push({
    question: `Can I order online from ${client.name}?`,
    answer: `<p>Yes. ${client.name} takes online orders. <a href="${orderUrl}">Order online</a> to see the current menu and place an order.</p>`,
  });
}

if (theme.components.events && client.id && client.events) {
  items.push({
    question: `Can ${client.name} accommodate large parties or private events?`,
    answer: `<p>Yes. ${client.events.lede || 'Send the date and headcount and the team will follow up.'} <a href="/events/">Send a party inquiry</a>.</p>`,
  });
}

if (client.addressLine) {
  items.push({
    question: `Where is ${client.name} located?`,
    answer: `<p>${client.name} is ${client.address.street ? 'at' : 'based in'} ${client.addressLine}.${client.googleMapsUrl ? ` <a href="${client.googleMapsUrl}" target="_blank" rel="noopener">Get directions</a>.` : ''}</p>`,
  });
}

if (theme.components.employment && client.id && client.employment) {
  items.push({
    question: `Is ${client.name} hiring?`,
    answer: `<p>${client.employment.pitch || `${client.name} is always interested in hearing from people who want to join the team.`} <a href="/employment/">See open roles and apply</a>.</p>`,
  });
}

module.exports = items;
