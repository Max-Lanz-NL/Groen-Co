# Groen & Co.

De bestaande website voor Max & Leo uit Arnhem: HTML, CSS en JavaScript, zonder extra pakketten. Huisstijl, navigatie en tuinillustratie zijn behouden.

## Bekijken en controleren

Node.js 20 of hoger is voldoende, zonder dependency-installatie.

```
npm run dev
```

Open http://127.0.0.1:4178. Voor de volledige gebouwde versie:

```
npm run check
npm run build
npm run check:built
node scripts/serve.mjs --dist
```

Er is geen lintscript ingesteld. De controles testen pagina's, interne links, contactberichten, het behouden nummer, de zes diensten, metadata, sitemap, indexeerbaarheid en de prijslijst.

## Instellingen

`public/config.js` is de centrale plek voor:

- Het bestaande WhatsApp-nummer: alleen appen, niet bellen. Alle contactlinks gebruiken dit nummer. Na een build werken ze ook zonder JavaScript.
- Het algemene WhatsApp-bericht. Dienstknoppen hebben een eigen bericht in hun HTML.
- `siteUrl`: het huidige Vercel-adres. Bij een eigen domein hier aanpassen en opnieuw bouwen; de build werkt canonical-links, Open Graph-URLs, sitemap en robots.txt bij.
- `prices`: zes lege prijsvelden. Vul later per dienst `{ label: "jullie prijstekst", unit: "per bezoek" }` in. Een vaste prijs, vanafprijs of uurtarief kan allemaal. Er zijn nu geen bedragen ingevuld. De build zet prijzen vooraf in de HTML.

## Foto's

Er zijn geen portretten of fotoplaceholders. Teamfoto's staan standaard uit; alleen een foto toevoegen aan de map toont niets. Zie `public/images/team/README.md` om later bewust een echte foto toe te voegen.

Voor eigen werkfoto's: voeg bestanden toe aan `public/images/work/` en vul `photos.work` met `{ src: "/images/work/bestand.jpg", alt: "Beschrijving van de echte klus" }`. De galerij op de dienstenpagina verschijnt pas nadat een foto succesvol is geladen. Voeg daar alleen eigen werk toe. De bestaande tuinillustratie is als illustratie aangeduid.

## WhatsApp-grasmaaier

`public/whatsapp.js` tekent een passende achtergrond op compacte WhatsApp-knoppen. De dienst bepaalt het effect: grasmaaien, heg snoeien, onkruid verwijderen, bladeren harken, een gemengde tuin onderhouden of een pad vegen. Eigen SVG-gereedschappen worden van bovenaf getoond, met passende snippers of blaadjes. Algemene knoppen behouden het gras en de grasmaaier. Eén seconde na verlaten/blur herstelt de achtergrond in twee seconden. Teruggaan annuleert die timer. Canvas is decoratief, ontvangt geen muis-events en is verborgen voor schermlezers; de linktekst blijft gewone HTML. Het effect staat uit bij verminderde beweging en hover wordt niet gebruikt op touchapparaten. Er draait alleen een animatielus tijdens werken, snippers of herstel. `npm run test:grass` controleert alle zes effecten, gereedschap, snippers, tijdstappen, hernieuwde hover, toetsenbordfocus en verminderde beweging.

## Publiceren

`npm run build` maakt `dist/`. `vercel.json` geeft buildopdracht en uitvoermap aan. De bestaande GitHub-koppeling kan de nieuwe commit automatisch publiceren. Controleer het deploymentresultaat in Vercel; een push bewijst niet dat de nieuwe website live staat.

De site gebruikt paden vanaf het hoofddomein, geen GitHub Pages-submap. De standaard 404-pagina blijft beschikbaar. Sitemap en canonical-links worden vooraf gegenereerd en zijn niet afhankelijk van JavaScript.
