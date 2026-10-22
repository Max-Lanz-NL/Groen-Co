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
  assert.ok(!/Leonardo|callcenter.{0,10}24|\b5[,.]0\s*\/\s*5/.test(html));
}
const ctx = { window: {} };
vm.runInNewContext(await readFile("public/config.js", "utf8"), ctx);
assert.equal(
  ctx.window.GROEN_CO.whatsappMessage,
  "Hallo Max en Leo! Ik wil graag meer informatie over de diensten van Groen & Co.",
);
console.log("Alle pagina's, interne links, middelen en WhatsApp-tekst gecontroleerd.");
const app = await readFile("public/app.js", "utf8");
for (const [number, expected] of [
  ["", false],
  ["onjuist", false],
  ["+31 6 12345678", true],
]) {
  const link = { href: "", removeAttribute() {} };
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
    assert.equal(url.pathname, "/31612345678");
    assert.equal(url.searchParams.get("text"), ctx.window.GROEN_CO.whatsappMessage);
  } else assert.equal(link.href, "/contact/#whatsapp");
}
console.log("WhatsApp gecontroleerd met een leeg, ongeldig en geldig ingesteld nummer.");
