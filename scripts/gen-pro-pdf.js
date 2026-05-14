#!/usr/bin/env node
/**
 * gen-pro-pdf.js
 * --------------------------------------------------------------------
 * Renders pro-pdf/sourdough-schedule-pro.md into a print-ready HTML
 * file with brand styling. Open in browser → Ctrl+P → Save as PDF
 * → upload to Gumroad. No external dependencies beyond `marked`.
 */
import fs from 'node:fs';
import { marked } from 'marked';

const SRC = 'pro-pdf/sourdough-schedule-pro.md';
const OUT = 'pro-pdf/sourdough-schedule-pro.html';

const raw = fs.readFileSync(SRC, 'utf8');

// Strip YAML frontmatter (--- ... ---) from the top
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n/);
let body = raw;
const meta = { title: 'Sourdough Schedule Pro', subtitle: '', author: 'Loaf & Levain' };
if (fmMatch) {
  const fm = fmMatch[1];
  fm.split('\n').forEach(line => {
    const m = line.match(/^(\w+):\s*"?([^"]+)"?/);
    if (m) meta[m[1]] = m[2];
  });
  body = raw.slice(fmMatch[0].length);
}

marked.setOptions({ gfm: true, breaks: false });
const contentHtml = marked.parse(body);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${meta.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,300..700,0..100,0..1&family=Manrope:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>
  @page {
    size: A4;
    margin: 22mm 18mm 24mm 18mm;
    @bottom-center {
      content: "Loaf & Levain · Sourdough Schedule Pro";
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      color: #8A7866;
    }
    @bottom-right {
      content: counter(page);
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      color: #4A3B2E;
    }
  }
  @page :first {
    margin: 0;
    @bottom-center { content: ""; }
    @bottom-right { content: ""; }
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body {
    background: #FBF7EE;
    color: #1F1611;
    font-family: 'Manrope', system-ui, sans-serif;
    line-height: 1.55;
    font-size: 10.5pt;
    -webkit-font-smoothing: antialiased;
  }

  /* COVER PAGE */
  .cover {
    width: 100%;
    height: 297mm;
    padding: 30mm 24mm;
    background: linear-gradient(180deg, #F4ECDD 0%, #EBE0CB 100%);
    position: relative;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .cover::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.18;
    background-image: url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.12, 0 0 0 0 0.08, 0 0 0 0 0.06, 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
    pointer-events: none;
  }
  .cover-top, .cover-mid, .cover-bot { position: relative; z-index: 1; }
  .cover-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #B85C38;
  }
  .cover-eyebrow::after {
    content: "";
    display: block;
    width: 60mm;
    height: 1px;
    background: #B85C38;
    margin-top: 8pt;
    opacity: 0.6;
  }
  .cover h1 {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    font-size: 80pt;
    line-height: 0.95;
    letter-spacing: -0.025em;
    font-variation-settings: "SOFT" 50, "WONK" 1;
    color: #1F1611;
    margin-top: 30pt;
  }
  .cover h1 em {
    font-style: italic;
    color: #B85C38;
    font-variation-settings: "SOFT" 100, "WONK" 1;
  }
  .cover-subtitle {
    font-family: 'Fraunces', serif;
    font-size: 18pt;
    font-weight: 400;
    line-height: 1.3;
    color: #4A3B2E;
    margin-top: 22pt;
    max-width: 90%;
  }
  .cover-bread {
    margin: 32pt 0;
    width: 100mm;
    height: auto;
  }
  .cover-version {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #8A7866;
  }
  .cover-author {
    font-family: 'Fraunces', serif;
    font-size: 14pt;
    font-style: italic;
    color: #1F1611;
    margin-top: 4pt;
  }
  .cover-domain {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10pt;
    letter-spacing: 0.08em;
    color: #B85C38;
    margin-top: 14pt;
  }

  /* CONTENT */
  .content {
    padding: 0;
  }
  .content > * + * { margin-top: 0; }

  h1 {
    font-family: 'Fraunces', serif;
    font-weight: 400;
    font-size: 32pt;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: #1F1611;
    margin: 28pt 0 14pt;
    page-break-before: always;
    page-break-after: avoid;
    font-variation-settings: "SOFT" 50;
  }
  h1:first-of-type { page-break-before: avoid; }
  h1::after {
    content: "";
    display: block;
    width: 36mm;
    height: 2px;
    background: #B85C38;
    margin-top: 6pt;
  }
  h2 {
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: 20pt;
    line-height: 1.2;
    letter-spacing: -0.015em;
    color: #1F1611;
    margin: 22pt 0 10pt;
    page-break-after: avoid;
  }
  h3 {
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: 14pt;
    color: #4A3B2E;
    margin: 16pt 0 6pt;
    page-break-after: avoid;
  }
  h4 {
    font-family: 'Manrope', sans-serif;
    font-weight: 700;
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #B85C38;
    margin: 12pt 0 4pt;
    page-break-after: avoid;
  }

  p {
    margin: 0 0 9pt;
    line-height: 1.6;
    color: #1F1611;
    orphans: 3;
    widows: 3;
  }
  p strong { color: #1F1611; font-weight: 600; }
  p em { font-style: italic; color: #4A3B2E; }
  a { color: #B85C38; text-decoration: none; }

  ul, ol {
    margin: 0 0 9pt 18pt;
    padding-left: 0;
  }
  li { margin-bottom: 3pt; line-height: 1.55; }

  hr {
    border: none;
    border-top: 1px solid #D9CFB9;
    margin: 18pt 0;
    page-break-after: avoid;
  }

  blockquote {
    border-left: 3px solid #B85C38;
    padding-left: 12pt;
    margin: 12pt 0;
    font-style: italic;
    color: #4A3B2E;
  }

  /* TABLES — recipes & schedules */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0 14pt;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  th {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 500;
    font-size: 8.5pt;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #4A3B2E;
    text-align: left;
    background: #EBE0CB;
    padding: 6pt 8pt;
    border-bottom: 1.5pt solid #1F1611;
  }
  td {
    padding: 5pt 8pt;
    border-bottom: 1px solid #D9CFB9;
    vertical-align: top;
  }
  td:first-child { font-weight: 500; color: #1F1611; }
  tr:nth-child(even) td { background: rgba(235, 224, 203, 0.35); }

  /* CODE / monospace blocks (used for flowcharts) */
  pre, code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9pt;
    color: #1F1611;
  }
  pre {
    background: #F4ECDD;
    border-left: 3px solid #B85C38;
    padding: 10pt 12pt;
    margin: 10pt 0 14pt;
    border-radius: 2pt;
    line-height: 1.5;
    page-break-inside: avoid;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  code {
    background: #F4ECDD;
    padding: 1pt 4pt;
    border-radius: 2pt;
    font-size: 9.5pt;
  }
  pre code { background: transparent; padding: 0; }

  /* TOC styling — use for the section that introduces parts */
  .part-divider {
    page-break-before: always;
    text-align: center;
    padding: 60mm 0;
  }

  /* AVOID page breaks inside critical blocks */
  table, pre, blockquote { page-break-inside: avoid; }
  h1, h2, h3, h4 { page-break-after: avoid; }

  /* Print-only tweaks */
  @media print {
    html, body { background: #FBF7EE; }
  }
  @media screen {
    body { max-width: 210mm; margin: 0 auto; padding: 24px 0; box-shadow: 0 0 24px rgba(0,0,0,0.12); }
    .cover, .content { background: #FBF7EE; }
    .content { padding: 22mm 18mm 24mm; }
  }
</style>
</head>
<body>

<!-- COVER PAGE -->
<section class="cover">
  <div class="cover-top">
    <div class="cover-eyebrow">${meta.author || 'Loaf & Levain'}</div>
  </div>
  <div class="cover-mid">
    <h1><em>${meta.title.replace('Pro', '').trim()}</em><br>Pro.</h1>
    <div class="cover-subtitle">${meta.subtitle || '30 recipes · climate-tuned schedules · troubleshooting flowcharts'}</div>

    <svg class="cover-bread" viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="68" rx="78" ry="22" fill="#C9A24E" opacity="0.45"/>
      <ellipse cx="100" cy="56" rx="78" ry="22" fill="#FBF7EE" stroke="#1F1611" stroke-width="2"/>
      <path d="M30 56 Q55 18 100 18 Q145 18 170 56" stroke="#B85C38" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M48 38 L58 50 M100 12 L100 26 M152 38 L142 50" stroke="#B85C38" stroke-width="2" stroke-linecap="round"/>
    </svg>
  </div>
  <div class="cover-bot">
    <div class="cover-version">Edition 1.0 · 2026</div>
    <div class="cover-author">A book by ${meta.author || 'Loaf & Levain'}</div>
    <div class="cover-domain">loafandlevain.com</div>
  </div>
</section>

<!-- CONTENT -->
<div class="content">
${contentHtml}
</div>

</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`✓ Wrote ${OUT}`);
console.log(`  Open in browser → Ctrl+P → Save as PDF → upload to Gumroad`);
