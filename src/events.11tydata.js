// The events page is opt-in. It needs two things to exist:
//
//   theme.components.events   the client actually takes large parties, and
//   client.id                 the 88restaurants account whose party-inquiry
//                             embed the page is built around
//
// Without both, `permalink: false` stops Eleventy writing the file at all —
// no /events/ in dist, no sitemap entry, no dead nav target. Frontmatter can't
// express this because Eleventy does not render frontmatter strings, so the
// gate lives here where it can read the data cascade.
module.exports = {
  eleventyComputed: {
    permalink: (data) =>
      data.theme.components.events && data.client.id ? '/events/' : false,
  },
};
