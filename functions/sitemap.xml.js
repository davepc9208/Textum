// functions/sitemap.xml.js
// SITE canónico: siempre https://www.mentoriatextum.com
const SITE = 'https://www.mentoriatextum.com';

export async function onRequest(context) {
  const { env } = context;

  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      `Missing env vars. URL: ${supabaseUrl ? 'OK' : 'MISSING'}, KEY: ${supabaseKey ? 'OK' : 'MISSING'}`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?select=slug,collection_type,created_at&published=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) {
      const body = await res.text();
      return new Response(
        `Supabase error ${res.status}: ${body}`,
        { status: 500, headers: { 'Content-Type': 'text/plain' } }
      );
    }

    const posts = await res.json();
    const today = new Date().toISOString().slice(0, 10);

    const staticUrls = [
      { loc: `${SITE}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
      { loc: `${SITE}/blog`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE}/colecciones`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
      { loc: `${SITE}/colecciones/principio`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE}/colecciones/categoria`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE}/colecciones/herramienta`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
      { loc: `${SITE}/contacto`, lastmod: today, changefreq: 'monthly', priority: '0.6' },
      { loc: `${SITE}/privacidad`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
      { loc: `${SITE}/llms.txt`, lastmod: today, changefreq: 'monthly', priority: '0.9' },
      { loc: `${SITE}/faq.md`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
      { loc: `${SITE}/services.md`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
    ];

    const dynamicUrls = (posts || []).map((p) => {
      const lastmod = (p.created_at || today).toString().slice(0, 10);
      if (p.collection_type) {
        return {
          loc: `${SITE}/colecciones/${p.collection_type}/${p.slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.8',
        };
      }
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
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
    });
  } catch (err) {
    return new Response(
      `Sitemap exception: ${err?.message || String(err)}`,
      { status: 500, headers: { 'Content-Type': 'text/plain' } }
    );
  }
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
