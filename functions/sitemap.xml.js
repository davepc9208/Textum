// functions/sitemap.xml.js
import { createClient } from '@supabase/supabase-js';

const SITE = 'https://mentoriatextum.com';

export async function onRequest(context) {
  const { env } = context;

  const supabase = createClient(
    env.VITE_SUPABASE_URL || env.SUPABASE_URL,
    env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
  );

  // Posts publicados (blog + colecciones)
  const { data: posts, error } = await supabase
    .from('posts')
    .select('slug, collection_type, updated_at, created_at, published')
    .eq('published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Sitemap Supabase error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // URLs estáticas importantes
  const staticUrls = [
    { loc: `${SITE}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
    { loc: `${SITE}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/colecciones`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE}/colecciones/principio`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/colecciones/categoria`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/colecciones/herramienta`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE}/contacto`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
    // Archivos para IA / SEO
    { loc: `${SITE}/llms.txt`, lastmod: today, changefreq: 'monthly', priority: '0.9' },
    { loc: `${SITE}/faq.md`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { loc: `${SITE}/services.md`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
  ];

  // URLs dinámicas desde Supabase
  const dynamicUrls = (posts || []).map((p) => {
    const lastmod = (p.updated_at || p.created_at || today).toString().slice(0, 10);

    // Piezas de colección
    if (p.collection_type) {
      return {
        loc: `${SITE}/colecciones/${p.collection_type}/${p.slug}`,
        lastmod,
        changefreq: 'monthly',
        priority: '0.8',
      };
    }

    // Posts de blog normales
    return {
      loc: `${SITE}/blog/${p.slug}`,
      lastmod,
      changefreq: 'monthly',
      priority: '0.7',
    };
  });

  const allUrls = [...staticUrls, ...dynamicUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      // Corto para que Google siempre vea versión fresca
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}