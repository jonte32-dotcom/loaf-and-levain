#!/usr/bin/env node
/**
 * inject-articles.js
 * --------------------------------------------------------------------
 * Reads every markdown file in /articles, converts to HTML, and injects
 * them into sourdough-schedule.html between the AUTO_INJECT markers.
 * Also generates sitemap.xml with anchor links to each article.
 *
 * Run: npm run inject
 */
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';

const HTML_FILE = 'sourdough-schedule.html';
const ARTICLES_DIR = 'articles';
const SITE_BASE = process.env.SITE_BASE || 'https://loafandlevain.com';
const START = '<!-- ARTICLES_AUTO_INJECT_START -->';
const END = '<!-- ARTICLES_AUTO_INJECT_END -->';

marked.setOptions({ headerIds: true, mangle: false, gfm: true });

function slugify(s) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
}

function readArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    .sort()
    .map(f => {
      const raw = fs.readFileSync(path.join(ARTICLES_DIR, f), 'utf8').trim();
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : f.replace(/^\d+-/, '').replace(/\.md$/, '');
      const body = raw.replace(/^#\s+.+$/m, '').trim();
      const slug = slugify(title);
      return { file: f, title, body, slug };
    });
}

function articleToHTML(a) {
  // Convert markdown body. Promote H2 in MD to H3 in our content section
  // (because the section already uses H2 for top-level groups).
  let html = marked.parse(a.body);
  html = html.replace(/<h1\b/g, '<h3').replace(/<\/h1>/g, '</h3>');
  html = html.replace(/<h2\b/g, '<h4').replace(/<\/h2>/g, '</h4>');
  html = html.replace(/<h3\b/g, '<h4').replace(/<\/h3>/g, '</h4>');

  return `
<article class="kb-article" id="${a.slug}">
  <h2 class="kb-title"><a href="#${a.slug}">${escapeHtml(a.title)}</a></h2>
  <div class="kb-body">
    ${html}
  </div>
</article>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function injectInto(html, articlesHtml) {
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`Markers not found in ${HTML_FILE}. Add ${START} and ${END}.`);
  }
  const before = html.slice(0, startIdx + START.length);
  const after = html.slice(endIdx);
  const wrapped = `\n<section class="knowledge-base" aria-label="Knowledge base">\n  <h2 class="kb-section-head" style="margin-top:56px;">From the <em>knowledge base</em>.</h2>\n${articlesHtml}\n</section>\n      `;
  return before + wrapped + after;
}

function generateSitemap(articles) {
  const today = new Date().toISOString().slice(0, 10);
  const entries = [
    `<url><loc>${SITE_BASE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...articles.map(a =>
      `<url><loc>${SITE_BASE}/#${a.slug}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>`
    )
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}

function main() {
  const articles = readArticles();
  console.log(`Found ${articles.length} articles in /${ARTICLES_DIR}`);
  if (articles.length === 0) {
    console.log('No articles to inject. Add markdown files to /articles or run npm run gen-article.');
    return;
  }

  const articlesHtml = articles.map(articleToHTML).join('\n');
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  const updated = injectInto(html, articlesHtml);
  fs.writeFileSync(HTML_FILE, updated);
  console.log(`✓ Injected ${articles.length} articles into ${HTML_FILE}`);

  fs.writeFileSync('sitemap.xml', generateSitemap(articles));
  console.log(`✓ Wrote sitemap.xml (${articles.length + 1} entries)`);
}

main();
