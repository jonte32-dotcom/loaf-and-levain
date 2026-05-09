import sharp from 'sharp';
import fs from 'node:fs';

const W = 1200, H = 630;
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F4ECDD"/>
      <stop offset="100%" stop-color="#EBE0CB"/>
    </linearGradient>
    <radialGradient id="warm" cx="80%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#F8EDD4" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#EBE0CB" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#warm)"/>

  <!-- LEFT: text -->
  <text x="80" y="115"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="18" font-weight="500"
        letter-spacing="6"
        fill="#B85C38">
    LOAF &amp; LEVAIN
  </text>
  <line x1="80" y1="135" x2="220" y2="135" stroke="#B85C38" stroke-width="2"/>

  <text x="80" y="235"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="86" font-weight="400"
        letter-spacing="-3" fill="#1F1611">
    Free sourdough
  </text>
  <text x="80" y="325"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="86" font-weight="400"
        letter-spacing="-3" fill="#1F1611">
    schedule <tspan font-style="italic" fill="#B85C38">calculator.</tspan>
  </text>

  <text x="80" y="395"
        font-family="Georgia, serif"
        font-size="22" font-weight="400"
        fill="#4A3B2E">
    Calibrated for your kitchen temperature.
  </text>
  <text x="80" y="425"
        font-family="Georgia, serif"
        font-size="22" font-weight="400"
        fill="#4A3B2E">
    Live tracking · calendar export · no signup.
  </text>

  <text x="80" y="560"
        font-family="ui-monospace, monospace"
        font-size="16" font-weight="500" letter-spacing="3"
        fill="#8A7866">
    LOAFANDLEVAIN.COM
  </text>

  <!-- RIGHT: bread -->
  <g transform="translate(770, 200)">
    <ellipse cx="180" cy="170" rx="170" ry="92" fill="#C9A24E" opacity="0.45"/>
    <ellipse cx="180" cy="130" rx="170" ry="92" fill="#FBF7EE" stroke="#1F1611" stroke-width="7"/>
    <path d="M40 130 Q105 25 180 25 Q255 25 320 130" stroke="#B85C38" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M75 75 L110 110 M180 13 L180 55 M285 75 L250 110" stroke="#B85C38" stroke-width="7" stroke-linecap="round"/>
  </g>
</svg>`;

const outPath = 'og-image.jpg';
await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(outPath);
console.log(`✓ Wrote ${outPath} (${fs.statSync(outPath).size} bytes, ${W}×${H})`);
