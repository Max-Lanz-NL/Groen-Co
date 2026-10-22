import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
const pages = [
  "index.html",
  "diensten/index.html",
  "prijzen/index.html",
  "over-ons/index.html",
  "contact/index.html",
  "404.html",
];
for (const page of pages) {
  const html = await readFile("public/" + page, "utf8");
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, page + ": één hoofdtitel");
  assert.match(html, /lang="nl"/);
  assert.match(html, /name="description"/);
  for (const match of html.matchAll(/(?:href|src)="(\/[^"#]*)/g)) {
    const path = match[1];
    const target = resolve("public", "." + path, path.endsWith("/") ? "index.html" : "");
    assert.ok((await stat(target)).isFile(), page + ": " + path);
  }
  assert.ok(!/Leonardo|binnenkort.{0,40}foto|photo-placeholder|tel:|\b5[,.]0\s*\/\s*5/i.test(html));
  assert.match(html, /rel="canonical"/);
  assert.match(html, /src="\/whatsapp.js"/);
  for (const match of html.matchAll(/href="(https:\/\/wa.me\/[^\"]*)"/g)) {
    const url = new URL(match[1].replaceAll("&amp;", "&"));
    assert.equal(url.pathname, "/31619110237", page + ": bestaand nummer behouden");
    assert.ok(url.searchParams.get("text").startsWith("Hoi Max en Leo,"));
  }
}
const ctx = { window: {} };
vm.runInNewContext(await readFile("public/config.js", "utf8"), ctx);
assert.equal(
  ctx.window.GROEN_CO.whatsappMessage,
  "Hoi Max en Leo, ik heb een vraag over tuinonderhoud.",
);
assert.equal(ctx.window.GROEN_CO.whatsappNumber, "31619110237");
assert.equal(ctx.window.GROEN_CO.photos.showTeam, false);
assert.ok(
  Object.values(ctx.window.GROEN_CO.prices).every(
    (value) =>
      value === null ||
      (typeof value.label === "string" && (!value.unit || typeof value.unit === "string")),
  ),
);
console.log("Alle pagina's, interne links, middelen en WhatsApp-tekst gecontroleerd.");
const app = await readFile("public/app.js", "utf8");
for (const [number, expected, message] of [
  ["", false, ""],
  ["onjuist", false, ""],
  ["+31 6 12345678", true, ""],
  [
    "31619110237",
    true,
    "Hoi Max en Leo, ik wil graag mijn gras laten maaien. Kunnen jullie me hiermee helpen?",
  ],
]) {
  const link = { href: "", dataset: { message }, removeAttribute() {} };
  const status = { hidden: false };
  const ready = { hidden: true };
  const document = {
    querySelector: () => null,
    querySelectorAll: (selector) =>
      ({
        "[data-whatsapp]": [link],
        "[data-contact-status]": [status],
        "[data-whatsapp-ready]": [ready],
      })[selector] || [],
  };
  vm.runInNewContext(app, {
    window: {
      GROEN_CO: { whatsappNumber: number, whatsappMessage: ctx.window.GROEN_CO.whatsappMessage },
    },
    document,
  });
  assert.equal(status.hidden, expected);
  assert.equal(ready.hidden, !expected);
  if (expected) {
    const url = new URL(link.href);
    assert.equal(url.origin, "https://wa.me");
    assert.equal(url.pathname, "/" + number.replace(/[+\s()-]/g, ""));
    assert.equal(url.searchParams.get("text"), message || ctx.window.GROEN_CO.whatsappMessage);
  } else assert.equal(link.href, "/contact/#whatsapp");
}
console.log("WhatsApp gecontroleerd met een leeg, ongeldig en geldig ingesteld nummer.");
const servicesPage = await readFile("public/diensten/index.html", "utf8");
assert.equal((servicesPage.match(/<article class="service-row"/g) || []).length, 6);
assert.equal((servicesPage.match(/data-message=/g) || []).length, 6);
console.log("Zes diensten, eigen dienstberichten en uitgeschakelde portretten gecontroleerd.");
