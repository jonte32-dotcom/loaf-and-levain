#!/usr/bin/env node
/**
 * configure.js
 * --------------------------------------------------------------------
 * Interactive (or env-driven) setup of the MONETIZATION_CONFIG block in
 * sourdough-schedule.html. Run this once you have your IDs from
 * Amazon, Gumroad, ConvertKit, BMC, AdSense.
 *
 * Modes:
 *   1. Env vars:
 *      AMAZON_TAG=mytag-20 GUMROAD_URL=https://... npm run configure
 *
 *   2. Config file (config.local.json, gitignored):
 *      Create config.local.json with the keys, run npm run configure
 *
 *   3. Interactive:
 *      npm run configure -- --interactive
 *      (prompts for each value)
 */
import fs from 'node:fs';
import readline from 'node:readline';

const HTML = 'sourdough-schedule.html';
const CONFIG_FILE = 'config.local.json';

const FIELDS = [
  { key: 'amazonTag',            envVar: 'AMAZON_TAG',         match: /amazonTag:\s*'[^']*'/,            replace: v => `amazonTag: '${v}'` },
  { key: 'amazonRegion',         envVar: 'AMAZON_REGION',      match: /amazonRegion:\s*'[^']*'/,         replace: v => `amazonRegion: '${v}'` },
  { key: 'gumroadProductURL',    envVar: 'GUMROAD_URL',        match: /gumroadProductURL:\s*'[^']*'/,    replace: v => `gumroadProductURL: '${v}'` },
  { key: 'convertkitFormAction', envVar: 'CONVERTKIT_FORM',    match: /convertkitFormAction:\s*'[^']*'/, replace: v => `convertkitFormAction: '${v}'` },
  { key: 'bmcHandle',            envVar: 'BMC_HANDLE',         match: /bmcHandle:\s*'[^']*'/,            replace: v => `bmcHandle: '${v}'` },
  { key: 'adsenseClient',        envVar: 'ADSENSE_CLIENT',     match: /adsenseClient:\s*'[^']*'/,        replace: v => `adsenseClient: '${v}'` },
  { key: 'adsenseSlotInContent', envVar: 'ADSENSE_SLOT_INCONTENT', match: /inContent:\s*'[^']*'/,        replace: v => `inContent: '${v}'` },
  { key: 'adsenseSlotMidContent',envVar: 'ADSENSE_SLOT_MIDCONTENT', match: /midContent:\s*'[^']*'/,       replace: v => `midContent: '${v}'` }
];

function loadConfigFile() {
  if (!fs.existsSync(CONFIG_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { return {}; }
}

async function promptInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = q => new Promise(r => rl.question(q, r));
  const out = {};
  console.log('\nSourdough Schedule — interactive setup\n──────────────────────────────────────');
  console.log('Press ENTER to keep current value (placeholder).\n');
  for (const f of FIELDS) {
    const v = (await ask(`${f.key} (${f.envVar}): `)).trim();
    if (v) out[f.key] = v;
  }
  rl.close();
  return out;
}

async function main() {
  const interactive = process.argv.includes('--interactive');
  let values = { ...loadConfigFile() };
  for (const f of FIELDS) {
    if (process.env[f.envVar]) values[f.key] = process.env[f.envVar];
  }
  if (interactive) values = { ...values, ...(await promptInteractive()) };

  const present = Object.entries(values).filter(([_, v]) => v && !String(v).includes('REPLACE_ME'));
  if (!present.length) {
    console.log('No values supplied. Set env vars, create config.local.json, or run with --interactive.');
    return;
  }

  let html = fs.readFileSync(HTML, 'utf8');
  let changed = 0;
  for (const f of FIELDS) {
    if (!values[f.key]) continue;
    const newLine = f.replace(values[f.key]);
    if (f.match.test(html)) {
      html = html.replace(f.match, newLine);
      changed += 1;
      console.log(`✓ ${f.key} → ${values[f.key]}`);
    }
  }
  fs.writeFileSync(HTML, html);
  console.log(`\nUpdated ${changed} field(s) in ${HTML}.`);
}

main().catch(e => { console.error(e); process.exit(1); });
