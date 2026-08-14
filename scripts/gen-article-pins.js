#!/usr/bin/env node
/**
 * gen-article-pins.js
 * --------------------------------------------------------------------
 * Generates 4 Pinterest pin variants (1000×1500 JPG) for every article
 * in articles/. Content is pulled from the markdown itself — headings,
 * tables, FAQ questions, pull-quotes — so new articles produce new pins
 * with no hand-authoring.
 *
 * This is the volume generator. scripts/gen-pinterest-pins.js still owns
 * the 10 hand-designed evergreen pins in dist-pins/ and is untouched.
 *
 * Run: node scripts/gen-article-pins.js
 * Output: dist-pins/articles/<slug>-<variant>.jpg
 *         dist-pins/articles/metadata.json  (title/description/hashtags/link)
 *         dist-pins/articles/queue.csv      (posting order, 2 pins/day)
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const W = 1000, H = 1500;
const SRCDIR = 'articles';
const OUTDIR = path.join('dist-pins', 'articles');
const SITE = 'https://loafandlevain.com';
const PINS_PER_DAY = 2;

// Put the searchable phrase on the pin art itself, not the editorial article
// title. Pinterest is a search engine and reads pin text; the overlay should
// say what the searcher typed. Flip to false to go back to article titles.
const KEYWORD_HEADLINE = true;

// ---------------------------------------------------------------- themes
// One theme per pin, rotated so a scheduled batch never looks repetitive.
// `weight` biases the rotation: sourdough Pinterest is a wall of warm beige
// and brown crumb photos, so the pale themes (0, 3) blend straight into the
// feed. The dark, terracotta, sage and gold ones are what stop a scroll, so
// they get pulled 3× as often.
const THEMES = [
  { bg: '#F4ECDD', text: '#1F1611', accent: '#B85C38', muted: '#6B5B4B', card: '#FBF7EE', line: '#D9CFB9', chip: '#1F1611', chipText: '#FBF7EE' },
  { bg: '#1F1611', text: '#FBF7EE', accent: '#C9A24E', muted: 'rgba(251,247,238,0.72)', card: 'rgba(251,247,238,0.07)', line: 'rgba(251,247,238,0.20)', chip: '#C9A24E', chipText: '#1F1611' },
  { bg: '#B85C38', text: '#FBF7EE', accent: '#F6E2B3', muted: 'rgba(251,247,238,0.82)', card: 'rgba(31,22,17,0.18)', line: 'rgba(251,247,238,0.28)', chip: '#FBF7EE', chipText: '#B85C38' },
  { bg: '#FBF7EE', text: '#1F1611', accent: '#B85C38', muted: '#6B5B4B', card: '#F1E7D4', line: '#D9CFB9', chip: '#1F1611', chipText: '#FBF7EE' },
  { bg: '#6F8060', text: '#FBF7EE', accent: '#F0E3B8', muted: 'rgba(251,247,238,0.80)', card: 'rgba(251,247,238,0.10)', line: 'rgba(251,247,238,0.24)', chip: '#FBF7EE', chipText: '#3F4B35' },
  { bg: '#C9A24E', text: '#1F1611', accent: '#7A3F1F', muted: '#4A3B2E', card: 'rgba(31,22,17,0.10)', line: 'rgba(31,22,17,0.22)', chip: '#1F1611', chipText: '#C9A24E' },
];

// Index-aligned to THEMES. 1 = pale/blends in, 3 = high contrast.
const THEME_WEIGHT = [1, 3, 3, 1, 3, 2];

/**
 * Expand the weights into a deterministic rotation. Built in passes (all
 * themes with weight >= 1, then >= 2, then >= 3) so a heavy theme never lands
 * twice in a row — a straight repeat-then-flatten would give runs of six
 * identical backgrounds.
 */
const THEME_ROTATION = (() => {
  const order = THEMES.map((_, i) => i).sort((a, b) => THEME_WEIGHT[b] - THEME_WEIGHT[a] || a - b);
  const rotation = [];
  for (let pass = 1; pass <= Math.max(...THEME_WEIGHT); pass++) {
    for (const i of order) if (THEME_WEIGHT[i] >= pass) rotation.push(i);
  }
  return rotation;
})();

const SERIF = 'Georgia, serif';
// Manrope isn't installed on most machines and librsvg falls back to a
// monospace face, which looks broken. Stick to fonts that actually resolve.
const SANS = 'Segoe UI, Helvetica Neue, Arial, sans-serif';
const MONO = 'JetBrains Mono, monospace';

// Average glyph width as a fraction of font-size. Used for wrapping, since
// SVG <text> has no auto-wrap and we render headless.
const WIDTH_FACTOR = { [SERIF]: 0.50, [SANS]: 0.53, [MONO]: 0.60 };

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

/** Strip inline markdown down to plain prose. */
function plain(s) {
  return String(s)
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function wrap(text, maxWidth, fontSize, font = SANS, maxLines = 99) {
  const per = fontSize * (WIDTH_FACTOR[font] || 0.53);
  const max = Math.max(1, Math.floor(maxWidth / per));
  const lines = [];
  let line = '';
  for (const word of String(text).split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= max) { line = next; continue; }
    if (line) lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].replace(/[.,;:]$/, '')}…`;
    return kept;
  }
  return lines;
}

function textBlock(lines, x, y, lineHeight, attrs) {
  return lines.map((l, i) =>
    `<text x="${x}" y="${y + i * lineHeight}" ${attrs}>${esc(l)}</text>`
  ).join('\n    ');
}

/** Truncate to a whole word within `n` characters. */
function clip(s, n) {
  const t = plain(s);
  if (t.length <= n) return t;
  return `${t.slice(0, t.lastIndexOf(' ', n)).replace(/[.,;:—-]$/, '')}…`;
}

/** Truncate on a sentence boundary when there is one worth using. */
function clipSentence(s, n) {
  const t = plain(s);
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  return stop > n * 0.45 ? cut.slice(0, stop + 1) : clip(s, n);
}

// ---------------------------------------------------------------- parsing
function parseArticle(file) {
  const raw = fs.readFileSync(path.join(SRCDIR, file), 'utf8');
  const slug = file.replace(/^\d+-/, '').replace(/\.md$/, '');
  const lines = raw.split(/\r?\n/);

  const title = plain((lines.find((l) => l.startsWith('# ')) || `# ${slug}`).slice(2));

  // First real paragraph after the H1.
  let intro = '';
  for (let i = lines.findIndex((l) => l.startsWith('# ')) + 1; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l || l.startsWith('#') || l.startsWith('|')) { if (intro) break; continue; }
    intro += (intro ? ' ' : '') + l;
    if (intro.length > 400) break;
  }
  intro = plain(intro);

  // H2 section titles, skipping the meta ones that make bad pin copy.
  const SKIP = /^(common questions|frequently asked|faq|sources|references)/i;
  const h2 = lines
    .filter((l) => /^## /.test(l))
    .map((l) => plain(l.slice(3)))
    .filter((t) => !SKIP.test(t));

  // FAQ: H3 question + the paragraph under it.
  const faq = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^### /.test(lines[i])) continue;
    const q = plain(lines[i].slice(4));
    let a = '';
    for (let j = i + 1; j < lines.length && !/^#{2,3} /.test(lines[j]); j++) {
      const l = lines[j].trim();
      if (!l) { if (a) break; continue; }
      a += (a ? ' ' : '') + l;
    }
    if (q && a) faq.push({ q, a: plain(a) });
  }
  // Not every H3 is a question — articles use them for section steps too
  // ("Cut too early (the zero-effort fix)"). A pin captioned COMMON QUESTIONS
  // over a list of non-questions reads as broken, so keep only real ones; an
  // article that ends up with fewer than three just gets a different layout.
  const questions = faq.filter((f) => /\?\s*$/.test(f.q));

  // First markdown table: header row, separator, then body rows.
  let table = null;
  for (let i = 0; i < lines.length - 2; i++) {
    if (!/^\|/.test(lines[i]) || !/^\|[\s:|-]+\|$/.test(lines[i + 1].trim())) continue;
    const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => plain(c));
    const head = cells(lines[i]);
    const rows = [];
    for (let j = i + 2; j < lines.length && /^\|/.test(lines[j]); j++) rows.push(cells(lines[j]));
    if (rows.length >= 3) table = { head, rows };
    break;
  }

  // Pull-quote: a punchy standalone sentence, preferring the closing section.
  const sentences = plain(raw.replace(/^#.*$/gm, '').replace(/^\|.*$/gm, ''))
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 55 && s.length <= 145 && /^[A-Z"“]/.test(s) && !/[|]/.test(s));
  const quote = sentences.length ? sentences[sentences.length - 1] : intro;

  return { file, slug, title, intro, h2, faq: questions, table, quote };
}

// ---------------------------------------------------------------- chrome
/** Split an article title into an upright half and an italic accent half. */
function splitTitle(title) {
  const colon = title.indexOf(':');
  if (colon > 8 && colon < title.length - 8) {
    return [title.slice(0, colon).trim(), title.slice(colon + 1).trim()];
  }
  const words = title.split(' ');
  if (words.length < 4) return [title, ''];
  const cut = Math.ceil(words.length / 2);
  return [words.slice(0, cut).join(' '), words.slice(cut).join(' ')];
}

function titleBlock(title, t) {
  const [head, tail] = splitTitle(title);
  const longest = Math.max(head.length, tail.length || 0);
  const size = longest > 34 ? 54 : longest > 26 ? 62 : longest > 18 ? 72 : 80;
  const lh = size * 1.1;

  const headLines = wrap(head, 880, size, SERIF, 2);
  const tailLines = tail ? wrap(tail, 880, size, SERIF, 2) : [];
  let y = 300;
  let svg = textBlock(headLines, 60, y, lh,
    `font-family="${SERIF}" font-size="${size}" font-weight="400" letter-spacing="-2" fill="${t.text}"`);
  y += headLines.length * lh;
  if (tailLines.length) {
    svg += '\n    ' + textBlock(tailLines, 60, y, lh,
      `font-family="${SERIF}" font-size="${size}" font-style="italic" font-weight="400" letter-spacing="-2" fill="${t.accent}"`);
    y += tailLines.length * lh;
  }
  return { svg, bottom: y + 30 };
}

function frame(pin, t, body) {
  const soft = ['#F4ECDD', '#FBF7EE'].includes(t.bg);
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  ${soft ? `<defs>
    <linearGradient id="warm" x1="80%" y1="20%" x2="20%" y2="80%">
      <stop offset="0%" stop-color="#F8EDD4" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${t.bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>` : ''}

  <text x="60" y="160" font-family="${MONO}" font-size="22" letter-spacing="6" font-weight="500" fill="${t.accent}">${esc(pin.eyebrow)}</text>
  <line x1="60" y1="180" x2="240" y2="180" stroke="${t.accent}" stroke-width="2"/>

  ${body}

  <line x1="60" y1="1380" x2="940" y2="1380" stroke="${t.line}" stroke-width="1"/>
  <text x="60" y="1430" font-family="${MONO}" font-size="20" letter-spacing="3" font-weight="500" fill="${t.muted}">LOAFANDLEVAIN.COM</text>
  <text x="940" y="1430" text-anchor="end" font-family="${MONO}" font-size="14" letter-spacing="2" fill="${t.muted}">FREE SCHEDULE CALCULATOR</text>
</svg>`;
}

function ctaChip(label, y, t) {
  const w = 60 + label.length * 13;
  return `<g transform="translate(${(W - w) / 2}, ${y})">
      <rect width="${w}" height="78" rx="4" fill="${t.chip}"/>
      <text x="${w / 2}" y="50" text-anchor="middle" font-family="${MONO}" font-size="21" letter-spacing="3" fill="${t.chipText}">${esc(label)}</text>
    </g>`;
}

// ---------------------------------------------------------------- variants
// Each returns an SVG body string, or null when the article lacks the
// source material for that layout.

function vHook(a, t) {
  const { svg, bottom } = titleBlock(a.headline || a.title, t);
  const lines = wrap(clipSentence(a.intro, 280), 880, 34, SERIF, 8);
  const lh = 52;
  // Sit the paragraph + CTA as one block, centred in the space under the title.
  const blockH = lines.length * lh + 180;
  const y = bottom + Math.max(40, Math.floor((1340 - bottom - blockH) / 2));
  return `${svg}
    ${textBlock(lines, 60, y, lh, `font-family="${SERIF}" font-size="34" fill="${t.muted}"`)}
    ${ctaChip('READ THE FULL GUIDE →', y + lines.length * lh + 60, t)}`;
}

function vSteps(a, t) {
  if (a.h2.length < 3) return null;
  const items = a.h2.slice(0, 5);
  const { svg, bottom } = titleBlock(a.headline || a.title, t);
  const gap = Math.min(150, Math.floor((1340 - bottom - 40) / items.length));
  const top = bottom + Math.max(40, Math.floor((1340 - bottom - gap * items.length) / 2));
  const cards = items.map((h, i) => {
    const lines = wrap(h, 740, 30, SERIF, 2);
    const height = gap - 18;
    return `<g transform="translate(60, ${top + i * gap})">
      <rect width="880" height="${height}" rx="6" fill="${t.card}"/>
      <rect width="6" height="${height}" fill="${t.accent}"/>
      <text x="40" y="${height / 2 + 12}" font-family="${MONO}" font-size="34" font-weight="600" fill="${t.accent}">${i + 1}</text>
      ${textBlock(lines, 108, height / 2 - (lines.length - 1) * 18 + 10, 36,
        `font-family="${SERIF}" font-size="30" font-weight="500" fill="${t.text}"`)}
    </g>`;
  }).join('\n    ');
  return `${svg}\n    ${cards}`;
}

/**
 * Pair the label column with the tersest data column — a prose "use case"
 * column truncates to nothing at pin size, a "3–4 h" column reads instantly.
 * Shared so the description names the same two columns the pin renders.
 */
function tableColumns(table) {
  if (!table) return null;
  const { head, rows } = table;
  if (head.length < 2) return null;
  const body = rows.slice(0, 7);
  const li = 0;
  let ri = 1, terse = Infinity;
  for (let i = 1; i < head.length; i++) {
    const avg = body.reduce((s, r) => s + (r[i] || '').length, 0) / body.length;
    if (avg < terse) { terse = avg; ri = i; }
  }
  return { head, body, li, ri };
}

function vTable(a, t) {
  const cols = tableColumns(a.table);
  if (!cols) return null;
  const { head, body, li, ri } = cols;
  const { svg, bottom } = titleBlock(a.headline || a.title, t);
  const step = Math.min(80, Math.floor((1340 - bottom - 60) / (body.length + 1)));
  const top = bottom + Math.max(60, Math.floor((1340 - bottom - step * (body.length + 1)) / 2));

  let out = `<text x="60" y="${top}" font-family="${MONO}" font-size="20" letter-spacing="2" fill="${t.muted}">${esc(clip(head[li], 22).toUpperCase())}</text>
    <text x="580" y="${top}" font-family="${MONO}" font-size="20" letter-spacing="2" fill="${t.muted}">${esc(clip(head[ri], 24).toUpperCase())}</text>
    <line x1="60" y1="${top + 18}" x2="940" y2="${top + 18}" stroke="${t.text}" stroke-width="2"/>`;
  body.forEach((r, i) => {
    const y = top + step * (i + 1);
    out += `\n    <text x="60" y="${y}" font-family="${MONO}" font-size="26" font-weight="500" fill="${t.accent}">${esc(clip(r[li], 20))}</text>
    <text x="580" y="${y}" font-family="${MONO}" font-size="26" fill="${t.text}">${esc(clip(r[ri], 22))}</text>
    <line x1="60" y1="${y + 18}" x2="940" y2="${y + 18}" stroke="${t.line}" stroke-width="1"/>`;
  });
  return `${svg}\n    ${out}`;
}

function vFaq(a, t) {
  if (a.faq.length < 3) return null;
  const items = a.faq.slice(0, 4);
  const { svg, bottom } = titleBlock(a.headline || a.title, t);
  const gap = Math.min(190, Math.floor((1340 - bottom - 40) / items.length));
  const top = bottom + Math.max(40, Math.floor((1340 - bottom - gap * items.length) / 2));
  const cards = items.map((f, i) => {
    const q = wrap(f.q, 800, 30, SERIF, 2);
    const ansTop = 46 + q.length * 36;
    const ans = wrap(clip(f.a, 110), 800, 22, SANS, Math.max(1, Math.floor((gap - ansTop - 20) / 30)));
    return `<g transform="translate(60, ${top + i * gap})">
      <rect width="880" height="${gap - 20}" rx="6" fill="${t.card}"/>
      ${textBlock(q, 36, 52, 36, `font-family="${SERIF}" font-size="30" font-weight="500" fill="${t.accent}"`)}
      ${textBlock(ans, 36, ansTop, 30, `font-family="${SANS}" font-size="22" fill="${t.text}"`)}
    </g>`;
  }).join('\n    ');
  return `${svg}\n    ${cards}`;
}

function vQuote(a, t) {
  const [head] = splitTitle(a.headline || a.title);
  const kicker = wrap(clip(head, 44), 880, 48, SERIF, 2);
  const q = wrap(clip(a.quote, 150), 880, 56, SERIF, 6);
  const rule = 330 + kicker.length * 60;
  const lh = 76;
  const y = rule + Math.max(80, Math.floor((1260 - rule - q.length * lh) / 2));
  return `${textBlock(kicker, 60, 300, 60, `font-family="${SERIF}" font-size="48" letter-spacing="-1.5" fill="${t.muted}"`)}
    <line x1="60" y1="${rule}" x2="200" y2="${rule}" stroke="${t.accent}" stroke-width="3"/>
    ${textBlock(q, 60, y, lh, `font-family="${SERIF}" font-size="56" font-style="italic" letter-spacing="-2" fill="${t.text}"`)}
    ${ctaChip('THE FULL BREAKDOWN →', Math.min(1240, y + q.length * lh + 70), t)}`;
}

const VARIANTS = [
  { key: 'hook', eyebrow: 'THE FULL GUIDE', build: vHook },
  { key: 'steps', eyebrow: 'WHAT YOU NEED TO KNOW', build: vSteps },
  { key: 'table', eyebrow: 'THE NUMBERS', build: vTable },
  { key: 'faq', eyebrow: 'COMMON QUESTIONS', build: vFaq },
  { key: 'quote', eyebrow: 'READ THIS FIRST', build: vQuote },
];
const TARGET_VARIANTS = 4;

// ---------------------------------------------------------------- keywords
// Pinterest ranks on the search phrase, and weights roughly the first 50
// characters of a title and description hardest. Article titles are written
// for readers ("Rye sourdough is different — here are the rules"); nobody
// searches that. Each article therefore carries a `primary` search phrase and
// an `angle` that picks the phrasing template, giving all four of its pins a
// DIFFERENT keyword instead of four copies of the same title.
//
// No hashtags anywhere: Pinterest dropped them from its own recommendations in
// 2022. Keywords in natural sentences are what actually index.
const KEYWORDS = {
  'bulk-fermentation-by-temperature': ['sourdough bulk fermentation', 'process'],
  'why-sourdough-gummy': ['gummy sourdough crumb', 'problem'],
  'revive-forgotten-starter': ['reviving a sourdough starter', 'process'],
  'hydration-explained': ['sourdough hydration', 'spec'],
  'cold-retard-vs-same-day': ['cold retard sourdough', 'process'],
  'float-test-explained': ['the sourdough float test', 'process'],
  'ddt-formula-water-temperature': ['sourdough water temperature', 'spec'],
  'fix-dense-sourdough': ['dense sourdough bread', 'problem'],
  'starter-feeding-ratio': ['sourdough starter feeding ratios', 'spec'],
  'stretch-and-fold': ['stretch and fold sourdough', 'process'],
  'scoring-sourdough': ['sourdough scoring patterns', 'process'],
  'autolyse-vs-fermentolyse': ['autolyse vs fermentolyse', 'spec'],
  'whole-wheat-sourdough': ['whole wheat sourdough', 'process'],
  'rye-sourdough-rules': ['rye sourdough bread', 'process'],
  'winter-sourdough': ['sourdough in a cold kitchen', 'process'],
  'summer-sourdough': ['sourdough in a warm kitchen', 'process'],
  'starter-from-scratch': ['sourdough starter from scratch', 'process'],
  'sourdough-troubleshooting': ['sourdough problems', 'problem'],
};

// Phrasing per variant, so the four pins for one article compete on four
// different searches rather than cannibalising each other.
const PHRASING = {
  process: {
    hook: (p) => `${p}: the complete guide`,
    steps: (p) => `${p}, step by step`,
    table: (p) => `${p}: timing chart`,
    faq: (p) => `${p}: your questions answered`,
    quote: (p) => `${p}: what actually matters`,
  },
  problem: {
    hook: (p) => `how to fix ${p}`,
    steps: (p) => `${p}: causes and fixes`,
    table: (p) => `${p}: diagnosis chart`,
    faq: (p) => `${p}: your questions answered`,
    quote: (p) => `${p}: the real cause`,
  },
  spec: {
    hook: (p) => `${p}, explained`,
    steps: (p) => `${p}: what to know`,
    table: (p) => `${p} chart`,
    faq: (p) => `${p}: your questions answered`,
    quote: (p) => `${p}: what actually matters`,
  },
};

const FILLER = /^(how|to|the|a|an|is|my|why|explained|guide|rules|from|by|and|vs|fix)$/i;

/**
 * Fallback for articles the weekly cron adds later, so a new article still
 * gets usable keywords with no hand-authoring. Hand-tune it into KEYWORDS
 * above when the article proves itself.
 */
function deriveKeyword(a) {
  const words = a.slug.split('-').filter((w) => !FILLER.test(w));
  let primary = words.join(' ').trim() || a.slug.replace(/-/g, ' ');
  if (!/sourdough|starter|levain/i.test(primary)) primary = `sourdough ${primary}`;
  const hay = `${a.slug} ${a.title}`;
  const angle = /gummy|dense|fix|problem|troubleshoot|wrong|fail/i.test(hay) ? 'problem'
    : /how|make|revive|scor|fold|autolyse|retard|test|step/i.test(hay) ? 'process'
    : 'spec';
  return [primary, angle];
}

const sentenceCase = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** All five keyword titles for an article, keyed by variant. */
function keywordTitles(a) {
  const [primary, angle] = KEYWORDS[a.slug] || deriveKeyword(a);
  const tpl = PHRASING[angle] || PHRASING.spec;
  return Object.fromEntries(
    Object.entries(tpl).map(([key, fn]) => [key, sentenceCase(fn(primary))])
  );
}

// ---------------------------------------------------------------- copy
const CLOSERS = {
  hook: 'Full guide plus the free sourdough schedule calculator that does the math for your kitchen.',
  steps: 'Every step in the full guide, with a free sourdough schedule calculator to time it.',
  table: 'The full table and the reasoning behind it, plus a free calculator for your own numbers.',
  faq: 'All the answers in one place, plus a free sourdough schedule calculator.',
  quote: 'The full explanation — and the free sourdough calculator that plans the bake around it.',
};

/**
 * Keyword phrase first, then a detail taken from the part of the article this
 * particular pin actually shows, then the CTA. Pulling the detail per variant
 * is what stops four pins from sharing one intro paragraph — near-duplicate
 * descriptions are a spam signal on Pinterest.
 */
/** Table headers are written to sit under a heading ("vs. 24°C reference"), so
 *  strip the leading connective before splicing one into a sentence. */
const asNoun = (h) => plain(h).replace(/^(vs\.?|versus|per|by)\s+/i, '').toLowerCase();

function describe(a, variantKey) {
  const lead = a.kw[variantKey];
  const cols = tableColumns(a.table);
  let detail;
  switch (variantKey) {
    case 'steps':
      // Headings keep their own casing (Q10, DDT die if lowercased) and are
      // joined with a middot, because several contain commas themselves.
      detail = a.h2.length ? `Covers: ${a.h2.slice(0, 3).join(' · ')}` : '';
      break;
    case 'table':
      detail = cols
        ? `${asNoun(cols.head[cols.li])} against ${asNoun(cols.head[cols.ri])}, ${cols.body.length} rows you can read at a glance`
        : '';
      break;
    case 'faq':
      detail = a.faq.length ? `Starting with the one everyone asks: ${a.faq[0].q}` : '';
      break;
    case 'quote':
      detail = clip(a.quote, 140);
      break;
    default:
      detail = clipSentence(a.intro, 170);
  }
  if (!detail) detail = clipSentence(a.intro, 170);
  detail = sentenceCase(detail);
  if (!/[.!?…]$/.test(detail)) detail += '.';
  return `${lead}. ${detail} ${CLOSERS[variantKey]}`.replace(/\s+/g, ' ').trim();
}

function linkFor(a, variantKey) {
  const q = new URLSearchParams({
    utm_source: 'pinterest',
    utm_medium: 'social',
    utm_campaign: 'article-pins',
    utm_content: `${a.slug}-${variantKey}`,
  });
  return `${SITE}/sourdough/${a.slug}/?${q}`;
}

// ---------------------------------------------------------------- main
async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });

  const files = fs.readdirSync(SRCDIR).filter((f) => f.endsWith('.md')).sort();
  const articles = files.map(parseArticle);
  for (const a of articles) a.kw = keywordTitles(a);
  for (const a of articles) {
    if (!KEYWORDS[a.slug]) console.warn(`  ! ${a.slug}: keywords derived, not hand-tuned → "${a.kw.hook}"`);
  }

  // Preserve any hand-edited title/description/hashtags across reruns.
  let existing = [];
  try { existing = JSON.parse(fs.readFileSync(path.join(OUTDIR, 'metadata.json'), 'utf8')); } catch { /* first run */ }

  const pins = [];
  let themeIndex = 0;

  articles.forEach((a, ai) => {
    // Every layout the article has source material for…
    const usable = VARIANTS
      .map((v) => ({ v, body: (t) => v.build(a, t) }))
      .filter((c) => c.body(THEMES[0]) !== null);
    // …then start the pick at a rotating offset, so article 1 and article 2
    // don't both end up with the same four layouts.
    const offset = ai % usable.length;
    let made = 0;
    for (let i = 0; i < usable.length && made < TARGET_VARIANTS; i++) {
      const { v } = usable[(offset + i) % usable.length];
      const t = THEMES[THEME_ROTATION[themeIndex % THEME_ROTATION.length]];
      themeIndex++;
      made++;
      const headline = KEYWORD_HEADLINE ? a.kw[v.key] : a.title;
      pins.push({ article: a, variant: v, theme: t, svg: frame(v, t, v.build({ ...a, headline }, t)) });
    }
    if (made < TARGET_VARIANTS) {
      console.warn(`  ! ${a.slug}: only ${made} variants (needs more tables/headings/FAQ)`);
    }
  });

  const metadata = [];
  for (const p of pins) {
    const file = `${p.article.slug}-${p.variant.key}.jpg`;
    await sharp(Buffer.from(p.svg)).jpeg({ quality: 92 }).toFile(path.join(OUTDIR, file));
    const prev = existing.find((m) => m.file === file) || {};
    // Pinterest caps titles at 100 chars and descriptions at 500.
    const auto = {
      title: clip(p.article.kw[p.variant.key], 95),
      description: clip(describe(p.article, p.variant.key), 480),
    };
    // Keep hand-edits, drop stale auto-copy. `_auto` records what the
    // generator last produced, which is the only way to tell "the operator
    // rewrote this" from "this is last run's output" — a plain `prev.title ||`
    // would freeze every article on the copy it was first generated with.
    const keep = (field) =>
      prev[field] && prev._auto && prev._auto[field] !== prev[field] ? prev[field] : auto[field];
    metadata.push({
      file,
      title: keep('title'),
      description: keep('description'),
      link: linkFor(p.article, p.variant.key),
      article: p.article.slug,
      articleTitle: p.article.title,
      variant: p.variant.key,
      _auto: auto,
    });
  }

  fs.writeFileSync(path.join(OUTDIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

  // Posting queue: round-robin by variant so consecutive pins are always a
  // different article AND a different layout.
  const byVariant = new Map();
  for (const m of metadata) {
    if (!byVariant.has(m.variant)) byVariant.set(m.variant, []);
    byVariant.get(m.variant).push(m);
  }
  const queue = [];
  // Rotate each bucket by its own index first, otherwise every round would
  // start at article 0 and one article would fill a whole day.
  const buckets = [...byVariant.values()].map((b, bi) => {
    const k = bi % b.length;
    return b.slice(k).concat(b.slice(0, k));
  });
  for (let round = 0; ; round++) {
    const before = queue.length;
    for (const b of buckets) if (b[round]) queue.push(b[round]);
    if (queue.length === before) break;
  }

  const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const csv = ['day,slot,file,title,description,link'];
  queue.forEach((m, i) => {
    csv.push([
      Math.floor(i / PINS_PER_DAY) + 1,
      (i % PINS_PER_DAY) + 1,
      csvCell(m.file),
      csvCell(m.title),
      csvCell(m.description),
      csvCell(m.link),
    ].join(','));
  });
  fs.writeFileSync(path.join(OUTDIR, 'queue.csv'), csv.join('\n') + '\n');

  const days = Math.ceil(queue.length / PINS_PER_DAY);
  console.log(`\n✓ ${metadata.length} pins from ${articles.length} articles → ${OUTDIR}/`);
  console.log(`  queue.csv = ${days} days at ${PINS_PER_DAY} pins/day`);
}

main().catch((e) => { console.error(e); process.exit(1); });
