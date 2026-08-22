import { buildHreflang } from './hreflang.js';

export function buildSitemap(paths: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.map((path) => {
  const url = new URL(path);
  const cleanPath = `${url.pathname}${url.searchParams.get('lang') === 'en' ? '' : url.search}`;
  return `  <url>
    <loc>${path}</loc>
    ${buildHreflang(cleanPath)}
  </url>`;
}).join('\n')}
</urlset>`;
}
