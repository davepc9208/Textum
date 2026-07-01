import fs from "fs";
import { SITE_URL, LOCALES } from "./constants.js";
import { STATIC_ROUTES } from "./routes.js";
import { getPosts } from "./client.js";
import { buildHreflang } from "./hreflang.js";

function buildUrls(locale: string, posts: any[]) {
  const staticUrls = STATIC_ROUTES.map((r) => ({
    loc: `${SITE_URL}/${locale}${r.path}`,
    path: r.path,
  }));

  const postUrls = posts.map((p) => ({
    loc: `${SITE_URL}/${locale}/blog/${p.slug}`,
    path: `/blog/${p.slug}`,
  }));

  return [...staticUrls, ...postUrls];
}

function buildSitemapXml(urls: { loc: string; path: string }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${urls
  .map((u) => {
    return `
  <url>
    <loc>${u.loc}</loc>
    ${buildHreflang(u.path)}
  </url>`;
  })
  .join("")}
</urlset>`;
}

export async function generateSitemaps() {
  const posts = await getPosts();

  for (const locale of LOCALES) {
    const urls = buildUrls(locale, posts);
    const xml = buildSitemapXml(urls);

    fs.writeFileSync(`public/sitemap-${locale}.xml`, xml);
  }

  console.log("🗺️ sitemaps ES/EN generados");
}