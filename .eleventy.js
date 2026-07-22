const { EleventyHtmlBasePlugin } = require("@11ty/eleventy");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const htmlmin = require("html-minifier");
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");

module.exports = function (eleventyConfig) {
  // Add plugins
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: "https://pdthaiaustin.com",
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
  // Rewrites root-relative URLs (/assets, /menus, etc.) to honor pathPrefix,
  // so preview builds nested in a subfolder still resolve their links.
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

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
