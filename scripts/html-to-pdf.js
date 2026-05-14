#!/usr/bin/env node
/**
 * html-to-pdf.js
 * --------------------------------------------------------------------
 * Converts an HTML file to a clean PDF (no header/footer/file path)
 * using headless Chrome/Edge. No manual print-dialog wrestling.
 *
 * Usage:
 *   node scripts/html-to-pdf.js <input.html> <output.pdf>
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: node scripts/html-to-pdf.js <input.html> <output.pdf>');
  process.exit(1);
}

const input = path.resolve(args[0]);
const output = path.resolve(args[1]);

if (!fs.existsSync(input)) {
  console.error(`Input not found: ${input}`);
  process.exit(1);
}

// Find an available Chromium-based browser
const browsers = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const browser = browsers.find(p => fs.existsSync(p));
if (!browser) {
  console.error('No Chrome or Edge found. Install one or adjust paths.');
  process.exit(1);
}
console.log(`Using browser: ${browser}`);

// Convert input file path to file:// URL
const inputUrl = 'file:///' + input.replace(/\\/g, '/').replace(/^\/+/, '');

// Headless print-to-pdf
// --no-pdf-header-footer suppresses the date/url Chrome auto-injects
// --virtual-time-budget gives time for fonts/CSS to load
const cmd = [
  `"${browser}"`,
  '--headless=new',
  '--disable-gpu',
  '--no-pdf-header-footer',
  '--virtual-time-budget=10000',
  `--print-to-pdf="${output}"`,
  `"${inputUrl}"`
].join(' ');

console.log(`Generating PDF...`);
try {
  execSync(cmd, { stdio: 'inherit' });
  if (fs.existsSync(output)) {
    const size = fs.statSync(output).size;
    console.log(`✓ Wrote ${output} (${(size / 1024).toFixed(1)} KB)`);
  } else {
    console.error('PDF was not created. Check Chrome/Edge command output above.');
    process.exit(1);
  }
} catch (e) {
  console.error('Failed:', e.message);
  process.exit(1);
}
