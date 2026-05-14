import sharp from 'sharp';
import fs from 'node:fs';

const SIZE = 1280;
const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 1280 1280" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F4ECDD"/>
      <stop offset="100%" stop-color="#EBE0CB"/>
    </linearGradient>
    <radialGradient id="warm" cx="70%" cy="25%" r="80%">
      <stop offset="0%" stop-color="#F8EDD4" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#EBE0CB" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Cream background -->
  <rect width="1280" height="1280" fill="url(#bg)"/>
  <rect width="1280" height="1280" fill="url(#warm)"/>

  <!-- Top eyebrow -->
  <text x="120" y="180"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="22" font-weight="500"
        letter-spacing="6"
        fill="#B85C38">
    LOAF &amp; LEVAIN — EDITION 1.0
  </text>
  <line x1="120" y1="200" x2="320" y2="200" stroke="#B85C38" stroke-width="2"/>

  <!-- Big serif title -->
  <text x="120" y="380"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="160" font-weight="400"
        letter-spacing="-4"
        fill="#1F1611">
    Sourdough
  </text>
  <text x="120" y="540"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="160" font-weight="400"
        letter-spacing="-4"
        fill="#1F1611">
    Schedule
  </text>
  <text x="120" y="700"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="160" font-style="italic"
        font-weight="400" letter-spacing="-4"
        fill="#B85C38">
    Pro.
  </text>

  <!-- Subtitle -->
  <text x="120" y="780"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="34" font-weight="400"
        fill="#4A3B2E">
    30 recipes · climate-tuned schedules
  </text>
  <text x="120" y="828"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="34" font-weight="400"
        fill="#4A3B2E">
    troubleshooting flowcharts
  </text>

  <!-- Bread illustration bottom right -->
  <g transform="translate(720, 920)">
    <ellipse cx="220" cy="160" rx="200" ry="100" fill="#C9A24E" opacity="0.45"/>
    <ellipse cx="220" cy="120" rx="200" ry="100" fill="#FBF7EE" stroke="#1F1611" stroke-width="8"/>
    <path d="M50 120 Q120 0 220 0 Q320 0 390 120" stroke="#B85C38" stroke-width="9" fill="none" stroke-linecap="round"/>
    <path d="M85 60 L120 100 M220 -10 L220 30 M355 60 L320 100" stroke="#B85C38" stroke-width="8" stroke-linecap="round"/>
  </g>

  <!-- Bottom domain -->
  <text x="120" y="1180"
        font-family="ui-monospace, 'JetBrains Mono', monospace"
        font-size="22" font-weight="500" letter-spacing="3"
        fill="#8A7866">
    LOAFANDLEVAIN.COM
  </text>

  <!-- Price tag (corner) -->
  <g transform="translate(1080, 120)">
    <circle r="80" fill="#B85C38"/>
    <text text-anchor="middle" y="-8"
          font-family="ui-monospace, monospace"
          font-size="14" letter-spacing="2"
          fill="#FBF7EE">SAVE 35%</text>
    <text text-anchor="middle" y="22"
          font-family="Georgia, serif" font-style="italic"
          font-size="42" font-weight="500"
          fill="#FBF7EE">$19</text>
    <text text-anchor="middle" y="46"
          font-family="ui-monospace, monospace"
          font-size="11" letter-spacing="1"
          fill="#FBF7EE" opacity="0.75">WAS $29</text>
  </g>
</svg>`;

const outPath = 'C:/Users/Aras_/Desktop/sourdough-pro-cover.jpg';

await sharp(Buffer.from(svg))
  .jpeg({ quality: 92 })
  .toFile(outPath);

console.log(`✓ Wrote ${outPath}`);
console.log(`  Size: ${fs.statSync(outPath).size} bytes`);
