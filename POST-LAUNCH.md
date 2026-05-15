# Post-launch guide — what to do now

The build is done. Everything that can run automatically is running. Below
is what you do over the coming weeks/months to actually get traffic and
revenue. None of it requires me — just discipline.

## Right now (within 24 hours)

- [ ] **Drag-drop pin-01.jpg into Pinterest** (manual upload)
  - Use title + description from `pinterest/descriptions.md` (Pin 01)
  - Link to `https://loafandlevain.com/#bulk-fermentation-by-temperature`
  - Save to "Sourdough Tutorials" board
- [ ] **Top up Anthropic API** with $10 at https://console.anthropic.com → Billing
- [ ] **Verify the welcome email actually delivered** to jonte32@gmail.com (it should have)

## This week

- [ ] **Drag-drop 1 more pin every other day** (pin-02 → pin-10)
- [ ] **Pinterest Developer App** — apply via https://developers.pinterest.com (5 min, then 0-7 day wait)
  - When approved: get token + board ID
  - Add to GitHub Secrets: `PINTEREST_TOKEN`, `PINTEREST_BOARD_ID`
  - Pinterest cron auto-posts 1 pin every other day from then on
- [ ] **Stripe finalisering for BMC** — slutför payout-onboarding via https://buymeacoffee.com → Settings → Payouts (15 min, needs personnummer + bank IBAN + ID photo)
- [ ] **Welcome drip is automatic** — `scripts/welcome-drip.js` runs every 6 hours
  via `.github/workflows/welcome-drip.yml`. No manual action needed once
  `MAILERLITE_TOKEN` is added as a GitHub Secret. The script handles all 5
  mails (delays: 0/2/5/9/14 days) per subscriber via temp-group pattern.
  Manual trigger: GitHub Actions tab → "Welcome drip" → Run workflow.

## Within 2 weeks

- [ ] **AdSense decision arrives** (email to loafandlevain.bake@gmail.com)
  - If approved: create 2 ad units (in-content + mid-content), get slot IDs
  - Update `MONETIZATION_CONFIG.adsenseSlots` in HTML
  - Push → ads start showing
- [ ] **First Google indexing** — sajten börjar visas på `site:loafandlevain.com` Google searches
- [ ] **First Pinterest impression** — sannolikt 20-200 visningar på första pinnen

## Within 1 month

- [ ] **Cron har genererat 4 nya artiklar** (15 totalt)
- [ ] **Pinterest har 10-20 pins uppe** (om Pinterest API godkänd) eller manuell pacing
- [ ] **First subscriber** — beyond your test
- [ ] **AdSense aktiverar** + börjar dra in $5-15/mån

## Within 3 months — critical milestone

If you've stayed disciplined:

- 30+ artiklar publicerade
- 30+ Pinterest pins postade
- 50-300 organiska besök/mån
- 5-30 prenumeranter
- 0-3 Pro PDF sales = $0-40
- Total intäkt: $20-80/mån

If you've stopped pinning Pinterest:
- Total intäkt: $0-15/mån
- Sajten dör långsamt

## Within 6 months

If discipline held:
- 1000-3000 besök/mån
- 100-500 prenumeranter
- 5-15 Pro PDF sales/mån = $65-200
- Amazon affiliate $5-25/mån
- AdSense $20-80/mån
- BMC tips $5-20/mån
- Total: **$100-300/mån**

## Within 12 months

Realistic ceiling for a single niche done well:
- 3000-10000 besök/mån
- 500-2000 prenumeranter
- Total: **$300-800/mån**

This is when you decide:
- **Build a second niche** — replicate the entire stack for knitting / aquarium / beekeeping etc
- **Scale this niche** — paid ads on Pinterest, sponsored content, Pro PDF v2 with more recipes
- **Launch a higher-tier product** — $49 "Pro Plus" with video walkthroughs

## Maintenance scripts you'll run

| Script | When | Purpose |
|---|---|---|
| `node scripts/welcome-drip.js` | Auto via cron every 6h | Drives 5-step welcome sequence per subscriber |
| `node scripts/inject-articles.js` | After manually adding article | Updates HTML with all articles |
| `node scripts/gen-pinterest-pins.js` | When you want new pin batch | Regenerates 10 pin JPGs |
| `node scripts/configure.js` | When you change MONETIZATION_CONFIG values | Updates HTML in place |

## When something breaks

**Sajten 404s/down:** Cloudflare Pages dashboard → check latest deployment logs.
Almost always a syntax error in HTML. Roll back via `git revert HEAD` and push.

**Cron stops generating articles:**
1. Check Anthropic API balance (https://console.anthropic.com)
2. Check GitHub Secret still valid
3. Re-run workflow manually

**Pinterest cron stops posting:**
- Pinterest tokens expire after 30 days. Generate new token, update GitHub Secret.

**MailerLite send fails:**
- Free tier has 12k emails/mån limit. If you hit it, upgrade to Growing Business ($10/mån for 1k subs).

**Spam complaints rise:**
- Check that GDPR consent banner is showing
- Verify double opt-in is on for forms
- Reduce send frequency

## Long-term: what to invest in

**$0-50/mån income period (months 1-3):**
- Don't invest anything beyond domain ($10/yr) and Anthropic credits ($10 every 6 months)
- Time investment: 5-10 hrs/week (Pinterest pinning, occasional content review)

**$50-200/mån income period (months 4-9):**
- Plausible Analytics ($9/mån) — better than blind running
- Tailwind for Pinterest scheduling ($15/mån) — if you outgrow GitHub Actions cron
- Maybe upgrade MailerLite to paid tier ($10/mån) when over 1000 subs

**$200+/mån income period (months 10+):**
- Sponsored content opportunities will start showing up
- Affiliate programs beyond Amazon (Williams-Sonoma, Sur La Table for baking)
- Build Pro PDF v2 with new content
- Start a second niche

## What you don't need to do (resist the urge)

- ❌ Buy paid Pinterest/Facebook ads in first 3 months — wait for organic baseline
- ❌ Run discounts/promotions before you have 100 subscribers
- ❌ Add more monetization streams beyond what you have — focus on driving traffic instead
- ❌ Switch tech stack — what you have works, polish content not infra
- ❌ Build a second niche before this one hits $200/mån

## Final note

The infrastructure is done. Whether this makes $0 or $5000/mån depends on
**whether you keep pinning Pinterest for 90 days minimum**. That's the
hardest part — pinning when nobody is watching, when there's no immediate
feedback, when it feels pointless. Month 3-4 is when most people quit.

Don't quit at month 3. The compounding curve is real, but it kicks in
month 5-7. People who quit at month 3 never see the curve.

Set a calendar reminder: "Loaf & Levain — pin 1 pin" every other day at
14:00 for the next 90 days. After 90 days, you'll either see traction
(keep going) or you won't (decide based on data, not feelings).

Good luck.
