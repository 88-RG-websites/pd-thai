const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const htmlmin = require("html-minifier");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const client = require("./src/_data/client.js");
const time12 = require("./lib/time12.js");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

module.exports = function (eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: client.domain,
    },
  });
  // Minify HTML output directly (instead of @sherby/eleventy-plugin-files-minifier,
  // whose hardcoded sortAttributes/sortClassName reordered attributes in the head)
  eleventyConfig.addTransform("htmlmin", function (content) {
    if (this.page.outputPath && this.page.outputPath.endsWith(".html")) {
      return htmlmin.minify(content, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        decodeEntities: true,
        html5: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeEmptyAttributes: true,
        useShortDoctype: true,
      });
    }
    return content;
  });
  eleventyConfig.addPlugin(eleventyNavigationPlugin);

  // ISO timestamp → "July 27, 2026". Used for review dates
  // (components/reviews.njk); the timezone is the business's own
  // (client.timezone) so a date never shifts a day against the reviewer's.
  eleventyConfig.addFilter("readableDate", (value) => {
    const date = new Date(value);
    if (isNaN(date)) return value;
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: client.timezone,
    }).format(date);
  });
  // "16:00" -> "4:00 pm", so the FAQ answers (src/_data/faq.js) and the
  // schema's opens/closes (both 24h, client.hours) can share one source.
  eleventyConfig.addFilter("time12", time12);

  // NOTE on MUSASHI's `prefixHtmlLinks` filter: not ported. It rewrites
  // root-relative hrefs inside a block of raw HTML (e.g. faq.js's answers)
  // so they respect pathPrefix on a preview build — necessary there because
  // MUSASHI has no EleventyHtmlBasePlugin. This template DOES run that
  // plugin (below), and it already rewrites every real href/src it can
  // parse out of the FINAL rendered HTML, including one spliced in from a
  // data file via `| safe` — components/faq.njk relies on exactly that.
  // Porting the filter and applying it too, as MUSASHI does, double-prefixes
  // those links on a preview build (verified: /site/site/#reserve). The
  // plugin's own comment below already names this rule: filter only what
  // the plugin cannot see (inline background-image, data-* attributes) —
  // faq.js's answers are plain <a href> and don't need it.

  // Rewrites root-relative URLs (/assets, /menus, etc.) to honor pathPrefix,
  // so preview builds nested in a subfolder still resolve their links.
  //
  // It rewrites only real URL attributes it can parse out of the HTML — src,
  // srcset, href. Three kinds of reference are invisible to it and MUST carry
  // an explicit `| url` in the template:
  //
  //   style="background-image: url('{{ card.image | url }}')"   inline CSS
  //   data-src / data-srcset on lazily-promoted images           not URL attrs
  //   data-full-image on gallery thumbnails                      not a URL attr
  //
  // Everything the plugin does see must NOT also be filtered — `| url` on a
  // plain src="" double-prefixes it to /site/site/assets/…. The rule is not
  // "filter everything", it is "filter exactly what the plugin cannot see".
  //
  // Both failure modes are invisible in a default `npm run build` (pathPrefix
  // "/", so a missing prefix is still correct) and only appear on a preview
  // deploy. Check with `npm run build:preview` before shipping.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

  // Every local asset URL in the built HTML gets ?v=<content hash>. The server
  // (server/client/snippets/static-site.conf) caches ?v= URLs for a year and re-checks
  // everything else on each visit, so a deploy that changes a file changes its
  // URL and is live at once. URLs that already carry a query are left alone.
  // The path may or may not carry pathPrefix yet: the base plugin above adds it
  // in its own transform.
  const pathPrefix = process.env.PATH_PREFIX || "/";
  const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
  const localPath = `(?:${escapeRegExp(pathPrefix)}|/)`;
  const assetPath = `assets/[^"'()\\s?#>,]+\\.(?:css|js|png|jpe?g|webp|avif|gif|svg|ico|mp4|webm|woff2?|webmanifest)`;
  const assetUrl = new RegExp(`(["'(=,\\s])(${localPath}(${assetPath}))(?![?\\w])`, "gi");
  // The header 88's menu pages borrow (src/_88/header.njk) names the site's
  // assets by absolute URL: version those in src=, href= and url() too, or the
  // menu pages pair new header markup with a stale styles.css. Absolute URLs
  // anywhere else (og:image, the JSON-LD images) keep a stable address.
  const absoluteAssetUrl = new RegExp(
    `((?:src|href)=["']?|url\\(["']?)(${escapeRegExp(client.domain)}${localPath}(${assetPath}))(?![?\\w])`,
    "gi"
  );
  const assetHashes = new Map();
  const assetHash = (relative) => {
    if (!assetHashes.has(relative)) {
      const file = path.join("src", relative);
      if (fs.existsSync(file)) {
        const digest = crypto.createHash("md5").update(fs.readFileSync(file)).digest("hex");
        assetHashes.set(relative, digest.slice(0, 10));
      } else {
        console.warn(`[assetVersion] no file for /${relative}, left unversioned`);
        assetHashes.set(relative, null);
      }
    }
    return assetHashes.get(relative);
  };
  eleventyConfig.addTransform("assetVersion", function (content) {
    const outputPath = this.page ? this.page.outputPath : arguments[1];
    if (!outputPath || !outputPath.endsWith(".html")) return content;
    const version = (whole, before, url, relative) => {
      const hash = assetHash(relative);
      return hash ? `${before}${url}?v=${hash}` : whole;
    };
    return content.replace(assetUrl, version).replace(absoluteAssetUrl, version);
  });
  // Each CSS and JS version a page names is also kept at _versions/<hash>/<path>.
  // deploy.sh never deletes that folder and the server answers ?v=<hash> from it
  // (server/client/snippets/static-site.conf), so HTML cached elsewhere, like the header
  // 88's menu pages keep for 10 minutes, gets the stylesheet it was built with,
  // not a newer one that may lack the classes it uses.
  eleventyConfig.on("eleventy.after", ({ dir }) => {
    for (const [relative, hash] of assetHashes) {
      if (!hash || !/\.(?:css|js)$/i.test(relative)) continue;
      const from = path.join(dir.output, relative);
      if (!fs.existsSync(from)) continue;
      const to = path.join(dir.output, "_versions", hash, relative);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
    }
  });

  // Passthrough copy for assets
  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy("dist/css/styles.css");

  return {
    dir: {
      input: "src",
      output: "dist",
      includes: "_includes",
      data: "_data",
    },
    // Defaults to "/" for production; preview builds set PATH_PREFIX (e.g.
    // "/site-name/") so the site works when served from a subfolder.
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    dataTemplateEngine: "njk",
  };
};
