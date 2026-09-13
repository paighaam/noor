// Publish build for the Noor design POC → static, clean-URL `dist/` for Firebase Hosting.
//
// Authoring is untouched: keep editing src/**/*.dc.html and using the local devserver.
// This runs only at deploy. It:
//   • gives every page a clean route (e.g. src/qibla/Qibla.dc.html → /qibla/)
//   • emits each page as <route>/index.html
//   • copies shared assets (support.js, ios-frame.jsx, _theme, _ds, uploads) + repo images/
//   • rewrites every asset / x-import / nav reference to an absolute path, so page depth
//     no longer matters and the dc runtime's relative `../` chains can't break
//   • patches chrome.js so the left-nav emits absolute hrefs from its NoorSiteMap
//
// No dependencies — Node built-ins only.  Run: `node tools/build.mjs`

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const IMAGES = path.join(ROOT, 'images');
const DIST = path.join(ROOT, 'dist');

const ASSET_EXT = 'js|css|jsx|png|jpe?g|webp|svg|gif|ttf|woff2?|ico';

// ── helpers ────────────────────────────────────────────────────────────────
const posix = (p) => p.split(path.sep).join('/');
const slug = (s) =>
  s.toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// Resolve a reference against a base dir (both relative to the web root = src root),
// clamping `..` at the root. Returns an absolute web path like "/qibla/storyboards/x.jsx".
function resolveWeb(baseDir, ref) {
  const stack = [];
  const parts = (baseDir ? baseDir.split('/') : []).concat(ref.split('/'));
  for (const p of parts) {
    if (p === '' || p === '.') continue;
    if (p === '..') { if (stack.length) stack.pop(); continue; }
    stack.push(p);
  }
  return '/' + stack.join('/');
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ── 1. route map: srcRel (posix) → clean web route ("/qibla/", "/", …) ───────
const pages = walk(SRC).filter((f) => f.endsWith('.dc.html')).map((f) => posix(path.relative(SRC, f)));
const dirCount = {};
for (const rel of pages) {
  const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  dirCount[dir] = (dirCount[dir] || 0) + 1;
}
const routeMap = {};
const fixedRoutes = {
  'home/Home Broadcast Studio.dc.html': '/home/home-broadcast-studio/',
  'onboarding/Onboarding.dc.html': '/onboarding/',
};
for (const rel of pages) {
  const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  const base = slug(rel.slice(rel.lastIndexOf('/') + 1).replace(/\.dc\.html$/, ''));
  let route;
  if (fixedRoutes[rel]) route = fixedRoutes[rel];
  else if (dir === '') route = base === 'index' ? '/' : `/${base}/`;
  else if (dirCount[dir] > 1) route = `/${dir}/${base}/`;
  else route = `/${dir}/`;
  routeMap[rel] = route;
}

const warnings = new Set();

// ── 2. reference rewriting ───────────────────────────────────────────────────
function rewrite(text, baseDir) {
  // page links (may contain spaces, so match within quotes): "...X.dc.html#hash"
  text = text.replace(/(['"])([^'"]*?\.dc\.html)(#[^'"]*)?\1/g, (m, q, p, hash) => {
    const key = resolveWeb(baseDir, p).replace(/^\//, '');
    const route = routeMap[key];
    if (!route) { warnings.add(`${baseDir || '(root)'} → unresolved page link: ${p}`); return m; }
    return q + route + (hash || '') + q;
  });
  // source-relative asset references (bare, ./ or ../ prefixed) → absolute.
  // Bare references matter when a root-level authoring page is published below a
  // clean route (for example Quran.dc.html → /quran/): leaving `_theme/poc.css`
  // untouched makes the browser request `/quran/_theme/poc.css`.
  // Root-absolute, fragment, data and URL-scheme references are already portable.
  const assetRe = new RegExp(
    `(['"])((?!/|#|[a-zA-Z][a-zA-Z\\d+.-]*:)(?:\\.\\.?/)?[^'"]*?\\.(?:${ASSET_EXT}))(#[^'"]*)?\\1`,
    'g',
  );
  text = text.replace(assetRe, (m, q, p, hash) => q + resolveWeb(baseDir, p) + (hash || '') + q);
  return text;
}

// chrome.js: neutralize the depth-relative prefix so NoorSiteMap hrefs stay absolute.
function patchChrome(text) {
  text = text
    .split('prefix + p.file').join('p.file')
    .split("prefix + 'Index.dc.html'").join("'/'")
    .split("'/' + fileNoHash").join('fileNoHash');
  return rewrite(text, ''); // absolutize the NoorSiteMap `file:` entries (src-root relative)
}

// base dir used to resolve refs inside a file. For storyboard jsx the refs are authored
// relative to the BOARD PAGE (the flow dir), not the jsx's own folder.
function baseFor(rel) {
  if (rel.includes('/storyboards/')) return rel.slice(0, rel.indexOf('/storyboards/'));
  return rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
}

// ── 3. build dist ────────────────────────────────────────────────────────────
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const write = (abs, data) => { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, data); };

let nPages = 0, nRewritten = 0, nCopied = 0;
for (const abs of walk(SRC)) {
  const rel = posix(path.relative(SRC, abs));
  if (rel.endsWith('.dc.html')) {
    const route = routeMap[rel];
    const dest = path.join(DIST, route === '/' ? 'index.html' : route.slice(1) + 'index.html');
    write(dest, rewrite(fs.readFileSync(abs, 'utf8'), baseFor(rel)));
    nPages++;
  } else if (rel === '_theme/chrome.js') {
    write(path.join(DIST, rel), patchChrome(fs.readFileSync(abs, 'utf8')));
    nRewritten++;
  } else if (rel.endsWith('.jsx')) {
    write(path.join(DIST, rel), rewrite(fs.readFileSync(abs, 'utf8'), baseFor(rel)));
    nRewritten++;
  } else {
    write(path.join(DIST, rel), fs.readFileSync(abs)); // verbatim (support.js, _ds bundle, css, fonts, images-in-src)
    nCopied++;
  }
}

// repo-root images/ → dist/images/
if (fs.existsSync(IMAGES)) {
  for (const abs of walk(IMAGES)) {
    write(path.join(DIST, 'images', posix(path.relative(IMAGES, abs))), fs.readFileSync(abs));
    nCopied++;
  }
}

console.log(`Routes (${pages.length}):`);
for (const rel of pages.sort()) console.log(`  ${routeMap[rel].padEnd(28)} ← src/${rel}`);
console.log(`\nPages: ${nPages} · rewritten assets: ${nRewritten} · copied: ${nCopied}`);
if (warnings.size) { console.log('\nWARNINGS:'); for (const w of warnings) console.log('  ! ' + w); }
console.log('\ndist/ ready.');
