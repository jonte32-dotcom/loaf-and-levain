# Weekly Check-in — Loaf & Levain

**När:** Söndag kväll, 10 minuter.
**Hur:** Öppna Claude Code på `C:\Users\Aras_\Desktop\Dough` och säg:
> "kör veckogenomgång"

Då kör jag igenom hela checklistan med dig.

---

## Inbox-genomgång (innan du startar Claude)

Öppna Gmail → klicka label **🚨 LOAF ACTION** i sidebaren → screenshot allt som kommit den senaste veckan.

Anteckna här (eller skicka screenshots till mig):

- [ ] Pinterest Standard access (upgrade) — godkänd? (Trial räcker INTE; kräver video demo. Hoppa över tills vi gör screencast.)
- [ ] Google AdSense — godkänd/nekad? (Inom 1-4 veckor)
- [ ] MailerLite — nya prenumeranter? (Hur många?)
- [ ] Gumroad — sales? (Hur många, vilken produkt?)
- [ ] GitHub Actions — failures? (Cron som inte körts?)
- [ ] BMC tips — eller payouts?
- [ ] Cloudflare — fakturor/varningar?

---

## Manuell pin status (Pinterest)

Tills Pinterest API godkänts:
- [ ] Postade jag pin denna vecka? (mål: 3-4 pins/v dvs varannan dag)
- [ ] Vilken pin-nummer är jag på? (pin-01 → pin-10 i `dist-pins/`)
- [ ] När pin-10 postad → säg till mig så genererar jag pin-11→pin-20

---

## Article output (auto)

GitHub Actions cron körs varje måndag 08:00 UTC och genererar 1 ny artikel.
- [ ] Kolla `articles/` — hur många filer finns där nu?
- [ ] Senaste filens datum — har en ny dykt upp denna vecka?
- [ ] Om INGEN ny → cron failade, säg "kolla cron-status" till mig

---

## Pengar in (manuell koll)

- [ ] Gumroad dashboard: https://gumroad.com/dashboard
- [ ] Buy Me a Coffee: https://buymeacoffee.com/loafandlevain
- [ ] Amazon Associates: https://affiliate-program.amazon.com (rapporterar 24h delay)
- [ ] AdSense (när aktiv): https://adsense.google.com/start

Skriv summa här:
```
Vecka [datum]:
- Gumroad:    $___
- BMC:        $___
- Amazon:     $___
- AdSense:    $___
TOTAL:        $___
```

---

## Pinterest analytics (när live)

- [ ] Pinterest Business → Analytics
- [ ] Senaste 7 dagar: impressions / outbound clicks / saves
- [ ] Bästa pin? Sämsta pin?

---

## Saker som triggar action (säg till mig)

| Vad jag ser | Vad jag säger till Claude |
|---|---|
| Pinterest-mejl: "Standard access approved" | "Pinterest Standard godkänt, gör OAuth-flow och lägg in token" |
| AdSense-mejl: "approved" | "AdSense godkänd, fixa ad slots" |
| AdSense-mejl: "not approved" | "AdSense nekade, vad gör vi" |
| Gumroad-mejl: "You made a sale" | "första sale, [datum]" — bara så jag firar med dig |
| GitHub Actions: failure email | "cron failade, fixa" |
| Plötslig trafikspike | "trafiken sköt upp, kolla varifrån" |
| 50 prenumeranter passerat | "50 subs nådda, nästa steg" |
| 100 prenumeranter passerat | "100 subs nådda, nästa steg" |

---

## Diskvalifikationsmilstolpar (om vi ska ge upp)

Sajten är inte värd att fortsätta om EFTER 6 MÅNADER:
- Pinterest impressions < 500/månad
- Newsletter subs < 30
- Total intäkt < $20/månad
- Sajten har 0 sales på 6 månader

Då lägger vi ner och pivotar. INTE INNAN.

---

## Hela tiden i bakgrunden

Detta körs automatiskt utan dig:
- ✅ Cron: 1 ny artikel varje måndag 08:00 UTC
- ⏸️ Pinterest cron: pausad. Trial-token saknar `pins:write`; Standard kräver video demo (skjuts upp tills volym motiverar)
- ✅ MailerLite popup: fångar emails dygnet runt
- ✅ Welcome email: skickas automatiskt vid signup (när jag fixat trigger)
- ✅ AdSense: visar ads när godkänd
- ✅ Gumroad: tar betalt + mejlar PDF automatiskt
- ✅ Amazon affiliate: cookie-trackar 24h efter klick

Du behöver bara:
1. Pinna manuellt (15 min/vecka tills API godkänns)
2. Köra denna check-in (10 min/vecka)
3. Säga till mig när action behövs
