// The other half of menus.11tydata.js: /menus/ is this redirect only while
// client.menuSubdomain is on.
module.exports = {
  eleventyComputed: {
    permalink: (data) => (data.client.menuSubdomain ? '/menus/' : false),
  },
};
