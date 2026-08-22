import fs from "fs";
import { getPosts } from "./client.js";
import { SITE_URL, LOCALES } from "./constants.js";

export async function generateRss() {
  const posts = await getPosts();

  for (const locale of LOCALES) {
    const items = posts.map((p) => {
      const title = locale === "es" ? p.title_es : p.title_en;
      const excerpt = locale === "es" ? p.excerpt_es : p.excerpt_en;

      return `
  <item>
    <title><![CDATA[${title}]]></title>
    <link>${SITE_URL}/blog/${p.slug}${locale === 'en' ? '?lang=en' : ''}</link>
    <description><![CDATA[${excerpt ?? ""}]]></description>
    <pubDate>${new Date(p.created_at).toUTCString()}</pubDate>
    <guid>${SITE_URL}/blog/${p.slug}${locale === 'en' ? '?lang=en' : ''}</guid>
  </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>Blog (${locale})</title>
  <link>${SITE_URL}/${locale === 'en' ? '?lang=en' : ''}</link>
  <description>Contenido actualizado</description>
  ${items.join("")}
</channel>
</rss>`;

    fs.writeFileSync(`public/rss-${locale}.xml`, xml);
  }

  console.log("📰 RSS listo");
}