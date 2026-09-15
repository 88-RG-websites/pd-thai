// Build-time Google reviews. Configure via the `reviews` block in client.js;
// without it this returns null and the reviews component renders nothing.
//
// The cache (full review history) lives at the REPO ROOT as
// reviews-cache.json — committed, not ignored — so builds only fetch what's
// new. Commit it when a build picks up new reviews (monthly.sh does this).
// Dev/serve builds never hit the network; force that for a production build
// with REVIEWS_OFFLINE=1.
const path = require("path");
const client = require("./client.js");

module.exports = async function () {
  if (!client.reviews) return null;

  // The package is ESM-only; this data file is CJS, hence dynamic import.
  const { getReviews } = await import("@reservationgenie/google-reviews");

  // Pass the whole client.reviews block through (only google_maps_url needs
  // renaming to the package's mapsUrl argument). Future config keys — e.g. a
  // yelp_url when more platforms land — reach the package without this file
  // changing; versions that don't know a key ignore it.
  const { google_maps_url, ...reviewsConfig } = client.reviews;

  return getReviews({
    ...reviewsConfig,
    mapsUrl: google_maps_url,
    name: client.name,
    cachePath: path.join(__dirname, "..", "..", "reviews-cache.json"),
    offline: process.env.ELEVENTY_RUN_MODE !== "build" || Boolean(process.env.REVIEWS_OFFLINE),
  });
};
