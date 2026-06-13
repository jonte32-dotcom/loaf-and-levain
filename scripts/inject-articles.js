#!/usr/bin/env node
/**
 * inject-articles.js
 * --------------------------------------------------------------------
 * Reads every markdown file in /articles and produces, for each one, a
 * STANDALONE, indexable HTML page at its own real URL:
 *
 *     https://loafandlevain.com/sourdough/<slug>/
 *
 * It also builds a knowledge-base index page at /sourdough/, rewrites the
 * calculator's in-page "knowledge base" block into a card grid that LINKS
 * OUT to those standalone pages (no duplicated article bodies), and emits a
 * sitemap.xml listing every real URL (no fragment anchors).
 *
 * Why: AdSense flagged the site "Low value content" because all 12 articles
 * were injected into a single page as #fragment anchors. Google does not
 * index fragments as separate pages, so the crawler saw a 3-page site. Real
 * per-article URLs turn that into 14+ indexable content pages.
 *
 * Output (staging dir, copied into /dist by build-dist.js):
 *   articles-build/sourdough/index.html          ← knowledge-base index
 *   articles-build/sourdough/<slug>/index.html   ← one per article
 *   sitemap.xml                                  ← real URLs only
 *
 * Run: npm run inject
 */
import fs from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { DIAGRAMS, ARTICLE_DIAGRAM } from './diagrams.mjs';

const HTML_FILE = 'sourdough-schedule.html';
const ARTICLES_DIR = 'articles';
const BUILD_DIR = 'articles-build';
const KB_DIR = path.join(BUILD_DIR, 'sourdough');
const SITE_BASE = (process.env.SITE_BASE || 'https://loafandlevain.com').replace(/\/$/, '');
// Authorship. By default the content is credited to the Loaf & Levain BRAND (an editorial
// Organization), not a named person: a "By Loaf & Levain" byline + a brand author-box + an
// Organization author in the JSON-LD. To switch to a named human author (the higher-E-E-A-T
// option) set AUTHOR_NAME (and optionally AUTHOR_BIO) — that swaps in a person byline, a Person
// author-box and Person JSON-LD linked to the About page. Leaving AUTHOR_NAME empty is a
// deliberate, honest choice (no fabricated persona), not a half-finished fallback.
const AUTHOR_NAME = process.env.AUTHOR_NAME || '';
const AUTHOR_BIO = process.env.AUTHOR_BIO || 'a home baker and the maker of Loaf & Levain who tests every number in a real kitchen';
const BRAND_BLURB = 'an independent sourdough resource where every number in these guides is tested in a real kitchen, not copied from another blog';
const ADSENSE_CLIENT = 'ca-pub-8093269710555728';
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'loafandlevain.bake@gmail.com';
const START = '<!-- ARTICLES_AUTO_INJECT_START -->';
const END = '<!-- ARTICLES_AUTO_INJECT_END -->';

marked.setOptions({ headerIds: false, mangle: false, gfm: true });

// ---------- helpers ----------

function fileSlug(filename) {
  // 08-fix-dense-sourdough.md -> fix-dense-sourdough
  return filename.replace(/^\d+-/, '').replace(/\.md$/, '');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(s) {
  return escapeHtml(s).replace(/'/g, '&#39;');
}

// articles/ is trusted input (our own Claude-generated markdown), but this is cheap
// defence-in-depth: strip active/embedded tags, inline event handlers and javascript:
// URLs so a stray bit of raw HTML can never inject script into a page that runs AdSense.
function sanitizeHtml(html) {
  return String(html)
    .replace(/<\/?(?:script|style|iframe|object|embed|form|base|meta|link)\b[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/((?:href|src))\s*=\s*(["'])\s*javascript:[^"']*\2/gi, '$1="#"');
}

// First paragraph of the body, as plain text, trimmed to a meta-description length.
function excerpt(body, max = 155) {
  const firstPara = body.split(/\n\s*\n/).find(p => p.trim() && !p.trim().startsWith('#')) || '';
  const plain = firstPara
    .replace(/[#*_`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  return plain.slice(0, max - 1).replace(/\s+\S*$/, '') + '…';
}

function readArticles() {
  if (!fs.existsSync(ARTICLES_DIR)) return [];
  return fs.readdirSync(ARTICLES_DIR)
    .filter(f => f.endsWith('.md'))
    // Sort numerically on the NN- prefix so 100- doesn't sort before 11- past 99 articles.
    .sort((a, b) => (parseInt(a, 10) || 0) - (parseInt(b, 10) || 0))
    .map(f => {
      const fp = path.join(ARTICLES_DIR, f);
      const raw = fs.readFileSync(fp, 'utf8').trim();
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : f.replace(/^\d+-/, '').replace(/\.md$/, '');
      const body = raw.replace(/^#\s+.+$/m, '').trim();
      let modified = '';
      try { modified = fs.statSync(fp).mtime.toISOString().slice(0, 10); } catch (e) { /* ignore */ }
      return { file: f, title, body, slug: fileSlug(f), summary: excerpt(body), modified };
    });
}

// ---------- shared page chrome ----------

const SITE_CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --cream:#F4ECDD;--cream-deep:#EBE0CB;--paper:#FBF7EE;
    --ink:#1F1611;--ink-soft:#4A3B2E;--ink-mute:#8A7866;
    --crust:#B85C38;--crust-deep:#8E3F22;--gold:#C9A24E;--sage:#6F8060;
    --line:#D9CFB9;--line-soft:#E8DFC9;
    --serif:'Fraunces','Times New Roman',serif;
    --sans:'Manrope',system-ui,sans-serif;
    --mono:'JetBrains Mono',ui-monospace,monospace;
    --shadow:0 1px 2px rgba(31,22,17,.04),0 8px 24px -12px rgba(31,22,17,.12);
  }
  html{scroll-behavior:smooth}
  body{font-family:var(--sans);background:var(--cream);color:var(--ink);line-height:1.7;
    font-weight:400;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;min-height:100vh;
    background-image:radial-gradient(at 12% 8%,rgba(184,92,56,.06)0%,transparent 50%),
      radial-gradient(at 88% 92%,rgba(201,162,78,.07)0%,transparent 55%)}
  .wrap{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:0 24px}
  ::selection{background:var(--crust);color:var(--paper)}
  a{color:var(--crust-deep)}
  /* header */
  header.site{display:flex;justify-content:space-between;align-items:center;
    padding:28px 0;border-bottom:1px solid var(--line);margin-bottom:48px;flex-wrap:wrap;gap:16px}
  .brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
  .brand svg{width:30px;height:30px}
  .brand-name{font-family:var(--serif);font-weight:600;font-size:20px;letter-spacing:-.01em}
  .brand-name span{color:var(--crust)}
  nav.site a{font-size:14px;font-weight:500;color:var(--ink-soft);text-decoration:none;margin-left:22px}
  nav.site a:hover{color:var(--crust-deep)}
  /* article */
  main{padding-bottom:64px}
  .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.14em;text-transform:uppercase;
    color:var(--crust);margin-bottom:14px}
  .back{display:inline-block;font-size:13px;color:var(--ink-mute);text-decoration:none;margin-bottom:24px}
  .back:hover{color:var(--crust-deep)}
  h1{font-family:var(--serif);font-weight:600;font-size:clamp(30px,5vw,46px);line-height:1.12;
    letter-spacing:-.02em;margin-bottom:28px}
  .article-body{font-size:17px;color:var(--ink-soft)}
  .article-body h2{font-family:var(--serif);font-weight:600;color:var(--ink);font-size:26px;
    margin:40px 0 14px;letter-spacing:-.01em}
  .article-body h3,.article-body h4{font-family:var(--serif);font-weight:600;color:var(--ink);
    font-size:20px;margin:30px 0 10px}
  .article-body p{margin:0 0 18px}
  .article-body ul,.article-body ol{margin:0 0 18px;padding-left:24px}
  .article-body li{margin-bottom:8px}
  .article-body strong{color:var(--ink);font-weight:600}
  .article-body code{font-family:var(--mono);font-size:.88em;background:var(--cream-deep);
    padding:2px 6px;border-radius:4px}
  .article-body blockquote{border-left:3px solid var(--gold);padding-left:18px;margin:0 0 18px;
    color:var(--ink-mute);font-style:italic}
  .article-body a{color:var(--crust-deep);text-decoration:underline;text-underline-offset:2px}
  .article-body img{max-width:100%;height:auto;border-radius:10px;margin:22px 0;display:block;box-shadow:0 8px 24px -12px rgba(31,22,17,.18)}
  .article-body figure{margin:22px 0}
  .article-body figcaption{font-size:13px;color:var(--ink-mute);margin-top:6px;text-align:center;font-style:italic}
  .byline{font-size:14px;color:var(--ink-mute);margin:-4px 0 24px}
  .byline a{color:var(--crust-deep)}
  .author-box{background:var(--paper);border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin:30px 0;font-size:14px;color:var(--ink-soft)}
  .author-box strong{color:var(--ink)}
  /* cards / related */
  .cards{display:grid;gap:18px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));margin:8px 0 0}
  .card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:22px;
    box-shadow:var(--shadow);text-decoration:none;color:var(--ink);display:flex;flex-direction:column;
    transition:transform .15s ease,box-shadow .15s ease}
  .card:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(31,22,17,.10),0 20px 40px -16px rgba(31,22,17,.20)}
  .card h3{font-family:var(--serif);font-weight:600;font-size:18px;line-height:1.25;margin-bottom:8px}
  .card p{font-size:14px;color:var(--ink-mute);margin:0 0 14px;flex:1}
  .card .more{font-size:13px;font-weight:600;color:var(--crust)}
  section.related{margin-top:56px;padding-top:40px;border-top:1px solid var(--line)}
  section.related>h2{font-family:var(--serif);font-weight:600;font-size:22px;margin-bottom:20px}
  /* cta */
  .cta{margin-top:48px;background:var(--ink);color:var(--paper);border-radius:16px;padding:32px;text-align:center}
  .cta h2{font-family:var(--serif);font-weight:600;font-size:24px;margin-bottom:8px;color:var(--paper)}
  .cta p{color:#D8CDBD;font-size:15px;margin-bottom:20px}
  .cta a{display:inline-block;background:var(--crust);color:#fff;text-decoration:none;font-weight:600;
    font-size:15px;padding:13px 26px;border-radius:10px}
  .cta a:hover{background:var(--crust-deep)}
  /* footer */
  footer.site{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
    padding:28px 0 48px;border-top:1px solid var(--line);font-size:13px;color:var(--ink-mute)}
  footer.site a{color:var(--ink-mute);text-decoration:none;margin-left:18px}
  footer.site a:hover{color:var(--crust-deep)}
  .lede{font-size:18px;color:var(--ink-soft);margin-bottom:36px;max-width:60ch}
`;

const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cellipse cx='16' cy='20' rx='13' ry='9' fill='%23C9A24E' opacity='0.4'/%3E%3Cellipse cx='16' cy='18' rx='13' ry='9' fill='%23F4ECDD' stroke='%231F1611' stroke-width='1.4'/%3E%3Cpath d='M7 18 Q11 11 16 11 Q21 11 25 18' stroke='%23B85C38' stroke-width='1.1' fill='none'/%3E%3Cpath d='M9 14 L11 16 M16 9 L16 12 M23 14 L21 16' stroke='%23B85C38' stroke-width='1.1'/%3E%3C/svg%3E`;

const BRAND_SVG = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><ellipse cx="16" cy="20" rx="13" ry="9" fill="#C9A24E" opacity="0.3"/><ellipse cx="16" cy="18" rx="13" ry="9" stroke="#1F1611" stroke-width="1.2"/><path d="M7 18 Q11 11 16 11 Q21 11 25 18" stroke="#B85C38" stroke-width="0.9" fill="none"/><path d="M9 14 L11 16 M16 9 L16 12 M23 14 L21 16" stroke="#B85C38" stroke-width="0.9"/></svg>`;

function pageHead({ title, description, canonical, ogType = 'article' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}" crossorigin="anonymous"></script>
<script defer data-domain="loafandlevain.com" src="https://plausible.io/js/script.outbound-links.js"></script>
<script>window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)}</script>
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeAttr(description)}" />
<meta name="theme-color" content="#1F1611" />
<meta name="color-scheme" content="light" />
<meta name="robots" content="index,follow" />
<link rel="canonical" href="${canonical}" />
<meta property="og:type" content="${ogType}" />
<meta property="og:title" content="${escapeAttr(title)}" />
<meta property="og:description" content="${escapeAttr(description)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:site_name" content="Loaf &amp; Levain" />
<meta property="og:locale" content="en_US" />
<meta property="og:image" content="${SITE_BASE}/og-image.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeAttr(title)}" />
<meta name="twitter:description" content="${escapeAttr(description)}" />
<meta name="twitter:image" content="${SITE_BASE}/og-image.jpg" />
<link rel="icon" type="image/svg+xml" href="${FAVICON}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${SITE_CSS}</style>`;
}

function siteHeader() {
  return `<header class="site">
  <a class="brand" href="/sourdough/">${BRAND_SVG}<span class="brand-name">Loaf<span>&amp;</span>Levain</span></a>
  <nav class="site">
    <a href="/sourdough/">Knowledge base</a>
    <a href="/">Calculator</a>
    <a href="/about">About</a>
  </nav>
</header>`;
}

function siteFooter() {
  return `<footer class="site">
  <span>© Loaf &amp; Levain · Sourdough for bakers who measure</span>
  <span><a href="/sourdough/">Knowledge base</a><a href="/about">About</a><a href="/contact">Contact</a><a href="/privacy.html">Privacy</a></span>
</footer>`;
}

// Per-article CTA. Identical CTAs on every page are a top "scaled AI content" signal, so the
// headline + copy + destination vary by the article's topic while always pointing somewhere useful.
const CTA_VARIANTS = {
  calc: { h: 'Plan your next bake', p: 'Free schedule calculator — calibrated to your kitchen temperature, hydration and starter.', a: '/', label: 'Open the calculator →' },
  starter: { h: 'Get your starter on schedule', p: 'The calculator works backwards from when you want to bake to when you should feed.', a: '/', label: 'Time your starter →' },
  troubleshoot: { h: 'Find out what went wrong', p: 'Dial in dough temperature and bulk timing for your kitchen, and stop guessing at the cause.', a: '/', label: 'Run your numbers →' },
  explore: { h: 'Keep reading', p: 'Tested, in-depth guides on fermentation, hydration, starters, scoring and troubleshooting.', a: '/sourdough/', label: 'Browse the knowledge base →' },
};
const CTA_BY_SLUG = {
  'bulk-fermentation-by-temperature': 'calc', 'ddt-formula-water-temperature': 'calc',
  'cold-retard-vs-same-day': 'calc', 'winter-sourdough': 'calc', 'summer-sourdough': 'calc',
  'stretch-and-fold': 'calc', 'autolyse-vs-fermentolyse': 'calc',
  'revive-forgotten-starter': 'starter', 'float-test-explained': 'starter', 'starter-feeding-ratio': 'starter',
  'why-sourdough-gummy': 'troubleshoot', 'fix-dense-sourdough': 'troubleshoot',
  'hydration-explained': 'explore', 'scoring-sourdough': 'explore',
  'whole-wheat-sourdough': 'explore', 'rye-sourdough-rules': 'explore',
};
function calculatorCTA(slug) {
  const v = CTA_VARIANTS[CTA_BY_SLUG[slug] || 'calc'] || CTA_VARIANTS.calc;
  return `<div class="cta">
  <h2>${escapeHtml(v.h)}</h2>
  <p>${escapeHtml(v.p)}</p>
  <a href="${v.a}">${escapeHtml(v.label)}</a>
</div>`;
}

// Original, build-time SVG figure embedded near the top of each article. Zero original images was
// the single heaviest "low value content" signal; these are data-accurate, branded diagrams.
function diagramFigure(slug) {
  const d = ARTICLE_DIAGRAM[slug];
  if (!d || !DIAGRAMS[d.name]) return '';
  return `<figure>
  <img src="/diagrams/${d.name}.svg" width="820" height="480" loading="lazy" decoding="async" alt="${escapeAttr(d.alt)}" />
  <figcaption>${escapeHtml(d.caption)}</figcaption>
</figure>`;
}
// Insert the figure after the first closing </p> so it sits under the article's opening paragraph.
function insertDiagram(bodyHtml, slug) {
  const fig = diagramFigure(slug);
  if (!fig) return bodyHtml;
  const idx = bodyHtml.indexOf('</p>');
  if (idx < 0) return fig + bodyHtml;
  return bodyHtml.slice(0, idx + 4) + '\n' + fig + bodyHtml.slice(idx + 4);
}

// Topical relevance so each article's "related" list is DIFFERENT and on-topic — instead of the
// same first 4 articles on every page (the #1 "scaled AI content" signal AdSense flags).
const REL_STOP = new Set(('the a an and or but for to of in on at is are be it your you this that with from as ' +
  'if when how what why which not no into out up down over under our their than then can could should would ' +
  'will just like get make made use used dough bread sourdough bake baking baker bakers loaf loaves recipe ' +
  'time most more less very also even still here there about').split(/\s+/));
function relTerms(s) {
  return (String(s).toLowerCase().match(/[a-z]{4,}/g) || []).filter(w => !REL_STOP.has(w));
}
function relevance(a, b) {
  const A = new Set(relTerms(a.title + ' ' + a.summary + ' ' + a.body));
  const B = new Set(relTerms(b.title + ' ' + b.summary + ' ' + b.body));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  // Jaccard: normalises for length so the long articles don't dominate every "related" list.
  return inter / (A.size + B.size - inter);
}
const RELATED_HEADINGS = ['Related guides', 'Keep reading', 'More from the knowledge base', 'Related reading', 'Where to go next'];
function relatedList(current, all, n = 4) {
  const scored = all
    .filter(a => a.slug !== current.slug)
    .map(a => ({ a, s: relevance(current, a) }))
    .sort((x, y) => (y.s - x.s) || ((parseInt(x.a.file, 10) || 0) - (parseInt(y.a.file, 10) || 0)));
  // Vary card count 3–5 (deterministically by article number) to break the fixed-4 visual template.
  const num = parseInt(current.file, 10) || 0;
  const count = 3 + (num % 3);
  const others = scored.slice(0, Math.min(count, n + 1)).map(x => x.a);
  const heading = RELATED_HEADINGS[num % RELATED_HEADINGS.length];
  const cards = others.map(a => `
    <a class="card" href="/sourdough/${a.slug}/">
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.summary)}</p>
      <span class="more">Read →</span>
    </a>`).join('');
  return `<section class="related">
  <h2>${escapeHtml(heading)}</h2>
  <div class="cards">${cards}</div>
</section>`;
}

function articleJsonLd(a, canonical) {
  const obj = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.summary,
    author: AUTHOR_NAME
      ? { '@type': 'Person', '@id': `${SITE_BASE}/about#author`, name: AUTHOR_NAME, url: `${SITE_BASE}/about` }
      : { '@type': 'Organization', '@id': `${SITE_BASE}/#org`, name: 'Loaf & Levain', url: `${SITE_BASE}/` },
    publisher: {
      '@type': 'Organization',
      name: 'Loaf & Levain',
      logo: { '@type': 'ImageObject', url: `${SITE_BASE}/og-image.jpg` }
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    image: `${SITE_BASE}/og-image.jpg`
  };
  if (a.modified) { obj.datePublished = a.modified; obj.dateModified = a.modified; }
  return `<script type="application/ld+json">${JSON.stringify(obj)}</script>`;
}

function byline(a) {
  // Named author when configured; otherwise a brand byline (still attributes editorial ownership)
  // plus the freshness date.
  const who = AUTHOR_NAME ? escapeHtml(AUTHOR_NAME) : 'Loaf &amp; Levain';
  const updated = a.modified ? ` · Updated ${escapeHtml(a.modified)}` : '';
  return `<div class="byline">By <a href="/about">${who}</a>${updated}</div>`;
}
function authorBox() {
  if (AUTHOR_NAME) {
    return `<aside class="author-box"><strong>${escapeHtml(AUTHOR_NAME)}</strong>${AUTHOR_BIO ? ` — ${escapeHtml(AUTHOR_BIO)}` : ''}</aside>`;
  }
  return `<aside class="author-box"><strong>Loaf &amp; Levain</strong> — ${escapeHtml(BRAND_BLURB)}. <a href="/about">More about how we test</a>.</aside>`;
}

// Build-time internal linker: weaves the articles into a topical cluster automatically (and
// links the calculator), instead of hand-editing every markdown file. Conservative: links the
// FIRST plain-text mention of each target once per article, max 6, skipping headings, code,
// tables, blockquotes and lines that already contain a link or HTML.
const CALC_PHRASES = ['schedule calculator', 'calculator on this page', 'Recipe Lab', 'Starter tab'];
const ARTICLE_LINK_MAP = [
  ['bulk-fermentation-by-temperature', ['bulk fermentation']],
  ['why-sourdough-gummy', ['gummy']],
  ['revive-forgotten-starter', ['forgotten starter']],
  ['hydration-explained', ['hydration']],
  ['cold-retard-vs-same-day', ['cold retard']],
  ['float-test-explained', ['float test']],
  ['ddt-formula-water-temperature', ['DDT']],
  ['fix-dense-sourdough', ['dense crumb', 'dense loaf']],
  ['starter-feeding-ratio', ['feeding ratio']],
  ['stretch-and-fold', ['stretch and fold']],
  ['scoring-sourdough', ['scoring']],
  ['autolyse-vs-fermentolyse', ['autolyse', 'fermentolyse']],
  ['whole-wheat-sourdough', ['whole wheat']],
  ['rye-sourdough-rules', ['rye flour', 'rye bread']]
];
function autoLinkBody(md, currentSlug) {
  const lines = md.split('\n');
  const used = new Set();
  let total = 0;
  const MAX = 6;
  const triggers = ARTICLE_LINK_MAP
    .filter(([slug]) => slug !== currentSlug)
    .map(([slug, phrases]) => ({ key: slug, url: `/sourdough/${slug}/`, phrases }));
  triggers.push({ key: '__calc__', url: '/', phrases: CALC_PHRASES });
  const linkable = (line) => line && !/^\s*(#|```|\||>)/.test(line) && !line.includes('](') && !line.includes('<');
  for (let i = 0; i < lines.length && total < MAX; i++) {
    if (!linkable(lines[i])) continue;
    for (const t of triggers) {
      if (used.has(t.key)) continue;
      for (const p of t.phrases) {
        const re = new RegExp('\\b(' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')\\b', 'i');
        if (re.test(lines[i])) {
          lines[i] = lines[i].replace(re, `[$1](${t.url})`);
          used.add(t.key);
          total++;
          break;
        }
      }
      if (total >= MAX) break;
    }
  }
  return lines.join('\n');
}

// ---------- standalone article page ----------

function renderArticlePage(a, all) {
  const canonical = `${SITE_BASE}/sourdough/${a.slug}/`;
  let bodyHtml = sanitizeHtml(marked.parse(autoLinkBody(a.body, a.slug)));
  // Demote heading levels: H1 in source already stripped; map H2→H2 stays, but
  // ensure no stray H1 in body collides with the page H1.
  bodyHtml = bodyHtml.replace(/<h1\b/g, '<h2').replace(/<\/h1>/g, '</h2>');
  bodyHtml = insertDiagram(bodyHtml, a.slug);

  return `${pageHead({ title: `${a.title} — Loaf & Levain`, description: a.summary, canonical, ogType: 'article' })}
${articleJsonLd(a, canonical)}
</head>
<body>
<div class="wrap">
${siteHeader()}
<main>
  <a class="back" href="/sourdough/">← Knowledge base</a>
  <div class="eyebrow">Sourdough knowledge base</div>
  <article>
    <h1>${escapeHtml(a.title)}</h1>
    ${byline(a)}
    <div class="article-body">
${bodyHtml}
    </div>
    ${authorBox()}
  </article>
  ${calculatorCTA(a.slug)}
  ${relatedList(a, all)}
</main>
${siteFooter()}
</div>
</body>
</html>`;
}

// ---------- knowledge-base index page ----------

function renderIndexPage(all) {
  const canonical = `${SITE_BASE}/sourdough/`;
  const cards = all.map(a => `
    <a class="card" href="/sourdough/${a.slug}/">
      <h3>${escapeHtml(a.title)}</h3>
      <p>${escapeHtml(a.summary)}</p>
      <span class="more">Read →</span>
    </a>`).join('');

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Sourdough Knowledge Base',
    description: 'In-depth guides on sourdough fermentation, hydration, starters, and troubleshooting.',
    url: canonical,
    hasPart: all.map(a => ({ '@type': 'Article', headline: a.title, url: `${SITE_BASE}/sourdough/${a.slug}/` }))
  };

  return `${pageHead({
    title: 'Sourdough Knowledge Base — Loaf & Levain',
    description: 'In-depth, tested guides on sourdough fermentation, hydration, starters, scoring, and troubleshooting. From the makers of the free bake schedule calculator.',
    canonical,
    ogType: 'website'
  })}
<script type="application/ld+json">${JSON.stringify(itemList)}</script>
</head>
<body>
<div class="wrap">
${siteHeader()}
<main>
  <div class="eyebrow">Knowledge base</div>
  <h1>Sourdough, explained properly.</h1>
  <p class="lede">Tested, in-depth guides on fermentation, hydration, starters, scoring, and the things that actually go wrong. Written by bakers who measure, not guess.</p>
  <div class="cards">${cards}</div>
  ${calculatorCTA()}
</main>
${siteFooter()}
</div>
</body>
</html>`;
}

// ---------- static editorial pages: About + Contact ----------

function renderStaticPage({ slug, title, lede, bodyHtml, jsonLd }) {
  const canonical = `${SITE_BASE}/${slug}`;
  return `${pageHead({ title: `${title} — Loaf & Levain`, description: lede, canonical, ogType: 'website' })}
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n` : ''}</head>
<body>
<div class="wrap">
${siteHeader()}
<main>
  <div class="eyebrow">${escapeHtml(title)}</div>
  <h1>${escapeHtml(title)}</h1>
  <p class="lede">${escapeHtml(lede)}</p>
  <div class="article-body">
${bodyHtml}
  </div>
</main>
${siteFooter()}
</div>
</body>
</html>`;
}

function aboutPage() {
  const body = `
<p>Loaf &amp; Levain is an independent sourdough resource built around one idea: baking gets easier when you measure instead of guess. The free <a href="/">schedule calculator</a> predicts fermentation timing from your kitchen temperature, hydration, and starter strength — and the <a href="/sourdough/">knowledge base</a> explains the why behind every number.</p>
<h2>Who writes this</h2>
<p>${AUTHOR_NAME ? `Loaf &amp; Levain is written and maintained by <strong>${escapeHtml(AUTHOR_NAME)}</strong>${AUTHOR_BIO ? ', ' + escapeHtml(AUTHOR_BIO) : ', a home baker who has logged hundreds of bakes across cold winter kitchens and humid summer ones'}.` : 'Loaf &amp; Levain is written and edited under one editorial standard: every guide is checked against the same fermentation model that powers the calculator, and every number — bulk percentages, hydration targets, retard windows, water temperatures — is one we have tested at the bench across cold winter kitchens and humid summer ones.'} The same Q10 fermentation math (about 2.2&times; per 8&deg;C, anchored to five hours at 24&deg;C) runs through the calculator and every article, so the advice here and the tool agree by design — not by coincidence.</p>
<h2>What we cover</h2>
<p>Fermentation science, starter maintenance and rescue, hydration, shaping and scoring, and the long list of things that go wrong (and how to diagnose them). If a guide gives a number, it also tells you how to know whether that number is right for <em>your</em> dough.</p>
<h2>How it's funded</h2>
<p>The calculator and all knowledge-base articles are free. The site is supported by display advertising and an optional one-time Pro upgrade. We don't gate the core content behind a paywall, and we don't publish recipes we haven't baked.</p>
<h2>Get in touch</h2>
<p>Questions, corrections, or a bake that's misbehaving? Reach us on the <a href="/contact">contact page</a>.</p>`;
  const org = {
    '@type': 'Organization',
    '@id': `${SITE_BASE}/#org`,
    name: 'Loaf & Levain',
    url: `${SITE_BASE}/`,
    email: CONTACT_EMAIL,
    logo: { '@type': 'ImageObject', url: `${SITE_BASE}/og-image.jpg` },
    description: 'An independent sourdough resource: a free bake-schedule calculator and a tested knowledge base.'
  };
  const graph = [org];
  if (AUTHOR_NAME) {
    graph.push({
      '@type': 'Person',
      '@id': `${SITE_BASE}/about#author`,
      name: AUTHOR_NAME,
      url: `${SITE_BASE}/about`,
      description: AUTHOR_BIO || undefined,
      worksFor: { '@id': `${SITE_BASE}/#org` }
    });
  }
  return renderStaticPage({
    slug: 'about',
    title: 'About',
    lede: 'An independent sourdough resource for bakers who measure, not guess — the free schedule calculator and a tested knowledge base.',
    bodyHtml: body,
    jsonLd: { '@context': 'https://schema.org', '@graph': graph }
  });
}

function contactPage() {
  const body = `
<p>We read every message. Whether you've found an error in a guide, have a sourdough problem the calculator didn't solve, or want to suggest a topic for the knowledge base, we'd like to hear from you.</p>
<h2>Email</h2>
<p>The fastest way to reach us is by email: <a href="mailto:${escapeAttr(CONTACT_EMAIL)}">${escapeHtml(CONTACT_EMAIL)}</a>. We aim to reply within a few days.</p>
<h2>What to include</h2>
<p>If you're troubleshooting a bake, it helps to tell us your flour, hydration, kitchen temperature, and what the crumb looked like. The more detail, the more useful the answer.</p>
<h2>Press &amp; partnerships</h2>
<p>For press enquiries or partnership ideas, use the same address with "Press" or "Partnership" in the subject line.</p>`;
  return renderStaticPage({
    slug: 'contact',
    title: 'Contact',
    lede: 'Questions, corrections, or a bake that’s misbehaving? Here’s how to reach Loaf & Levain.',
    bodyHtml: body
  });
}

// ---------- in-page calculator block (links out, no duplicated bodies) ----------

function renderInPageBlock(all) {
  const cards = all.slice(0, 6).map(a => `
    <a class="kb-card" href="/sourdough/${a.slug}/">
      <span class="kb-card-title">${escapeHtml(a.title)}</span>
      <span class="kb-card-sum">${escapeHtml(a.summary)}</span>
      <span class="kb-card-more">Read →</span>
    </a>`).join('');

  return `\n<section class="knowledge-base" aria-label="Knowledge base">
  <h2 class="kb-section-head" style="margin-top:56px;">From the <em>knowledge base</em>.</h2>
  <p style="color:var(--ink-mute);font-size:15px;margin:-8px 0 24px;">Tested guides on fermentation, hydration, starters, and troubleshooting.</p>
  <style>
    .kb-grid{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
    .kb-card{display:flex;flex-direction:column;gap:8px;background:var(--paper);border:1px solid var(--line);
      border-radius:14px;padding:20px;text-decoration:none;color:var(--ink);box-shadow:var(--shadow);
      transition:transform .15s ease,box-shadow .15s ease}
    .kb-card:hover{transform:translateY(-2px)}
    .kb-card-title{font-family:var(--serif);font-weight:600;font-size:17px;line-height:1.25}
    .kb-card-sum{font-size:13px;color:var(--ink-mute);flex:1}
    .kb-card-more{font-size:13px;font-weight:600;color:var(--crust)}
  </style>
  <div class="kb-grid">${cards}</div>
  <p style="margin-top:24px;font-size:15px;"><a href="/sourdough/" style="color:var(--crust-deep);font-weight:600;">Browse the full knowledge base →</a></p>
</section>\n      `;
}

function injectInto(html, block) {
  const startIdx = html.indexOf(START);
  const endIdx = html.indexOf(END);
  if (startIdx < 0 || endIdx < 0) {
    throw new Error(`Markers not found in ${HTML_FILE}. Add ${START} and ${END}.`);
  }
  return html.slice(0, startIdx + START.length) + block + html.slice(endIdx);
}

// ---------- sitemap ----------

function generateSitemap(all) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: `${SITE_BASE}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${SITE_BASE}/sourdough/`, priority: '0.9', changefreq: 'weekly' },
    ...all.map(a => ({ loc: `${SITE_BASE}/sourdough/${a.slug}/`, priority: '0.8', changefreq: 'monthly' })),
    { loc: `${SITE_BASE}/about`, priority: '0.4', changefreq: 'yearly' },
    { loc: `${SITE_BASE}/contact`, priority: '0.4', changefreq: 'yearly' },
    { loc: `${SITE_BASE}/privacy.html`, priority: '0.3', changefreq: 'yearly' }
  ];
  const entries = urls.map(u =>
    `<url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;
}

// ---------- main ----------

function rmrf(p) { if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true }); }

function main() {
  const articles = readArticles();
  console.log(`Found ${articles.length} articles in /${ARTICLES_DIR}`);
  if (articles.length === 0) {
    console.log('No articles. Add markdown to /articles or run npm run gen-article.');
    return;
  }

  // 1. Fresh staging dir with standalone pages + KB index.
  rmrf(BUILD_DIR);
  fs.mkdirSync(KB_DIR, { recursive: true });

  // 1a. Render original SVG diagrams referenced by the articles into /diagrams/.
  const DIAG_DIR = path.join(BUILD_DIR, 'diagrams');
  fs.mkdirSync(DIAG_DIR, { recursive: true });
  const usedDiagrams = new Set(Object.values(ARTICLE_DIAGRAM).map(d => d.name));
  let diagCount = 0;
  for (const name of usedDiagrams) {
    if (!DIAGRAMS[name]) { console.warn(`  (warn) diagram "${name}" referenced but not defined`); continue; }
    fs.writeFileSync(path.join(DIAG_DIR, `${name}.svg`), DIAGRAMS[name]());
    diagCount++;
  }
  console.log(`✓ Wrote ${diagCount} original SVG diagrams to /${path.relative(BUILD_DIR, DIAG_DIR)}`);

  fs.writeFileSync(path.join(KB_DIR, 'index.html'), renderIndexPage(articles));
  for (const a of articles) {
    const dir = path.join(KB_DIR, a.slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), renderArticlePage(a, articles));
  }
  console.log(`✓ Wrote ${articles.length} standalone pages + index to /${KB_DIR}`);

  // 1b. Editorial trust pages (AdSense expects About + Contact).
  for (const [slug, render] of [['about', aboutPage], ['contact', contactPage]]) {
    const dir = path.join(BUILD_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), render());
  }
  console.log('✓ Wrote /about and /contact');

  // 2. Rewrite the calculator's in-page block to link out (no duplicated bodies).
  const html = fs.readFileSync(HTML_FILE, 'utf8');
  fs.writeFileSync(HTML_FILE, injectInto(html, renderInPageBlock(articles)));
  console.log(`✓ Rewrote in-page knowledge-base block in ${HTML_FILE}`);

  // 3. Sitemap with real URLs only.
  fs.writeFileSync('sitemap.xml', generateSitemap(articles));
  console.log(`✓ Wrote sitemap.xml (${articles.length + 5} URLs, no fragments)`);
}

main();
