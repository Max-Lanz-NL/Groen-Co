import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
const base = "https://groenenco125235.vercel.app";
const paths = ["/", "/diensten/", "/prijzen/", "/over-ons/", "/contact/"];
const sitemap = await readFile("dist/sitemap.xml", "utf8");
for (const path of paths) {
  const html = await readFile("dist" + path + "index.html", "utf8");
  assert.ok(html.includes('<link rel="canonical" href="' + base + path + '"'));
  assert.ok(html.includes('<meta property="og:url" content="' + base + path + '"'));
  assert.ok(sitemap.includes("<loc>" + base + path + "</loc>"));
  assert.ok(!html.includes('name="robots" content="noindex'));
  assert.ok(!html.includes("photo-placeholder"));
}
assert.match(
  await readFile("dist/robots.txt", "utf8"),
  /Allow: \/\nSitemap: https:\/\/groenenco125235.vercel.app\/sitemap.xml/,
);
assert.match(await readFile("dist/404.html", "utf8"), /name="robots" content="noindex, follow"/);
const prices = await readFile("dist/prijzen/index.html", "utf8");
assert.equal((prices.match(/<td data-price=/g) || []).length, 6);
const context = { window: {} };
vm.runInNewContext(await readFile("public/config.js", "utf8"), context);
const escape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
for (const [id, price] of Object.entries(context.window.GROEN_CO.prices)) {
  const label = price?.label ? [price.label, price.unit].filter(Boolean).join(" · ") : "In overleg";
  assert.ok(prices.includes('<td data-price="' + id + '">' + escape(label) + "</td>"));
}
console.log(
  "Gebouwde pagina's, canonical-URLs, sitemap, indexeerbaarheid en prijslijst gecontroleerd.",
);
