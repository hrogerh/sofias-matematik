# Sofias matematik

En iPad-anpassad matteapp byggd åt min dotter Sofia (åk 9), som ett sätt att
komplettera distansundervisning och täppa till kunskapsluckor på egen hand.

## Köra lokalt

Statiska sidor (allt utom `/api/*`) kan köras med vilken statisk server som
helst, t.ex.:

```bash
npx serve .
```

`/api/*`-funktionerna (kursplan, lektionsinnehåll, framsteg) kräver en riktig
serverless-miljö och går **inte** att testa med en enkel statisk server. Testa
dem antingen med `npx vercel dev` (kräver `vercel login`) eller genom att
pusha till `master` och testa mot den riktiga Vercel-deployen.

## Arkitektur

- **Statiskt app-skal** (git + Vercel, ändras sällan): `index.html`,
  `app.html`, `lektioner/runner.html` (generisk lektionsmotor),
  `lektioner/index.html` (generisk ämneslista), `js/lesson.js`, `css/style.css`.
- **Dynamiskt innehåll** i Upstash Redis, via Vercel-funktioner i `api/`:
  - `curriculum:<subject>` — vilka lektioner som finns per ämne och i vilken
    ordning (`api/curriculum.js`).
  - `content:<subject>/<sectionId>` — själva lektionsinnehållet, teori- och
    övningssteg (`api/lesson.js`).
  - `progress:sofia` — Sofias sparade framsteg (`api/progress.js`).
- **Inloggning:** ett enda delat lösenord för hela sajten (`js/auth.js`),
  ingen separat inloggning per person.

### Lägga till eller ändra en lektion

Inget behöver committas eller deployas för att ändra innehåll. Använd
`scripts/db.mjs` (läser databas-uppgifter från en lokal `.env.local`, som
aldrig committas):

```bash
node scripts/db.mjs get curriculum:algebra
node scripts/db.mjs get content:algebra/01-uttryck
# redigera JSON-filen lokalt, skriv sedan tillbaka:
node scripts/db.mjs set content:algebra/01-uttryck sokvag/till/fil.json
node scripts/db.mjs del <key>
```

`scripts/seed/` innehåller en kopia av allt innehåll som redan finns i
databasen, som referens/backup — inte den levande källan.

`curriculum-source.json` är en referensfil över hela läromedlets kapitel-
och delkapitelstruktur (tre böcker, åk 7–9). Den visas aldrig i appen, utan
används för att slå upp var ett nytt delkapitel hör hemma när vi bygger ut
kursplanen ämne för ämne.

## Framsteg – `framsteg.html`

En skrivskyddad sida där jag (föräldern) kan se hur det går för Sofia per
lektion: hur många övningar som är klara, senaste aktivitet, och om hon
behövt se en lösning eller övat om något.

**Den är medvetet inte länkad någonstans i appen.** Sofia loggar in med
samma delade lösenord som resten av sajten, och är extremt känslig för
synliga siffror kopplade till hennes egna prestationer/misstag (hon har
bl.a. raderat en ritapp med alla sina bilder flera gånger när en räknare
där gått upp för mycket). Sidan nås bara genom att skriva URL:en direkt:

```
https://<din-domän>/framsteg.html
```

Bokmärk den om du vill komma åt den snabbt. Lägg **inte** till en länk till
den från `app.html` eller någon annan sida Sofia navigerar igenom.
