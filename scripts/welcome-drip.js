#!/usr/bin/env node
/**
 * welcome-drip.js
 * --------------------------------------------------------------------
 * Drives the full 5-email welcome sequence for Cheat Sheet subscribers.
 * Replaces the buggy auto-welcome-new-subs.js (which sent campaigns to
 * the whole group every run, causing duplicate sends).
 *
 * Per-subscriber state lives in custom field `welcome_step` (0..5).
 * Each run:
 *   1. Lists active subs in the Cheat Sheet group.
 *   2. For each step (1..5), finds subs whose age >= delay AND step < n.
 *   3. Creates a one-shot temp group, adds matching subs, sends a
 *      campaign targeted at THAT group only, marks subs as advanced,
 *      then deletes the temp group.
 *
 * Idempotent: re-running within seconds produces 0 sends because
 * welcome_step is bumped before the campaign is scheduled.
 *
 * Schedule: every 6 hours via .github/workflows/welcome-drip.yml.
 * Manual run: MAILERLITE_TOKEN=... node scripts/welcome-drip.js
 */
import fs from 'node:fs';

const TOKEN = process.env.MAILERLITE_TOKEN || (() => {
  try { return JSON.parse(fs.readFileSync('config.local.json', 'utf8')).mailerliteToken; }
  catch { return null; }
})();

if (!TOKEN) {
  console.error('Missing MAILERLITE_TOKEN env var or config.local.json');
  process.exit(1);
}

const BASE = 'https://connect.mailerlite.com/api';
const CHEAT_SHEET_GROUP_ID = '186842234643022954';
const STEP_FIELD = 'welcome_step';
const PDF_URL = 'https://loafandlevain.com/cheat-sheet.pdf';
const SITE_URL = 'https://loafandlevain.com';
const PRO_URL = 'https://loaflevain.gumroad.com/l/sourdough-pro';
const FROM = 'loafandlevain.bake@gmail.com';
const FROM_NAME = 'Loaf & Levain';

// Drip schedule: step n requires age >= delayDays AND welcome_step < n.
// Email content is rendered inline (no MD parsing needed — these are short).
const STEPS = [
  {
    n: 1,
    delayDays: 0,
    subject: 'Your sourdough cheat sheet (+ a heads-up)',
    preheader: 'A one-page reference for every sourdough bake. Tape it inside your cabinet.',
    body: () => `
<p>Hi {$name|default:"there"},</p>
<p>The cheat sheet is here. <a href="${PDF_URL}" style="color:#B85C38;">Download it &rarr;</a> Print it, tape it inside your cabinet, never lose another bake to bad timing.</p>
<p>Two quick things before I let you go.</p>
<p><strong>First &mdash; the thing nobody tells you about sourdough timing:</strong> the recipe lies. Almost every published sourdough recipe assumes "room temperature" without saying which one. A 24&deg;C kitchen and an 18&deg;C kitchen are not the same recipe. The cheat sheet shows you bulk times for every kitchen between 16&deg;C and 30&deg;C &mdash; that's the table I look at most often myself.</p>
<p><strong>Second &mdash; what to expect from me:</strong> about one email a week, usually a specific tip or a new schedule for a recipe I just tested. No fluff, no daily noise, no affiliate spam. If I lose your interest, hit unsubscribe. I won't be offended.</p>
<p>If you want to stress-test the cheat sheet against your own kitchen, the free calculator at <a href="${SITE_URL}" style="color:#B85C38;">loafandlevain.com</a> generates full schedules from your inputs in real time.</p>
<p>Happy baking.</p>
<p>&mdash; Loaf &amp; Levain</p>
<p style="font-size:12px;color:#8A7866;">P.S. Reply to this email if you have a sourdough question. I read every one.</p>`
  },
  {
    n: 2,
    delayDays: 2,
    subject: 'The thing that ruins most home loaves',
    preheader: 'It is not what bakers think — and the fix takes 30 seconds.',
    body: () => `
<p>Hi {$name|default:"there"},</p>
<p>Quick observation from reading hundreds of sourdough troubleshooting threads: the same mistake comes up again and again, and it's almost never the one bakers think it is.</p>
<p>It's not hydration. Not flour. Not the starter (usually).</p>
<p><strong>It's measuring the wrong temperature.</strong></p>
<p>Bakers measure the room. Or they trust the thermostat. The dough is what actually matters, and the dough is almost always 1&ndash;4&deg;C warmer than the room because mixing adds heat and flour holds it.</p>
<p>A schedule built around a "22&deg;C kitchen" produces dough that's actually fermenting at 24&deg;C. The bulk you planned for 6 hours is done in 4.5. By the time you check, it's already overproofed.</p>
<p><strong>The fix takes 30 seconds:</strong> stick an instant-read thermometer into the dough right after mixing. That number is what feeds into your schedule. If it reads 24&deg;C and you assumed 22&deg;C, drop two degrees in <a href="${SITE_URL}" style="color:#B85C38;">the calculator</a>. The new bulk prediction will line up with reality within &plusmn;20 minutes.</p>
<p>This single habit closes most of the gap between home bakers and bakery results.</p>
<p>Talk soon.</p>
<p>&mdash; Loaf &amp; Levain</p>`
  },
  {
    n: 3,
    delayDays: 5,
    subject: 'A quick story about a $19 mistake',
    preheader: 'The bake I ruined and the schedule that would have saved it.',
    body: () => `
<p>Hi {$name|default:"there"},</p>
<p>Short story, then I'll let you go.</p>
<p>A while back I tried to make panettone with sourdough. Three days of stiff levain refreshes, multiple long ferments, butter and yolks fighting the gluten, a 16-hour final proof.</p>
<p>I used a free recipe I found online. It worked at the author's kitchen, which she described as "comfortable room temperature." Mine wasn't comfortable &mdash; it was a January kitchen at 17&deg;C.</p>
<p>I followed the schedule exactly. The bake was a brick. Three days of work, a kilo of imported flour, candied citrus that costs more than it should, all of it for a dense doorstop.</p>
<p>The recipe wasn't wrong. The schedule was wrong <strong>for my kitchen.</strong> Every step needed 1.5&ndash;2&times; the time the author had given it.</p>
<p>That's why I built <a href="${PRO_URL}" style="color:#B85C38;">Sourdough Schedule Pro</a>. Every recipe in it has three timing tables: cold kitchen, standard kitchen, hot kitchen. No more guessing. No more $30 paperweights.</p>
<p>It's $19. One ruined panettone pays for it 1.5 times over.</p>
<p>Details on what's inside in a couple days.</p>
<p>&mdash; Loaf &amp; Levain</p>`
  },
  {
    n: 4,
    delayDays: 9,
    subject: 'What is actually inside Sourdough Schedule Pro',
    preheader: '30 recipes, 12 troubleshooting flowcharts, climate-tuned timing.',
    body: () => `
<p>Hi {$name|default:"there"},</p>
<p>Following up on the panettone story &mdash; here's exactly what's in <a href="${PRO_URL}" style="color:#B85C38;">Sourdough Schedule Pro</a>.</p>
<p><strong>30 recipes</strong>, each with three timing tables (cold, standard, hot kitchen):</p>
<ul>
<li>5 white &amp; lean breads (country, pan de cristal, sandwich)</li>
<li>7 whole-grain (50% WW, 100% WW, multigrain, rye, spelt, kamut)</li>
<li>3 high-hydration showcases (ciabatta, open-crumb country, pain rustique)</li>
<li>5 enriched (brioche, croissants, milk bread, babka, discard pancakes)</li>
<li>5 flatbreads &amp; shapes (focaccia, pizza 24/48/72-h, bagels, English muffins, pita)</li>
<li>5 holiday &amp; specialty (panettone, stollen, hot cross buns, pretzels, beer bread)</li>
</ul>
<p><strong>12 troubleshooting flowcharts</strong> for: gummy crumb, dense crumb, flat loaves, no oven spring, pale crust, too sour, bland flavour, sticky dough, starter that won't peak, crumb wall holes, dough that tears, loaf stuck in banneton.</p>
<p><strong>Starter rescue protocols.</strong> From-scratch 7-day starter, reviving fridge-forgotten starter, fixing sluggish starters.</p>
<p>60+ page PDF. Pay once, lifetime updates.</p>
<p><strong>Price: $19</strong> during launch. <a href="${PRO_URL}" style="color:#B85C38;">Get the PDF &rarr;</a></p>
<p>&mdash; Loaf &amp; Levain</p>
<p style="font-size:12px;color:#8A7866;">P.S. Gumroad gives a 30-day refund window &mdash; if it's not what you expected, ask for your money back, no friction.</p>`
  },
  {
    n: 5,
    delayDays: 14,
    subject: 'Closing the launch window',
    preheader: 'Last note from this series before back to baking content.',
    body: () => `
<p>Hi {$name|default:"there"},</p>
<p>Last note from me on this, then back to baking content.</p>
<p><a href="${PRO_URL}" style="color:#B85C38;">Sourdough Schedule Pro</a> is live at the launch price of <strong>$19</strong>. Sometime in the next few weeks I'm raising it to $29. If you've been thinking about it, this is the moment.</p>
<p>Two reasons people actually buy it:</p>
<ol>
<li>They've already wasted a weekend on a failed bake. The math is simple &mdash; one ruined project costs more than the PDF.</li>
<li>They want a single source of recipes that won't disappear. The internet is full of half-tested sourdough recipes from blogs that vanish.</li>
</ol>
<p>Two reasons people don't:</p>
<ol>
<li>They're 5 bakes in and still learning the basics. The free calculator + cheat sheet are enough at that stage.</li>
<li>They prefer YouTube to reading. The PDF is for readers.</li>
</ol>
<p>If the timing is right: <a href="${PRO_URL}" style="color:#B85C38;">Get Sourdough Schedule Pro &rarr;</a></p>
<p>From here you'll just get the weekly newsletter &mdash; usually a single tip, never a sales push longer than two sentences.</p>
<p>&mdash; Loaf &amp; Levain</p>`
  }
];

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

function ageDays(subscribedAtIso) {
  if (!subscribedAtIso) return Infinity;
  const t = Date.parse(subscribedAtIso);
  if (Number.isNaN(t)) return Infinity;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function getStep(sub) {
  const fields = sub.fields || {};
  // MailerLite returns fields as object with key→value (varies; handle both)
  if (Array.isArray(fields)) {
    const f = fields.find(x => x.key === STEP_FIELD);
    return f ? parseInt(f.value, 10) || 0 : 0;
  }
  return parseInt(fields[STEP_FIELD], 10) || 0;
}

async function ensureField() {
  const res = await api('GET', '/fields?limit=100');
  const existing = (res.data || []).find(f => f.key === STEP_FIELD);
  if (existing) return existing.id;
  const created = await api('POST', '/fields', {
    type: 'number',
    name: STEP_FIELD
  });
  console.log(`✓ Created custom field: ${STEP_FIELD}`);
  return created.data.id;
}

async function listAllSubs() {
  const subs = [];
  let cursor = null;
  for (let i = 0; i < 20; i++) {
    // MailerLite API: filter key is singular `group` (plural `groups` → HTTP 400).
    const qs = `filter[group]=${CHEAT_SHEET_GROUP_ID}&filter[status]=active&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
    const res = await api('GET', `/subscribers?${qs}`);
    subs.push(...(res.data || []));
    cursor = res?.meta?.next_cursor || null;
    if (!cursor) break;
  }
  return subs;
}

async function setStep(subId, step) {
  await api('PUT', `/subscribers/${subId}`, {
    fields: { [STEP_FIELD]: String(step) }
  });
}

const HTML_SHELL = (preheader, body) => `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${preheader}</title></head>
<body style="font-family: Georgia, serif; max-width: 580px; margin: 24px auto; padding: 24px; color: #1F1611; line-height: 1.55; font-size: 15px;">
${body}
<hr style="border:none;border-top:1px solid #D9CFB9;margin:32px 0 16px;" />
<p style="margin:0;font-size:12px;color:#8A7866;">{$unsubscribe}</p>
</body></html>`;

async function processStep(step, subs) {
  // Eligible: age >= delay AND current step < this step's n.
  const eligible = subs.filter(s => getStep(s) < step.n && ageDays(s.subscribed_at) >= step.delayDays);
  if (eligible.length === 0) {
    console.log(`Step ${step.n}: 0 eligible (no-op)`);
    return;
  }
  console.log(`Step ${step.n}: ${eligible.length} eligible — "${step.subject}"`);

  // 1. Create temp group
  const tempName = `drip-step${step.n}-${Date.now()}`;
  const grp = await api('POST', '/groups', { name: tempName });
  const tempId = grp.data.id;

  try {
    // 2. Add eligible subs to temp group
    for (const sub of eligible) {
      await api('POST', `/subscribers/${sub.id}/groups/${tempId}`, null);
    }

    // 3. Bump step BEFORE send (so re-runs skip these subs even if send fails after this point)
    for (const sub of eligible) {
      try { await setStep(sub.id, step.n); }
      catch (e) { console.log(`  warn: could not set step for ${sub.email}: ${e.message.slice(0, 100)}`); }
    }

    // 4. Create + schedule campaign targeted at temp group
    const camp = await api('POST', '/campaigns', {
      name: `Welcome drip step ${step.n} — ${new Date().toISOString().slice(0, 10)}`,
      language_id: 9,
      type: 'regular',
      emails: [{
        subject: step.subject,
        from_name: FROM_NAME,
        from: FROM,
        content: HTML_SHELL(step.preheader, step.body())
      }],
      groups: [tempId]
    });

    await api('POST', `/campaigns/${camp.data.id}/schedule`, { delivery: 'instant' });
    console.log(`  ✓ Sent step ${step.n} to ${eligible.length} sub(s)`);
  } finally {
    // 5. Best-effort cleanup. If this fails, the orphan temp group is harmless
    //    (no auto-add, no future sends targeted at it).
    try {
      await api('DELETE', `/groups/${tempId}`);
    } catch (e) {
      console.log(`  warn: failed to delete temp group ${tempId}: ${e.message.slice(0, 100)}`);
    }
  }
}

async function main() {
  await ensureField();
  const subs = await listAllSubs();
  console.log(`Active Cheat Sheet subs: ${subs.length}`);
  if (subs.length === 0) { console.log('Nothing to do.'); return; }

  for (const step of STEPS) {
    await processStep(step, subs);
  }
  console.log('Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
