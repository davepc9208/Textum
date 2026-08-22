import fs from 'fs';
import { getPosts } from './client.js';
import { SITE_URL } from './constants.js';
import { buildSitemap } from './sitemap-builder.js';

export async function generateSitemapEs() {
  const posts = await getPosts();
  const urls = [
    SITE_URL,
    `${SITE_URL}/blog`,
    `${SITE_URL}/colecciones`,
    `${SITE_URL}/privacidad`,
    ...posts.map((post) => `${SITE_URL}/blog/${post.slug}`),
  ];

  fs.writeFileSync('public/sitemap-es.xml', buildSitemap(urls));
}
