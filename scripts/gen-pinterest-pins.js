#!/usr/bin/env node
/**
 * gen-pinterest-pins.js
 * --------------------------------------------------------------------
 * Generates 10 Pinterest pins (1000×1500 JPG) from brand-styled SVGs.
 * Each pin is fully designed in the Loaf & Levain brand voice.
 *
 * Run: node scripts/gen-pinterest-pins.js
 * Output: dist-pins/pin-01.jpg ... pin-10.jpg
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const W = 1000, H = 1500;
const OUTDIR = 'dist-pins';

const PINS = [
  {
    id: '01',
    bg: '#F4ECDD',
    style: 'lightTable',
    eyebrow: 'THE Q10 RULE',
    title: 'Bulk time by',
    titleEm: 'kitchen temp',
    content: `<g transform="translate(60, 480)">
      ${tableHeader('ROOM TEMP', 'BULK @ 20% INOC', 0)}
      ${tableRow('16°C / 61°F', '~11 hours', 65)}
      ${tableRow('20°C / 68°F', '~7.5 hours', 130)}
      ${tableRow('22°C / 72°F', '~6 hours', 195)}
      ${tableRow('24°C / 75°F', '~5 hours', 260)}
      ${tableRow('26°C / 79°F', '~4 hours', 325)}
      ${tableRow('28°C / 82°F', '~3.3 hours', 390)}
      ${tableRow('30°C / 86°F', '~2.7 hours', 455)}
    </g>`,
    article: 'bulk-fermentation-by-temperature'
  },
  {
    id: '02',
    bg: '#1F1611',
    style: 'darkGrid',
    eyebrow: 'SOURDOUGH HYDRATION',
    title: 'Pick the',
    titleEm: 'right hydration.',
    content: `<text x="60" y="540" font-family="Manrope, sans-serif" font-size="28" font-weight="400" fill="rgba(251,247,238,0.7)" letter-spacing="-0.3">Higher = more open crumb. Also:</text>
    <text x="60" y="582" font-family="Manrope, sans-serif" font-size="28" font-weight="400" fill="rgba(251,247,238,0.7)" letter-spacing="-0.3">stickier, harder to shape, more skill.</text>
    ${hydrationCard('65%', 'Beginner / sandwich', 60, 700)}
    ${hydrationCard('75%', 'Classic country', 510, 700)}
    ${hydrationCard('80%', 'Open crumb push', 60, 920)}
    ${hydrationCard('85%', 'Ciabatta', 510, 920)}
    ${hydrationCard('100%', 'Pan de cristal', 60, 1140)}`,
    article: 'hydration-explained'
  },
  {
    id: '03',
    bg: '#B85C38',
    style: 'orangeList',
    eyebrow: 'TROUBLESHOOTING',
    title: 'Why is my',
    titleEm: 'sourdough gummy?',
    content: `${troubleshootItem('1. You cut it warm', 'Wait 1+ hour after bake', 540)}
    ${troubleshootItem('2. Internal temp too low', 'Aim for 96-99°C', 700)}
    ${troubleshootItem('3. Underproofed bulk', 'Extend 1-2h or raise inoc', 860)}
    ${troubleshootItem('4. Overproofed bulk', 'Shorten or drop inoc 5%', 1020)}
    ${troubleshootItem('5. Not enough steam', 'Use Dutch oven covered 20m', 1180)}`,
    article: 'why-sourdough-gummy'
  },
  {
    id: '04',
    bg: '#FBF7EE',
    style: 'lightFormula',
    eyebrow: 'PRO BAKER SECRET',
    title: 'Get the',
    titleEm: 'perfect dough temp.',
    content: `<g transform="translate(80, 550)">
      <rect width="840" height="200" rx="8" fill="#1F1611"/>
      <text x="420" y="86" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="34" fill="#FBF7EE">Water = (<tspan fill="#C9A24E" font-weight="600">Target × 4</tspan>)</text>
      <text x="420" y="146" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="34" fill="#FBF7EE">− Flour − Room − Friction</text>
    </g>
    <g transform="translate(80, 850)">
      <text x="0" y="0" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="2" fill="#B85C38" font-weight="600">TARGET</text>
      <text x="0" y="40" font-family="Manrope, sans-serif" font-size="26" fill="#4A3B2E">Aim 24-26°C</text>
      <text x="0" y="120" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="2" fill="#B85C38" font-weight="600">FLOUR</text>
      <text x="0" y="160" font-family="Manrope, sans-serif" font-size="26" fill="#4A3B2E">Usually = room temp</text>
      <text x="420" y="0" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="2" fill="#B85C38" font-weight="600">ROOM</text>
      <text x="420" y="40" font-family="Manrope, sans-serif" font-size="26" fill="#4A3B2E">Measure, not thermo</text>
      <text x="420" y="120" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="2" fill="#B85C38" font-weight="600">FRICTION</text>
      <text x="420" y="160" font-family="Manrope, sans-serif" font-size="26" fill="#4A3B2E">2-4°C hand · 5-8°C mixer</text>
    </g>`,
    article: 'ddt-formula-water-temperature'
  },
  {
    id: '05',
    bg: '#6F8060',
    style: 'greenChecklist',
    eyebrow: 'STARTER CHECK',
    title: 'Is your starter',
    titleEm: 'ready?',
    content: `<text x="60" y="540" font-family="Manrope, sans-serif" font-size="26" fill="rgba(251,247,238,0.7)">4 of 6 = ready to mix. Skip the float test,</text>
    <text x="60" y="578" font-family="Manrope, sans-serif" font-size="26" fill="rgba(251,247,238,0.7)">watch the rise.</text>
    ${checklistItem('At least doubled since feeding', 700)}
    ${checklistItem('Domed top (not flat or sunken)', 800)}
    ${checklistItem('Bubbles visible on the sides', 900)}
    ${checklistItem('Smells like beer + yogurt', 1000)}
    ${checklistItem('Stretchy gel-like consistency', 1100)}
    ${checklistItem('Floats in water (optional)', 1200)}`,
    article: 'float-test-explained'
  },
  {
    id: '06',
    bg: '#FBF7EE',
    style: 'lightCTA',
    eyebrow: 'FREE PLANNER',
    title: 'Stop guessing.',
    titleEm: 'Start baking.',
    content: `<text x="500" y="800" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#4A3B2E">A free sourdough schedule calculator</text>
    <text x="500" y="850" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#4A3B2E">that knows your kitchen isn't 22°C.</text>
    <g transform="translate(330, 950)">
      <rect width="340" height="80" rx="4" fill="#1F1611"/>
      <text x="170" y="50" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="3" fill="#FBF7EE">TRY IT FREE →</text>
    </g>`,
    article: 'schedule'
  },
  {
    id: '07',
    bg: '#1F1611',
    style: 'darkTimeline',
    eyebrow: 'SATURDAY COUNTRY LOAF',
    title: 'A real schedule,',
    titleEm: 'real timestamps.',
    content: `${timelineStep('14:00 Sat', 'Feed levain', 540)}
    ${timelineStep('20:00 Sat', 'Mix flour + water', 640)}
    ${timelineStep('20:30 Sat', 'Add levain + salt', 740)}
    ${timelineStep('21:10 Sat', 'Folds × 4 (every 30 min)', 840)}
    ${timelineStep('02:50 Sun', 'Pre-shape + bench rest', 940)}
    ${timelineStep('03:30 Sun', 'Cold retard 12 h', 1040)}
    ${timelineStep('16:30 Sun', 'Bake', 1140)}`,
    article: 'cold-retard-vs-same-day'
  },
  {
    id: '08',
    bg: '#C9A24E',
    style: 'goldStatement',
    eyebrow: 'WHY BULK IS WRONG',
    title: 'Your bread is',
    titleEm: 'dense.',
    content: `<text x="60" y="640" font-family="Georgia, serif" font-size="60" font-weight="400" fill="#1F1611" letter-spacing="-2">The reason isn't</text>
    <text x="60" y="710" font-family="Georgia, serif" font-size="60" font-weight="400" fill="#1F1611" letter-spacing="-2">what you think.</text>
    <text x="60" y="900" font-family="Manrope, sans-serif" font-size="28" font-weight="400" fill="#1F1611" letter-spacing="-0.3">90% of dense sourdough = underproofed</text>
    <text x="60" y="940" font-family="Manrope, sans-serif" font-size="28" font-weight="400" fill="#1F1611" letter-spacing="-0.3">bulk because you measured the room,</text>
    <text x="60" y="980" font-family="Manrope, sans-serif" font-size="28" font-weight="400" fill="#1F1611" letter-spacing="-0.3">not the dough.</text>`,
    article: 'fix-dense-sourdough'
  },
  {
    id: '09',
    bg: '#FBF7EE',
    style: 'lightMyths',
    eyebrow: 'SOURDOUGH MYTHS',
    title: '3 things you',
    titleEm: "don't need.",
    content: `${mythCard('The float test', 'Volume + dome + bubbles is more reliable. Float can lie both ways.', 540)}
    ${mythCard('Filtered water', 'Tap is fine for dough. Only matters for new starter.', 720)}
    ${mythCard('Specialty sourdough flour', 'King Arthur Bread Flour does the job. Marketing ≠ better bread.', 900)}`,
    article: 'float-test-explained'
  },
  {
    id: '10',
    bg: '#B85C38',
    style: 'orangeCover',
    eyebrow: 'PRO',
    title: 'Sourdough Schedule',
    titleEm: 'Pro.',
    content: `<text x="500" y="830" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="rgba(251,247,238,0.85)">30 recipes. 3 climate-tuned</text>
    <text x="500" y="870" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="rgba(251,247,238,0.85)">schedules each. 12 troubleshooting</text>
    <text x="500" y="910" text-anchor="middle" font-family="Georgia, serif" font-size="30" fill="rgba(251,247,238,0.85)">flowcharts. Lifetime updates.</text>
    <g transform="translate(370, 1010)">
      <rect width="260" height="76" rx="3" fill="rgba(251,247,238,0.12)" stroke="rgba(251,247,238,0.3)" stroke-width="1"/>
      <text x="130" y="50" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="3" fill="#FBF7EE">$19 · LAUNCH</text>
    </g>`,
    article: 'pro'
  }
];

function tableHeader(left, right, y) {
  return `
    <text x="0" y="${y}" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="2" fill="#8A7866">${left}</text>
    <text x="600" y="${y}" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="2" fill="#8A7866">${right}</text>
    <line x1="0" y1="${y + 18}" x2="880" y2="${y + 18}" stroke="#1F1611" stroke-width="2"/>`;
}
function tableRow(left, right, y) {
  return `
    <text x="0" y="${y}" font-family="JetBrains Mono, monospace" font-size="28" fill="#B85C38" font-weight="500">${left}</text>
    <text x="600" y="${y}" font-family="JetBrains Mono, monospace" font-size="28" fill="#1F1611">${right}</text>
    <line x1="0" y1="${y + 18}" x2="880" y2="${y + 18}" stroke="#D9CFB9" stroke-width="1"/>`;
}
function hydrationCard(pct, label, x, y) {
  return `
    <g transform="translate(${x}, ${y})">
      <rect width="430" height="180" rx="6" fill="rgba(251,247,238,0.06)" stroke="rgba(251,247,238,0.18)" stroke-width="1.5"/>
      <text x="32" y="80" font-family="Georgia, serif" font-size="64" font-weight="500" fill="#C9A24E">${pct}</text>
      <text x="32" y="130" font-family="JetBrains Mono, monospace" font-size="20" fill="rgba(251,247,238,0.7)" letter-spacing="1">${label}</text>
    </g>`;
}
function troubleshootItem(title, sub, y) {
  return `
    <g transform="translate(60, ${y})">
      <rect width="880" height="130" rx="6" fill="rgba(31,22,17,0.18)"/>
      <rect width="6" height="130" fill="#1F1611"/>
      <text x="40" y="56" font-family="Georgia, serif" font-size="34" font-weight="500" fill="#FBF7EE">${title}</text>
      <text x="40" y="100" font-family="Manrope, sans-serif" font-size="22" fill="rgba(251,247,238,0.85)">${sub}</text>
    </g>`;
}
function checklistItem(text, y) {
  return `
    <g transform="translate(60, ${y})">
      <circle cx="32" cy="0" r="22" fill="#C9A24E"/>
      <text x="32" y="9" text-anchor="middle" font-family="Manrope, sans-serif" font-size="26" font-weight="700" fill="#1F1611">✓</text>
      <text x="78" y="10" font-family="Manrope, sans-serif" font-size="28" fill="#FBF7EE">${text}</text>
    </g>`;
}
function timelineStep(time, title, y) {
  return `
    <g transform="translate(60, ${y})">
      <circle cx="0" cy="0" r="9" fill="#FBF7EE" stroke="#B85C38" stroke-width="2.5"/>
      <line x1="0" y1="14" x2="0" y2="86" stroke="#B85C38" stroke-width="1.5" opacity="0.6"/>
      <text x="36" y="-8" font-family="JetBrains Mono, monospace" font-size="20" fill="#B85C38">${time}</text>
      <text x="36" y="22" font-family="Georgia, serif" font-size="30" font-weight="500" fill="#FBF7EE">${title}</text>
    </g>`;
}
function mythCard(title, body, y) {
  return `
    <g transform="translate(60, ${y})">
      <rect width="880" height="160" rx="6" fill="#EBE0CB"/>
      <rect width="6" height="160" fill="#B85C38"/>
      <text x="36" y="50" font-family="Georgia, serif" font-size="32" font-weight="500" fill="#B85C38">${title}</text>
      <text x="36" y="100" font-family="Manrope, sans-serif" font-size="22" fill="#1F1611">${body}</text>
    </g>`;
}

function buildSvg(pin) {
  const isDark = ['#1F1611', '#B85C38', '#6F8060', '#C9A24E'].includes(pin.bg);
  const titleColor = isDark ? '#FBF7EE' : '#1F1611';
  const emColor = isDark ? '#C9A24E' : '#B85C38';
  const eyebrowColor = isDark ? '#C9A24E' : '#B85C38';
  const urlColor = isDark ? 'rgba(251,247,238,0.6)' : '#8A7866';
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="${pin.bg}"/>
  ${pin.bg === '#F4ECDD' || pin.bg === '#FBF7EE' ? `
  <defs>
    <linearGradient id="warm" x1="80%" y1="20%" x2="20%" y2="80%">
      <stop offset="0%" stop-color="#F8EDD4" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${pin.bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#warm)"/>` : ''}

  <text x="60" y="160" font-family="JetBrains Mono, monospace" font-size="22" letter-spacing="6" font-weight="500" fill="${eyebrowColor}">${pin.eyebrow}</text>
  <line x1="60" y1="180" x2="240" y2="180" stroke="${eyebrowColor}" stroke-width="2"/>

  <text x="60" y="320" font-family="Georgia, serif" font-size="80" font-weight="400" letter-spacing="-3" fill="${titleColor}">${pin.title}</text>
  <text x="60" y="412" font-family="Georgia, serif" font-size="80" font-style="italic" font-weight="400" letter-spacing="-3" fill="${emColor}">${pin.titleEm}</text>

  ${pin.content}

  <text x="60" y="1430" font-family="JetBrains Mono, monospace" font-size="20" letter-spacing="3" font-weight="500" fill="${urlColor}">LOAFANDLEVAIN.COM</text>
  <text x="940" y="1430" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="14" letter-spacing="2" fill="${urlColor}">${pin.id}/10</text>
</svg>`;
}

async function main() {
  if (!fs.existsSync(OUTDIR)) fs.mkdirSync(OUTDIR, { recursive: true });

  for (const pin of PINS) {
    const svg = buildSvg(pin);
    const out = path.join(OUTDIR, `pin-${pin.id}.jpg`);
    await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(out);
    console.log(`✓ ${out} (${(fs.statSync(out).size / 1024).toFixed(1)} KB)`);
  }

  // Write metadata for posting
  const metadata = PINS.map(p => ({
    file: `pin-${p.id}.jpg`,
    title: `${p.title} ${p.titleEm}`,
    description: '',
    article: p.article
  }));
  fs.writeFileSync(path.join(OUTDIR, 'metadata.json'), JSON.stringify(metadata, null, 2));
  console.log(`\nWrote ${PINS.length} pins to ${OUTDIR}/`);
}

main().catch(e => { console.error(e); process.exit(1); });
