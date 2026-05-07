#!/usr/bin/env node
/**
 * build-dist.js
 * --------------------------------------------------------------------
 * Copies ONLY public-facing files into /dist for Cloudflare Pages to deploy.
 * Source files (Pro PDF, email sequence, marketing copy, scripts, articles
 * markdown, content roadmap, etc.) stay in the repo but never reach the CDN.
 *
 * Run via: npm run build (which runs inject first, then this)
 */
import fs from 'node:fs';
import path from 'node:path';

const DIST = 'dist';

// Files that ARE public (everything else is private)
const PUBLIC_FILES = [
  'sourdough-schedule.html',
  'index.html',
  '_redirects',
  'sitemap.xml',
  'robots.txt'
];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function main() {
  rmrf(DIST);
  fs.mkdirSync(DIST, { recursive: true });

  let copied = 0;
  for (const file of PUBLIC_FILES) {
    if (!fs.existsSync(file)) {
      console.log(`  (skip) ${file} — not found`);
      continue;
    }
    fs.copyFileSync(file, path.join(DIST, file));
    copied += 1;
    console.log(`  ✓ ${file}`);
  }

  console.log(`\nWrote ${copied} public file(s) to /${DIST}`);
  console.log('Source files (pro-pdf/, email-sequence/, marketing/, scripts/, etc.)');
  console.log('stay in the repo but are NOT deployed to the CDN.');
}

main();
