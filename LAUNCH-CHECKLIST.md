# Launch checklist

Everything that needs to happen between "I have these files on my desktop"
and "I'm earning passive revenue." Tick each box as you go.

Estimated total time: **8–12 focused hours over a weekend.** Then it runs.

---

## Phase 1 — Foundation (90 minutes, day 1)

### Git + GitHub

- [ ] Open terminal in `C:\Users\Aras_\Desktop\Dough`
- [ ] `git init`
- [ ] `git add . && git commit -m "initial commit"`
- [ ] Create a new GitHub repo (https://github.com/new) — name it whatever
- [ ] `git remote add origin git@github.com:YOURUSER/YOURREPO.git`
- [ ] `git branch -M main`
- [ ] `git push -u origin main`

### Cloudflare Pages

- [ ] Create Cloudflare account (free): https://dash.cloudflare.com/sign-up
- [ ] Workers & Pages → Pages → Connect to Git → authorise GitHub → select your repo
- [ ] Framework preset: None
- [ ] Build command: `npm install && npm run build`
- [ ] Build output directory: `.` (just a single dot, root)
- [ ] Environment variables: add `SITE_BASE = https://YOUR-DOMAIN-HERE` (we'll set the domain next)
- [ ] Click "Save and Deploy"
- [ ] Wait ~30 seconds — you'll get a `*.pages.dev` URL

### Domain

- [ ] Cloudflare Registrar (cheapest option, zero-config): https://dash.cloudflare.com → Domain Registration → Register
- [ ] Search for: `loafandlevain.com`, `crustcalc.com`, `proofedup.com`, `bakeschedule.io`, or your idea
- [ ] Buy ($10–15/year for .com)
- [ ] DNS auto-configures
- [ ] Cloudflare Pages → your project → Custom domains → Set up a custom domain → enter your domain → it auto-creates the DNS records

### Verify

- [ ] Open your domain in browser
- [ ] Calculator should work fully
- [ ] Articles should be visible at the bottom (knowledge base section)
- [ ] No errors in browser console (F12 → Console tab)

✅ Phase 1 done. The site is live but no monetization yet.

---

## Phase 2 — Monetization signups (3 hours, day 1 evening)

Sign up for all five services. Most have approval windows so do them all today
and they'll be ready over the next 1–3 days.

### Amazon Associates (1 day approval)

- [ ] https://affiliate-program.amazon.com → Sign up
- [ ] Pick the marketplace matching your audience (`.com`, `.co.uk`, `.de`, etc.)
- [ ] Add your live domain as your primary website
- [ ] Confirm phone number, choose payment method
- [ ] Wait for approval email (typically same-day to 24 hours)
- [ ] Once approved, copy your tracking tag (looks like `loafandlevain-20`)
- [ ] Save the tag for Phase 3

### Gumroad (instant, but you need the PDF first)

- [ ] https://gumroad.com/signup
- [ ] Go to Products → New product → Digital product
- [ ] Use copy from `marketing/gumroad-sales-page.md` for description, title, etc.
- [ ] Set price $19, regular price $29 (visible discount)
- [ ] Cover image: use Pin 10 from `pinterest/pin-templates.html` (screenshot it)
- [ ] PDF upload: see Phase 4 for generating the PDF from `pro-pdf/sourdough-schedule-pro.md`
- [ ] Don't publish yet — save as draft. We'll come back after Phase 4.

### ConvertKit (instant)

- [ ] https://convertkit.com/sign-up (free up to 1000 subscribers)
- [ ] Forms → Create new form → Inline → name it "Sourdough Cheat Sheet"
- [ ] Settings → Incentive email → enable → upload the cheat sheet PDF (Phase 4)
- [ ] Settings → Incentive email → set the welcome subject line to "Your sourdough cheat sheet"
- [ ] Embed → HTML → copy the form action URL
- [ ] Format: `https://app.convertkit.com/forms/XXXXXXX/subscriptions`
- [ ] Save the URL for Phase 3

### Buy Me A Coffee (instant)

- [ ] https://buymeacoffee.com/signup
- [ ] Choose a handle (e.g. `loafandlevain`)
- [ ] Connect Stripe for payouts
- [ ] Save just the handle for Phase 3 (not the full URL)

### Email welcome series in ConvertKit

- [ ] ConvertKit → Sequences → Create new sequence → name "Sourdough Welcome"
- [ ] Add 5 emails using the markdown in `email-sequence/01–05.md`
- [ ] Set delays: 0d, 2d, 5d, 9d, 14d
- [ ] Trigger: subscribed to "Sourdough Cheat Sheet" form
- [ ] Replace `[Your name]` and `https://YOUR-GUMROAD-URL` placeholders before saving

### AdSense (do LAST, day 4+)

Don't apply yet. AdSense rejects sites with too little content. Wait until
you have all 10 articles + the calculator live and getting some traffic.
Apply in week 2.

---

## Phase 3 — Wire monetization into the site (15 minutes)

You can either edit the HTML directly or use the configure script.

### Option A: configure script (recommended)

Create `config.local.json` in the project root:

```json
{
  "amazonTag": "your-amzn-20",
  "amazonRegion": "com",
  "gumroadProductURL": "https://yourhandle.gumroad.com/l/sourdough-pro",
  "convertkitFormAction": "https://app.convertkit.com/forms/XXXXXXX/subscriptions",
  "bmcHandle": "loafandlevain"
}
```

Then run:

```bash
npm run configure
```

It updates the HTML in place. Commit and push:

```bash
git add . && git commit -m "wire monetization config" && git push
```

Cloudflare Pages auto-deploys. Within 30 seconds the live site has all
streams active.

### Option B: edit HTML directly

Open `sourdough-schedule.html`, search for `MONETIZATION_CONFIG`, replace
the five `REPLACE_ME` placeholders with your real IDs. Commit and push.

### Verify

- [ ] Visit your live site
- [ ] Generate a schedule by clicking "Generate schedule"
- [ ] Gear strip should appear under the timeline (Amazon affiliate)
- [ ] After 4.5 seconds, lead modal should pop up (ConvertKit form)
- [ ] Click "Send it" with your own email — check your inbox for the cheat sheet
- [ ] Generate the schedule 2 more times — Pro banner appears in SEO area
- [ ] Generate once more — BMC tip jar appears

---

## Phase 4 — Build the PDFs (3–4 hours, day 2)

These are the only two pieces of work you genuinely need to do yourself
(no automation can replace them).

### Cheat sheet PDF (15 minutes)

- [ ] Open `lead-magnet/cheat-sheet.html` in your browser
- [ ] Press Ctrl+P (Cmd+P on Mac) → Destination: Save as PDF → Layout: Portrait → A4
- [ ] Save as `cheat-sheet.pdf`
- [ ] Upload to ConvertKit → your form → Incentive email → attach this PDF

The HTML is already designed to print as a clean 1-page A4 PDF. No Canva needed.

### Pro PDF (3–4 hours)

The markdown source is in `pro-pdf/sourdough-schedule-pro.md`. You have
several conversion options:

**Easiest: Pandoc** (best output)
```bash
# Mac/Linux: brew install pandoc
# Windows: choco install pandoc OR download from pandoc.org
pandoc pro-pdf/sourdough-schedule-pro.md -o sourdough-schedule-pro.pdf \
  --pdf-engine=xelatex \
  --variable mainfont="Georgia" \
  --variable sansfont="Helvetica Neue" \
  --variable monofont="JetBrains Mono" \
  --variable fontsize=11pt \
  --variable geometry:margin=1in \
  --toc --toc-depth=2
```

**Alternative: Notion**
- [ ] Create a new Notion page
- [ ] Paste the entire markdown
- [ ] Notion auto-formats headings, tables, lists
- [ ] Tweak any heading styles you want
- [ ] Export as PDF (Notion has a built-in export)

**Alternative: Typora or iA Writer**
- [ ] Open `pro-pdf/sourdough-schedule-pro.md` in either editor
- [ ] File → Export → PDF
- [ ] Both produce nice-looking PDFs without LaTeX setup

### Polish before upload

- [ ] Add a cover page with title, subtitle, your name/brand, version "v1.0"
- [ ] Add table of contents (Pandoc adds automatically with --toc)
- [ ] Skim every section — fix any obvious typos or claims you disagree with
- [ ] Save as `sourdough-schedule-pro-v1.pdf`

### Upload and publish

- [ ] Gumroad → your draft product → upload PDF
- [ ] Click Publish
- [ ] Test buying it from another browser (or incognito) with a friend's email
- [ ] Verify the welcome email arrives with PDF attached
- [ ] Refund the test purchase

---

## Phase 5 — Cron content factory (30 minutes, day 3)

### Anthropic API key

- [ ] https://console.anthropic.com → Settings → API keys → Create key
- [ ] Copy the key (starts with `sk-ant-`)
- [ ] Add ~$10 of credit to your account (will last 30+ articles, ~6 months)

### GitHub Actions secret

- [ ] Your repo → Settings → Secrets and variables → Actions → New repository secret
- [ ] Name: `ANTHROPIC_API_KEY`
- [ ] Value: paste the key
- [ ] Save

### Test the cron manually

- [ ] Repo → Actions tab → "Weekly content" workflow → Run workflow → main → Run
- [ ] Watch the run — should take ~2 minutes
- [ ] Check that a new file appears in `articles/`
- [ ] Check that the live site auto-deployed with the new article

The cron now runs every Monday at 08:00 UTC. You don't have to do anything
weekly. The roadmap has 30 topics — that's 30 weeks of fresh content.

---

## Phase 6 — Pinterest (2 hours, day 4)

### Setup

- [ ] Create Pinterest business account (free): https://business.pinterest.com
- [ ] Verify your domain (Pinterest → Settings → Claim website)
- [ ] Create boards: Sourdough Tutorials, Sourdough Troubleshooting,
      Sourdough Recipes, Sourdough Tools & Tips, Bread Photography

### First 10 pins

- [ ] Open `pinterest/pin-templates.html` in your browser
- [ ] For each pin (1–10): take a screenshot at exactly 1000×1500px ratio
      (use Windows Snipping Tool, macOS Screenshot, or browser dev tools'
      device-mode at 500×750 px and screenshot)
- [ ] Save each as `pin-01.png` ... `pin-10.png`
- [ ] Upload to Pinterest one by one
- [ ] For each, copy title + description from `pinterest/descriptions.md`
- [ ] Link each pin to the corresponding article URL

### Cadence

- [ ] First 30 days: post 1 pin every other day, manually
- [ ] Take notes on which pins get impressions vs saves
- [ ] After 30 days: batch a month of pins in Buffer.com or Tailwindapp.com
      so they auto-post on schedule

---

## Phase 7 — AdSense (week 2+)

- [ ] Wait until you have at least 8 articles indexed on Google
      (search `site:yourdomain.com` to verify)
- [ ] https://adsense.google.com → Sign up with your domain
- [ ] Add the AdSense verification snippet that they give you (paste in
      the `<head>` of `sourdough-schedule.html`)
- [ ] Submit for review
- [ ] Wait 1–4 weeks for approval (be patient — denial is common on first
      try; iterate if denied)
- [ ] Once approved: create 2 ad units (in-content and mid-content)
- [ ] Update `MONETIZATION_CONFIG.adsenseClient` and `adsenseSlots`
- [ ] `npm run configure` or edit directly, commit, push

---

## Phase 8 — Analytics (15 minutes, anytime)

- [ ] https://plausible.io/register (or umami.is for self-hosted) — $9/mo
- [ ] Add your domain
- [ ] Copy the script tag they give you
- [ ] Paste before `</head>` in `sourdough-schedule.html`
- [ ] Commit and push
- [ ] Verify Plausible shows real-time visits

You'll watch this dashboard every morning for a week, then weekly. The
metrics that matter:

- **Tool completions**: how many people clicked "Generate schedule" — this
  is your real engagement metric
- **Article reads**: which knowledge base articles are getting traffic
  (use this to add more topics like the winners to `content-roadmap.json`)
- **Conversion**: schedule → email signup → Pro PDF — track the funnel

---

## After launch — what your weeks look like

**Week 1–2:** Daily check that the site is up. Reply to any emails from
buyers. Pin 1 new pin every other day.

**Week 3–4:** AdSense approval window. Start drafting the second niche
template if sourdough is going well.

**Month 2–3:** Pinterest momentum builds. Email list grows to 100–500.
First Pro PDF sales come in.

**Month 4–6:** First $50–150 month. Plausible shows clear top articles —
add 2x more topics like those to roadmap. Consider a second niche.

**Month 7–12:** $200–500/month if you stayed disciplined. Email list at
500–1500. Consider Pro PDF v2 with more content.

**Year 2:** $500–1200/month is the realistic ceiling for one niche done
right. The multiplier from here is replication, not optimisation.

---

## What you don't have to do

- ❌ Write more SEO articles. The cron handles it.
- ❌ Maintain the schedule calculator. It's working code; leave it alone.
- ❌ Manually post to Pinterest after month 2. Buffer handles it.
- ❌ Email subscribers manually. ConvertKit drip handles welcome.
- ❌ Send Pro PDFs to buyers. Gumroad delivers.
- ❌ Track gear prices. Amazon updates them automatically.
- ❌ Pay for hosting. Cloudflare Pages is free.
- ❌ Pay for SSL. Cloudflare gives it free.

The point of all this setup is that none of it requires ongoing work after
the first weekend. The system runs itself.

---

## When something breaks

- **Cron fails:** Check `ANTHROPIC_API_KEY` is still valid (key rotation).
  Re-run the workflow manually from GitHub Actions tab.
- **Site goes down:** Cloudflare Pages dashboard → check deployment status.
  Almost always a syntax error in your latest edit. Roll back via git.
- **Lead modal not showing:** Open browser console, check for errors.
  Verify `convertkitFormAction` doesn't contain `REPLACE_ME`.
- **AdSense not loading:** Confirm publisher ID is correct. Disable any
  ad blocker before you panic.
- **Pinterest rejects domain:** Verify your domain via DNS TXT record
  in Cloudflare DNS.

For anything else: read the error message, then ask Claude. Most issues
are 5-minute fixes.

---

## Final word

The hardest part of this isn't building it. It's the patience for SEO
and Pinterest to compound. You'll feel like nothing is working in months
2–4. That's normal. The system is working — Google just hasn't decided
to surface your articles yet. Keep the cron running, keep pinning, keep
quiet improvements rolling.

The compound point usually arrives in month 5–6. After that, traffic
grows on its own as long as you don't break things.

Now go push the first commit.
