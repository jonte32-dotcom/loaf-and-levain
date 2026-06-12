# Bulk fermentation by temperature: a baker's guide

Bulk fermentation is the part of a sourdough bake where most outcomes are decided. Get the timing right and you get an open crumb, a clean ear, and dough that's a pleasure to shape. Get it wrong and nothing downstream can rescue it. The single biggest variable that decides bulk timing isn't your flour or your starter — it's the temperature of the dough as it ferments. This guide is about that one lever: how warmth and cold move your bulk clock, and how to read the dough instead of guessing.

## The Q10 rule, in plain words

Yeast and lactic bacteria work faster when it's warm and slower when it's cold. For sourdough the rate increases about **2.2× for every 8°C (about 14°F)** rise in dough temperature. Bakers call this Q10 ≈ 2.2, and it's the exact factor the [calculator](/) uses to schedule your bake.

It's worth being precise about what 2.2 means, because it's easy to mangle. A "doubling per 8°C" would be Q10 = 2.0. The real figure, 2.2, is about **10% faster than a simple doubling** — not "a touch more than double" in any vague sense, but a clean, measurable 10% on top of doubling. Warm 8°C and you don't just halve the time; you cut it to roughly 45% of what it was. That extra 10% is exactly why summer dough sneaks past you so much faster than people expect.

The model that follows assumes a healthy starter at peak, white bread flour, and 20% inoculation. Change those and the curve shifts, but the *shape* of the curve — the 2.2× per 8°C — stays the same.

## A bulk-time table you can read at a glance

Here is the Q10 model spelled out across the temperatures a home kitchen actually sees. Each row is the approximate time to reach the end of bulk (around a 50% rise) for a 20% starter white-flour dough, anchored to the reference of **5 hours at 24°C**. The math is time = 5 × 2.2^((24 − T)/8).

| Dough temp | Approx. bulk to ~50% rise | vs. 24°C reference |
|---|---|---|
| 16°C (61°F) | ~11 h 00 m | a long overnight |
| 18°C (64°F) | ~9 h 00 m | most of a working day |
| 20°C (68°F) | ~7 h 25 m | classic cool-room bulk |
| 22°C (72°F) | ~6 h 05 m | typical spring kitchen |
| 24°C (75°F) | ~5 h 00 m | the reference point |
| 26°C (79°F) | ~4 h 05 m | warm kitchen / proofer |
| 28°C (82°F) | ~3 h 20 m | fast same-day bake |
| 30°C (86°F) | ~2 h 45 m | very fast, easy to overshoot |

Read down that column and the practical consequence is obvious: the dough you mixed at 9 a.m. on a 22°C Saturday is ready around 3 p.m., while the *same* dough mixed at 9 a.m. in a 16°C winter kitchen won't be ready until evening. Treating those two days as the same bake is the most common reason loaves come out underproofed in winter and overproofed in summer. If your kitchen swings hard with the seasons, the dedicated guides on [winter sourdough](/sourdough/winter-sourdough/) and [summer sourdough](/sourdough/summer-sourdough/) cover how to claw the temperature back toward that 24°C sweet spot.

## Measure dough temperature, not air temperature

The table is keyed to *dough* temperature, and that's deliberate — dough is usually warmer than the room it sits in. Friction from mixing adds heat (1–4°C by hand, more with a stand mixer), and the dough then holds that heat because flour and water are slow to cool. A 22°C kitchen routinely produces dough sitting at 24–25°C straight out of the mix.

That gap is why people who plan off the thermostat get caught out: they look up "22°C" expecting six hours and the dough is actually fermenting on the 24–25°C line, an hour or more faster. A cheap instant-read probe in the centre of the dough right after mixing settles it. If you want to *hit* a target dough temperature rather than just measure it after the fact, the [DDT water-temperature formula](/sourdough/ddt-formula-water-temperature/) tells you how warm or cold to make your water before you mix.

## Inoculation: the second dial that bends the clock

Temperature sets the curve; inoculation — the percentage of starter relative to total flour — slides you along it. The relationship in the model is close to linear, so it folds neatly into the same arithmetic: halving the starter roughly doubles the time, doubling it roughly halves it. Concretely, the full estimate is bulk time = 5 × 2.2^((24 − T)/8) × (20 / inoculation%).

- **10–15% inoculation** — slower bulk, easily stretched to an overnight at cool room temperature. Useful when you want to ferment while you sleep.
- **20% inoculation** — the reference used in the table above. Predictable, and the default starting point.
- **25–30% inoculation** — faster bulk, sometimes under three hours in a warm kitchen. The lever to pull for a same-day loaf.

A worked example: at 20°C the table says ~7 h 25 m at 20% starter. Drop to 10% and you're near 15 hours — a true set-and-forget overnight. Push to 30% and you're back around five hours even in that cool room. Same temperature, very different day, just by moving one number. If you're not sure how your starter ratio affects its own peak timing, the [starter-feeding-ratio](/sourdough/starter-feeding-ratio/) guide handles the feed side; this article assumes your levain is already ripe at mix time.

## Visual cues beat the clock

The table is a planning tool, not a stopwatch. Dough finishes bulk when *it* decides, and your job is to read it. The reliable tells:

- **A 50% rise** in volume measured from the moment salt went in. Mark the side of a straight-walled container with tape or a wax pencil so the rise is unambiguous — eyeballing a curved bowl is where most "I thought it was ready" errors come from.
- **A domed top** that holds its shape when you tilt the container gently.
- **A jiggle** — wobble the container and the surface moves like set custard, not like wet concrete.
- **Bubbles at the surface and along the sides** of a clear container.

When two or more of those four line up, you're at or near the end of bulk regardless of what the clock says. The numbers tell you *roughly when to start watching*; the dough tells you when to stop.

## How to use the calculator with your kitchen

Open the [schedule calculator](/), set inoculation, hydration, and salt to your recipe, then set the room-temperature input to your *measured* room temperature rather than the thermostat reading. It runs the same Q10 model behind the table above, then schedules everything around the bulk estimate — folds, pre-shape, retard, and bake-out — so the whole day lines up from a single temperature.

If your bulks consistently finish faster than predicted, your dough is almost certainly running warmer than the room (underfloor heating, sun on the counter, an oven light left on). Nudge the room input down 1–2°C and the prediction snaps back into line. This is the one calibration worth doing once: find your kitchen's real offset between room and dough, and every future bake inherits it.

## What the temperature model can't see

Two things sit outside the temperature curve, and it's worth naming them so you don't blame the math when they bite.

**Flour.** The model assumes white bread flour. Whole-grain flours carry more enzymes and more wild yeast on the bran, so they ferment noticeably faster — a 50% whole-wheat dough can shave 20–30% off the predicted time. That's a flour effect, not a temperature effect, and it's covered properly in the [whole-wheat](/sourdough/whole-wheat-sourdough/) and [rye](/sourdough/rye-sourdough-rules/) guides. Hydration and autolyse choices also nudge dough behaviour, but they belong to their own topics — see [hydration explained](/sourdough/hydration-explained/) and [autolyse vs. fermentolyse](/sourdough/autolyse-vs-fermentolyse/) rather than reading them into the temperature table.

**Starter health.** The curve assumes a starter peaking on schedule. A sluggish or over-fed starter adds latency at the front that no dough-temperature math can erase. If yours isn't reliably doubling, fix that first — the [revive-a-forgotten-starter](/sourdough/revive-forgotten-starter/) guide is the place to start.

## Common questions

### Is air temperature or dough temperature what I should plug into the table?

Dough temperature, measured in the centre right after mixing. The room number is only a proxy, and usually a cool one — dough typically runs 1–3°C warmer than the air because of mixing friction and slow heat loss. If all you have is the room reading, add 1–2°C before you look up the row.

### How do I tell underproofed from overproofed at the end of bulk?

Underproofed dough is tight, barely domed, and springs back fast when poked. Overproofed dough has lost its dome, looks slack and bubbly at the edges, and tears or jiggles loosely. The 50% rise plus a held dome is the window you're aiming for; past that, fast, in a warm kitchen, you can slide from perfect to overproofed in under an hour.

### Does higher hydration change the bulk time?

Wetter dough *feels* like it ferments faster because it's slacker and shows gas more readily, but the temperature curve is what actually sets the time. Treat hydration as a handling and crumb decision, not a clock decision — the details live in [hydration explained](/sourdough/hydration-explained/).

### Can I just retard in the fridge instead of timing a room-temperature bulk?

Yes, and the fridge is essentially temperature control by another name — you're moving the dough far down the cold end of the curve so it crawls. Whether to finish bulk warm or push it cold is its own trade-off, laid out in [cold retard vs. same-day](/sourdough/cold-retard-vs-same-day/).

### My loaf is dense even though I followed the times. What now?

Times are a starting estimate, not a guarantee — density usually traces back to ending bulk too early, a weak starter, or under-development rather than the temperature math. The [fix-a-dense-sourdough](/sourdough/fix-dense-sourdough/) guide walks the diagnosis; come back to this curve once your starter and rise are dialled in.

### Why does my bulk finish faster in summer even at the "same" kitchen temperature?

Because the dough is warmer than your thermostat suggests, and the Q10 curve is steep. A kitchen that reads 24°C in summer often holds dough at 26–27°C once you account for warm flour, warm water, and ambient heat — and at that point you've jumped a row or two up the table without realising it.

## Calibrate once, then trust the curve

The mistake most bakers make isn't ignoring temperature — it's measuring the wrong thing once and never closing the loop. Do it properly a single time: mix a plain 20% starter dough, probe the dough temperature, bulk it in a marked straight-walled container, and write down the clock time when it actually hits the 50% line. Compare that to the row in the table. The difference between the two is your kitchen's personal offset, and it almost never changes.

From then on you're not guessing the season or trusting a thermostat — you're reading one dough-temperature number, sliding to the matching row, applying your starter ratio, and starting your visual checks a little before the estimate lands. That's the whole discipline. Temperature is the one dial that bends every other timing in the bake, and once you've calibrated it, the curve does the planning so you can spend your attention on the dough.
