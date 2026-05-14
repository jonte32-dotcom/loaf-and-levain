import sharp from 'sharp';
import fs from 'node:fs';

const SIZE = 500;
const svg = `
<svg width="${SIZE}" height="${SIZE}" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#F4ECDD"/>
      <stop offset="100%" stop-color="#EBE0CB"/>
    </linearGradient>
    <radialGradient id="warm" cx="65%" cy="35%" r="55%">
      <stop offset="0%" stop-color="#F8EDD4" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#EBE0CB" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Cream circle background -->
  <circle cx="250" cy="250" r="250" fill="url(#bg)"/>
  <circle cx="250" cy="250" r="250" fill="url(#warm)"/>

  <!-- Bread loaf -->
  <ellipse cx="250" cy="290" rx="180" ry="125" fill="#C9A24E" opacity="0.45"/>
  <ellipse cx="250" cy="262" rx="180" ry="125" fill="#FBF7EE" stroke="#1F1611" stroke-width="14"/>

  <!-- Top scoring -->
  <path d="M125 262 Q175 150 250 150 Q325 150 375 262" stroke="#B85C38" stroke-width="13" fill="none" stroke-linecap="round"/>

  <!-- Decorative score marks -->
  <path d="M155 220 L185 250" stroke="#B85C38" stroke-width="11" stroke-linecap="round"/>
  <path d="M250 138 L250 178" stroke="#B85C38" stroke-width="11" stroke-linecap="round"/>
  <path d="M345 220 L315 250" stroke="#B85C38" stroke-width="11" stroke-linecap="round"/>

  <!-- Brand text bottom -->
  <text x="250" y="430" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="34" font-style="italic" font-weight="500"
        fill="#1F1611" letter-spacing="-1">
    Loaf &amp; Levain
  </text>
</svg>`;

const outPath = 'C:/Users/Aras_/Desktop/loaf-and-levain-avatar.jpg';

await sharp(Buffer.from(svg))
  .jpeg({ quality: 92 })
  .toFile(outPath);

console.log(`✓ Wrote ${outPath}`);
console.log(`  Size: ${fs.statSync(outPath).size} bytes`);
