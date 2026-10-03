// Facts about the build itself, as opposed to the client (client.js) or the
// visual theme (theme.js): whether this is a preview build, and whether it is
// the production build that deploys to the live domain.
//
// `npm run build:preview` sets PATH_PREFIX to a non-root path (package.json)
// so the site works nested under a subfolder on the preview server; a plain
// `npm run build` leaves it "/". base.njk reads `build.preview` to force
// `noindex, nofollow` on every page of a preview build, since a subfolder
// copy of the site must never compete with the production domain in search.
//
// `production` is a plain `npm run build`: not `serve`/`watch` on localhost
// and not a preview. Anything that must reach only real visitors (the GA tag)
// checks it, so dev and preview traffic never lands in the client's reports.
const preview = (process.env.PATH_PREFIX || '/') !== '/';

module.exports = {
  preview,
  production: process.env.ELEVENTY_RUN_MODE === 'build' && !preview,
};
