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
  'privacy.html',
  '_redirects',
  'sitemap.xml',
  'robots.txt',
  'ads.txt',
  'cheat-sheet.pdf',
  'og-image.jpg',
  'googlebd595b152ab8942b.html' // Google Search Console verification (URL-prefix property)
];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) n += copyDir(s, d);
    else { fs.copyFileSync(s, d); n += 1; }
  }
  return n;
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

  // Copy edge functions (Pages Functions) — gives us 404 blocking ahead of cache
  const fnCount = copyDir('functions', path.join(DIST, 'functions'));
  if (fnCount > 0) console.log(`  ✓ functions/ (${fnCount} file)`);

  // Copy generated standalone pages (knowledge base, articles, about, contact)
  // produced by inject-articles.js. These give Google real, indexable URLs:
  //   /sourdough/  /sourdough/<slug>/  /about  /contact
  const pageCount = copyDir('articles-build', DIST);
  if (pageCount > 0) console.log(`  ✓ articles-build/ → / (${pageCount} pages)`);

  console.log(`\nWrote ${copied + fnCount + pageCount} public file(s) to /${DIST}`);
  console.log('Source files (pro-pdf/, email-sequence/, marketing/, scripts/, etc.)');
  console.log('stay in the repo but are NOT deployed to the CDN.');
}

main();
