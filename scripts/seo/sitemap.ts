import fs from 'fs';
import { SITE_URL, LOCALES } from './constants.js';
import { STATIC_ROUTES } from './routes.js';
import { getPosts } from './client.js';
import { buildHreflang } from './hreflang.js';
import type { SeoPost } from './types.js';

type SitemapUrl = { loc: string; path: string };

function localizedUrl(path: string, locale: 'es' | 'en') {
  const url = new URL(path || '/', SITE_URL);
  if (locale === 'en') url.searchParams.set('lang', 'en');
  return url.toString();
}

function buildUrls(locale: 'es' | 'en', posts: SeoPost[]): SitemapUrl[] {
  const staticUrls = STATIC_ROUTES.map((route) => ({
    loc: localizedUrl(route.path, locale),
    path: route.path,
  }));
  const postUrls = posts.map((post) => ({
    loc: localizedUrl(`/blog/${post.slug}`, locale),
    path: `/blog/${post.slug}`,
  }));
  return [...staticUrls, ...postUrls];
}

function buildSitemapXml(urls: SitemapUrl[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map((url) => `  <url>
    <loc>${url.loc}</loc>
    ${buildHreflang(url.path)}
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
