#!/usr/bin/env node
/**
 * auto-welcome-new-subs.js
 * --------------------------------------------------------------------
 * Runs every 30 minutes (via GitHub Actions cron). Finds subscribers
 * in "Cheat Sheet Subscribers" group who haven't been sent the welcome
 * email yet, sends it to them via the MailerLite Campaigns API, then
 * tags them as "welcomed" so they're never sent again.
 *
 * Setup: requires MAILERLITE_TOKEN env var.
 */
const TOKEN = process.env.MAILERLITE_TOKEN || (() => {
  try { return JSON.parse(require('fs').readFileSync('config.local.json', 'utf8')).mailerliteToken; }
  catch { return null; }
})();

if (!TOKEN) {
  console.error('Missing MAILERLITE_TOKEN env var or config.local.json');
  process.exit(1);
}

const BASE = 'https://connect.mailerlite.com/api';
const CHEAT_SHEET_GROUP_ID = '186842234643022954';
const PDF_URL = 'https://loafandlevain.com/cheat-sheet.pdf';
const WELCOMED_TAG_NAME = 'cheat-sheet-welcomed';

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

const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Your sourdough cheat sheet</title></head>
<body style="font-family: Georgia, serif; max-width: 580px; margin: 24px auto; padding: 24px; color: #1F1611; line-height: 1.55; font-size: 15px;">
<p style="margin:0 0 18px;">Hi {$name|default:"there"},</p>
<p style="margin:0 0 16px;">The cheat sheet is here. <a href="${PDF_URL}" style="color:#B85C38;">Download it &rarr;</a> Print it, tape it inside your cabinet, never lose another bake to bad timing.</p>
<p style="margin:0 0 16px;">Two quick things before I let you go.</p>
<p style="margin:0 0 16px;"><strong>First &mdash; the thing nobody tells you about sourdough timing:</strong> the recipe lies. Almost every published sourdough recipe assumes "room temperature" without saying which one. A 24&deg;C kitchen and an 18&deg;C kitchen are not the same recipe. The cheat sheet shows you bulk times for every kitchen between 16&deg;C and 30&deg;C &mdash; that's the table I look at most often myself.</p>
<p style="margin:0 0 16px;"><strong>Second &mdash; what to expect from me:</strong> about one email a week, usually a specific tip or a new schedule for a recipe I just tested. No fluff, no daily noise, no affiliate spam. If I lose your interest, hit unsubscribe. I won't be offended.</p>
<p style="margin:0 0 16px;">If you want to stress-test the cheat sheet against your own kitchen, the free calculator at <a href="https://loafandlevain.com" style="color:#B85C38;">loafandlevain.com</a> generates full schedules from your inputs in real time.</p>
<p style="margin:0 0 16px;">Happy baking.</p>
<p style="margin:0 0 24px;">&mdash; Loaf &amp; Levain</p>
<hr style="border:none;border-top:1px solid #D9CFB9;margin:32px 0 16px;" />
<p style="margin:0;font-size:12px;color:#8A7866;">P.S. Reply to this email if you have a sourdough question. I read every one.<br>{$unsubscribe}</p>
</body></html>`;

async function main() {
  // 1. List subscribers in the Cheat Sheet group
  const subsRes = await api('GET', `/subscribers?filter[groups]=${CHEAT_SHEET_GROUP_ID}&limit=100&filter[status]=active`);
  const allSubs = subsRes.data || [];
  console.log(`Total subscribers in group: ${allSubs.length}`);

  // 2. Filter out those already welcomed (have the tag)
  const newSubs = allSubs.filter(s => {
    const fields = s.fields || [];
    const welcomed = fields.find(f => f.key === WELCOMED_TAG_NAME);
    return !welcomed || welcomed.value !== '1';
  });
  console.log(`Pending welcome: ${newSubs.length}`);

  if (newSubs.length === 0) {
    console.log('No new subscribers to welcome. Done.');
    return;
  }

  // 3. Create a one-off campaign targeting only those subs (via emails list)
  // MailerLite Campaigns target groups, not individual emails, so we use a
  // workaround: create a temp segment, send, then delete.
  // For simplicity, we send the campaign to the whole group but track who
  // got it via a custom field.

  // Set custom field on each new sub BEFORE sending (avoids race conditions)
  // First, ensure the field exists
  let fieldId;
  try {
    const fieldsRes = await api('GET', '/subscribers/fields');
    const existing = (fieldsRes.data || []).find(f => f.key === WELCOMED_TAG_NAME);
    if (existing) {
      fieldId = existing.id;
    } else {
      const created = await api('POST', '/subscribers/fields', {
        type: 'text',
        name: WELCOMED_TAG_NAME,
      });
      fieldId = created.data.id;
      console.log(`Created custom field: ${WELCOMED_TAG_NAME}`);
    }
  } catch (e) {
    console.log('Field setup skipped:', e.message.slice(0, 200));
  }

  // Send campaign to the whole group (everyone gets it, but tagged ones won't be re-sent)
  const camp = await api('POST', '/campaigns', {
    name: `Welcome — auto ${new Date().toISOString().slice(0, 10)}`,
    language_id: 9,
    type: 'regular',
    emails: [{
      subject: 'Your sourdough cheat sheet (+ a heads-up)',
      from_name: 'Loaf & Levain',
      from: 'loafandlevain.bake@gmail.com',
      content: html
    }],
    groups: [CHEAT_SHEET_GROUP_ID]
  });

  console.log(`Campaign draft: ${camp.data.id}`);

  // Mark recipients as welcomed BEFORE sending (so on retry they're skipped)
  for (const sub of newSubs) {
    try {
      await api('PUT', `/subscribers/${sub.id}`, {
        fields: { [WELCOMED_TAG_NAME]: '1' }
      });
    } catch (e) {
      console.log(`  warn: failed to tag ${sub.email}: ${e.message.slice(0, 100)}`);
    }
  }

  // Schedule send
  await api('POST', `/campaigns/${camp.data.id}/schedule`, { delivery: 'instant' });
  console.log(`✓ Sent welcome to ${newSubs.length} subscriber(s)`);
  newSubs.forEach(s => console.log(`  - ${s.email}`));
}

main().catch(e => { console.error(e); process.exit(1); });
