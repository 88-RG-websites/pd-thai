#!/usr/bin/env node
// Serve the theme's Google Fonts from the site itself: `npm run fonts`.
//
// Reads theme.fonts.googleFontsUrl, downloads the Latin woff2 files Google
// serves for it into src/assets/fonts/, and writes src/_data/fontFaces.json,
// which base.njk turns into a preload and inline @font-face rules. A
// stylesheet from fonts.googleapis.com held up first paint from two more hosts
// (on musashi, self-hosting was the largest single homepage gain).
//
// Run it again whenever theme.fonts changes, and commit the result. Until
// then base.njk sees that fontFaces.json names a different URL and falls back
// to the Google stylesheet, so a stale set is never used.
//
// Google Fonts families are licensed for this (SIL OFL or Apache 2.0).
const fs = require("fs");
const path = require("path");
const theme = require("../src/_data/theme.js");

const FONT_DIR = path.join(__dirname, "..", "src", "assets", "fonts");
const DATA_FILE = path.join(__dirname, "..", "src", "_data", "fontFaces.json");
// Google picks the format from the user agent; a current Chrome gets woff2.
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const sourceUrl = theme.fonts && theme.fonts.googleFontsUrl;
  if (!sourceUrl) throw new Error("theme.fonts.googleFontsUrl is not set");

  const response = await fetch(sourceUrl, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) throw new Error(`${sourceUrl}: HTTP ${response.status}`);
  const css = await response.text();

  // One block per subset, style and weight: "/* latin */ @font-face { ... }".
  // A variable family lists each requested weight with the same file, so blocks
  // are grouped by file and their weights become one range.
  const byFile = new Map();
  for (const [, subset, body] of css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*@font-face\s*\{([^}]*)\}/g)) {
    if (subset !== "latin") continue;
    const field = (name) => (body.match(new RegExp(`${name}:\\s*([^;]+);`)) || [])[1];
    const url = (body.match(/url\(([^)]+)\)\s*format\(['"]woff2['"]\)/) || [])[1];
    if (!url) continue;
    const weights = field("font-weight").split(/\s+/).map(Number);
    const face = byFile.get(url) || {
      family: field("font-family").replace(/['"]/g, ""),
      style: field("font-style"),
      unicodeRange: field("unicode-range"),
      weights: [],
      url,
    };
    face.weights.push(...weights);
    byFile.set(url, face);
  }
  if (!byFile.size) throw new Error("no latin woff2 faces in the Google Fonts response");

  fs.mkdirSync(FONT_DIR, { recursive: true });
  const bodyFamily = theme.fonts.body && theme.fonts.body.family;
  const faces = [];
  for (const face of byFile.values()) {
    const low = Math.min(...face.weights);
    const high = Math.max(...face.weights);
    const weight = low === high ? `${low}` : `${low} ${high}`;
    const name = `${slug(face.family)}-${face.style}-${weight.replace(" ", "-")}.woff2`;
    const file = await fetch(face.url);
    if (!file.ok) throw new Error(`${face.url}: HTTP ${file.status}`);
    fs.writeFileSync(path.join(FONT_DIR, name), Buffer.from(await file.arrayBuffer()));
    faces.push({
      family: face.family,
      style: face.style,
      weight,
      unicodeRange: face.unicodeRange,
      file: `/assets/fonts/${name}`,
      // The body text face paints first; preload only that one.
      preload: face.family === bodyFamily && face.style === "normal",
    });
  }

  // Drop files an earlier run wrote for fonts the theme no longer uses.
  const keep = new Set(faces.map((face) => path.basename(face.file)));
  for (const name of fs.readdirSync(FONT_DIR)) {
    if (name.endsWith(".woff2") && !keep.has(name)) fs.unlinkSync(path.join(FONT_DIR, name));
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify({ sourceUrl, faces }, null, 2) + "\n");
  for (const face of faces) {
    const size = fs.statSync(path.join(FONT_DIR, path.basename(face.file))).size;
    console.log(`${face.family} ${face.style} ${face.weight}: ${face.file} (${Math.round(size / 1024)} KB)${face.preload ? ", preloaded" : ""}`);
  }
}

main().catch((error) => {
  console.error(`self-host-fonts: ${error.message}`);
  process.exit(1);
});
