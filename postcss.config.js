module.exports = {
  plugins: [
    require("tailwindcss"),
    require("autoprefixer"),
    // Minify the shipped stylesheet — the render-blocking CSS is ~19KB
    // smaller minified, and dev tooling doesn't care.
    require("cssnano")({ preset: "default" }),
  ],
};
