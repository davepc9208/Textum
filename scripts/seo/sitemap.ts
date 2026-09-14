import fs from 'fs';
import { SITE_URL, LOCALES } from './constants.js';
import { STATIC_ROUTES } from './routes.js';
import { getPosts } from './client.js';
import type { SeoPost } from './types.js';

type SitemapUrl = { loc: string; es: string; en: string };

function localizedUrl(path: string, locale: 'es' | 'en') {
  const url = new URL(path || '/', SITE_URL);
  if (locale === 'en') url.searchParams.set('lang', 'en');
  return url.toString();
}

function slugFor(post: SeoPost, locale: 'es' | 'en') {
  return locale === 'en'
    ? (post.slug_en || post.slug_es || post.slug)
    : (post.slug_es || post.slug);
}

function buildUrls(locale: 'es' | 'en', posts: SeoPost[]): SitemapUrl[] {
  const staticUrls = STATIC_ROUTES.map((route) => {
    const es = localizedUrl(route.path, 'es');
    const en = localizedUrl(route.path, 'en');
    return { loc: locale === 'en' ? en : es, es, en };
  });
    const postUrls = posts.map((post) => {
    const prefix = post.collection_type
      ? `/colecciones/${post.collection_type}`
      : '/blog';
    const es = localizedUrl(`${prefix}/${slugFor(post, 'es')}`, 'es');
    const en = localizedUrl(`${prefix}/${slugFor(post, 'en')}`, 'en');
    return { loc: locale === 'en' ? en : es, es, en };
  });
  return [...staticUrls, ...postUrls];
}

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildSitemapXml(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(url.es)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(url.en)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(url.es)}" />
  </url>`).join('\n')}
</urlset>`;
}

export async function generateSitemaps() {
  const posts = await getPosts();
  for (const locale of LOCALES) {
    fs.writeFileSync(`public/sitemap-${locale}.xml`, buildSitemapXml(buildUrls(locale, posts)));
  }
  console.log('🗺️ sitemaps ES/EN generados');
}
