// functions/sitemap.xml.js
const SITE = 'https://www.mentoriatextum.com';

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function localizedUrl(path, lang) {
  const url = new URL(path, SITE);
  if (lang === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  return url.toString();
}

function slugFor(post, lang) {
  if (lang === 'en') return post.slug_en || post.slug_es || post.slug;
  return post.slug_es || post.slug;
}

function urlEntry(esPath, enPath, lastmod, priority, changefreq, lang = 'es') {
  const es = localizedUrl(esPath, 'es');
  const en = localizedUrl(enPath, 'en');
  const loc = lang === 'en' ? en : es;
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n    <xhtml:link rel="alternate" hreflang="es" href="${escapeXml(es)}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(es)}" />\n  </url>`;
}

export async function onRequest(context) {
  const { env } = context;
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/posts?select=slug,slug_es,slug_en,collection_type,created_at&published=eq.true&order=created_at.desc`, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    });
    if (!response.ok) return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });

    const posts = await response.json();
    const today = new Date().toISOString().slice(0, 10);
    const staticPaths = [
      ['/', '1.0', 'weekly'],
      ['/blog', '0.8', 'weekly'],
      ['/colecciones', '0.9', 'weekly'],
      ['/colecciones/principio', '0.8', 'weekly'],
      ['/colecciones/categoria', '0.8', 'weekly'],
      ['/colecciones/herramienta', '0.8', 'weekly'],
      ['/colecciones/eii', '0.8', 'weekly'],
      ['/colecciones/flux', '0.8', 'weekly'],
      ['/privacidad', '0.3', 'yearly'],
      ['/casos', '0.6', 'monthly'],
    ];
    const entries = staticPaths.flatMap(([path, priority, frequency]) => [
      urlEntry(path, path, today, priority, frequency, 'es'),
      urlEntry(path, path, today, priority, frequency, 'en'),
    ]);

    for (const post of posts || []) {
      const prefix = post.collection_type
        ? `/colecciones/${post.collection_type}`
        : '/blog';
      const esPath = `${prefix}/${slugFor(post, 'es')}`;
      const enPath = `${prefix}/${slugFor(post, 'en')}`;
      const lastmod = String(post.created_at || today).slice(0, 10);
      const priority = post.collection_type ? '0.8' : '0.7';
      entries.push(urlEntry(esPath, enPath, lastmod, priority, 'monthly', 'es'));
      entries.push(urlEntry(esPath, enPath, lastmod, priority, 'monthly', 'en'));
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>`;
    return new Response(xml, {
      status: 200,
      headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300, s-maxage=300' },
    });
  } catch (error) {
    console.error('[Sitemap] generation failed', error);
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}
