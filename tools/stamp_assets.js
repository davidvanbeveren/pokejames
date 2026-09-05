#!/usr/bin/env node
// Stamp ?v=<content hash> onto the js/ and audio/ URLs in index.html.
//
//   node tools/stamp_assets.js
//
// GitHub Pages serves assets with `cache-control: max-age=600`, so after a deploy a
// browser keeps showing the previous js for up to ten minutes. The hash only changes
// when the files themselves change, so this busts the cache exactly when it matters
// and leaves index.html untouched otherwise.
//
// Run before committing a deploy. build.py and tools/headless.js strip the query
// again when they resolve paths on disk.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const INDEX = path.join(ROOT, 'index.html');

function hashOf(files) {
  const h = crypto.createHash('sha1');
  for (const f of files.sort()) h.update(fs.readFileSync(path.join(ROOT, f)));
  return h.digest('hex').slice(0, 8);
}

let html = fs.readFileSync(INDEX, 'utf8');
const bare = u => u.split('?')[0];

const js = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => bare(m[1]));
const media = [...html.matchAll(/src="((?:audio|art)\/[^"]+)"/g)].map(m => bare(m[1]));
const missing = [...js, ...media].filter(f => !fs.existsSync(path.join(ROOT, f)));
if (missing.length) {
  console.error('missing files referenced by index.html:', missing.join(', '));
  process.exit(1);
}

const jsHash = hashOf(js);
const mediaHash = media.length ? hashOf(media) : '0';

const before = html;
html = html.replace(/<script src="([^"]+)"><\/script>/g,
  (m, u) => `<script src="${bare(u)}?v=${jsHash}"></script>`);
html = html.replace(/src="((?:audio|art)\/[^"]+)"/g,
  (m, u) => `src="${bare(u)}?v=${mediaHash}"`);

if (html === before) {
  console.log(`index.html already stamped (js ${jsHash}, media ${mediaHash})`);
} else {
  fs.writeFileSync(INDEX, html);
  console.log(`stamped ${js.length} scripts (v=${jsHash}) and ${media.length} media files (v=${mediaHash})`);
}
