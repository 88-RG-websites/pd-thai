// The employment page is opt-in, on the same pattern as /events/. It needs:
//
//   theme.components.employment   the client is actually hiring through the
//                                 88restaurants form, and
//   client.id                     the account whose employment_submissions
//                                 embed the page is built around
//
// Without both, `permalink: false` stops Eleventy writing the file at all — no
// /employment/ in dist, no sitemap entry, no dead nav or footer target.
// Frontmatter cannot express this because Eleventy does not render frontmatter
// strings, so the gate lives here where it can read the data cascade.
module.exports = {
  eleventyComputed: {
    permalink: (data) =>
      data.theme.components.employment && data.client.id ? '/employment/' : false,
  },
};
