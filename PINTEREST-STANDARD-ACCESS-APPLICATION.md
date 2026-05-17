# Pinterest Standard Access — Application Kit

Everything needed to apply for `pins:write`. Copy the English text verbatim
into Pinterest's review form. Record the screencast reading the narration
word-for-word. Pinterest reviewers are English-speaking — keep all
submitted text and narration in English.

App: **Loaf and Levain Auto-Post** · App ID **1569029** · Account `loafandlevain.bake@gmail.com`

---

## Part 1 — Review form answers (paste verbatim)

**App name**
> Loaf and Levain Auto-Post

**App description / What does your app do?**
> Loaf and Levain Auto-Post publishes original sourdough-baking educational
> content from our own website, loafandlevain.com, to our own Pinterest
> business board. Each pin is a brand-designed graphic we created ourselves,
> linking back to a specific free article or tool on our site (e.g. a bulk
> fermentation temperature chart, a hydration guide, a troubleshooting
> diagnostic). The app posts on a fixed schedule so we maintain a consistent
> presence without manual work. It only ever posts our own first-party
> content to our own board — it does not scrape, repost, or aggregate other
> users' content, and it does not interact with other accounts.

**Which scopes are you requesting and why?**
> - `pins:write` — to publish our own original pins to our own board on a schedule.
> - `pins:read` — to confirm a pin was created and avoid duplicates.
> - `boards:read` — to resolve and validate the target board ID before posting.
> We are not requesting ads, catalog, or any scope beyond what is strictly
> needed to publish our own educational content.

**Expected API request volume**
> Very low. Approximately 3–4 write requests per week (one pin every other
> day), plus a handful of read requests for validation. Well under any rate
> limit. Volume will not grow significantly — this is a single small content
> site, not a platform or multi-account tool.

**How does your app benefit Pinterest and its users?**
> It brings consistent, high-quality, original educational content to
> Pinterest. Our pins are practical reference material for home bakers
> (timing charts, troubleshooting flowcharts, technique guides) that drive
> genuine saves and engagement. All content is free, ad-light, and
> non-spam — there is no signup wall and no affiliate spam on the linked
> pages.

**Is the content original? Who owns it?**
> Yes. All pin images and all linked articles are written and designed by
> us and hosted on our own domain, loafandlevain.com, which is verified to
> this Pinterest account. We own 100% of the content.

**App / website URL**
> https://loafandlevain.com

**Redirect URI**
> https://loafandlevain.com/pinterest-oauth-callback

---

## Part 2 — Screencast narration (read word-for-word, ~2 min)

Record screen + voice (Loom, OBS, or Windows Game Bar `Win+G`). Export
.mp4 under 2 GB. Follow the [SCREEN: …] cues; read the spoken lines exactly.

---

**[SCREEN: loafandlevain.com homepage, scroll slowly through the calculator and an article]**

> "This is Loaf and Levain, our own sourdough-baking website. Every article
> and tool here is original content that we wrote and designed. This is the
> only source of content our Pinterest app will ever post."

**[SCREEN: open the `dist-pins/` folder, show the 10 .jpg pin images]**

> "These are the pin graphics. We designed all ten ourselves in our brand
> style. Each one corresponds to a specific free article on our site — for
> example, this bulk-fermentation temperature chart links to our guide on
> fermentation timing."

**[SCREEN: open `scripts/post-pinterest-pin.js` in an editor, scroll through it]**

> "This is the script that posts pins. It picks the next un-posted image
> from our own folder, attaches the title, description, and a link back to
> our own article, and sends one create-pin request to the Pinterest v5 API.
> It tracks what it has already posted in a state file so it never posts
> duplicates."

**[SCREEN: show `.github/workflows/pinterest-cron.yml`, point at the cron line]**

> "It runs on a fixed schedule — one pin every other day — through GitHub
> Actions. There is no user interaction and no posting to anyone else's
> board. It only ever writes our own content to our own board."

**[SCREEN: terminal, run `node scripts/post-pinterest-pin.js` — it will fail at the write call on the trial token; that is expected and fine to show]**

> "Here is the app authenticating against the Pinterest API and preparing a
> pin. With Standard access and the pins-write scope, this final step
> publishes the pin to our board. The request volume is roughly three to
> four pins per week — very low, single account, our content only."

**[SCREEN: back to loafandlevain.com]**

> "To summarise: original first-party content, posted by us to our own
> verified domain's Pinterest board, low volume, no scraping, no spam, no
> interaction with other users. Thank you for reviewing."

**[END — stop recording]**

---

## Part 3 — After approval checklist

1. Dev console → generate access token with `pins:write` `pins:read` `boards:read`.
2. Get the target board ID (Pinterest board URL or `GET /v5/boards`).
3. Add GitHub Secrets (repo → Settings → Secrets → Actions):
   - `PINTEREST_TOKEN` = the access token
   - `PINTEREST_BOARD_ID` = the board ID
4. GitHub → Actions → "Pinterest auto-post" → Run workflow → verify green.
5. Confirm the pin appears on the board, and `pinterest-state.json` was committed.
6. (Follow-up) Implement refresh-token flow — v5 tokens expire (~60 days);
   without refresh the cron dies silently. Build this only after step 4 works.
