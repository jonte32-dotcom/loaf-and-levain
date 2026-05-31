# Sourdough Deep Review — Loaf & Levain (loafandlevain.com)

**Datum:** 2026-05-29
**Granskare:** staff-engineer + UX-strateg + bagar-domänexpert (Claude, ultrathink)
**Metod:** orienterande genomläsning + 7 parallella djupgranskningsagenter, var och en adversariellt verifierad (varje citerat radnummer öppnat och kontrollerat), plus 3 idéströmmar. 69 fynd, 39 verifierade förstahands-kontroller, 1 avfärdat fynd, 6 justerade. Citerade radnummer är verifierade mot faktisk fil; osäkra domänpåståenden är märkta `[VERIFY]`.

---

## 0. Snabb sammanfattning

**Viktig ramjustering:** granskningsmallen var skriven för en surdegs-*app* (mobil, sensorer, watch-app, hydration-kalkylator i en native domänmodell). Det här projektet är **inte** en app. Det är två saker:

1. **En statisk single-file webbsajt** — `sourdough-schedule.html` (4762 rader, 182 KB, all CSS+JS inline) som innehåller en faktiskt kompetent **surdegs-schemakalkylator** (schemagenerator, Recipe Lab med baker's percentages, DDT-kalkylator, starter-planerare, live-bake-läge) plus ett komplett **monetiseringslager** (Amazon affiliate, Gumroad Pro-PDF, MailerLite lead-capture, Buy Me a Coffee, AdSense).
2. **En Node "content factory"** — ESM-skript som låter Claude skriva SEO-artiklar, injicerar dem som standalone-sidor, bygger sitemap, och automatiserar Pinterest + e-postdrip. Tre GitHub Actions-crons kör allt obevakat. Deploy via Cloudflare Pages.

Mallens app-frågor (sensorer, HomeKit, Apple Watch) är därför mestadels irrelevanta — men *andan* (är domänlogiken bagarmässigt korrekt? är systemet robust, säkert, monetiserbart?) gäller fullt ut, och kalkylatorn har **äkta domänlogik** att bedöma med en bagares hjärna.

### Tech-stack

| Lager | Teknik |
|---|---|
| Frontend | Vanilla JS (en IIFE, `use strict`), inline CSS med design-tokens, ingen build-framework |
| Content factory | Node 20 ESM, `@anthropic-ai/sdk`, `marked` v15, `sharp` (odeklarerad), inga tester |
| Deploy | Cloudflare Pages (git-kopplat), `functions/_middleware.js` (edge), `_redirects` |
| Automation | 3 GitHub Actions-crons (weekly-content, pinterest, welcome-drip) |
| Integrationer | Anthropic, MailerLite, Pinterest v5 API, AdSense, Plausible, Gumroad, Amazon Associates |

### Helhetsbedömning

Det här är ett **ovanligt välbyggt soloprojekt**. Kalkylatorns fermentationsmodell är temperatur- och inoculation-beroende (Q10-modell, slår de flesta gratis-konkurrenter), `isConfigured`-gatet är en elegant fail-safe, content-factoryn använder en allowlist (rätt säkerhetsmodell), och `welcome-drip-probe.js` är en föredömlig dry-run-design. Det märks att en kompetent person tänkt igenom arkitekturen.

Men det finns ett **kluster av allvarliga produktions- och efterlevnadsfel** som direkt undergräver intäkterna och förtroendet:

| Allvarlighet | Antal | Tyngsta exemplen |
|---|---|---|
| **KRITISKT** | 3 | Betal-PDF:erna gratis nedladdningsbara; live-nycklar i klartext; ingen integritetspolicy-länk på startsidan |
| **HÖG** | 13 | Verifiera att Google-CMP faktiskt fyrar (K3); DDT-formeln ger ~53 °C vatten (skållar levainen); levain-mjöl räknas ej i hydration; ICS-tider fel över sommartid; AdSense laddas dubbelt; modell-id hårdkodat; välkomstmail kan dubbelskickas |
| **MEDIUM** | ~24 | Inga säkerhetsheaders; inga enhetstester för matematiken; döda artikellänkar; ingen dark mode; WCAG-kontrastfel |
| **LÅG** | ~21 | i18n saknas; small SEO/innehållsfel; kosmetik |

De tre absolut viktigaste sakerna att göra **innan AdSense-godkännandet** (som fortfarande är under review): (1) fixa root-deploy/PDF-läckan, (2) lägg in integritetspolicy-länk på startsidan + verifiera att den Google-CMP som konfigurerades i AdSense-konsolen 2026-05-14 faktiskt fyrar för EEA, (3) rotera de exponerade nycklarna. Inget av det tar mer än en dag tillsammans.

---

## 1. KRITISKT

> Säkerhet, intäktsläckage, brutna produktionsfunktioner och juridik som kan stoppa AdSense.

### K1 — Cloudflare-output satt till repo-roten gör att betal-PDF:erna kan laddas ner gratis

- **Filer:** `README.md:32-35`, `LAUNCH-CHECKLIST.md:27-28`, `functions/_middleware.js:5-23`, `scripts/build-dist.js:17-28`
- **Vad:** Dokumenterad deploy är `Build command: npm install && npm run build` men **Output directory: `.` (root)**. `build-dist.js` bygger noggrant en allowlist till `dist/`, men eftersom Cloudflare publicerar **roten** serveras alla spårade rotfiler. Verifierat med `git ls-files`: `Sourdough Schedule Pro.pdf`, `Sourdough-Cheat-Sheet.pdf` och `sourdough-pro-cover.jpg` ligger spårade i roten. De matchar varken `BLOCKED_EXACT` eller någon `BLOCKED_PREFIX` i middleware (som bara blockerar markdown-källan `/pro-pdf/`, inte själva PDF:en) och inte `_redirects`.
- **Varför:** Hela Gumroad-monetiseringen ($19 Pro-PDF) undermineras — vem som helst kan gissa `https://loafandlevain.com/Sourdough%20Schedule%20Pro.pdf` och ladda ner gratis. Dessutom blir `build-dist.js` falsk trygghet: varje framtida känslig rotfil exponeras automatiskt.
- **Lösning:** Antingen (a) ändra Cloudflare Pages output-katalog till `dist` så allowlisten faktiskt gäller (rätt arkitektur — `build-dist.js` är redan byggd för det), eller (b) ta bort betal-PDF:erna ur git helt och leverera dem enbart via Gumroad, och lägg `/Sourdough Schedule Pro.pdf`, `/Sourdough-Cheat-Sheet.pdf`, `/sourdough-pro-cover.jpg` i både `BLOCKED_EXACT` och `_redirects`. Alternativ (a) är klart att föredra.
- **Beroenden:** Verifiera den faktiska Cloudflare Pages-inställningen i dashboarden — dokumentationen säger root, men kan ha ändrats manuellt. **Detta måste bekräftas innan något annat.**
- **Insats:** 1 h.

### K2 — Live Anthropic-nyckel och långlivad MailerLite-JWT i klartext på disk

- **Filer:** `config.local.json:1-4`, `scripts/post-pinterest-pin.js:18-27`, `scripts/welcome-drip.js:25-32`
- **Vad:** `config.local.json` innehåller en aktiv Anthropic-nyckel (`sk-ant-…`, 108 tecken) och en MailerLite-JWT (988 tecken). Filen är **korrekt gitignorad och har verifierat ALDRIG committats** (`git log --all -- config.local.json` är tomt; JWT-prefixet finns i ingen commit). Men den ligger i klartext på disk, läses som fallback av flera skript, och JWT:n har en avkodad `exp` på **2126-05-08 — ~100 års livslängd**.
- **Varför:** En läckt Anthropic-nyckel ger obegränsad fakturerad API-användning. MailerLite-token ger full åtkomst till hela e-postlistan (export, utskick, radering) — direkt GDPR-/förtroenderisk. Klartext-hemligheter på disk läcker oftast via backup, delade mappar, malware eller skärmdumpar. *(Tidigare antagande korrigerat: Desktop är INTE OneDrive-omdirigerat på denna maskin — `C:/Users/Aras_/OneDrive/Desktop` finns inte — så molnsynk-vektorn är inte aktiv idag, men kan slås på via Known Folder Move.)*
- **Lösning:** **Rotera båda nycklarna nu** (de har legat i klartext sedan 8 maj). Ersätt `config.local.json`-fallbacken med enbart miljövariabler; för lokal körning, använd en `.env` utanför repo-roten eller OS-nyckelhanterare. Sätt en rimlig livslängd på MailerLite-token om plattformen tillåter — 100 år är onödigt.
- **Beroenden:** Anthropic Console + MailerLite-dashboard + uppdatering av GitHub Actions Secrets.
- **Insats:** 1 h.

### K3 → omklassad till HÖG `[VERIFY]` — verifiera att Google-CMP faktiskt fyrar; reconcile mot obefintlig CMP-kod i repot

> **Korrigering efter avstämning mot sessionsanteckningar:** detta rapporterades initialt som ett KRITISKT "ingen CMP"-brott baserat på att repot saknar CMP-kod. Men en Google-CMP (Funding Choices, 3-val) konfigurerades i AdSense-*konsolen* 2026-05-14 (se [[adsense-application-status]]). Konsol-konfigurerad Funding Choices levereras via Googles servrar genom AdSense-taggen och kräver **ingen** kod i repot. Avsaknad av CMP-kod bevisar alltså **inte** att ingen CMP är aktiv. Nedgraderat till HÖG `[VERIFY]`.

- **Filer:** `sourdough-schedule.html:9`, `scripts/inject-articles.js:175`, `privacy.html:124`, `README.md:214`
- **Vad:** AdSense-loadern ligger ovillkorligt i `<head>` (rad 9 + `inject-articles.js:175`). Grep på `consent|cookie|cmp|fundingchoices` i koden = noll träffar (förväntat om CMP är konsol-konfigurerad). `privacy.html:124` beskriver en samtyckesbanner och `README.md:214` säger "AdSense handles cookie consent in the EU".
- **Varför:** Google kräver en certifierad CMP för EEA/UK/CH-trafik sedan jan 2024. Om CMP:n av någon anledning **inte** fyrar på den deployade sidan visas inga annonser för EEA-trafik och policyn bryts — därför fortfarande HÖG. Men eftersom CMP är konsol-konfigurerad är detta sannolikt redan löst; det behöver **verifieras**, inte byggas om.
- **Lösning:** (1) Öppna `https://loafandlevain.com/` i en EEA-kontext (VPN/EU-IP) och bekräfta att Funding Choices-bannern faktiskt visas och blockerar annonscookies före samtycke. (2) Kontrollera i AdSense → Privacy & messaging att meddelandet är publicerat och kopplat till domänen. (3) Stäm av `privacy.html:124`-formuleringen mot den faktiska CMP:n (banner-beskrivningen ska matcha verkligheten). Om bannern *inte* visas: publicera/återpublicera Funding Choices i konsolen — ingen repo-kod behövs.
- **Beroenden:** AdSense-konsolåtkomst. Bör verifieras innan/under review.
- **Insats:** 15 min (verifiering) + ev. halvdag om CMP måste konfigureras om.

### K4 — Startsidan (kalkylatorn) saknar helt länk till integritetspolicyn

- **Filer:** `sourdough-schedule.html:2696-2699` (footer), `:2084` (nav), `:2711-2717` (lead-form)
- **Vad:** Ordet "privacy" förekommer **inte en enda gång** i `sourdough-schedule.html` (verifierat: `grep -c` = 0). Footern (2696-2699) innehåller bara copyright + "Built for home bakers · v2.1". Ingen nav-länk, ingen footer-länk till `privacy.html`/`/about`/`/contact`. Lead-formuläret samlar in e-post utan policylänk. De *genererade artiklarna* har rätt footer (`inject-articles.js:215-219`, inkl. `/privacy.html` på rad 218) — men kalkylatorn, sajtens mest besökta sida, har det inte.
- **Varför:** AdSense kräver en lätt åtkomlig integritetspolicy på alla annonssidor — startsidan är huvudsidan som granskas. GDPR/ePrivacy kräver information vid insamlingstillfället (lead-formuläret). Att huvudsidan saknar policylänk är både ett godkännandehinder och ett transparenskravsbrott.
- **Lösning:** Lägg en footer på kalkylatorn med länkar till `/privacy.html`, `/about`, `/contact`, `/sourdough/` — återanvänd `siteFooter()` från `inject-articles.js:215-219`. Lägg en kort "By subscribing you agree to our privacy policy" med länk i lead-modalen (vid `:2715`).
- **Beroenden:** Hör ihop med K3 och H10 — åtgärda som ett efterlevnadspaket.
- **Insats:** 1 h.

---

## 2. HÖG

> Domänlogik-fel som ger felaktiga bakråd, robusthetsbrister i obevakade jobb, och SEO/förtroende-skador.

### H1 — DDT-formeln är fel: ×4 men bara 3 temperaturer subtraheras (ger ~53 °C vatten — skållar levainen) — gränsar till KRITISKT

- **Filer:** `sourdough-schedule.html:4016`, `:2515-2520` (artikeltext), `:4100` (formelrad); `articles/07-ddt-formula-water-temperature.md:9-12`; `lead-magnet/cheat-sheet.md:55`
- **Vad:** `const ddtWaterC = ddt.target * 4 - ddt.flour - ddt.room - ddt.friction;` (verifierat förstahands på rad 4016). Multiplikatorn är **4** men endast **tre** temperaturer dras av (mjöl, rum, friktion). I N-faktorsformeln (Hamelman/Forkish) måste multiplikatorn = antalet subtraherade temperaturmassor. Felet upprepas i artikel 07 och i cheat-sheet.
- **Varför:** Vattentemperaturen blir systematiskt **för hög**. Med target 25 °C, mjöl 22, rum 22, friktion 3 ger koden `25×4 − 22 − 22 − 3 = 53 °C` — kokhett vatten som dödar jäst/enzymer i levainen. Detta är en *advertised feature* (`featureList`, rad 82) som ger aktivt skadligt råd. Korrekt 3-faktor (rak deg): `25×3 − 22 − 22 − 3 = 28 °C`. Korrekt 4-faktor (med levain ~24 °C): `25×4 − 22 − 22 − 24 − 3 = 29 °C`.
- **Lösning:** Två delar. (a) **Bugg:** gör multiplikatorn konsekvent med antalet termer. Enklast: använd 3-faktorsformeln `target*3 - flour - room - friction`. (b) **Domän (artikel 07/H i artiklarna):** för surdeg är levainen en *femte* temperaturmassa; lägg helst ett levain-temp-fält i DDT-sektionen (`:2392-2420`) och använd `target*5 - flour - room - levain - friction`, eller notera i artikeln att 4-faktorvarianten antar levain ≈ rumstemp. Uppdatera artikeltext (`:2518-2519`), formelrad (`:4100`) och cheat-sheet (`:55`). Varningsgränserna `<5/>45` (`:4046-4047`) blir korrekta först när formeln stämmer.
- **Beroenden:** Nytt inputfält + `tempInputs`-listan (`:3342`) + `readRecipeInputs` ddt-objekt (`:4125`).
- **Insats:** 1 h.

### H2 — Levain-mjölet räknas aldrig in i mjölbasen — hydration och baker's % blir systematiskt fel

- **Filer:** `sourdough-schedule.html:3447-3450` (buildSchedule), `:4003-4005` (buildRecipe), `:3416-3430` (presets)
- **Vad:** Både `buildSchedule` och `buildRecipe` räknar `water = flour*hydration/100`, `saltG = flour*salt/100`, `levain = flour*inoc/100` där `flour` är **bara det tillsatta mjölet**. Levainen (vid 100 % hydration: hälften mjöl, hälften vatten) bidrar med mjöl och vatten som aldrig läggs till baserna.
- **Varför:** Skillnaden mellan nominell och faktisk hydration. Exempel: 500 g mjöl, 75 %, 20 % levain @100 %. Koden ger 375 g vatten + 100 g levain. Faktisk total: mjöl = 550 g, vatten = 425 g → **verklig hydration 77,3 %**, inte 75 %. Felet växer med högre inoculation (ciabatta-preset kör 25 %). Saltet räknas mot 500 g i stället för 550 g → faktisk salthalt lägre än angiven. Notabelt: artikel 04 *förklarar* nyansen i prosa (rad 13-16) men kalkylatorn implementerar den inte — en inkonsekvens mellan vad sajten lär ut och vad verktyget gör.
- **Lösning:** Inför en "total flour / total hydration"-modell: `prefermentMjöl = levainG * (starterHyd/(100+starterHyd))`, `prefermentVatten = levainG − prefermentMjöl` (default 100 % starter-hydration, ev. konfigurerbart). Visa både "tillsatt vatten" och "verklig total hydration" i Recipe Lab, eller dra av preferment-bidraget så total hydration landar på det användaren bad om. Standard i Forkish/Robertson-räkning.
- **Beroenden:** Antagande om starter-hydration bör exponeras; berör både schedule- och recipe-modulerna. Gör tillsammans med H1 och M-enhetstesterna.
- **Insats:** halvdag.

### H3 — ICS-export använder lokal tid serialiserad till UTC utan TZID — fel klockslag över sommartidsskifte

- **Filer:** `sourdough-schedule.html:3744-3767`
- **Vad:** `exportICS` formaterar med `d.toISOString().replace(/[-:]|\.\d{3}/g,'')`. Regexen tar bort bindestreck/kolon/ms men **inte** det avslutande `Z` — `toISOString()` returnerar alltid `…Z`, så stämpeln blir UTC-explicit (`20260530T130000Z`). Men `Date`-objekten byggs i **lokal** tid (`anchor.setHours`, `:3462`). Ingen `VTIMEZONE`/`TZID`.
- **Varför:** Lokalt byggda tider serialiserade till UTC fryser offset vid genereringstillfället. Ett surdegsschema är 12-24 h och korsar ofta natten; startar man lör 23:00 och bakar ut sön morgon **över sommartidsomställningen** (sista söndagen i mars/oktober) blir alla steg efter skiftet en timme fel. Surdeg är extremt tidskänslig — en timmes fel proof = överjäst deg.
- **Lösning:** Använd **flytande lokal tid** — formatera från `getFullYear/getMonth/getDate/getHours/getMinutes` och skriv `DTSTART:20260530T130000` *utan* `Z`. Då följer eventet alltid väggklockan. Lägg ev. `X-WR-TIMEZONE`. CRLF används redan korrekt.
- **Insats:** 1 h.

### H4 — AdSense-loadern laddas två gånger (statiskt i `<head>` + dynamiskt i `loadAdSense`)

- **Filer:** `sourdough-schedule.html:9`, `:3112-3120`, `:4712`
- **Vad:** Rad 9 laddar `adsbygoogle.js` statiskt. `init()` (`:4712`) anropar `loadAdSense()` som — när `adsenseClient` är konfigurerad (det är den) — skapar **ett till** `<script>`-element med samma src och appendar till `document.head`. `adsenseLoaded`-gardet skyddar bara mot upprepade *anrop*, inte mot dubbletten mot head-taggen. *(Detta fynd rapporterades av två agenter; sammanslaget här.)*
- **Varför:** Google rekommenderar uttryckligen en laddning per sida. Dubbel laddning ger konsolvarningar (`adsbygoogle.push() error`), kan flaggas som implementeringsproblem **under pågående review**, och blockerar main-thread två gånger.
- **Lösning:** Behåll EN väg. Ta bort skapandet av script-elementet i `loadAdSense` (`:3116-3120`) och låt funktionen bara avslöja/pusha slots — head-taggen finns redan. (Alternativt ta bort rad 9 och låt `loadAdSense` vara enda vägen, vilket ger villkorlig laddning via `isConfigured`.)
- **Insats:** 15 min.

### H5 — Hårdkodad Claude-modell-id (`claude-opus-4-7`) utan fallback tystnar när modellen pensioneras

- **Filer:** `scripts/gen-article.js:15`, `:64-80`, `.github/workflows/weekly-content.yml:27-30`
- **Vad:** `const MODEL = 'claude-opus-4-7';` skickas rakt in i `client.messages.create`. Modell-id:n pensioneras regelbundet av Anthropic. Vid 404 `model_not_found` kastar anropet → `process.exit(1)` (`:92`) → cron-steget failar. Ingen env-override, ingen fallback.
- **Varför:** Content-factoryn ska köra obevakad varje måndag. En operatör som inte tittar på Actions-loggen märker inte att artikelgenereringen dött förrän SEO-flödet sinar. Modellrotation är en känd återkommande händelse.
- **Lösning:** `const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-7';` och sätt `ANTHROPIC_MODEL` som repo-variabel — då byts modell utan kodändring. Lägg en daterad kommentar om översyn.
- **Insats:** 15 min.

### H6 — Ingen retry/backoff mot Claude-API:et — ett transient 429/529 missar veckans publicering

- **Filer:** `scripts/gen-article.js:64-83`, `:92`, `.github/workflows/weekly-content.yml:27-44`
- **Vad:** `messages.create` anropas en gång utan try/retry. 429/5xx/529 kastar direkt → `main().catch` → `exit(1)`. *(Korrigering av ursprungsfyndet: i GitHub Actions stoppar ett misslyckat steg hela jobbet — inject/commit körs INTE efteråt. Resultatet är ett rött, helt misslyckat jobb och ingen ny artikel, inte "inject körs utan artikel".)*
- **Varför:** Anthropics API ger periodvis 529 overloaded / 429 rate limit även vid normal användning. För ett obevakat veckojobb betyder varje sådan studs en missad publicering.
- **Lösning:** Wrappa `messages.create` i en retry-loop (3-4 försök, exponentiell backoff) för 429/500/503/529. SDK:n exponerar `APIError.status`. Sätt ett rimligt request-timeout. (Jfr `claude-api`-skillens caching/retry-mönster.)
- **Insats:** 1 h.

### H7 — `sharp` är inte deklarerad i `package.json` — pin-generering kraschar på ren CI-runner

- **Filer:** `scripts/gen-pinterest-pins.js:11`, `gen-og-image.js:1`, `gen-avatar.js:1`, `gen-gumroad-cover.js:1`, `package.json:14-20`, `.github/workflows/pinterest-cron.yml:22-29`
- **Vad:** Fyra bildskript gör `import sharp from 'sharp'`, men `sharp` finns **varken** i `package.json` eller `package-lock.json` (verifierat: 0 träffar i lock). Det fungerar lokalt bara för att `node_modules/sharp` ligger kvar som "extraneous". I CI kör pinterest-cron `npm ci || npm install`; `npm ci` installerar exakt lock-filen (utan sharp) → `ERR_MODULE_NOT_FOUND`. *(Rapporterat av två agenter; sammanslaget.)*
- **Varför:** Idag döljs felet av guarden `if [ ! -d dist-pins ]` (pinsen är incheckade). Men så fort dist-pins rensas eller pins ska regenereras faller hela bildpipelinen. En automation som ser ut att fungera men har en odeklarerad runtime-dependency. `npm ci || npm install`-fallbacken maskerar dessutom generellt lockfile-drift.
- **Lösning:** Lägg `sharp` i `devDependencies` (det är ett byggverktyg), kör `npm install` så lock uppdateras och committas. Byt `npm ci || npm install` mot enbart `npm ci` i alla tre workflows för reproducerbarhet. **Alternativt:** eftersom Pinterest-API-vägen är övergiven (du använder native scheduler manuellt — se [[project_pinterest_api_status]]), överväg att ta bort skriptet och cron-steget helt.
- **Insats:** 15 min.

### H8 — `welcome-drip` kan dubbelskicka välkomstmail vid överlappande cron-körningar

- **Filer:** `scripts/welcome-drip.js:218-269`, `:233-258`, `.github/workflows/welcome-drip.yml:7`
- **Vad:** Idempotensen vilar på att `welcome_step` bumpas (`:239-242`) *före* att kampanjen schemaläggs (`:245-258`). Men `listAllSubs()` (`:273`) snapshottar prenumeranternas steg vid körningens start. Två överlappande körningar (manuell `workflow_dispatch` medan 6h-cronen kör, eller en körning som drar ut pga paginering/rate limit) läser **samma gamla** `welcome_step`, filtrerar samma sub som eligible, och schemalägger var sin `delivery:'instant'`-kampanj. Ingen `concurrency:`-grupp finns (filen är 24 rader).
- **Varför:** Kommentaren (`:17-18`) "Idempotent: re-running within seconds produces 0 sends" gäller bara *sekventiella* körningar. Dubbla välkomstmail skadar avsändarrykte och känns oprofessionellt.
- **Lösning:** Lägg `concurrency: { group: welcome-drip, cancel-in-progress: false }` på job-nivå. Som bältesrem: efter bump, läs om varje subs `welcome_step` (`GET /subscribers/{id}`) och hoppa över om steget redan är >= n innan schemaläggning.
- **Insats:** 1 h.

### H9 — Inga säkerhetsheaders sätts på vanliga svar (ingen CSP, HSTS, X-Content-Type-Options, Referrer-Policy)

- **Filer:** `functions/_middleware.js:39-52`, ingen `_headers`-fil i repot
- **Vad:** Ingen `_headers`-fil existerar (verifierat). `_middleware.js` sätter headers **endast** på sina egna 404-svar (`:44-48`), aldrig på `context.next()`-200-svar (`:51`). Repo-bred grep efter CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy/X-Frame-Options = noll träffar.
- **Varför:** Sajten injicerar tredjepartsskript (AdSense, Plausible, MailerLite, Google Fonts) och bygger HTML från markdown via `marked`. Utan CSP är XSS-ytan onödigt stor. Avsaknad av `nosniff`/HSTS är standardbrister som granskningsverktyg och annonsbedömare flaggar.
- **Lösning:** Lägg en `_headers`-fil (och i `PUBLIC_FILES`) med minst `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`, och en CSP som tillåter de faktiska tredjepartsdomänerna. **Börja med CSP i Report-Only** för att inte bryta annonser.
- **Beroenden:** Inventera scripttaggarna först så CSP matchar.
- **Insats:** halvdag.

### H10 — Lead-formuläret saknar uttryckligt GDPR-samtycke och postar med `no-cors` (kan inte se fel)

- **Filer:** `sourdough-schedule.html:2711-2717`, `:3037-3043`, `:3060-3061`
- **Vad:** Lead-formuläret har bara ett e-postfält + knapp + mikrotext "No spam, unsubscribe anytime" — ingen samtyckes-checkbox, ingen policylänk. `submitLead` postar med `mode:'no-cors'` (`:3039`) → opakt svar → `ok=true` → `setLeadStatus({state:'submitted'})` (`:3061`) sätts **även om MailerLite avvisade** e-posten.
- **Varför:** GDPR-marknadsföringssamtycke kräver aktiv, informerad handling — bara att skriva e-post utan samtyckestext/policylänk uppfyller inte kravet. Separat databugg: `no-cors` döljer serversvaret, så användaren får "Check your inbox" även när prenumerationen misslyckades, och `localStorage` markeras "submitted" så modalen aldrig visas igen → leaden förloras tyst och användaren får aldrig cheat-sheet.
- **Lösning:** Lägg obligatorisk samtyckes-checkbox + policylänk i formuläret. Aktivera double-opt-in i MailerLite (löser samtyckesbevis). För `no-cors`: dokumentera att "submitted" = "skickat" inte "bekräftat", och sätt en kortare cooldown i stället för permanent flagga så en misslyckad post kan återupprepas.
- **Beroenden:** Hör ihop med K3/K4.
- **Insats:** halvdag.

### H11 — Buy-Me-A-Coffee-rutan påstår "no ads, no tracking" medan sajten kör AdSense + Plausible

- **Filer:** `sourdough-schedule.html:2687` (verifierat verbatim), `:9` (AdSense), `:16` (Plausible)
- **Vad:** Tip-jar-rutan säger ordagrant: *"It's free, no ads, no tracking. A small tip keeps it that way."* Samma sida laddar AdSense, Plausible, har två ad-slots och affiliate-länkar.
- **Varför:** Direkt självmotsägande påstående → konsumentvilseledande/FTC-trovärdighetsproblem som underminerar integritetspolicyn. Även om Plausible är cookiefritt är det tracking i ordets vanliga mening, och AdSense är bokstavligen annonser.
- **Lösning:** Ändra texten till något sanningsenligt, t.ex. "It's free and we keep ads light. A small tip helps keep it that way." — eller ta bort påståendet.
- **Insats:** 15 min.

### H12 — Ingen canonical på startsidan + dubbel URL (`/` och `/sourdough-schedule.html`) serverar samma innehåll med motstridiga signaler

- **Filer:** `sourdough-schedule.html:30` (og:url), `_redirects:18`, `index.html:5-6`, `sitemap.xml:3`
- **Vad:** Kalkylatorn har **ingen** `<link rel="canonical">` (verifierat: 0 träffar). `_redirects:18` rewriter `/` → `/sourdough-schedule.html` med status 200 (rewrite, URL:en behålls). Samma sida är nåbar på både `/` och `/sourdough-schedule.html`. `index.html:6` deklarerar `/sourdough-schedule.html` som canonical, medan `sitemap.xml:3` listar `/` med priority 1.0 — **motstridiga signaler** om vilken som är startsidan.
- **Varför:** Utan canonical kan Google indexera båda som dubbletter och splittra rank-signaler för sajtens viktigaste sida.
- **Lösning:** Lägg `<link rel="canonical" href="https://loafandlevain.com/" />` i kalkylatorns `<head>` (efter rad 23). Ta bort/ändra canonical-raden i `index.html:6` till `/`. Då pekar allt entydigt på `/` som matchar sitemap.
- **Insats:** 15 min.

### H13 — Artikel 13 motsäger resten av sajten om innertemperatur (påstår 200 °F räcker för vitt surdegsbröd)

- **Filer:** `articles/13-whole-wheat-sourdough.md:109` + `:155`; motsägs av `articles/02-why-sourdough-gummy.md:35`, `articles/08-fix-dense-sourdough.md:81`, `lead-magnet/cheat-sheet.md:69` *(korrigerat radnr)*, `sourdough-schedule.html:3583`
- **Vad:** Artikel 13: *"Whole wheat needs to hit 207-210°F internal temperature, not the 200°F that's fine for white sourdough"* (rad 109) och *"Push your internal temperature to 208°F instead of pulling at 200°F"* (rad 155). Den framställer 200 °F (~93 °C) som tillräckligt för vitt bröd — krockar med 02/08/cheat-sheet/kalkylatorn som alla säger 96-99 °C (205-210 °F).
- **Varför:** Surdeg med öppen smula ska enligt Hamelman nå 96-99 °C. 200 °F är underbakat för en hörnstensloaf och ger just den gummiga smula artikel 02/08 varnar för. Sajtens egna källor som säger olika om samma grundtal undergräver E-E-A-T — extra känsligt direkt efter en AdSense "low-value content"-flagg (se [[project_adsense_status]]).
- **Lösning:** Ändra artikel 13 så referensvärdet för vitt bröd blir 205-210 °F (96-99 °C). Behåll budskapet att fullkorn vill ligga i övre delen (208-210 °F), men ta bort att 200 °F duger för vitt.
- **Insats:** 15 min.

---

## 3. MEDIUM

> Kodkvalitet, robusthet, tillgänglighet, SEO-grovkorn. Komprimerade (fil:rad · vad · fix · insats).

**Domänlogik & kalkylator**
- **M1 Ingen multi-loaf-skalning.** `:3445-3450`, `:2126-2156`. Inget antal-bröd-fält; användaren måste själv multiplicera. Lägg satsmultiplikator som skalar enbart ingredienser pro-rata (tider ska *inte* skalas — de beror på temp/inoc). · halvdag
- **M2 Inga edge-case-varningar.** `:2138-2152`, `:3399-3406`, `:4019-4023`. Hydration tillåts upp till 110 %, salt 0,5-3 %, temp 16-30 °C utan domänvarning. Lägg notiser: salt utanför 1,8-2,2 %, hydration >85 % utan fullkorn, rumstemp ≥28 °C ("risk överjäsning") / ≤18 °C ("långsam jäsning"). · halvdag
- **M3 Live-notiser via `setTimeout` överlever inte stängd flik.** `:4445-4457`, `:4482-4486`. Surdeg jäser över natten; `setTimeout` throttlas/dödas i bakgrund. Kortsiktigt: disclaimer + hänvisa till ICS. Långsiktigt: Service Worker + Notification Trigger/Push. · dag
- **M4 Inga enhetstester för fermentations-/receptmatematiken.** `:3399-3412`, `:3445-3596`, `:4001-4026`. Produktens hjärta, noll tester. Extrahera ren matte till `scripts/dough-math.js`, lägg `node:test` med referensfall (24 °C/20 % → ~5 h; Q10-dubbling; total hydration; DDT mot Hamelman). H1 och H2 hade fångats av tre assertions. · dag

**Frontend & UX**
- **M5 `copyScheduleText`/starter-copy saknar clipboard-fallback.** `:3741`, `:3977-3978`. Ingen `navigator.clipboard`-koll/`.catch` → knappen gör tyst ingenting i osäkra kontexter. `shareBake` (`:4604-4613`) gör rätt — bryt ut samma `copyText()`-hjälpare. · 1 h
- **M6 Modaler saknar focus-trap + fokusåterställning.** `:2940-2957`, `:2704`, `:2728`. Tab kan vandra bakom modalen (WCAG 2.4.3/4.1.2); fokus återställs ej vid stängning. Spara `activeElement`, cykla Tab inom modalen, sätt `inert` på bakgrund. (Esc-stängning finns redan.) · halvdag
- **M7 Ingen dark mode trots färdiga design-tokens.** `:22`, `:93-113`. `color-scheme: light` hårdkodat, inga `prefers-color-scheme`-overrides. Kvällsbagare får bländande skärm. Tokens gör det trivialt — override `:root` i ett `@media (prefers-color-scheme: dark)`-block. · halvdag
- **M8 WCAG-kontrastfel.** `:99-100`, `:203`. `--ink-mute` (#8A7866) = 3,61:1 mot cream och `--crust` (#B85C38) = 3,87:1 — under AA 4,5:1 för normaltext, och de är dominerande sekundär-/accentfärger. Mörka `--ink-mute` till ~#6E5D4C; använd befintliga `--crust-deep` (#8E3F22, 5,6:1) för text/länkar. · 1 h
- **M9 Touch targets under 44 px.** `:1129-1140`, `:1702-1715`, `:653-665`. `.icon-btn`/`.modal-close` = 32 px, `.action-btn` ~30 px. Sätt `min-height/min-width: 44px`. Sajten är mobiltung (Pinterest-trafik). · 1 h
- **M10 Flik-navigeringen saknar ARIA tab-roller.** `:2084-2089`, `:3375-3391`. Flikar är `<a href=#>` med hijackad klick, utan `role=tab/tablist/tabpanel/aria-selected`. Skärmläsare får fyra namnlösa länkar. Lägg tab-mönster + pil-navigering. · halvdag
- **M11 Ingen `<noscript>`-fallback.** `:3645-3661`, `:4746`. Allt resultatinnehåll renderas via `innerHTML`; med JS av syns inget. Lägg `<noscript>` med länkar till de statiska artiklarna. · 1 h

**Content factory**
- **M12 Cron kör inject+commit även när roadmapen är slut.** `weekly-content.yml:27-44`, `gen-article.js:58-61`. När inga ämnen kvarstår exit 0 → inject skriver om sitemap-`lastmod` ändå → tomma/lastmod-only-commits utan signal till operatören. Roadmapen har **30 ämnen** *(korrigerat antal)*, 13 skrivna → slut om ~16 veckor. Låt `gen-article` signalera "roadmap slut" (distinkt exit/`GITHUB_OUTPUT`) och hoppa över inject/commit. · 1 h
- **M13 `marked`-output injiceras osaniterad (XSS-yta).** `inject-articles.js:41`, `:263-268`, `:281-283`. `marked` v15 har ingen inbyggd sanitizer; rå HTML i markdown passerar till sidor som kör AdSense/Plausible. Källan är Claude-genererad (låg risk), men en framtida prompt-injection eller manuell `<script>` skulle rendera oescaped. Lägg `sanitize-html`/DOMPurify efter `marked.parse`; dokumentera `articles/` som betrodd input. · halvdag
- **M14 Ingen test/verifiering för injektion/slug/sitemap.** `inject-articles.js:425-453`, `:459-496`, `package.json:7-13`. Enda koden som muterar 182 KB-huvudfilen in-place (`:488`) saknar assertion på att markörerna kvarstår, att antal sidor = antal artiklar, eller att slugs är unika. Lägg ett smoke-test mot en fixture som pre-commit-steg. · halvdag

**Automation**
- **M15 Temp-grupp raderas direkt efter `schedule` — race mot MailerLites asynkrona utskick.** `welcome-drip.js:244-268`. `delivery:'instant'` betyder "börja nu"; om MailerLite materialiserar mottagarlistan vid utskick (inte vid schedule) kan gruppen redan vara raderad → 0 mottagare. Behåll temp-grupper och rensa i början av *nästa* körning. · 1 h
- **M16 Tre divergerande sanningskällor för pin-texter.** `post-pinterest-pin.js:38-89`, `dist-pins/metadata.json`, `pinterest/descriptions.md`. Inbyggd `PIN_DESCRIPTIONS` divergerar redan från `metadata.json`. Låt postern läsa från `metadata.json` (har redan fullständig data) och ta bort den inbyggda tabellen. · 1 h
- **M17 `pinterest-state.json` committas utan `git pull --rebase` — race kan posta om pin.** `pinterest-cron.yml:43-55`, `post-pinterest-pin.js:91-97,155-157`. Postning sker *före* state-skrivning; en non-fast-forward-push misslyckas medan pinnen redan postats → nästa körning postar om samma pin. Lägg `git pull --rebase` före push eller `concurrency`-grupp. · 1 h
- **M18 Ingen retry/backoff vid MailerLite-/Pinterest-429.** `welcome-drip.js:146-159,234-242`, `post-pinterest-pin.js:121-131`. `api()` kastar direkt på icke-2xx; per-sub-loopen (2 anrop/sub) saknar throttling → 429 ger partiella sends. Lägg backoff (läs `Retry-After`) + paus mellan anrop. · halvdag

**CI/CD & säkerhet**
- **M19 `weekly-content` auto-committar `sourdough-schedule.html` — latent hemlighetsläcka.** `weekly-content.yml:37-43`, `configure.js:70-82`. `configure.js` skriver in IDs i HTML från `config.local.json`; körs den någonsin i CI, eller hamnar en hemlighet i ett `MONETIZATION_CONFIG`-fält, committar boten den. Lägg en grep-guard (vägra push vid `sk-ant-`/`eyJ`/`Bearer`) eller `gitleaks`-steg. Säkerställ att `configure.js` aldrig körs i workflow. · 1 h
- **M20 Gitignorade datafiler i repo-roten exponeras vid root-deploy om gitignore fallerar.** `.gitignore:5-8`, `_middleware.js:16-23`, `_redirects:1-15`. `forms.json`, `camp-detail.json` m.fl. står inte i `BLOCKED_EXACT`/`_redirects`. Lägg dem där, eller flytta till en `data/`-mapp som blockeras av prefix. Roten är K1 (root-deploy). · 15 min

**SEO & data**
- **M21 Synlig FAQ (7 frågor) saknar FAQPage-schema.** `:2611-2676`, `:49-84`. Innehållet finns och uppfyller Googles krav — bara markeringen saknas. Lägg ett tredje JSON-LD-block (`FAQPage`) som speglar de synliga frågorna ordagrant → rich results/CTR. · 1 h
- **M22 `localStorage`-schema saknar versionering.** `:2983`, `:3150`, `:3179-3180`. Inget `schemaVersion`-fält; format-ändring → tyst korrupt state (lead-nyckel tolkas som "fresh" → modal igen; live-bake kan förloras). Lägg `schemaVersion` + migrationsfunktion i `loadState`. Erbjud "Exportera min data (JSON)" så `privacy.html:135` ("Right to data portability") faktiskt uppfylls. · halvdag
- **M23 AdSense-slots är `REPLACE_ME` → noll annonser även efter godkännande.** `:2817`, `:3122-3131`, `:2681`. `inContent`/`midContent` = `REPLACE_ME`; `loadAdSense` kräver `isConfigured(slotId)` så ingen `<ins>` renderas. *(Korrigerat: båda containrarna finns redan — `ad-slot-content` `:2681` och `ad-slot-mid` `:2536`; bara slot-ID:na saknas.)* Fyll i riktiga slot-ID när AdSense godkänns. · 15 min

---

## 4. LÅG

> Kosmetik, nice-to-have, små innehållsfel. Kompakt.

| ID | Fil:rad | Vad | Fix | Insats |
|---|---|---|---|---|
| L1 | `:3548-3562` | Cold retard går direkt till "Preheat" utan uttag-ur-kyl-steg (pedagogiskt gap; kall bakning är giltigt) | Lägg en rad om att bröd bakas kallt direkt ur kylen (Tartine) | 15 min |
| L2 | `:3456` | Final proof = `bulk×0,18` är en gissning; ofta i underkant | Justera mot litteratur (~25-40 % av bulk); behåll poke-test som signal | 15 min |
| L3 | `:2`, `:29` | Ingen i18n-struktur, ingen svensk version (hårdkodad engelska) | Affärsbeslut; bryt ut strängar till `sv/en`-objekt om sv-marknad ska byggas (se idé L-stor) | (vecka) |
| L4 | `:2542-2551` | Ett extra inline `<style>`-block mitt i `<body>` *(korrigerat: ett, inte två)*; allt inline → ingen delad cache med artikelsidor | Bryt ev. ut delad CSS till `/assets/app.css` om CWV/återbesök blir viktigt | dag |
| L5 | `:2145`, `:2321` | Salt-fält (`step=0.1`) saknar `inputmode=decimal` på mobil | Lägg `inputmode=decimal` | 15 min |
| L6 | `gen-article.js:8-9,64` | Dokumentationen lovar `config.local.json`-fallback för API-nyckeln, men `gen-article` läser bara env (asymmetri mot andra skript) | Lägg fallbacken eller ta bort den döda `anthropicApiKey`-nyckeln | 15 min |
| L7 | `gen-article.js:85-88`, `inject-articles.js:76` | Icke-atomisk filskrivning; 2-siffrig padding spricker vid 100:e artikeln (lexikografisk sort `:76` *(korrigerat radnr)*) | Temp-fil + `renameSync`; padda till 3 siffror eller sortera numeriskt | 15 min |
| L8 | `post-pinterest-pin.js:107` | Död ternary — båda grenarna returnerar tom sträng | Skriv `new URL(meta.link, SITE_BASE).href` | 15 min |
| L9 | `html-to-pdf.js:30-43` | Windows-only Chrome-sökvägar (medvetet lokalt verktyg) | Vid CI-behov: `puppeteer-core` eller plattformsdetektion | halvdag |
| L10 | `gen-pinterest-pins.js:45,77,186` | SVG använder webfonts (Manrope + JetBrains Mono) som `sharp`/resvg inte laddar → tyst systemfont-fallback *(korrigerat: "Fraunces" finns ej; serifen är system-säkra Georgia)* | Byt till system-säkra fonter (som og-image) eller installera fonter i CI | halvdag |
| L11 | `articles/04-hydration-explained.md:86` | Dinglande referens till en obefintlig "rye guide" | Skriv en rågartikel + länka, eller tona ner meningen | 15 min |
| L12 | `inject-articles.js:244-259` | Artiklar saknar FAQPage-schema (13 har "Common questions") + `datePublished/dateModified` | Generera FAQPage från Q&A-block; lägg datum från git/mtime | halvdag |
| L13 | `articles/10-stretch-and-fold.md:53` | Trasig mening: "You can taste the bread tested it but…" | Skriv om; korrekturläs övriga | 15 min |
| L14 | `articles/09-starter-feeding-ratio.md:25` | "Halve the kitchen temperature" är fysikaliskt meningslöst | "Sänk temperaturen ~6-8 °C så fördubblas tiderna" | 15 min |
| L15 | `articles/01-…md:7`, `:2625-2627`, `:3403` | Q10-inkonsekvens: artikel/FAQ säger "≈2 / dubblas", koden använder 2,2 (tabellerna är dock konsekventa med 2,2) | Skriv "Q10 ≈ 2,2 — ökar ~2,2× per 8 °C (drygt en fördubbling)" | 15 min |
| L16 | `articles/05-cold-retard-…md:7` | "slows ~10×" är högt mot sajtens egen Q10=2,2 (ger ~5,9×) | Nyansera: "5-10× långsammare; jästaktivitet faller brant under 10 °C" `[VERIFY]` | 15 min |
| L17 | `inject-articles.js:230-242` | "Related"-kort är `slice(0,4)` → samma fyra på varje artikel (icke-tematiskt) | Tematisk matchning via frontmatter-taggar (se idé M-medel) | halvdag |
| L18 | `articles/02,08,13` | Återanvänd boilerplate-slutstycke ("stable recipe in 3-4 bakes instead of 15") nästan ordagrant mellan artiklar | Omformulera artikelspecifikt | 1 h |
| L19 | `articles/12-…md:7` | "Calvel coined the term in 1974" — årtalet osäkert (substansen korrekt) `[VERIFY]` | Verifiera eller mjuka till "på 1970-talet" | 15 min |
| L20 | `:3068` | `email_hash: btoa(email).slice(0,8)` är base64-prefix, inte hash → läsbart e-postfragment till Plausible | Ta bort propen (event-namnet räcker) eller använd SHA-256 | 15 min |
| L21 | `:2996-3007` | Lead-cooldown visar modalen på *nästa* schemagenerering efter 14 dgr (mild UX-ojämnhet, ej bugg) | Dokumentera avsikten eller jämför mot nytt tröskelvärde | 15 min |
| L22 | `welcome-drip.yml:10-23` | Saknar `permissions:`-block (ärver default-token; behöver ingen write) | Lägg `permissions: contents: read` | 15 min |
| L23 | `sitemap.xml:18-20` | URL-inkonsekvens: `/about`+`/contact` utan slash, `/privacy.html` med ändelse | Flytta privacy till `/privacy/`-mönster + uppdatera footer/sitemap | 1 h |

**Avfärdat fynd (adversariell verifiering):** Ett MEDIUM-fynd om att HowTo-schemat (`:49-72`) "inte matchar sidans funktion" **avfärdades** — kalkylatorns genererade steg (feed → autolyse → bulk → shape → retard → bake) speglar HowTo-stegen nära identiskt, så schemat är korrekt (om än rich-result-deprecierat av Google).

---

## 5. Per-modul-genomgång

**`sourdough-schedule.html` (kalkylator + monetisering).** Tre beräkningsmoduler: `buildSchedule` (`:3445-3596`) med fermentationsmodellen `bulkHours`/`starterPrep` (`:3399-3412`); Recipe Lab `buildRecipe` (`:4001-4026`) med baker's % + DDT; starter-planeraren `buildStarterPlan` (`:3832-3920`). JS är välstrukturerad: en IIFE med `use strict`, centralt `state`-objekt (`:3160-3171`), debouncad `localStorage`-persistens med try/catch, master-tick på 1 s med early-return i idle. Svagheter: dubbel AdSense-laddning (H4), ingen dark mode (M7), kontrast/touch/ARIA-brister (M8-M10), ingen i18n (L3), DDT-buggen (H1) och hydration-basen (H2).

**Content factory (`scripts/`).** Fyra ESM-skript, ingen build. `gen-article.js` väljer nästa oskrivna roadmap-ämne, ber Claude skriva markdown, sparar `articles/NN-slug.md`. `inject-articles.js` renderar `marked`→HTML, genererar standalone-sidor `/sourdough/<slug>/`, KB-index, about/contact, skriver om in-page-blocket mellan två markörer (idempotent, `:425-432`) och bygger sitemap. `build-dist.js` använder en **allowlist** (rätt modell). Genomtänkt — men hårdkodad modell (H5), ingen retry (H6), osaniterad injektion (M13), inga tester (M14).

**Automation (`scripts/` + crons).** `welcome-drip.js` (5-stegs MailerLite-drip), `post-pinterest-pin.js` (v5 API, state i git), fyra `sharp`-bildskript, `gen-pro-pdf.js`/`html-to-pdf.js`. `welcome-drip-probe.js` är en föredömlig read-only dry-run. Defekter: `sharp` odeklarerad (H7), dubbelskick-race (H8), temp-grupp-race (M15), state-race (M17), divergerande pin-källor (M16).

**Deploy/CI (`functions/`, `.github/`).** Edge-middleware + `_redirects` ger dubbelt skydd för källfiler. Tre crons med dokumenterade cron-minuter. `npm audit` är **ren (0 sårbarheter)**. Men root-deploy (K1), inga säkerhetsheaders (H9), `npm ci || npm install`-drift (H7).

**Innehåll (`articles/`, `lead-magnet/`, `pro-pdf/`).** 13 artiklar, faktanivån överlag hög och konsekvent med Forkish/Hamelman; temp→tid-tabellen matchar kalkylatorns Q10-modell exakt. Problem: innertemp-motsägelsen (H13), DDT-levain (del av H1), döda ankarlänkar (se M21/idéer), svag intern länkning (L17), småfel (L11-L19).

---

## 6. Domänlogik — bagarens genomgång (kärnan i en surdegssajt)

Jag läste fermentationsmotorn förstahands (`:3399-3596`, `:3669-3733`) och bedömer den med bagar-verklighet (Forkish/Robertson/Hamelman).

### Det som är bagarmässigt RÄTT (och imponerande för en gratis webkalkylator)

- **Bulk-fermentationen är faktiskt temperaturmodellerad.** `bulkHours = 5,0h × 2,2^((24−T)/8) × (20/inoc)` (`:3399-3406`). Det är en Q10-modell — jäshastigheten ökar ~2,2× per 8 °C — vilket är korrekt domänfysik och slår de flesta gratiskalkylatorer som hårdkodar "4-6h". Referenspunkten 5 h @ 24 °C @ 20 % levain är realistisk. Verifierade utfall: 16 °C→11 h, 20 °C→7,4 h, 28 °C→3,37 h.
- **Inoculation skalar bulktiden invers-proportionellt** (`20/inoc`) — mer levain = snabbare, rätt riktning.
- **Cold retard hålls separat från rumstemp** (`:3548-3554`) — korrekt förenkling, eftersom jäsgraden vid ~4 °C är försumbar och retard handlar om smak/hantering.
- **Starter-planeraren** modellerar `peakHours` temperatur- *och* ratio-beroende (`:3842-3847`) och bygger en korrekt bakåtkedja wake→build→final med pro-rata-matningar.
- **Reverse-läget finns redan** (`mode:'reverse'`, `:3467-3496`) och räknar baklänges genom hela kedjan med +24h-fallback. *(Flera idé-agenter föreslog "reverse planner" som ny funktion — den finns; det som saknas är datum/veckodag, se idéerna.)*
- **C/F-konvertering** behandlar korrekt friktion som ett delta vid omvandling (`:3348-3350`) — subtil men rätt.
- **Fermentationskurvan** ritar en sigmoid med 50-75 %-målzon — ärligt mot att jäsning är S-formad.
- **Float-testet (artikel 06) framställs INTE som facit** — den listar falska positiva/negativa och säger "watch the rise". Exakt den nyansering Hamelman efterfrågar.

### Det som är bagarmässigt FEL eller förenklat

| Område | Problem | Allvarlighet |
|---|---|---|
| **DDT** | `×4` med 3 termer → ~53 °C vatten, skållar levainen; levainen saknas som temperaturmassa | **H1 (gränsar KRITISKT)** |
| **Hydration** | Levain-mjöl/vatten räknas ej i basen → stated 75 % är egentligen ~77 %; salt-% missvisande | **H2** |
| **Mjöltyp ignoreras i tid** | `bulkHours` tar inte hänsyn till `blend` — whole-wheat-preset får identisk bulk-matte som vitt, trots att fullkorn/råg jäser snabbare | M (del av M2) |
| **Salt ignoreras i tid** | Hög salthalt bromsar jäsning verkligt; modellen bryr sig inte | M (del av M2) |
| **Final proof** | Fast `bulk×0,18` (`:3456`) — vid 28 °C ~36 min, i underkant för formad limpa | L2 |
| **Inga varningar** | Salt utanför 1,8-2,2 %, hydration 110 %, extremtemp passerar tyst | M2 |
| **DDT använder rumstemp** | Bulk drivs av *rums*-temp, inte *deg*-temp (avviker 1-3 °C pga friktion/kallt mjöl) | idé (quick win) |
| **Ingen volym-validering** | Tid är bara en proxy för volymökning; ingen aliquot-/observerad-rise-kalibrering | idé (medel) |

**Salt/hydration-standard underbyggt:** 1,8-2,2 % salt av total mjölvikt är standard enligt Forkish (*Flour Water Salt Yeast*) och Robertson (*Tartine*). DDT-faktorn = antal temperaturmassor är Hamelman (*Bread*). Q10 för jäst/LAB-metabolism ligger empiriskt ~2-3 per 10 °C; sajtens 2,2 per 8 °C (≈2,7 per 10 °C) är inom rimligt spann `[VERIFY exakt Q10 mot mikrobiologisk källa]`.

---

## 7. UI/UX-genomgång

- **First-run:** `isConfigured`-gatet (`:2827-2829`) gör att verktyget fungerar fullt ut medan monetiserings-IDs är placeholders — smart. Presets ger en nybörjare en bra startpunkt.
- **Tillgänglighet:** påbörjad (ARIA på modaler, `focus-visible`, `prefers-reduced-motion` både via CSS och JS, korrekta `<label for>`). Ofullständig: ingen focus-trap (M6), kontrastfel (M8), touch <44px (M9), tab-roller saknas (M10), ingen dark mode (M7).
- **I koket:** den största UX-möjligheten — ett "kök-läge" med ett stort steg i taget, Wake Lock och röstuppläsning (idé, quick win). Idag är live-notiser opålitliga (M3).
- **Mobil:** `inputmode=decimal` saknas (L5); vikter låsta till gram trots att USA är största marknaden (idé, medel).
- **Print:** genomtänkt print-stylesheet (`:2017-2028`) döljer all monetisering — bra.

---

## 8. Data & state

- **Lagring:** allt i `localStorage` (debouncad save, try/catch-omsluten). Offline-first vore trivialt (idé: PWA).
- **Schema-versionering saknas (M22)** — format-ändring korrumperar tyst sparade bake-planer; lead-nyckel tolkas som "fresh".
- **Dataportabilitet:** `privacy.html:135` lovar "Right to data portability" men det finns bara enskild ICS-export, ingen full data-dump (M22).
- **Backup/migration:** ingen. Acceptabelt för en klient-only kalkylator, men versionering bör in innან nästa state-ändring.
- **PII:** `email_hash` är base64-prefix (L20) — litet men onödigt PII-läckage till analytics.

---

## 9. Säkerhet

Sammanfattning (detaljer i K1-K4, H9, M19-M20):

- **Positivt:** git-historiken är **verifierat ren** (inga committade hemligheter), `npm audit` = **0 sårbarheter**, allowlist-baserad dist, dubbelt edge-skydd för källfiler, hemligheter via GitHub Secrets i CI, affiliate korrekt `rel="nofollow sponsored noopener"`, ovanligt komplett `privacy.html`.
- **Kritiskt:** root-deploy exponerar betal-PDF:er (K1); live-nycklar i klartext på disk (K2); ingen CMP (K3).
- **Hög/medel:** inga säkerhetsheaders/CSP (H9); auto-commit av HTML kan läcka hemlighet (M19); gitignorade datafiler saknar defense-in-depth (M20).
- Per [[feedback_secrets_handling]]: jag har inte återgett några hemlighetsvärden i klartext. De exponerade tokens i `config.local.json` bör roteras (K2) eftersom de legat i klartext sedan 8 maj.

---

## 10. Prestanda

- **Bra:** `tickLive` (`:4264-4297`) gör full re-render endast vid stegövergång, annars bara `textContent`; `masterTick` early-returnar i idle; `saveState` debouncad + flush på `beforeunload`.
- **Förbättra:** AdSense laddas dubbelt (H4); AdSense + Plausible + tre Google Fonts-familjer i `<head>` på varje artikelsida skadar LCP/INP (idé: lazy-init AdSense via IntersectionObserver, reducera font-axlar, `font-display:swap`). 182 KB inline-monolit utan delad cache mellan sidor (L4) — marginellt för engångs-Pinterest-trafik, relevant först vid återbesök.

---

## 11. Tester & kvalitet

**Det finns noll tester** (`package.json` saknar test-script). För en monetiserad kalkylator vars intäkter bygger på att schemat funkar är det den enskilt största kvalitetsrisken — DDT-buggen (H1) och hydration-felet (H2) hade fångats av tre assertions. Prioritet: extrahera ren matte till en ESM-modul och lägg `node:test` med kända referensfall (M4), plus ett smoke-test för injektion/sitemap (M14). Ingen linter/formatter är konfigurerad; koden är ändå konsekvent formaterad. CI kör bara crons, ingen test- eller lint-gate på commits.

---

## 12. DevOps & distribution

- **Build/deploy:** `npm run build` (inject + build-dist) men **output = root** (K1) gör `build-dist` overksam. Fixa output→`dist`.
- **Crons:** tre Actions-jobb, dokumenterade off-the-hour-minuter (bra: undviker GitHubs köfördröjning). `pinterest-cron` commit-steget är robust (kollar fil + staged diff — fixat i 4d76b24). Saknar `concurrency`-grupper (H8/M17) och minsta-privilegium på welcome-drip (L22).
- **Reproducerbarhet:** `npm ci || npm install`-fallbacken + odeklarerad `sharp` (H7) bryter reproducerbara byggen.
- **Crash reporting/analytics:** Plausible för web-analytics (cookiefritt, bra). Ingen felrapportering från crons utöver Actions-loggen — en tyst modell-pensionering (H5) eller API-stört (H6) upptäcks inte förrän SEO-flödet sinar. Överväg en enkel notis (mail/Slack) vid cron-fail.

---

## 13. Idéer utanför boxen (41 st, sorterade)

> Anpassade till en **content-sajt + kalkylator**, inte en native app. Notera: idé-agenterna föreslog några saker som redan finns (reverse-planner) eller dubblerar fynd (fixa #schedule-länkar = M21/L17, FAQPage = M21/L12) — markerade nedan.

### Quick wins (lågt arbete, hög/medel effekt)

1. **Reverse-planner: lägg datum/veckodag + DDT-integration.** Reverse-läget finns men tar bara klockslag (`:2103`). Lägg datumval ("klar 18:00 på lördag") som rullar över flera dygn, och mata DDT-resultatet in i schemat som ett "använd vatten på X °C"-steg vid mix (`:3509`). · *bygger på befintlig kod*
2. **Adaptiv bulk: driv `bulkHours` av degtemp (DDT) i stället för rumstemp.** Jäsningen styrs av degtemp (avviker 1-3 °C). Lägg valfri degtemp-input/koppla DDT-output. Hög precisionsvinst, liten ändring.
3. **Hands-free kök-läge:** ett stort steg i taget, jätteknappar, Screen Wake Lock, `SpeechSynthesis`-uppläsning (inbyggda API:er, noll beroenden). Förlänger session (bra för ads).
4. **FAQPage + HowTo-schema på artikelsidor** (parsa "Common questions"-H3:or). = L12. Gratis CTR-lyft.
5. **BreadcrumbList-schema + synliga brödsmulor** på artikel-/temperatursidor. Snyggare SERP.
6. **Fixa kalkylator-CTA-länkar (`#schedule`) på artikelsidor.** = M21-relaterat; döda ankarlänkar återställer en konverteringsväg. Regex-replace i `inject-articles.js`.
7. **Öka content-takten till 2-3 artiklar/vecka** tills roadmapen (30 ämnen, 13 skrivna) är tom inom ~6-8 v. Direkt väg ut ur AdSense "low-value". Marginalkostnad = Claude-tokens (~$0.30/artikel).
8. **FAQPage + synlig FAQ-accordion på kalkylatorsidan** (sajtens priority-1.0-sida). Rich snippet på det mest värdefulla söket.
9. **Reddit/FB-community-seeding** via "free tool"-vinkeln (besvara "why is my sourdough gummy/dense"-trådar med artikel/kalkylator-länk). Brand search + referraltrafik, ingen kod.
10. **Core Web Vitals: lazy-init AdSense + skjut upp Plausible på artiklar**, reducera font-axlar. CWV är rankingfaktor.
11. **Säsongsstyrd content-prioritering** — `season`/`publishMonth`-fält i roadmap; publicera "cold kitchen sourdough" i oktober, "summer sourdough" i maj, 4-6 v före topp.
12. **Amazon OneLink** (geo-router) för global affiliate — idag hårdkodad `.com`/`loafandlevain-20` (`:2797-2798`); utländska klick (kanske majoriteten) tappas idag. Ett script-tag i head. · **hög ROI**
13. **Riktiga ASIN-produktlänkar i stället för söksträngar** (`gearURL` bygger `/s?k=…`, `:2901`). Produktlänkar konverterar bättre och sätter cookien tidigare. Välj 9 gear + 3 bok-ASIN.
14. **Pro-bundle/nivåtrappa på Gumroad** ($19 / $29 + mini-PDF:er / $49 allt). Prisankaring; Gumroad-varianter, ingen kod.
15. **Medlemskap via Buy Me a Coffee Memberships** ($3/$5/mån: månatliga presets, annonsfri sajt). Bygger på en redan live kanal.

### Medel (1-2 veckors arbete)

16. **PWA: web app manifest + service worker** (installerbar, offline). All state ligger redan i `localStorage`. Förvandlar engångsbesökare till återkommande kök-verktygsanvändare; bra för retention och CWV. Löser också M3:s notisproblem.
17. **Live S&F-timers med push-notiser** kopplade till schemat (bygg på SW). Gör sajten till ett *aktivt* bakverktyg → längre session, fler ad-impressions.
18. **Aliquot-jar-läge: mät bulk på volym, inte klocka.** Koppla den befintliga sigmoid-kurvan till *observerad* rise → "the calculator that adjusts to YOUR dough". Det enda som gör en surdegskalkylator verkligt pålitlig. Stark delnings-/SEO-krok.
19. **Vikt-enhetsväxling g↔oz↔cups** (parallellt med °C/°F som redan finns, `:3234`). USA är största AdSense/affiliate-marknaden.
20. **Jästrecept→surdeg-konverterare.** Mata in jästrecept → få levain-mängd + justerad hydration + schema. Fångar en stor sökintent ("convert yeast recipe to sourdough") och drar in nybörjare som blir leads.
21. **Multi-loaf / batch-skalning med delad timeline** (= M1 som funktion). Träffar de mest engagerade (Pro-PDF-/affiliate-köpare).
22. **Relevansbaserad intern länkning** i stället för `slice(0,4)` (= L17). Topisk länkning är en av de starkaste on-page-signalerna.
23. **Programmatiska per-mjöltyp-sidor** (bread/AP/T65/rye) med hydration/protein/jäsjustering. Återanvänd whole-wheat-tabellen. Fångar "best flour for sourdough"-klustret.
24. **YouTube Shorts/TikTok/Reels-pipeline** från befintliga SVG-mallar (rendera 1080×1920 + ffmpeg). Vertikalt video är största outnyttjade reach-kanalen.
25. **Per-brödstorlek-kalkylatorsidor** (500 g/900 g/1200 g förinställt, query-string-förifyllning). Fångar "sourdough recipe for X grams".
26. **Lead-loop: kluster-specifik content-upgrade** (gratis "Whole Wheat Hydration Cheat Card" mot e-post längst ner på fullkornsartiklar). Sluter loopen SEO→ägd kanal→Pro-försäljning.
27. **Gör artikel-CTA till riktiga in-article AdSense-slots** (artiklar laddar loadern men renderar inga enheter). Förvandlar växande organisk trafik till intäkt.
28. **Tema-specifika mini-PDF:er** ($7-9: Pizza & Flatbreads, Holiday Bakes, Enriched). Pro-manuset är redan klustrat. Tripwire mot $19-bundlen.
29. **Display-ad-uppgradering:** Ezoic nu (ingen tröskel, +50-100 % RPM vs rå AdSense), Mediavine vid 50k sessioner (3-5× RPM). Behåll de två befintliga slot-platserna.
30. **Sponsrad utrustning + Amazon Influencer-storefront** när trafiken finns (Challenger, Brod & Taylor, SourHouse, Wire Monkey). Lägg en `featured`-flagga i `GEAR_CATALOG`.

### Stora projekt / moonshots

31. **Svensk regional mjöldatabas** (Kungsörnen, Saltå Kvarn, Nord Mills — askhalt/protein styr hydration-rekommendation). Unik svensk-först-vinkel ingen engelsk konkurrent har; "hydration för Kungsörnen". Stark länkmagnet. Börja med 8-10 vanligaste mjölerna. *(Matchar [[user_profile]]: svensk-först.)*
32. **Starter-hälsologg** med matningshistorik + styrkeindikator (peak-tid vs temp). Förvandlar besöksfrekvensen från veckovis (bakplanering) till **daglig** (starterskötsel) — störst hävstång för ad-intäkt och e-postkonvertering. Emotionell ägarkänsla ("min starter").
33. **Krumma-analys via foto som Pro-funktion (AI).** Ladda upp snittbild → strukturerad diagnos (överproofad/tät/dålig gluten) + konkreta parameterjusteringar tillbaka i kalkylatorn. Kör via Cloudflare Pages Function (vision) så nyckeln aldrig exponeras. Genuint premium-värd, stark PR-krok. *(Dök upp som två separata idéer — konsoliderat här.)*
34. **Programmatisk SEO: auto-genererade bulk-tid-sidor per temperatur** (`/sourdough/bulk-time/22c/`). Q10-modellen + sidmallen finns redan → ~15 sidor, noll API-kostnad, long-tail med exakt sökintent.
35. **Svensk språkversion** av kalkylator + KB med hreflang (`/sv/`). Nära okonkurrerad sökyta där ägaren har modersmålsfördel. Kräver i18n-stränglager (L3).
36. **Inbäddningsbar kalkylator-widget (iframe)** för backlink-tillväxt — `/embed/` + ett 5-raders snippet med do-follow "Powered by". Topiskt relevanta backlinks är den svåraste tillväxtkurvan att köpa; en widget genererar dem passivt.
37. **Premium "Pro Planner"-läge i kalkylatorn** (lås upp 30 recept som live-presets, multi-loaf, sparbara scheman) via Gumroad License Keys i `localStorage`. Gör *verktyget* — inte bara PDF:en — till produkten; återkommande intäkt.
38. **B2B white-label** av kalkylatorn till kvarnar/mikrobagerier (single-file gör re-skinning trivial; `MONETIZATION_CONFIG` är redan central). Ett avtal kan överstiga månaders display-intäkt.
39. **Onlinekurs "From 5 bakes to consistent"** ($79-149). Artiklar + Pro-felsökningsflöden är ett färdigt curriculum-skelett; mejlsekvensen är säljmotor.
40. **Andra-nisch-replikering** (README:190-204 beskriver mallen). Hela infrastrukturen återanvänds; varje nisch multiplicerar intäkt. README varnar korrekt: inte förrän sourdough klarar $200/mån.
41. **AI "Diagnostisera min bake"** per-användning-krediter (variant av 33 med betalmodell som bär API-kostnaden).

---

## 14. Konsekvensanalys — topp 5 fynd

**1. K1 (root-deploy → gratis PDF:er).** *Direkt:* intäktsläckage på Pro-produkten. *Indirekt:* `build-dist`-allowlisten blir verkningslös → varje framtida känslig rotfil exponeras. *Datamigration:* ingen, men byte till `dist`-output kräver att alla publika filer finns i `PUBLIC_FILES` (verifiera att inget syns idag som försvinner). *Bakåtkompat:* befintliga djuplänkar till `/sourdough-schedule.html` måste fortsätta funka (de gör det via `_redirects`). *Risk att flagga:* om du tar bort PDF:erna ur git, säkerställ att Gumroad-leveransen är inställd först så köpare inte blir utan fil.

**2. K2 (klartext-nycklar).** *Direkt:* potentiell obegränsad API-fakturering + full e-postlist-åtkomst vid läcka. *Indirekt:* rotering invaliderar alla ställen som använder nycklarna — uppdatera GitHub Secrets samtidigt, annars dör crons. *Migration:* ingen. *Bakåtkompat:* lokal körning som förlitat sig på `config.local.json` måste byta till `.env`. *Risk:* rotera MailerLite-token i lågtrafik så ingen drip-körning träffar gapet.

**3. K3 (CMP — verifiera).** *Direkt:* om CMP:n inte fyrar visas inga annonser för EEA → uteblivna intäkter; men en CMP konfigurerades i konsolen 05-14, så detta är sannolikt redan löst och behöver bekräftas, inte byggas. *Indirekt:* `privacy.html`-beskrivningen ska matcha den faktiska bannern. *Migration:* ingen. *Bakåtkompat:* CMP får inte blockera Plausible (cookiefritt) — bara annonscookies. *Risk:* lita inte på grep i repot som bevis på CMP-status — konsol-konfigurerad Funding Choices har ingen repo-kod; verifiera på den live-deployade sidan.

**4. H1 (DDT-formel).** *Direkt:* aktivt skadligt bakråd (53 °C vatten dödar levainen) på en advertised feature. *Indirekt:* artikel 07 + cheat-sheet måste rättas samtidigt, annars kvarstår motsägelsen. *Migration:* om ett levain-fält läggs till ändras `collectFormValues`/`restoreFormValues` → bumpa `localStorage`-schemaversion (M22) så gammal sparad state inte kraschar. *Bakåtkompat:* gamla sparade Recipe Lab-värden saknar levain-temp → defaulta till rumstemp. *Risk:* lås beteendet med ett enhetstest (M4) mot Hamelmans referensexempel.

**5. H2 (hydration-bas).** *Direkt:* alla recept har ~2-4 procentenheter fel hydration/salt. *Indirekt:* om du börjar visa "verklig total hydration" kommer presets se annorlunda ut än användare minns → kommunicera ändringen. *Migration:* sparade scheman har gammal (nominell) hydration; visa både eller migrera. *Bakåtkompat:* behåll "tillsatt vatten" som det användaren häller i. *Risk:* gör samtidigt med H1 och M4 så testerna låser fast både DDT och total hydration.

---

## 15. Bra grejer (det som redan är välbyggt)

- **Fermentationsmotorn är domänmässigt korrekt** (Q10-temperatur + inoculation) — slår de flesta gratis-konkurrenter. Reverse-läge, starter-planerare och C/F-delta-hantering är genomtänkta.
- **`isConfigured`-gatet** — verktyget fungerar fullt ut medan IDs är placeholders; ingen trasig UI. Elegant fail-safe.
- **`welcome-drip-probe.js`** — read-only dry-run som visar exakt vad en skarp körning *skulle* skicka. Föredömligt.
- **Allowlist-baserad `build-dist`** — rätt säkerhetsmodell (allt privat som default). Skadas bara av root-deploy-felet.
- **Git-historiken är ren, `npm audit` = 0 sårbarheter, minimal beroendeyta** (2 prod-deps).
- **Dubbelt edge-skydd** (middleware före cache + `_redirects`) för källfiler.
- **Migrationen till per-artikel-URL:er** med canonical, Article-JSON-LD, OG/Twitter — gedigen teknisk SEO-grund som direkt adresserar AdSense "low-value"-flaggen.
- **Affiliate korrekt `rel="nofollow sponsored noopener"`** (FTC + Google-korrekt).
- **Ovanligt komplett `privacy.html`** (AdSense, MailerLite EU-servrar, Gumroad, Amazon, Pinterest, GDPR-rättigheter, SCC) — den enda bristen är samtyckesbanner-påståendet (K3).
- **Subscriber-buggar från historiken är åtgärdade** (`filter[group]` singular, `GET /fields`) — koden bär tydliga lärdomskommentarer.
- **All `localStorage` är try/catch-omsluten**, `tickLive`/`masterTick` är prestandamedvetna, print-stylesheet är genomtänkt.

---

## 16. Prioriterad åtgärdslista (TL;DR med insatsestimat)

### Sprint 0 — innan AdSense-godkännande (~1 dag totalt)
1. **K1** Verifiera Cloudflare output-katalog; sätt till `dist` (eller blockera PDF:erna). · 1 h · *intäktsläcka + falsk trygghet*
2. **K3** Verifiera att den konsol-konfigurerade Google-CMP faktiskt fyrar för EEA (VPN-test); stäm av mot `privacy.html`. · 15 min · *AdSense-blockerare i EU om den inte fyrar*
3. **K4** Lägg footer + privacy-länk på kalkylatorn; samtyckesrad i lead-modalen. · 1 h · *godkännandehinder*
4. **K2** Rotera Anthropic- + MailerLite-nycklar; uppdatera GitHub Secrets. · 1 h · *aktiv exponering*
5. **H4** Ta bort dubbel AdSense-laddning. · 15 min · *policyvarning under review*
6. **H11** Fixa "no ads, no tracking"-texten. · 15 min · *vilseledande*
7. **H12** Lägg canonical på `/`; rätta `index.html`. · 15 min · *SEO för viktigaste sidan*

### Sprint 1 — domänkorrekthet (~1 dag)
8. **H1** Fixa DDT-formeln (multiplikator = antal termer) + artikel 07 + cheat-sheet. · 1 h · *aktivt skadligt råd*
9. **H2** Inför total-hydration-modell (levain-bidrag). · halvdag · *alla recept fel ~2-4 %*
10. **H13** Rätta innertemp i artikel 13. · 15 min · *E-E-A-T*
11. **M4** Extrahera `dough-math.js` + `node:test` med referensfall (låser H1/H2). · dag · *noll tester på hjärtat*
12. **H3** Byt ICS till flytande lokal tid. · 1 h · *DST-fel*

### Sprint 2 — robusthet i obevakade jobb (~1 dag)
13. **H5** `ANTHROPIC_MODEL` som env-variabel. · 15 min
14. **H6** Retry/backoff mot Claude-API. · 1 h
15. **H7** Deklarera `sharp` (eller ta bort pin-skriptet); `npm ci` enbart. · 15 min
16. **H8** `concurrency`-grupp på welcome-drip; läs-om-steg före schemaläggning. · 1 h
17. **M12/M15/M17/M18** Roadmap-slut-signal, temp-grupp-rensning, `git pull --rebase`, 429-backoff. · ~halvdag

### Sprint 3 — säkerhet, SEO, a11y (~2 dagar)
18. **H9** `_headers` med CSP (Report-Only) + nosniff/HSTS/Referrer. · halvdag
19. **H10** GDPR-samtycke + double-opt-in; hantera `no-cors`-flaggan. · halvdag
20. **M19/M20** Secret-guard i CI; flytta/blockera datafiler. · ~1 h
21. **M21/L12** FAQPage-schema (kalkylator + artiklar). · ~halvdag
22. **M6-M10** Focus-trap, dark mode, kontrast, touch targets, tab-ARIA. · ~2 dagar
23. **L13-L19** Korrekturläs artiklar (garbled mening, Q10-prosa, rye-ref, boilerplate). · ~halvdag

### Därefter — tillväxt (välj utifrån [[project_overview]]-mål)
**Snabbast ROI:** öka content-takten (idé 7), Amazon OneLink + ASIN-länkar (12-13), PWA (16), starter-hälsologg (32). **Defensiv nisch:** svensk mjöldatabas + sv-version (31, 35). **Intäktshöjd:** Pro Planner-läge (37), display-uppgradering (29), AI-krumma-analys (33).

---

*Självrevision utförd: K3 nedgraderat från KRITISKT till HÖG `[VERIFY]` efter avstämning mot sessionsanteckningar (en Google-CMP konfigurerades i AdSense-konsolen 2026-05-14; konsol-konfigurerad Funding Choices kräver ingen repo-kod, så grep-fyndet "ingen CMP-kod" bevisar inte "ingen CMP") → KRITISKT 4→3, HÖG 12→13. Avfärdat fynd (HowTo-schema) borttaget ur åtgärdslistan; 6 justerade fynd korrigerade (radnummer för cheat-sheet→69, `.sort()`→76, roadmap=30 ämnen, fonter=Manrope+JetBrains Mono, ett extra style-block, cron-flöde, ad-slot-mid finns); dubbletter sammanslagna (AdSense dubbel-laddning, `sharp`); de tyngsta KRITISKT/HÖG-fynden spotcheckade förstahands mot fil. Domänpåståenden underbyggda mot Forkish/Robertson/Hamelman; kvarvarande osäkerheter märkta `[VERIFY]`.*
