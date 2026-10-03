#!/usr/bin/env node
// Smoke-test a deployed preview: every page in dist, every asset those pages reference on the preview
// host, and every relative url() inside the stylesheets they load. Run from the client repo after
// `./deploy.sh preview` (dist must be the build you deployed):
//   node .claude/skills/5-site-ship/scripts/preview-smoke.mjs <SITE_NAME> [dist]
// PREVIEW_HOST overrides https://preview.88restaurants.com. A legacy port adds LIVE=<copy of the live
// webroot>, which sets aside stylesheet images live lacks too, so exit 0 stays the pass.
// Control: a file that cannot exist must come back 404; if it doesn't, the 200s prove nothing.
import fs from 'node:fs';
import path from 'node:path';

const [slug, DIST = 'dist'] = process.argv.slice(2);
if (!slug) { console.error('usage: preview-smoke.mjs <slug> [dist]'); process.exit(2); }
if (!fs.existsSync(DIST)) { console.error(`no ${DIST}/ here; run from the client repo`); process.exit(2); }
const HOST = process.env.PREVIEW_HOST || 'https://preview.88restaurants.com';
const BASE = `${HOST}/${slug}/`;
const host = new URL(HOST).host;

const walk = (d) => fs.readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const pages = walk(DIST).map((f) => path.relative(DIST, f))
  .filter((f) => f.endsWith('.html') && !/^(_88|_versions)\//.test(f))
  .map((f) => f.replace(/(^|\/)index\.html$/, '$1'))
  .sort();

const refs = new Map(); // url -> first page that referenced it
const add = (u, from) => {
  try {
    const x = new URL(u.trim().replace(/&amp;/g, '&'), from);
    if (x.host !== host) return;
    x.hash = '';
    if (!refs.has(x.href)) refs.set(x.href, from.replace(BASE, '/'));
  } catch { /* not a URL */ }
};

const pool = async (items, n, fn) => {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
};

const pageLines = []; let pageBad = 0;
for (const p of pages) {
  const url = BASE + p;
  const r = await fetch(url);
  const html = (await r.text()).replace(/<!--[\s\S]*?-->/g, '');
  if (r.status !== 200) pageBad++;
  pageLines.push(`${r.status} /${p}`);
  for (const m of html.matchAll(/\s(?:src|href|poster|content|data-[\w-]+)=(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/g)) {
    let v = m[1] ?? m[2] ?? m[3];
    const refresh = v.match(/url=(.*)$/i); if (refresh) v = refresh[1];
    if (/^(\/(?!\/)|https?:)/.test(v)) add(v, url);
  }
  for (const m of html.matchAll(/\s(?:data-)?srcset=(?:"([^"]*)"|'([^']*)')/g)) (m[1] ?? m[2]).split(',').forEach((s) => add(s.trim().split(/\s+/)[0], url));
  for (const m of html.matchAll(/url\(\s*['"]?([^)'"]+)/g)) if (m[1].startsWith('/')) add(m[1], url);
}

for (const css of [...refs.keys()].filter((k) => /\.css(\?|$)/.test(k))) {
  const t = (await (await fetch(css)).text()).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of t.matchAll(/url\(\s*['"]?([^)'"]+)/g)) if (!/^(data:|https?:|\/\/|#)/.test(m[1])) add(m[1].split(/[?#]/)[0], css);
}

// A stylesheet image the live webroot lacks too is dead legacy CSS, not a port bug.
const LIVE = process.env.LIVE;
const deadOnLive = (k) => {
  if (!LIVE || !/\.css(\?|$)/.test(refs.get(k))) return false;
  const rel = new URL(k).pathname.slice(`/${slug}/`.length).replace(/(^|\/)legacy\//, '$1');
  return !fs.existsSync(path.join(LIVE, decodeURIComponent(rel)));
};

const bad = []; const dead = []; let ok = 0;
await pool([...refs.keys()], 12, async (k) => {
  const r = await fetch(k);
  await r.arrayBuffer();
  const line = `${r.status} ${k.replace(HOST, '')}  (from ${refs.get(k)})`;
  if (r.status === 200) ok++; else (deadOnLive(k) ? dead : bad).push(line);
});

console.log(pageLines.join('\n'));
console.log(`\npages: ${pages.length - pageBad} ok, ${pageBad} not 200`);
const cssMisses = bad.some((b) => /\(from [^)]*\.css(\?|\))/.test(b));
console.log(`assets: ${ok} ok, ${bad.length} not 200` + (LIVE ? `, ${dead.length} dead on live too`
  : cssMisses ? ' (a legacy port: set LIVE=<webroot copy> to set aside dead legacy CSS)' : ''));
bad.sort().forEach((b) => console.log('  ' + b));
if (dead.length) console.log(`  dead on live too: ${dead.length} stylesheet images, e.g. ${dead.sort()[0].split(' ')[1]}`);
const ctl = await fetch(`${BASE}assets/definitely-missing-${Date.now()}.jpg`);
console.log(`control: missing file -> ${ctl.status} (expect 404)`);
if (ctl.status !== 404) { console.log('CONTROL FAILED: the host answers missing files with', ctl.status); process.exit(2); }
process.exit(pageBad || bad.length ? 1 : 0);
