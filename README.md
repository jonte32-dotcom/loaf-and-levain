# Loaf & Levain — Sourdough Schedule Calculator

A complete sourdough planning workspace with built-in monetization stack
and an autonomous content factory. One static HTML file + a few scripts.

> Last audit: 2026-05-15 — see [`STATUS-2026-05-15.md`](STATUS-2026-05-15.md)

## What's in this repo

```
.
├── sourdough-schedule.html        # The site (single-file, self-contained)
├── articles/                      # SEO articles (markdown source)
├── content-roadmap.json           # Queue of topics for weekly cron
├── lead-magnet/cheat-sheet.md     # Source for the free PDF
├── pro-pdf/outline.md             # Source for the $19 Pro PDF
├── scripts/
│   ├── inject-articles.js         # md → HTML, injects into the page
│   └── gen-article.js             # Claude API: writes the next article
├── .github/workflows/
│   └── weekly-content.yml         # Cron: every Monday, new article + auto-deploy
├── robots.txt
├── package.json
└── README.md (you are here)
```

## What you actually need to do

### Day 1 — get it live (90 minutes)

1. **Create a GitHub repo, push these files.**
2. **Cloudflare account → Pages → Connect to Git → select repo → Deploy.**
   Build command: `npm install && npm run build`
   Output directory: `.` (root)
   You'll get a `*.pages.dev` URL within a minute.
3. **Buy a domain.** Cloudflare Registrar is cheapest and zero-config —
   `loafandlevain.com`, `crustcalc.com`, `proofedup.com` are good options.
   DNS is automatic when registered through Cloudflare.
4. **Test the live URL.** The calculator should work fully. Monetization
   features stay hidden because the config still has `REPLACE_ME` placeholders.

### Day 2 — turn on revenue streams (3 hours)

Open `sourdough-schedule.html`, search for `MONETIZATION_CONFIG`. Replace the
five placeholders:

#### 1. Amazon Associates
- Sign up: https://affiliate-program.amazon.com (US) or your country
- Wait 1–3 days for approval
- Copy your tracking tag (e.g. `loafandlevain-20`)
- Replace: `amazonTag: 'REPLACE_ME_AMZN_TAG'` → `amazonTag: 'loafandlevain-20'`
- Set `amazonRegion` to your country code (`com`, `co.uk`, `de`, etc.)

Effect: gear strip appears under each generated schedule with affiliate links.

#### 2. Gumroad Pro PDF
- Sign up: https://gumroad.com
- Create the Pro PDF using the outline in `pro-pdf/outline.md`
  (Claude can draft each section — you polish and export to PDF)
- Set price $19, upload PDF
- Copy the public product URL
- Replace `gumroadProductURL`

Effect: Pro upgrade banner appears in SEO content area after the user
generates 3 schedules. Modal CTA opens Gumroad checkout.

#### 3. ConvertKit (lead magnet)
- Sign up: https://convertkit.com (free up to 1000 subscribers)
- Create a form named "Sourdough Cheat Sheet"
- Configure incentive email: attach the cheat sheet PDF
  (build it from `lead-magnet/cheat-sheet.md` → Canva or Notion → PDF)
- Embed → HTML → copy the form action URL
- Format: `https://app.convertkit.com/forms/XXXXXXX/subscriptions`
- Replace `convertkitFormAction`

Effect: lead capture modal appears 4.5 seconds after the user generates
their first schedule. Submitted email = automatic cheat sheet delivery
+ they're on your weekly newsletter.

#### 4. Buy Me A Coffee
- Sign up: https://buymeacoffee.com
- Pick a handle (e.g. `loafandlevain`)
- Replace `bmcHandle` (just the handle, not the full URL)

Effect: tip jar appears after the user has generated 2+ schedules.

#### 5. AdSense (do this LAST, after content is up)
- Apply: https://adsense.google.com
- AdSense usually requires 8–10 articles before approval — that's why
  you do this after Day 3 below
- Once approved, copy your publisher ID (`ca-pub-XXXXXX`)
- Create 2 ad units in your AdSense dashboard, get their slot IDs
- Replace `adsenseClient` and `adsenseSlots`

Effect: 2 ad slots auto-load (in-content + mid-content placements).

Push the HTML changes → Cloudflare Pages auto-deploys in 30 seconds.

### Day 3 — turn on the content factory (1 hour)

1. **Get an Anthropic API key:** https://console.anthropic.com → API keys
   Cost: each article is ~$0.30. 52 articles/year ≈ $15/year.
2. **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key (starts with `sk-ant-...`)
3. **Test the cron manually:**
   - GitHub repo → Actions tab → "Weekly content" workflow → Run workflow
   - It picks the next unwritten topic from `content-roadmap.json`,
     calls Claude, writes to `articles/`, runs the inject script,
     commits, pushes
   - Cloudflare Pages auto-deploys
4. **Confirm it ran.** Check `articles/` for a new file. Visit your site,
   scroll to the SEO section. The new article should be there.

The cron now runs every Monday at 08:00 UTC. You don't have to do anything
weekly. The roadmap has 30 topics — that's 30 weeks of fresh content.
Add more topics whenever you want.

### Day 4 — apply for AdSense

You now have 8 articles (the seed ones in this repo) plus the calculator.
That's enough to apply. Approval typically takes 1–4 weeks.

While you wait:

- Set up Plausible or Umami for analytics. One script tag.
- Create 5–10 Pinterest pins linking back to specific articles.
  Use Canva templates — about 10 minutes per pin.
- Post in 2–3 sourdough subreddits (genuine value, not spam) and
  baking Facebook groups.

## Daily / weekly maintenance

- **Weekly:** Review the auto-generated article. If it's off, edit the markdown,
  rerun `npm run inject`, commit. Usually it's fine.
- **Monthly:** Check Plausible analytics. Which articles are getting traffic?
  Add more topics like the winning ones to `content-roadmap.json`.
- **Quarterly:** Review monetization performance. Tweak Pro PDF, refresh
  gear recommendations, A/B test pricing if you want.

## Local development

```bash
npm install
npm run inject          # rebuild the HTML with all current articles
npm run gen-article     # generate the next article from roadmap (needs API key)
npm run preview         # serve the site locally on http://localhost:3000
```

Set `SITE_BASE` env var to your real domain before running inject for proper
sitemap URLs:

```bash
SITE_BASE=https://loafandlevain.com npm run inject
```

## Tweaking when to show monetization prompts

Open the HTML, find `MONETIZATION_CONFIG`. The trigger fields:

```js
leadModalDelayMs: 4500,        // ms after schedule before lead modal
leadModalTriggerScheduleN: 1,  // show on Nth schedule (1 = first)
leadModalCooldownDays: 14,     // dismissed → wait this long
proModalAfterScheduleN: 3,     // soft Pro nudge banner appears after N
showBmcAfterScheduleN: 2       // tip jar appears after N
```

If you find users are bouncing because the lead modal feels pushy, raise
`leadModalTriggerScheduleN` to 2 or 3. If you find no one's seeing the
Pro banner because they leave too soon, drop `proModalAfterScheduleN` to 2.

## Realistic revenue timeline

Honest expectations, not hype:

- **Month 1–3:** $0–10/mo. AdSense rejects until you have content.
  Pinterest is just starting.
- **Month 4–6:** $50–150/mo. AdSense approved, first affiliate
  commissions, occasional Pro PDF sale.
- **Month 7–12:** $200–500/mo. Email list at 500–1000 subscribers,
  Pro PDF compounding, ad RPM stabilising.
- **Year 2:** $500–1200/mo if you stay disciplined and don't get bored.
  Email list is the multiplier.

The single most important thing you can do is keep the cron running.
A site with 30 articles and 6 months of consistency beats a site with
5 articles and panicked promotion every time.

## Build a second niche

When sourdough is at $200/mo and the system is hands-off:

1. Copy this whole repo
2. Replace the calculator core (the JS schedule logic) with a different
   utility — knitting gauge, aquarium dosing, beekeeping varroa timing,
   astrophotography exposure
3. Replace the SEO content + roadmap with niche-appropriate topics
4. Same monetization stack works (Amazon affiliates, Gumroad, ConvertKit,
   BMC, AdSense — all niche-agnostic)
5. New domain, new Cloudflare Pages project, same git workflow

Don't do this until sourdough proves out. Five mediocre sites is worse
than one good one.

## License & disclosure

Code is MIT-licensed — fork freely, ship something good. The articles in
`articles/` are written for this project's domain — if you reuse them
elsewhere, edit them so Google doesn't flag duplicate content.

The monetization stack is FTC-compliant: affiliate disclosure shows
automatically when affiliate links are present, ConvertKit handles GDPR
opt-in, AdSense handles cookie consent in the EU.
