#!/usr/bin/env node
/**
 * send-welcome-campaign.js
 * --------------------------------------------------------------------
 * Creates and sends a one-off welcome campaign to all subscribers in
 * the "Cheat Sheet Subscribers" group. Delivers the cheat sheet PDF
 * link via clean HTML email.
 *
 * Usage: node scripts/send-welcome-campaign.js
 */
import fs from 'node:fs';

const TOKEN = JSON.parse(fs.readFileSync('config.local.json', 'utf8')).mailerliteToken;
const CHEAT_SHEET_GROUP_ID = '186842234643022954';
const PDF_URL = 'https://loafandlevain.com/cheat-sheet.pdf'; // We'll upload PDF to site later
const BASE = 'https://connect.mailerlite.com/api';

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
  if (!res.ok) {
    console.error(`${method} ${path} → ${res.status}`);
    console.error(text.slice(0, 800));
    throw new Error(`API ${res.status}`);
  }
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

<p style="margin:0 0 16px;">If you want to stress-test the cheat sheet against your own kitchen, the free calculator at <a href="https://loafandlevain.com" style="color:#B85C38;">loafandlevain.com</a> generates full schedules from your inputs in real time. That's the tool the cheat sheet is summarising.</p>

<p style="margin:0 0 16px;">Happy baking.</p>

<p style="margin:0 0 24px;">&mdash; Loaf &amp; Levain</p>

<hr style="border:none;border-top:1px solid #D9CFB9;margin:32px 0 16px;" />

<p style="margin:0;font-size:12px;color:#8A7866;">
P.S. Reply to this email if you have a sourdough question. I read every one.<br>
{$unsubscribe} &middot; {$forward}
</p>

</body></html>`;

const plainText = `Hi,

The cheat sheet is here: ${PDF_URL}

Two quick things before I let you go.

First — the thing nobody tells you about sourdough timing: the recipe lies. Almost every published sourdough recipe assumes "room temperature" without saying which one. A 24°C kitchen and an 18°C kitchen are not the same recipe. The cheat sheet shows you bulk times for every kitchen between 16°C and 30°C — that's the table I look at most often myself.

Second — what to expect from me: about one email a week, usually a specific tip or a new schedule for a recipe I just tested. No fluff, no daily noise, no affiliate spam.

The free calculator at https://loafandlevain.com generates full schedules from your inputs in real time.

Happy baking.

— Loaf & Levain

P.S. Reply to this email if you have a sourdough question. I read every one.

{$unsubscribe}`;

async function main() {
  console.log('Creating campaign...');

  const campaign = await api('POST', '/campaigns', {
    name: 'Welcome — Cheat Sheet delivery',
    language_id: 9,
    type: 'regular',
    emails: [
      {
        subject: 'Your sourdough cheat sheet (+ a heads-up)',
        from_name: 'Loaf & Levain',
        from: 'loafandlevain.bake@gmail.com',
        content: html
      }
    ],
    groups: [CHEAT_SHEET_GROUP_ID]
  });

  const campaignId = campaign.data?.id;
  console.log(`✓ Campaign created: ${campaignId}`);
  console.log(`  Recipients: subscribers in "Cheat Sheet Subscribers" group`);

  // Schedule immediate send
  console.log('\nScheduling send...');
  const send = await api('POST', `/campaigns/${campaignId}/schedule`, {
    delivery: 'instant'
  });

  console.log('✓ Campaign sent!');
  console.log('  Check loafandlevain.bake@gmail.com (sender) and jonte32@gmail.com (recipient).');
  console.log('  Delivery may take 1–5 minutes.');
}

main().catch(e => { console.error(e); process.exit(1); });
