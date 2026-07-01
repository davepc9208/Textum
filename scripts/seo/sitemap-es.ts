import fs from "fs";
import { getPosts } from "./client.js";
import { SITE_URL } from "./constants.js";
import { buildSitemap } from "./sitemap-builder.js";

export async function generateSitemapEs() {
  const posts = await getPosts();

  const urls = [
    `${SITE_URL}/es`,
    `${SITE_URL}/es/blog`,
    ...posts.map((p) => `${SITE_URL}/es/blog/${p.slug}`),
  ];

  const xml = buildSitemap(urls)

  fs.writeFileSync("public/sitemap-es.xml", xml);
}