import fs from 'fs';
import { getPosts } from './client.js';
import { SITE_URL } from './constants.js';
import { buildSitemap } from './sitemap-builder.js';

export async function generateSitemapEn() {
  const posts = await getPosts();
  const withEnglishLanguage = (path: string) => {
    const url = new URL(path, SITE_URL);
    url.searchParams.set('lang', 'en');
    return url.toString();
  };
  const urls = [
    withEnglishLanguage('/'),
    withEnglishLanguage('/blog'),
    withEnglishLanguage('/colecciones'),
    withEnglishLanguage('/privacidad'),
    ...posts.map((post) => withEnglishLanguage(`/blog/${post.slug}`)),
  ];

  fs.writeFileSync('public/sitemap-en.xml', buildSitemap(urls));
}
