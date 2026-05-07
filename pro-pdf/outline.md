# Sourdough Schedule Pro — content outline

Use this as the table of contents for the Pro PDF you sell on Gumroad ($19).
The TOC + sample chapters here lets you generate the full ~80-page PDF in
2–3 Claude API sessions.

---

## Part 1 — The 30 recipes (with full timing tables)

Each recipe includes: ingredient table, three climate-tuned schedules
(cold/standard/hot kitchen), step-by-step technique notes, and a troubleshooting paragraph.

### White & lean

1. Country loaf 75% — the classic
2. Country loaf 80% — the upgrade
3. White sourdough sandwich loaf 68%
4. Pain de campagne — French country style
5. Pan de cristal 100%

### Whole grain

6. 50% whole wheat country
7. 100% whole wheat — yes, it's possible
8. Multigrain (white + WW + rye + spelt)
9. Spelt sourdough
10. Khorasan / kamut sourdough
11. Sprouted grain sourdough
12. 100% rye — the slow road

### Hydration showcases

13. Ciabatta 85%
14. Open-crumb country 82%
15. Pain rustique 75%

### Enriched

16. Brioche sourdough — butter + eggs
17. Sourdough discard pancakes
18. Sourdough croissants — laminated levain
19. Hokkaido milk bread sourdough
20. Babka with sourdough leavening

### Flatbreads & shapes

21. Sourdough focaccia
22. Sourdough pizza dough — 24, 48, 72-hour
23. Sourdough bagels
24. Sourdough English muffins
25. Sourdough pita

### Holiday & specialty

26. Panettone with natural levain
27. Stollen with sourdough
28. Hot cross buns sourdough
29. Sourdough pretzels (with lye bath)
30. Sourdough beer bread

---

## Part 2 — Climate-tuned schedules

For each recipe above, three timing tables:

- **Cold kitchen (15–18°C):** longer bulk, longer retard, possibly higher inoculation
- **Standard kitchen (20–24°C):** the published recipe
- **Hot kitchen (26–32°C):** shorter bulk, lower inoculation, possibly skip retard

This is the section that justifies the $19. Most online sourdough recipes assume "room temperature" without specifying which one. Bakers in cold kitchens give up because nothing rises on schedule. Bakers in hot kitchens overferment everything. Climate-tuned tables solve both problems.

---

## Part 3 — Troubleshooting flowcharts

Visual decision trees for the 24 most common issues:

1. Gummy crumb
2. Dense crumb
3. Flat loaf
4. No ear / poor scoring
5. Burned bottom, raw top
6. Pale crust
7. Sour beyond preference
8. Bland flavour
9. Crumb wall holes (tight or chaotic)
10. Sticky dough that won't shape
11. Dough that tears during shaping
12. Starter won't peak
13. Starter peaks too fast
14. Starter peaks too slow
15. Starter went mouldy
16. Hooch every day vs hooch sometimes
17. Bulk taking too long
18. Bulk over too fast
19. Cold retard flat-spread the loaf
20. Loaf stuck in banneton
21. Loaf split unexpectedly during bake
22. Dough won't pass windowpane test
23. Crust too thick / too thin
24. Crumb texture inconsistent

Each flowchart: "if X, then check Y; if Y is true, do Z; if Y is false, check W."

---

## Part 4 — Starter rescue protocols

- 7-day starter from scratch (rye route)
- 7-day starter from scratch (whole wheat route)
- Reviving fridge-forgotten starter (3-feed protocol)
- Fixing a sluggish starter (population concentration method)
- Fixing an over-acid starter (refresh + cleanup feeds)
- Switching flours mid-life (transition schedule)
- Travelling with starter (drying, freezing, hibernation)
- The minimum-effort starter (bake-monthly schedule)

---

## Part 5 — Advanced topics

- Lamination during bulk: when, why, how to time it
- Tangzhong/yudane in sourdough
- Making your own bread flour blends (T80, T65 simulations)
- Discard projects that aren't pancakes
- Long-cold ferments (48–72 h): rules and risks
- Frozen retards: yes, and here's the catch
- Multi-loaf scheduling: 4 loaves on the same Saturday
- Bread for one: scaling sourdough to 250 g flour

---

## Part 6 — Reference appendix

- Baker's percentage primer
- Hydration conversion tables
- Temperature conversion tables (°C ↔ °F)
- Salt percentage and effects on fermentation
- Levain hydration and effects on dough hydration
- Flour protein content reference
- Common flour brand comparisons
- Equipment recommendations with reasoning
- Glossary of sourdough terminology

---

## Production notes

To generate the full PDF:

1. Use Claude API (Opus model) to draft each section. The roadmap topics
   already in `content-roadmap.json` cover most of Part 5 and Part 6.
2. Polish in Notion, Google Docs, or Markdown editor.
3. Export to PDF. For nicer typography, use a tool like Typora,
   iA Writer, or LaTeX with a baking-themed template.
4. Cover image: Canva, 1600×2400px, your brand colours.
5. Upload to Gumroad. Set price $19, allow $9 minimum (pay-what-you-want
   often outperforms fixed pricing on digital goods).
6. Update `MONETIZATION_CONFIG.gumroadProductURL` in the HTML.

Estimated effort: a focused weekend (12–16 hours) with Claude doing
the heavy lifting on first drafts.
