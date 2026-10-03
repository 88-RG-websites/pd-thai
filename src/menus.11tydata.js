// With client.menuSubdomain on, the menus live on 88's menu.<domain> pages and
// this iframe page is not written at all; src/menus-moved.njk takes /menus/
// over as a redirect so old links, QR codes and the GBP menu link still land.
// Same gate shape as events.11tydata.js. See menus.md.
module.exports = {
  eleventyComputed: {
    permalink: (data) => (data.client.menuSubdomain ? false : '/menus/'),
  },
};
