import sharp from 'sharp';
import fs from 'node:fs';

const W = 1280, H = 720;
const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
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

  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#warm)"/>

  <!-- LEFT: text -->
  <text x="80" y="120"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="20" font-weight="500"
        letter-spacing="6"
        fill="#B85C38">
    LOAF &amp; LEVAIN — EDITION 1.0
  </text>
  <line x1="80" y1="138" x2="240" y2="138" stroke="#B85C38" stroke-width="2"/>

  <text x="80" y="240"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="100" font-weight="400"
        letter-spacing="-3" fill="#1F1611">
    Sourdough
  </text>
  <text x="80" y="340"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="100" font-weight="400"
        letter-spacing="-3" fill="#1F1611">
    Schedule <tspan font-style="italic" fill="#B85C38">Pro.</tspan>
  </text>

  <text x="80" y="420"
        font-family="Georgia, serif"
        font-size="26" font-weight="400"
        fill="#4A3B2E">
    30 recipes · climate-tuned schedules
  </text>
  <text x="80" y="455"
        font-family="Georgia, serif"
        font-size="26" font-weight="400"
        fill="#4A3B2E">
    troubleshooting flowcharts · starter rescue
  </text>

  <text x="80" y="640"
        font-family="ui-monospace, monospace"
        font-size="18" font-weight="500" letter-spacing="3"
        fill="#8A7866">
    LOAFANDLEVAIN.COM
  </text>

  <!-- RIGHT: bread -->
  <g transform="translate(800, 220)">
    <ellipse cx="200" cy="180" rx="180" ry="100" fill="#C9A24E" opacity="0.45"/>
    <ellipse cx="200" cy="140" rx="180" ry="100" fill="#FBF7EE" stroke="#1F1611" stroke-width="7"/>
    <path d="M50 140 Q115 30 200 30 Q285 30 350 140" stroke="#B85C38" stroke-width="8" fill="none" stroke-linecap="round"/>
    <path d="M85 80 L120 115 M200 18 L200 60 M315 80 L280 115" stroke="#B85C38" stroke-width="7" stroke-linecap="round"/>
  </g>

  <!-- Price badge -->
  <g transform="translate(1140, 100)">
    <circle r="70" fill="#B85C38"/>
    <text text-anchor="middle" y="-8"
          font-family="ui-monospace, monospace"
          font-size="11" letter-spacing="2"
          fill="#FBF7EE">SAVE 35%</text>
    <text text-anchor="middle" y="20"
          font-family="Georgia, serif" font-style="italic"
          font-size="36" font-weight="500"
          fill="#FBF7EE">$19</text>
    <text text-anchor="middle" y="42"
          font-family="ui-monospace, monospace"
          font-size="9" letter-spacing="1"
          fill="#FBF7EE" opacity="0.75">WAS $29</text>
  </g>
</svg>`;

const outPath = 'C:/Users/Aras_/Desktop/sourdough-pro-cover-horizontal.jpg';
await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(outPath);
console.log(`✓ Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
