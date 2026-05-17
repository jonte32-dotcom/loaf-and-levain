#!/usr/bin/env node
/**
 * post-pinterest-pin.js
 * --------------------------------------------------------------------
 * Posts the next un-posted pin to Pinterest via their API.
 * Tracks state in pinterest-state.json to avoid duplicate posts.
 *
 * Required env vars:
 *   PINTEREST_TOKEN     - Pinterest API access token
 *   PINTEREST_BOARD_ID  - target board ID (default: read from config)
 *
 * Usage:
 *   node scripts/post-pinterest-pin.js
 */
import fs from 'node:fs';
import path from 'node:path';

const PINTEREST_TOKEN = process.env.PINTEREST_TOKEN || (() => {
  try { return JSON.parse(fs.readFileSync('config.local.json', 'utf8')).pinterestToken; }
  catch { return null; }
})();

const PINTEREST_BOARD_ID = process.env.PINTEREST_BOARD_ID || (() => {
  try { return JSON.parse(fs.readFileSync('config.local.json', 'utf8')).pinterestBoardId; }
  catch { return null; }
})();

if (!PINTEREST_TOKEN || !PINTEREST_BOARD_ID) {
  console.error('Missing PINTEREST_TOKEN or PINTEREST_BOARD_ID in env or config.local.json');
  console.error('Setup: see PINTEREST-SETUP.md');
  process.exit(1);
}

const SITE_BASE = process.env.SITE_BASE || 'https://loafandlevain.com';
const PINS_DIR = 'dist-pins';
const STATE_FILE = 'pinterest-state.json';

const PIN_DESCRIPTIONS = {
  '01': {
    title: 'Sourdough bulk fermentation time by kitchen temperature',
    description: 'The single chart every sourdough baker needs. Bulk time scales with temperature — a 22°C kitchen and an 18°C kitchen are not the same recipe. Use this Q10 table to plan your bulk for any kitchen between 16°C and 30°C. Free schedule calculator does the math for any inoculation, hydration, and recipe.\n\n#sourdough #sourdoughbread #breadbaking #bulkfermentation #naturalleaven',
    link: '#bulk-fermentation-by-temperature'
  },
  '02': {
    title: 'Sourdough hydration: 65%, 75%, 80%, 85% — which to pick',
    description: 'Higher hydration doesn\'t always mean better bread. Pick the hydration that matches your skill, your flour, and the bread you want. From sandwich loaves at 65% to ciabatta at 85% to pan de cristal at 100% — the full breakdown of what works at each level.\n\n#sourdough #sourdoughhydration #breadbaking #breadhydration',
    link: '#hydration-explained'
  },
  '03': {
    title: 'Why is my sourdough gummy inside (and how to fix it)',
    description: 'Gummy crumb is the most common sourdough failure mode and the cause is almost never the one bakers expect. Five real diagnoses ranked by how often they actually explain it: cut while warm, underbaked, underproofed, overproofed, no steam.\n\n#sourdough #sourdoughtroubleshooting #breadbaking #gummycrumb',
    link: '#why-sourdough-gummy'
  },
  '04': {
    title: 'The DDT formula: water temperature for perfect dough',
    description: 'Professional bakers calculate water temperature so dough lands at a known temperature after mixing. The math takes ten seconds. The payoff is bulk fermentation runs on schedule. Worked examples for winter, summer, hand mixing, and stand mixers.\n\n#sourdough #ddtformula #doughtemperature #breadbaking #professionalbaking',
    link: '#ddt-formula-water-temperature'
  },
  '05': {
    title: 'Is your sourdough starter ready? 6-point checklist',
    description: 'The float test isn\'t the only indicator and sometimes lies in both directions. Use a 6-point readiness check: volume, dome, bubbles on sides, smell, consistency, and (optionally) the float. 4 of 6 = ready to mix.\n\n#sourdoughstarter #sourdough #breadbaking #starterhealth #naturalleaven',
    link: '#float-test-explained'
  },
  '06': {
    title: 'Free sourdough schedule calculator — calibrated for your kitchen',
    description: 'Stop guessing when bulk is done. A free, no-signup, no-ads sourdough schedule calculator that knows your kitchen temperature isn\'t 22°C. Generates timing schedules from your inputs in real time, with calendar export and live bake tracking.\n\n#sourdough #sourdoughschedule #breadbaking #freesourdough #sourdoughcalculator',
    link: ''
  },
  '07': {
    title: 'A real sourdough schedule with timestamps',
    description: 'Saturday country loaf with 12-hour cold retard, calibrated for a 22°C kitchen. Feed levain 14:00 Saturday, mix 20:00, fold every 30 min, retard overnight, bake Sunday afternoon. The free calculator gives you a schedule like this in 5 seconds for any recipe.\n\n#sourdoughschedule #sourdough #breadbakingschedule #countryloaf',
    link: '#cold-retard-vs-same-day'
  },
  '08': {
    title: 'Your sourdough is dense — the reason isn\'t what you think',
    description: '90% of dense sourdough comes from underproofed bulk because the baker measured room temperature instead of dough temperature. The dough is usually 1–4°C warmer than the room from mixing friction. Twelve other causes diagnosed in order of frequency.\n\n#sourdough #densesourdough #sourdoughtroubleshooting #breadbaking',
    link: '#fix-dense-sourdough'
  },
  '09': {
    title: '3 sourdough tools and habits you don\'t actually need',
    description: 'The float test isn\'t reliable. Filtered water doesn\'t matter for dough (only starter). Specialty sourdough flour is mostly marketing. Three sourdough beliefs that waste money and time, and what to use instead.\n\n#sourdough #sourdoughmyths #breadbaking #sourdoughtips',
    link: '#float-test-explained'
  },
  '10': {
    title: 'Sourdough Schedule Pro — 30 recipes, climate-tuned schedules',
    description: 'Three timing tables for every recipe — cold kitchen (15-18°C), standard (20-24°C), hot (26-32°C). 30 recipes from country loaf to panettone. 12 troubleshooting flowcharts. Pay once, lifetime updates. $19 launch pricing.\n\n#sourdough #sourdoughrecipes #breadbaking #sourdoughebook',
    link: ''
  }
};

function readState() {
  if (!fs.existsSync(STATE_FILE)) return { posted: [] };
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return { posted: [] }; }
}
function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function postPin(pinFile, meta) {
  const imagePath = path.join(PINS_DIR, pinFile);
  if (!fs.existsSync(imagePath)) throw new Error(`Image not found: ${imagePath}`);

  // Pinterest API requires upload via base64 data URL or hosted URL
  const imageBuffer = fs.readFileSync(imagePath);
  const base64 = imageBuffer.toString('base64');

  const link = meta.link ? `${SITE_BASE}/${meta.link.startsWith('#') ? '' : ''}${meta.link}` : SITE_BASE;

  const body = {
    title: meta.title.slice(0, 100),
    description: meta.description.slice(0, 800),
    link,
    board_id: PINTEREST_BOARD_ID,
    media_source: {
      source_type: 'image_base64',
      content_type: 'image/jpeg',
      data: base64
    }
  };

  const res = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINTEREST_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Pinterest API ${res.status}: ${text.slice(0, 500)}`);
  return JSON.parse(text);
}

async function main() {
  const state = readState();
  const allPins = fs.readdirSync(PINS_DIR).filter(f => f.endsWith('.jpg')).sort();
  const next = allPins.find(f => !state.posted.includes(f));

  if (!next) {
    console.log('All pins posted. Generate more with: node scripts/gen-pinterest-pins.js');
    return;
  }

  const id = next.match(/\d+/)[0];
  const meta = PIN_DESCRIPTIONS[id];
  if (!meta) {
    console.error(`No metadata for ${next}`);
    process.exit(1);
  }

  console.log(`Posting ${next} — "${meta.title}"`);
  const result = await postPin(next, meta);
  console.log(`✓ Posted: pinterest.com/pin/${result.id}`);

  state.posted.push(next);
  state.lastPostedAt = new Date().toISOString();
  writeState(state);
}

main().catch(e => { console.error(e); process.exit(1); });
