/**
 * Cloudflare Pages Function - Blog SEO para bots únicamente
 * Solo intercepta requests de bots (Facebook, Twitter, WhatsApp, LinkedIn)
 * Los usuarios normales acceden directamente a la app React
 */

const SUPABASE_URL = 'https://didxrqnhnxbhskdazkzz.supabase.co';
const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Twitterbot',
  'twitterbot',
  'WhatsApp',
  'LinkedInBot',
  'linkedinbot',
  'Slurp',
  'Googlebot',
  'googlebot',
  'bingbot',
  'Bingbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  return BOT_USER_AGENTS.some(bot => userAgent.includes(bot));
}

async function fetchPost(slug, apiKey) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const posts = await response.json();
    return posts.length > 0 ? posts[0] : null;
  } catch (error) {
    console.error('Error fetching post:', error.message);
    return null;
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

export async function onRequest(context) {
  const { request, params, env } = context;
  const userAgent = request.headers.get('user-agent') || '';

  // Si no es un bot, dejar que React maneje la ruta normalmente
  if (!isBot(userAgent)) {
    return new Response(null, { status: 404 });
  }

  const slug = params.slug;
  if (!slug) {
    return new Response(null, { status: 404 });
  }

  try {
    const apiKey = env.VITE_SUPABASE_ANON_KEY;
    if (!apiKey) {
      return new Response(null, { status: 404 });
    }

    const post = await fetchPost(slug, apiKey);
    const lang = new URL(request.url).searchParams.get('lang') || 'es';

    let title = 'Artículo — TEXTUM Mentoría Académica';
    let description = 'Artículo académico del blog de TEXTUM';
    let image = 'https://mentoriatextum.com/og-default.png';
    let publishedTime = new Date().toISOString();
    let author = 'TEXTUM';

    if (post) {
      title = `${lang === 'en' ? post.title_en : post.title_es} — TEXTUM Mentoría Académica`;
      description = (lang === 'en' ? post.excerpt_en : post.excerpt_es).slice(0, 155);
      image = post.cover_url || image;
      publishedTime = post.created_at;
      author = post.author || 'TEXTUM';
    }

    const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="article">
  <meta property="og:url" content="https://mentoriatextum.com/blog/${slug}">
  <meta property="article:published_time" content="${publishedTime}">
  <meta property="article:author" content="${escapeHtml(author)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${image}">
  <link rel="canonical" href="https://mentoriatextum.com/blog/${slug}">
</head>
<body>
  <p>Redireccionando...</p>
  <script>
    window.location.href = '/blog/${slug}';
  </script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error:', error.message);
    return new Response(null, { status: 404 });
  }
}
