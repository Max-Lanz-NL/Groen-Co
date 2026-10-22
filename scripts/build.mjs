import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import vm from "node:vm";
await mkdir("dist", { recursive: true });
await cp("public", "dist", { recursive: true });
const context = { window: {} };
vm.runInNewContext(await readFile("public/config.js", "utf8"), context);
const siteUrl = context.window.GROEN_CO?.siteUrl;
if (siteUrl) {
  const base = new URL(siteUrl);
  if (!["https:", "http:"].includes(base.protocol)) throw new Error("siteUrl moet een http(s)-adres zijn");
  const escape = value => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  const urls = ["/", "/diensten/", "/prijzen/", "/over-ons/", "/contact/"];
  await writeFile("dist/sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + urls.map(path => "<url><loc>" + escape(new URL(path, base).href) + "</loc></url>").join("") + "</urlset>");
  await writeFile("dist/robots.txt", "User-agent: *\nAllow: /\nSitemap: " + new URL("/sitemap.xml", base).href + "\n");
} else {
  await writeFile("dist/robots.txt", "User-agent: *\nAllow: /\n");
}
console.log("Website gebouwd: " + resolve("dist"));

