# The DDT formula: water temperature for perfect dough

Professional bakers do something most home bakers skip: they pre-calculate the water temperature so the dough lands at a known temperature after mixing. The math takes ten seconds, and the payoff is that bulk fermentation runs on schedule instead of you guessing whether the kitchen was warm enough today. DDT stands for desired dough temperature — the number you pick first, then work backwards to find the only variable you fully control: the water.

Here is the formula, where it comes from, and how to use it without turning every bake into a spreadsheet.

## The formula

`Water = (Target × 3) − Flour − Room − Friction`

Every value is in the same unit, and Celsius is cleaner to reason about than Fahrenheit. The "× 3" is not magic: it is the count of temperatures you are correcting for — flour, room, and friction — and you solve for the fourth, the water. If you ever add a fourth factor (say, a separately tracked levain temperature), the multiplier becomes × 4. For ordinary sourdough you treat the levain as roughly room temperature and leave it at three.

Worked the other way, the logic is just an average. Your dough temperature ends up near the average of everything that goes into it. With three known inputs and one target average, the water has to make up the difference — so it swings further than you might expect.

## Worked examples

**Cold winter kitchen.** Target dough temperature 25°C (77°F), flour 18°C, room 18°C, hand mixing at 3°C friction.

`Water = (25 × 3) − 18 − 18 − 3 = 75 − 39 = 36°C (97°F)`

That is warm tap water — comfortable on the inside of your wrist, not hot. In a cold kitchen you nudge the dough up to target with slightly warm water. Do not reach for hot water straight off the tap; you want the dough warmed evenly, not the surface gluten and the yeast on the water's edge getting scalded.

**Hot summer kitchen.** Target 25°C, flour 27°C, room 27°C, hand mixing at 3°C.

`Water = 75 − 27 − 27 − 3 = 18°C (64°F)`

Now the water has to pull the dough *down* to target. Use cold tap water, and if your tap runs warm in high summer, chill part of it or swap in a few ice cubes (counted by weight as water).

**Stand mixer, same hot kitchen.** Identical inputs but mixer friction of 6°C instead of 3°C.

`Water = 75 − 27 − 27 − 6 = 15°C (59°F)`

The mixer dumps more mechanical heat into the dough, so the water has to be colder still to land on the same 25°C. This is exactly the case where guessing fails: two bakers in the same kitchen, same recipe, will finish at different dough temperatures purely because one kneaded by hand and one ran a machine.

## Friction by mixing method

Friction is the only input people consistently get wrong, because it is invisible — you cannot read it off a thermometer before you mix. It is the heat your mixing adds, and it scales with how much energy goes in and for how long.

| Mixing method | Typical friction |
|---|---|
| Pinch-and-fold by hand, 2–3 minutes | ~1°C |
| Standard hand mix / slap-and-fold, 5 minutes | 2–3°C |
| Stand mixer, low–medium speed, 8–10 minutes | 5–7°C |
| Spiral or high-speed dough mixer | 7–8°C |

Treat these as starting points, then calibrate against your own kitchen. Probe the dough's centre right after mixing, compare it to the target, and the gap tells you how far off your friction estimate was. Two or three bakes and you will know your own number for each method to within a degree. I run a stand mixer on low and have settled on 6°C for my own dough; a friend with a stiffer, faster machine sits closer to 8°C for the same time.

## Why dough temperature matters

Yeast and bacteria speed up with warmth, following the same Q10 ≈ 2.2-per-8°C rule the [schedule calculator](/) and the [bulk fermentation guide](/sourdough/bulk-fermentation-by-temperature/) use. Run the numbers and a couple of degrees is more than a rounding error. A dough finishing at 26°C ferments roughly 20% faster than one at 24°C, and around 35% faster than one at 23°C.

Put that in clock terms. A bulk written for 6 hours at 24°C dough is not "done in 4 hours" if you accidentally land at 26°C — it is closer to **4.9 hours**, about an hour early. That hour is the difference between a domed, jiggly bulk and a slack, over-gassed one that tears at shaping. The DDT formula is what keeps the dough on the temperature your schedule was written for, so a planned bulk lands within roughly ±20 minutes instead of surprising you.

## When DDT actually earns its keep

You do not need to calculate DDT for every bake. Most home bakers settle into a pattern — known tap water, a familiar kitchen — and get consistent results for weeks. The formula matters most when that pattern breaks:

- **The season turns.** Spring and autumn transitions quietly wreck schedules. Your tap, your flour, and your room all drift at once, and a fixed-water habit lands you off-target. This is the same swing the [winter](/sourdough/winter-sourdough/) and [summer sourdough](/sourdough/summer-sourdough/) guides exist to manage.
- **You try a new recipe**, especially enriched dough (brioche, panettone, croissant) where temperature precision drives the whole lamination and proof.
- **Your kitchen runs unusually hot or cold** — underfloor heating, a sun-blasted countertop, a draughty winter pantry.
- **You want batch-to-batch repeatability.** Bakery bakers calculate DDT every single mix, and that is most of why their loaves look identical.

## Cold flour throws the whole sum off

Most bakers assume flour temperature equals room temperature, and on a shelf-stored bag that is true. It is wrong for flour kept in the fridge or freezer — a habit some bakers adopt to slow rancidity in whole-grain flours.

Cold flour can shift the calculation by 5–10°C and you will undershoot dough temperature badly without ever knowing why. Either pull the flour out an hour ahead so it equilibrates, or measure its actual temperature and plug *that* into the formula. The sum is only as honest as its inputs.

## The water itself

The water you mix into dough does not need filtering — chlorinated tap water works fine for the dough. Starter health is more sensitive to chlorine than dough is, so if your tap runs heavily chlorinated, dechlorinate the water you feed the [starter](/sourdough/starter-feeding-ratio/) and use plain tap for the dough. Leaving water out overnight to off-gas chlorine is a fine ritual, but it is not what makes or breaks a loaf.

One sanity check: if the formula tells you to use water below about 5°C or above 50°C, stop and re-read your inputs. Numbers that extreme almost always mean a typo or a genuinely unusual kitchen condition worth investigating before you mix.

## The shortcut for cooks who don't like math

If you bake the same recipe weekly and your kitchen sits steadily in the 21–24°C range, you can skip the arithmetic. Lukewarm tap water around 35–40°C lands you in the right ballpark, and a notebook of dough-temperature readings will calibrate your tap by feel within five or six bakes. The formula is there for the times the shortcut fails — a shifted season, a new recipe, or a string of off loaves you can't explain. Plug in the numbers and temperature stops being the mystery variable.

## Common questions

### What's the ideal desired dough temperature for sourdough?

For most white and lightly whole-grain sourdough, aim for 24–26°C. It gives a brisk but controllable bulk and clean acidity. Go warmer (26–28°C) for a faster same-day bake or for rye, and cooler (22–24°C) if you want a longer, more flavour-forward bulk. Pick the target first; the formula finds the water.

### Why is my dough always colder than the target I calculated?

Almost always an underestimated cold input — fridge-cold flour, a colder-than-you-think winter room, or friction set too high for a gentle hand mix. Probe the dough right after mixing, find the gap, and correct the input that was furthest from reality. The formula is rarely wrong; the guesses fed into it usually are.

### Do I count the levain in the formula?

Not as a separate term for ordinary sourdough. The standard three-factor version treats the levain as roughly room temperature, which is true if your starter lives on the counter. If it comes straight from the fridge or a warm proofer, nudge the water a degree or two the opposite way to compensate, rather than rewriting the formula.

### Does hydration change the water temperature I need?

The formula doesn't change, but consequences do. A high-hydration dough is mostly water, so the water temperature has more leverage over the final dough temperature — your correction lands harder. At low hydration the flour dominates and the water matters less. If you bake across a wide hydration range, see [hydration explained](/sourdough/hydration-explained/) for how the water-to-flour balance shifts handling.

### Can I just use ice instead of measuring cold water?

Yes, and in a hot kitchen it is often the only way to hit a low target. Weigh the ice as part of your water total and let it melt into the mix. Just remember melting ice also chills the dough as it absorbs heat, so you may land a touch cooler than the arithmetic predicts — start with slightly less ice than the formula's full swing suggests.

### My calculated water is over 50°C. Is that safe?

No — back off. Water hotter than about 50°C starts to damage yeast and denature gluten on contact. If the formula demands that, your room or flour is genuinely cold and you are better off warming the *environment* (a turned-off oven with the light on, a proofing box) than scalding the dough into the right number.

## On your next bake

Before you mix, take three readings you usually ignore: flour temperature, room temperature, and — the honest one — the dough temperature right after your last mix, so you know your real friction number. Feed those into `Water = (Target × 3) − Flour − Room − Friction`, hit your target within a degree, and watch how much tighter your bulk timing becomes. Once your friction value is dialled in for the way *you* mix, in *your* kitchen, the water stops being something you test with a wrist and becomes a number you simply set.
