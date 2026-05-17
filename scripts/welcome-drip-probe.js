#!/usr/bin/env node
/**
 * welcome-drip-probe.js — READ-ONLY diagnostics for welcome-drip.
 * Makes only GET calls. Never creates groups/campaigns, never sends mail.
 * Verifies: token validity, custom-field presence, subs + their welcome_step.
 */
import fs from 'node:fs';

const TOKEN = process.env.MAILERLITE_TOKEN || (() => {
  try { return JSON.parse(fs.readFileSync('config.local.json', 'utf8')).mailerliteToken; }
  catch { return null; }
})();
if (!TOKEN) { console.error('No token'); process.exit(1); }

const BASE = 'https://connect.mailerlite.com/api';
const GROUP = '186842234643022954';
const STEP_FIELD = 'welcome_step';

async function api(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' }
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

function ageDays(iso) {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? Infinity : (Date.now() - t) / 86400000;
}

(async () => {
  console.log('1. Token check (GET /fields)...');
  const fields = await api('/fields?limit=100');
  console.log('   ✓ Token valid — API responded OK');
  const stepField = (fields.data || []).find(f => f.key === STEP_FIELD);
  console.log(`   ${STEP_FIELD} field: ${stepField ? 'EXISTS (id ' + stepField.id + ')' : 'MISSING — will be auto-created on first real run'}`);

  console.log('\n2. Active Cheat Sheet subscribers...');
  const res = await api(`/subscribers?filter[group]=${GROUP}&filter[status]=active&limit=100`);
  const subs = res.data || [];
  console.log(`   ${subs.length} active sub(s) in group ${GROUP}`);
  for (const s of subs) {
    const f = s.fields || {};
    const step = Array.isArray(f)
      ? (f.find(x => x.key === STEP_FIELD)?.value ?? 0)
      : (f[STEP_FIELD] ?? 0);
    console.log(`   - ${s.email} | welcome_step=${step} | age=${ageDays(s.subscribed_at).toFixed(1)}d`);
  }

  console.log('\n3. What a real run WOULD send right now:');
  const STEPS = [{ n: 1, d: 0 }, { n: 2, d: 2 }, { n: 3, d: 5 }, { n: 4, d: 9 }, { n: 5, d: 14 }];
  let total = 0;
  for (const st of STEPS) {
    const elig = subs.filter(s => {
      const f = s.fields || {};
      const step = parseInt(Array.isArray(f) ? (f.find(x => x.key === STEP_FIELD)?.value ?? 0) : (f[STEP_FIELD] ?? 0), 10) || 0;
      return step < st.n && ageDays(s.subscribed_at) >= st.d;
    });
    if (elig.length) { console.log(`   Step ${st.n}: would email ${elig.length} → ${elig.map(e => e.email).join(', ')}`); total += elig.length; }
  }
  if (total === 0) console.log('   Nothing — 0 emails would be sent (safe to trigger).');
  else console.log(`   ⚠️  ${total} email(s) would be sent on a real run.`);
})().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
