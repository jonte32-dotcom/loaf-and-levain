# Pinterest Auto-Post Setup

Goal: every other day, GitHub Actions auto-posts the next pin from `dist-pins/` to your Pinterest board, with brand-aligned title/description/link to your articles.

This requires Pinterest Developer App approval, which Pinterest typically grants within minutes for "trial" apps but can take up to 7 days for production access.

## Step 1 — Pinterest Business Account (5 min)

If you don't have one:

1. Go to https://business.pinterest.com
2. Sign up with `loafandlevain.bake@gmail.com`
3. Create profile (you can use the same business name & avatar from BMC)
4. Verify your domain at `loafandlevain.com` via DNS TXT record (Cloudflare → DNS → Add → TXT → name `_pinterest` value provided by Pinterest)

## Step 2 — Create Boards (5 min)

In Pinterest UI, create at least:

- **Sourdough Tutorials** — for technique pins
- **Sourdough Troubleshooting** — for diagnostic pins
- **Sourdough Recipes** — for recipe pins
- **Bread Photography** — for visual aesthetic pins (boost engagement)

For our 10 pins, we'll mostly use "Sourdough Tutorials" or "Sourdough Troubleshooting".

## Step 3 — Pinterest Developer App (10 min + waiting)

1. Go to https://developers.pinterest.com
2. Sign in with the same Pinterest business account
3. Click **"My apps"** → **"Create app"**
4. Fill in:
   - **App name:** `Loaf & Levain Auto-Post`
   - **App description:** "Auto-publishes original sourdough baking content from loafandlevain.com to Pinterest 2-3 times per week."
   - **Logo:** upload your BMC avatar (or any small JPG)
   - **Website:** `https://loafandlevain.com`
   - **Email:** `loafandlevain.bake@gmail.com`
5. After app creation, you'll see "App ID" and "App secret" — note them.
6. Click your app → **"Configure"** → set:
   - **Redirect URIs:** `https://loafandlevain.com/pinterest-oauth-callback` (placeholder; can be anything)
   - **Scopes:** check `boards:read`, `pins:read`, `pins:write`
7. **Submit for Trial Access** — Pinterest reviews and usually approves within minutes for trial.

## Step 4 — Get Access Token (BLOCKED on Trial tier)

⚠️ **As of 2026-05-11, Pinterest no longer issues `pins:write` tokens on Trial access.**
The "Generate access tokens" button in the dev console only produces *Production Limited* tokens that:

- Expire after **24 hours** (not 30 days)
- Only include read scopes (`pins:read`, `boards:read`, `user_accounts:read`, `ads:read`, `catalogs:read`)
- Cannot create pins (no `pins:write`)

To get `pins:write` you must **Upgrade to Standard access**, which requires:

1. A **video demo** of the app in action (.mp4, <2 GB)
2. Filled-out review form (use case, volume, scopes)
3. Manual review by Pinterest (1–7+ days)

**Recommendation for this project:** the upgrade overhead is not worth it for ~3 pins/week.
Use manual posting (see bottom of this doc) until volume justifies the demo recording.

If you do upgrade, the resulting flow:

1. After Standard approval, OAuth your Pinterest user against your app → get long-lived access + refresh token
2. The token is a long string starting with `pina_AAAA...`

## Step 5 — Find Board ID

1. In Pinterest UI, open the board where pins should go (e.g. "Sourdough Tutorials")
2. URL will be like `pinterest.com/loafandlevain/sourdough-tutorials`
3. Get board ID via API:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" "https://api.pinterest.com/v5/boards"
```

Response will list your boards with IDs. Copy the ID for the board you want pins to go to.

## Step 6 — Add to GitHub Secrets

In your GitHub repo:

1. **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
2. Name: `PINTEREST_TOKEN`, value: your access token
3. Add another: name `PINTEREST_BOARD_ID`, value: board ID

## Step 7 — Trigger first run (5 min)

1. GitHub repo → **Actions** tab → **"Pinterest auto-post"** workflow → **"Run workflow"**
2. Watch the run — should post pin-01 within ~30 seconds
3. Check Pinterest — your first pin should be there

After this, the cron runs automatically every other day (`0 14 */2 * *` — 14:00 UTC every other day).

## What's pinned

10 pins are pre-built in `dist-pins/`:

| # | Topic | Article link |
|---|---|---|
| 01 | Bulk fermentation table | bulk-fermentation-by-temperature |
| 02 | Hydration explained | hydration-explained |
| 03 | Why gummy crumb | why-sourdough-gummy |
| 04 | DDT formula | ddt-formula-water-temperature |
| 05 | Starter readiness | float-test-explained |
| 06 | Free planner CTA | calculator |
| 07 | Real schedule timeline | cold-retard-vs-same-day |
| 08 | Dense bread reasons | fix-dense-sourdough |
| 09 | Sourdough myths | float-test-explained |
| 10 | Pro PDF cover | gumroad |

After 10 pins post (~3 weeks), generate more via `node scripts/gen-pinterest-pins.js` (with new content templates) or manually upload variations.

## Manual posting (current default — Trial tier blocks auto-post)

This is the active workflow until Standard access is granted.

1. Open `dist-pins/` folder
2. Drag-drop pin-01.jpg → pin-10.jpg into Pinterest's manual upload UI
3. Use titles/descriptions from `pinterest/descriptions.md`
4. Post 1 pin every other day manually
5. After pin-10, ask Claude to generate pin-11 → pin-20

## Troubleshooting

**"401 Unauthorized" from Pinterest API:** Token expired (Pinterest tokens expire after 30 days). Generate new token, update GitHub secret.

**"403 Forbidden":** Token doesn't have `pins:write` scope. Re-generate with correct scopes.

**Pinterest API approval pending for >7 days:** Email Pinterest Developer support. Usually they need clarification on what you'll post.

**No pins post but no errors:** Check `pinterest-state.json` — all pins might be marked as posted. Reset by deleting the file.
