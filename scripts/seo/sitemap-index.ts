import fs from "fs";
import { SITE_URL } from "./constants.js";

export async function generateSitemapIndex() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <sitemap>
    <loc>${SITE_URL}/sitemap-es.xml</loc>
  </sitemap>

  <sitemap>
    <loc>${SITE_URL}/sitemap-en.xml</loc>
  </sitemap>

</sitemapindex>`;

  fs.writeFileSync("public/sitemap.xml", xml);

  console.log("🗺️ sitemap index listo");
}