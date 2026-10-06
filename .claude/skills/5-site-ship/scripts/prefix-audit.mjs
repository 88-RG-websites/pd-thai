#!/usr/bin/env node
// Audit a path-prefixed build before a preview deploy.
// Run from the site repo after `npm run build:preview` (or `./deploy.sh preview`, which leaves that
// build in dist):
//   node .claude/skills/5-site-ship/scripts/prefix-audit.mjs <SITE_NAME> [dist]
// A legacy port adds LIVE=<copy of the live webroot> to sort missing CSS targets into a copy that was
// missed ("LIVE HAS IT") and dead legacy CSS ("missing on live too").
// Flags, per file:
//   unprefixed  a root path (/x) the base plugin did not rewrite: inline style url(), an inline
//               script string, a meta refresh, a legacy CSS url(/x) or a JS "/assets/…" string
//   doubled     /<slug>/<slug>/… (a `| url` on a real src/href)
//   missing     a relative url() in a stylesheet whose file is not in dist
// Control: the count of correctly prefixed refs. 0 means this was a root build, not a preview one.
import fs from 'node:fs';
import path from 'node:path';

const [slug, DIST = 'dist'] = process.argv.slice(2);
if (!slug) { console.error('usage: prefix-audit.mjs <slug> [dist]'); process.exit(2); }
if (!fs.existsSync(DIST)) { console.error(`no ${DIST}/ here; run from the client repo after build:preview`); process.exit(2); }
const P = `/${slug}/`;
const LIVE = process.env.LIVE;
const SKIP = /^(_88|_versions)\//; // 88 serves the _88 fragments itself; _versions is a marker

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const files = walk(DIST).map((f) => path.relative(DIST, f)).filter((f) => !SKIP.test(f));

const problems = [];
let prefixed = 0;
const check = (v, where) => {
  v = v.trim().replace(/&amp;/g, '&');
  if (!v.startsWith('/') || v.startsWith('//')) return;
  if (v.startsWith(P + slug + '/')) problems.push(`doubled     ${v}  (${where})`);
  else if (v.startsWith(P) || v === P.slice(0, -1)) prefixed++;
  else problems.push(`unprefixed  ${v}  (${where})`);
};

const ATTR = /\s(src|href|action|poster|content|data-[\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/g;
const SRCSET = /\s(?:data-)?srcset=(?:"([^"]*)"|'([^']*)')/g;
const CSS_URL = /url\(\s*['"]?([^)'"]+)/g;
const SCRIPT = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g;
const QUOTED_ROOT = /(['"`])(\/[\w.-][^'"`\s]*)\1/g;

for (const f of files.filter((x) => x.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(DIST, f), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  for (const m of html.matchAll(ATTR)) {
    let v = m[2] ?? m[3] ?? m[4];
    if (m[1] === 'content') { const u = v.match(/url=(.*)$/i); if (!u) continue; v = u[1]; }
    check(v, `${f} ${m[1]}`);
  }
  for (const m of html.matchAll(SRCSET)) (m[1] ?? m[2]).split(',').forEach((s) => check(s.trim().split(/\s+/)[0], `${f} srcset`));
  for (const m of html.matchAll(CSS_URL)) check(m[1], `${f} inline url()`);
  for (const s of html.matchAll(SCRIPT)) {
    if (/^\s*[{[]/.test(s[1])) continue; // JSON-LD: absolute https URLs, not paths
    for (const m of s[1].matchAll(QUOTED_ROOT)) check(m[2], `${f} inline script`);
  }
}

const missing = [];
for (const f of files.filter((x) => x.endsWith('.css'))) {
  const css = fs.readFileSync(path.join(DIST, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(CSS_URL)) {
    const v = m[1].trim();
    if (/^(data:|https?:|\/\/|#)/.test(v)) continue;
    if (v.startsWith('/')) { check(v, `${f} url()`); continue; }
    const target = path.normalize(path.join(path.dirname(f), v.split(/[?#]/)[0]));
    if (fs.existsSync(path.join(DIST, target))) continue;
    let note = '';
    if (LIVE) {
      const liveRel = target.replace(/(^|\/)legacy\//, '$1');
      note = fs.existsSync(path.join(LIVE, liveRel)) ? '  LIVE HAS IT' : '  (missing on live too)';
    }
    missing.push(`missing     ${target}  (${f})${note}`);
  }
}
for (const f of files.filter((x) => x.endsWith('.js'))) {
  const js = fs.readFileSync(path.join(DIST, f), 'utf8');
  for (const m of js.matchAll(/(['"`])(\/(?:assets\/|[\w-]+\.html\b)[^'"`\s]*)\1/g)) check(m[2], `${f} string`);
}

const uniq = [...new Set(problems)].sort();
const uniqMissing = [...new Set(missing)].sort();
uniq.forEach((p) => console.log(p));
uniqMissing.forEach((p) => console.log(p));
console.log(`\n${files.length} files scanned; ${uniq.length} prefix problems; ${uniqMissing.length} missing CSS targets`
  + (LIVE || !uniqMissing.length ? '' : ' (a legacy port: set LIVE=<webroot copy> to check them against live)'));
console.log(`control: ${prefixed} refs correctly prefixed with ${P}`);
if (prefixed === 0) { console.log(`CONTROL FAILED: nothing prefixed with ${P}. A root build, or a slug other than SITE_NAME?`); process.exit(2); }
const liveHas = uniqMissing.filter((m) => m.includes('LIVE HAS IT')).length;
process.exit(uniq.length || liveHas || (uniqMissing.length && !LIVE) ? 1 : 0);
