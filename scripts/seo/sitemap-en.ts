import fs from "fs";
import { getPosts } from "./client.js";
import { SITE_URL } from "./constants.js";
import { buildSitemap } from "./sitemap-builder.js";

export async function generateSitemapEn() {
  const posts = await getPosts();

  const urls = [
    `${SITE_URL}/en`,
    `${SITE_URL}/en/blog`,
    ...posts.map((p) => `${SITE_URL}/en/blog/${p.slug}`),
  ];

  const xml = buildSitemap(urls)

  fs.writeFileSync("public/sitemap-en.xml", xml);
}