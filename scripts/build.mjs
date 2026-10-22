import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
const context = { window: {} };
vm.runInNewContext(await readFile("public/config.js", "utf8"), context);
const siteUrl = context.window.GROEN_CO?.siteUrl;
const config = context.window.GROEN_CO;
const paths = ["/", "/diensten/", "/prijzen/", "/over-ons/", "/contact/"];
const escape = (value) =>
  String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
// Render indexeerbare metadata en prijzen vooraf, zonder JavaScript nodig te hebben.
for (const path of [...paths, "/404.html"]) {
  const file = path.endsWith(".html") ? path.slice(1) : path.slice(1) + "index.html";
  let html = await readFile("public/" + file, "utf8");
  if (siteUrl) {
    const canonical = escape(new URL(path, siteUrl).href);
    html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, "$1" + canonical + "$2");
    html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, "$1" + canonical + "$2");
  }
  html = html.replace(/<td data-price="([^"]+)">[\s\S]*?<\/td>/g, (tag, id) => {
    const price = config.prices?.[id];
    return (
      '<td data-price="' +
      id +
      '">' +
      escape(price?.label ? [price.label, price.unit].filter(Boolean).join(" · ") : "In overleg") +
      "</td>"
    );
  });
  const number = String(config.whatsappNumber || "").replace(/[+\s()-]/g, "");
  html = html.replace(/<a\b[^>]*>/g, (tag) => {
    if (!/\bdata-whatsapp(?:\s|>|=)/.test(tag)) return tag;
    const specific = tag.match(/data-message="([^"]*)"/)?.[1];
    const message = (specific || config.whatsappMessage).replaceAll("&amp;", "&");
    const href = /^[1-9]\d{7,14}$/.test(number)
      ? "https://wa.me/" + number + "?text=" + encodeURIComponent(message)
      : "/contact/#whatsapp";
    return tag.replace(/href="[^"]*"/, 'href="' + escape(href) + '"');
  });
  await writeFile("dist/" + file, html);
}
if (siteUrl) {
  const base = new URL(siteUrl);
  if (!["https:", "http:"].includes(base.protocol))
    throw new Error("siteUrl moet een http(s)-adres zijn");
  await writeFile(
    "dist/sitemap.xml",
    '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
      paths
        .map((path) => "<url><loc>" + escape(new URL(path, base).href) + "</loc></url>")
        .join("") +
      "</urlset>",
  );
  await writeFile(
    "dist/robots.txt",
    "User-agent: *\nAllow: /\nSitemap: " + new URL("/sitemap.xml", base).href + "\n",
  );
} else {
  await writeFile("dist/robots.txt", "User-agent: *\nAllow: /\n");
}
console.log("Website gebouwd: " + resolve("dist"));
