import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://mentoriatextum.com';

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en las variables de entorno.');
  }
  return createClient(url, key);
}

function formatDate(iso) {
  return iso ? iso.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export default async () => {
  try {
    const supabase = getSupabase();
    const { data: posts, error } = await supabase
      .from('posts')
      .select('slug, created_at')
      .eq('published', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const today = new Date().toISOString().slice(0, 10);
    const latestPostDate = posts?.[0]?.created_at
      ? formatDate(posts[0].created_at)
      : today;

    const entries = [
      urlEntry({
        loc: `${SITE_URL}/`,
        lastmod: today,
        changefreq: 'weekly',
        priority: '1.0',
      }),
      urlEntry({
        loc: `${SITE_URL}/blog`,
        lastmod: latestPostDate,
        changefreq: 'daily',
        priority: '0.9',
      }),
      ...(posts ?? []).map((post) =>
        urlEntry({
          loc: `${SITE_URL}/blog/${post.slug}`,
          lastmod: formatDate(post.created_at),
          changefreq: 'monthly',
          priority: '0.8',
        }),
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err) {
    console.error('Sitemap error:', err);
    return new Response('Error generating sitemap', { status: 500 });
  }
};

export const config = {
  path: '/sitemap.xml',
};
