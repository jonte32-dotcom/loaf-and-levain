# AdSense "Low value content" — åtgärdsplan

**Datum:** 2026-05-31
**Underlag:** 18-agents innehållsrevision (14 artiklar + sajtnivå + research mot aktuella AdSense-kriterier)
**Status:** loafandlevain.com avslaget 2× på "Low value content" (ownership ✓, ads.txt ✓ — innehållet är problemet)

---

## Kärninsikt (det här vänder på problemet)

**Prosan är inte problemet — förpackningen är.** Research-agenten och artikelgranskarna är överens: själva texten ligger **över** AI-snittet (specifika siffror, riktiga felmoder, ej tom boilerplate). Per-artikel-domen blev **8 keep, 6 deepen, 0 rewrite**.

Det Google läser som "skalad AI-content utan människa bakom" är **signalerna runt texten**:

1. **Identiskt CTA + samma 4 "related"-kort på varje artikel** — den #1 AI-flaggan, syns på under 2 minuter.
2. **Författare = `Organization`** i JSON-LD, ingen namngiven person, anonym "home bakers"-About → noll E-E-A-T.
3. **Noll egna bilder i någon artikel** (alla delar `og-image.jpg`) → tyngsta low-value-signalen; inget bevis att en människa bakat.
4. **Verktyget är startsidan** (kalkylatorn på `/`, artiklarna gömda på `/sourdough/`) → "tool UI is not editorial content".
5. **Dubbletter/kannibalisering:** 02 (gummy) ↔ 08 (dense) delar ~6 orsaker + ordagranna avslut; 03/06/09 återförklarar alla peak/feed-timing.

**Förebilden finns redan:** artikel 13 (whole wheat) + 14 (rye), skrivna 31 maj — 1500+ ord, riktiga tabeller, FAQ, första person. Replikera dem; mall-batchen (02,03,06,08,09,10,11,12) är problemet.

> Google förbjuder inte AI-innehåll. Policyn straffar låg kvalitet/skalad produktion **utan redaktionellt ägarskap**. Fixa förpacknings-/E-E-A-T-signalerna så kan samma text mycket väl bli godkänd.

---

## Prioriterade sajt-övergripande drag

| # | Åtgärd | Effekt | Insats | Vem |
|---|---|---|---|---|
| 1 | **Bryt CTA-/related-enformigheten** — topiskt relevanta "related" (inte slice(0,4)) + kontextuellt avslut per artikel | Störst (tar bort #1 AI-flaggan) | Låg (kod) | **Claude** |
| 2 | **Namngiven författare + E-E-A-T** — JSON-LD `Person`, byline + bio + foto, riktig About med en verklig bagare | Mycket stor | Medel | Claude (scaffolding) + **du** (namn/bio/foto) |
| 3 | **Egna bilder, ≥2–3 per artikel** (gummy crumb, float-test, starter at peak, öra) + diagram | Tyngsta enskilda signalen | Medel–hög | **du** (foton) + Claude (diagram) |
| 4 | **De-dup 02↔08** + ta bort upprepade fraser (06,09,11,12) | Stor (duplicate-flagga) | Låg–medel (kod/innehåll) | **Claude** |
| 5 | **Startsidans redaktionella djup** — 350–450 ords intro ovanför kalkylatorn, FAQ 7→12–15, dämpa annonstäthet above-the-fold | Stor (tool-as-homepage) | Medel | **Claude** |
| 6 | **Konsolidera** 02+08 → en felsökningsguide; 03+06+09 → en starter-pelarsida; uppgradera 01/04 till flaggskepp i 13/14-format | Stor (färre djupare sidor) | Hög | Claude (innehåll) — *SEO-beslut, bekräfta först* |

**Re-request review FÖRST när #2 (namngiven författare) + #3 (bilder) + #4 (de-dup) är live. Vänta 2–3 veckor efter.**

---

## Vad Claude kan göra i kod nu (utan dig)

- **relatedList topiskt** (inte slice(0,4)) + variera CTA → `scripts/inject-articles.js`
- **Person-författar-scaffolding:** JSON-LD `author:{@type:Person,...}` + `datePublished/dateModified`, byline + bio-box i `renderArticlePage`, ev. `/author/<namn>`-sida (namnet fyller du i en konstant)
- **Interna länkar** mellan artiklar (revisionen har exakt vilka — t.ex. 02→01/07/13, 08→01/09/05, alla→kalkylatorn med riktig URL)
- **De-dup 02↔08** + skriv om upprepade avslut/fraser (06,09,11,12)
- **Startsidans intro + FAQ-expansion** i `sourdough-schedule.html` (+ uppdatera FAQPage-JSON-LD)
- **Bild-CSS** (`.article-body img`) så foton renderar, + generera **diagram-bilder** via den befintliga `sharp`-pipelinen (bulk-temp-kurva, hydrationstabell, pH/protease-kurva)
- **De små redaktionella fixarna** revisionen hittade (hedge-språk, kvarvarande mall-rubriker)

## Vad bara du kan göra

- **Riktiga bak-foton** (gummy crumb, float-test i glas, starter at peak, öra/bloom) — Google vill se original-bilder som bevis på erfarenhet. *(Jag kan generera diagram, men foton är den starkaste signalen.)*
- **Författarens riktiga namn + bio + porträtt/bak-foto** — vem står för innehållet?
- **Domänmail** (hej@loafandlevain.com) i stället för gratis-gmail.

---

## Ärlig strategisk bedömning

AdSense är **en svag passform** för en tunn AI-content-sajt + verktyg, och ger lägst RPM av annonsnäten. Dina **andra intäktsben behöver inte AdSense**: Amazon-affiliate (gear-strip), Gumroad $19-PDF, e-postlistan, Buy Me a Coffee.

Två vägar:
- **A) Satsa på godkännande:** kör #1–#5 ovan (mest kod kan jag göra; foton + namn kräver dig), vänta 2–3 v, re-request. Görbart men kräver riktig insats.
- **B) Lägg AdSense åt sidan:** fokusera på trafik + affiliate/PDF/e-post, och kom tillbaka till AdSense om några månader när sajten är en genuin resurs med foton och en namngiven bagare.

Oavsett väg höjer #1–#4 även den vanliga SEO-kvaliteten — så de är värda att göra även om du väljer (B).
