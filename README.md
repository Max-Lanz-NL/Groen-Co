# Groen & Co.

Een rustige, responsive website voor Max & Leo in Arnhem en omgeving. Gebouwd met HTML, CSS en JavaScript, zonder benodigde externe pakketten.

## Lokaal bekijken

Installeer Node.js 20 of hoger en voer uit:

```
npm run dev
```

Open http://127.0.0.1:4178.

## Controleren en bouwen

```
npm run check
npm run build
```

De publiceerbare website staat in `dist/`. Host deze map op een statische webhost die mappen met `index.html` ondersteunt. Gebruik een eigen domein of een host op het hoofddomein: de middelen en navigatie gebruiken absolute paden vanaf de hoofdmap. GitHub Pages onder `/Groen-Co/` vereist een aanpassing van deze paden.

## Voor ingebruikname

- Stel het echte centrale telefoonnummer in `public/config.js` in: landcode en nummer zonder plus of begin-0 (Nederlandse mobiel: `316…`). Alle WhatsApp-links gebruiken deze instelling en hetzelfde vooraf ingevulde bericht. Zolang het nummer leeg is, verwijzen knoppen naar een eerlijke contactmelding.
- Vul daar ook het definitieve `siteUrl` in en bouw opnieuw; zo worden een sitemap en robots.txt aangemaakt en worden canonical-links geactiveerd.
- Plaats een echte gezamenlijke foto in `public/images/team/max-leo.jpg`. De twee fotoposities schakelen automatisch over van placeholder naar foto.
- Optionele losse foto's zijn configureerbaar, maar worden nog niet getoond. Ze zijn niet nodig.
- Voeg echte werkfoto's toe aan `public/images/work/` en aan `photos.work` in de configuratie.
- De prijzenpagina bevat geen verzonnen tarieven. Vervang de toelichting door jullie eigen prijzen zodra die zijn vastgesteld.

## Pagina's

Home, Diensten, Prijzen, Over ons, Contact en een 404-pagina. Geen automatisch boekingssysteem, formulieren, tracking of nepreviews. Afspraken worden persoonlijk besproken en bevestigd.

De tuinillustratie is een eigen SVG-illustratie; deze toont geen bestaand werk of personen. Google Fonts wordt gebruikt met lokale systeemlettertypen als terugval.
