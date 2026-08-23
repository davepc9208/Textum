// functions/blog/[slug].js
import { fetchWithRetry } from '../_shared/security.js';
// Cloudflare Pages Function — SSR para Googlebot y bots de redes sociales
//
// PROBLEMA QUE RESUELVE:
// El blog es una SPA React que carga contenido desde Supabase en el cliente.
// Googlebot recibe HTML vacío y no puede indexar el contenido de los artículos.
// Esta función intercepta las peticiones a /blog/[slug] y devuelve HTML completo
// con el contenido del artículo cuando el visitante es un bot de búsqueda o social.
//
// RESULTADO ESPERADO:
// - Googlebot ve HTML completo con título, contenido, meta tags y Schema
// - Usuarios humanos siguen recibiendo la SPA React normal (sin cambios)
// - Los artículos aparecen correctamente indexados en Google en 1-4 semanas
//
// VARIABLES DE ENTORNO NECESARIAS en Cloudflare Pages → Settings → Variables:
//   SUPABASE_URL        → tu URL de Supabase (misma que VITE_SUPABASE_URL)
//   SUPABASE_ANON_KEY   → tu anon key de Supabase (misma que VITE_SUPABASE_ANON_KEY)

const SITE_URL = 'https://www.mentoriatextum.com';
const SITE_NAME = 'TEXTUM — Mentoría Académica Internacional';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

// Bots que deben recibir HTML renderizado
// Incluye Googlebot, bots de redes sociales y crawlers de IA
const BOT_PATTERNS = [
  'googlebot',
  'google-inspectiontool',
  'google-structured-data-testing-tool',
  'adsbot-google',
  'bingbot',
  'slurp',           // Yahoo
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'facebookcatalog',
  'twitterbot',
  'linkedinbot',
  'whatsapp',
  'telegrambot',
  'applebot',
  'semrushbot',
  'ahrefsbot',
  'mj12bot',
  'dotbot',
  'rogerbot',
  'gptbot',
  'claude-web',
  'anthropic-ai',
  'perplexitybot',
  'cohere-ai',
  'ccbot',
];

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeArticleHtml(html) {
  return String(html || '')
    .replace(/<\/?(?:script|style|iframe|object|embed|form|base|meta|link)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(['"])\s*(?:javascript|vbscript|data):[\\s\\S]*?\1/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(?:javascript|vbscript|data):[^\s>]+/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
}

function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

function formatDate(isoString) {
  if (!isoString) return '';
  return isoString.slice(0, 10);
}

function localizedUrl(path, lang) {
  const url = new URL(path, SITE_URL);
  if (lang === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  return url.toString();
}

function detectLang(request, post) {
  // Detectar idioma del post según Accept-Language o parámetro
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang');
  if (langParam === 'en') return 'en';
  if (langParam === 'es') return 'es';

  const acceptLang = request.headers.get('accept-language') || '';
  if (acceptLang.toLowerCase().includes('en') && !acceptLang.toLowerCase().startsWith('es')) {
    // Solo EN si no empieza por es
    return (post.title_en && post.content_en) ? 'en' : 'es';
  }
  return 'es';
}

function notFoundResponse(request) {
  const isEnglish = new URL(request.url).searchParams.get('lang') === 'en';
  const copy = isEnglish
    ? { lang: 'en', title: 'This page does not exist', description: 'The article may have been moved, unpublished, or no longer be available.', home: 'Back to home', blog: 'Explore the blog' }
    : { lang: 'es', title: 'Esta página no existe', description: 'El artículo puede haber cambiado, no estar publicado o ya no estar disponible.', home: 'Volver al inicio', blog: 'Explorar el blog' };
  const html = `<!doctype html><html lang="${copy.lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>404 — TEXTUM</title><style>:root{color-scheme:light;--navy:#0d1f3c;--gold:#c9a84c;--cream:#faf7f2}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--cream);color:var(--navy);font-family:Inter,Arial,sans-serif;text-align:center}main{max-width:560px}p{color:#5b6575;line-height:1.7;font-size:15px}h1{font:300 clamp(42px,8vw,72px)/1.1 Georgia,serif;margin:12px 0 16px}a{display:inline-block;margin:12px 6px;padding:13px 22px;background:var(--navy);color:var(--cream);text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px}a.secondary{background:transparent;color:var(--navy);border:1px solid #cfd3da}</style></head><body><main><div style="font-size:12px;letter-spacing:.35em;color:var(--gold);text-transform:uppercase">Error 404</div><h1>${copy.title}</h1><p>${copy.description}</p><a href="/">${copy.home}</a><a class="secondary" href="/blog">${copy.blog}</a></main></body></html>`;
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function fetchPost(supabaseUrl, supabaseKey, slug) {
  const url = `${supabaseUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&published=eq.true&collection_type=is.null&select=*&limit=1`;
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(url, { method: 'GET' });

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      const data = await cached.json();
      return data && data.length > 0 ? data[0] : null;
    }
  }

  const response = await fetchWithRetry(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
  }, { retries: 1, timeoutMs: 6000 });

  if (!response.ok) {
    throw new Error(`Supabase error: ${response.status}`);
  }

  const data = await response.json();
  if (cache) {
    await cache.put(cacheKey, new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    }));
  }
  return data && data.length > 0 ? data[0] : null;
}

function buildHtml(post, lang, slug) {
  const title = lang === 'en' ? (post.title_en || post.title_es) : post.title_es;
  const excerpt = lang === 'en' ? (post.excerpt_en || post.excerpt_es) : post.excerpt_es;
  const content = lang === 'en' ? (post.content_en || post.content_es) : post.content_es;
  const keywords = lang === 'en' ? (post.keywords_en || post.keywords_es || '') : (post.keywords_es || '');

  const canonicalUrl = localizedUrl(`/blog/${slug}`, lang);
  const esUrl = localizedUrl(`/blog/${slug}`, 'es');
  const enUrl = localizedUrl(`/blog/${slug}`, 'en');
  const ogImage = post.cover_url || DEFAULT_OG_IMAGE;
  const ogImageAlt = post.cover_alt || title;
  const publishedDate = formatDate(post.created_at);
  const readingTime = post.reading_time || 1;
  const author = post.author || SITE_NAME;

  const metaDescription = truncate(stripHtml(excerpt || content), 155);
  const plainContent = stripHtml(content);

  // Schema JSON-LD Article
  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDescription,
    image: ogImage,
    datePublished: post.created_at,
    dateModified: post.created_at,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/favicon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    timeRequired: `PT${readingTime}M`,
    inLanguage: lang === 'en' ? 'en-GB' : 'es-ES',
    url: canonicalUrl,
  });

  // Schema BreadcrumbList
  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Blog',
        item: localizedUrl('/blog', lang),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: title,
        item: canonicalUrl,
      },
    ],
  });

  // Construir el contenido del artículo como texto plano para que Google lo indexe
  // No usamos el HTML completo de Tiptap para evitar inyección; Google lo lee bien en texto
  const articleBodyHtml = content
    ? `<div class="article-content">${sanitizeArticleHtml(content)}</div>`
    : `<p>${escapeHtml(plainContent)}</p>`;

  return `<!DOCTYPE html>
<html lang="${lang === 'en' ? 'en' : 'es'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${escapeHtml(title)} — ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="${escapeHtml(author)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}

  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:image" content="${escapeHtml(ogImage)}" />
  <meta property="og:image:alt" content="${escapeHtml(ogImageAlt)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'es_ES'}" />
  <meta property="article:published_time" content="${post.created_at}" />
  <meta property="article:author" content="${escapeHtml(author)}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}" />

  <!-- Hreflang -->
  <link rel="alternate" hreflang="es" href="${esUrl}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="x-default" href="${esUrl}" />

  <!-- JSON-LD Schemas -->
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json">${breadcrumbSchema}</script>

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />

  <!-- Estilos mínimos para que el HTML no sea completamente sin estilo -->
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      color: #0d1f3c;
      line-height: 1.7;
      background: #faf7f2;
    }
    header { margin-bottom: 32px; border-bottom: 1px solid #c9a84c; padding-bottom: 16px; }
    nav { font-size: 14px; margin-bottom: 16px; color: #666; }
    nav a { color: #c9a84c; text-decoration: none; }
    h1 { font-size: 2rem; font-weight: 400; line-height: 1.2; margin-bottom: 16px; }
    .meta { font-size: 14px; color: #666; margin-bottom: 24px; }
    .cover-image { width: 100%; max-height: 400px; object-fit: cover; margin-bottom: 32px; border-radius: 4px; }
    .article-content { font-size: 1.05rem; }
    .article-content h2 { font-size: 1.5rem; margin-top: 2rem; }
    .article-content h3 { font-size: 1.25rem; margin-top: 1.5rem; }
    .article-content p { margin-bottom: 1.2rem; }
    .article-content ul, .article-content ol { margin-bottom: 1.2rem; padding-left: 1.5rem; }
    .article-content blockquote { border-left: 3px solid #c9a84c; padding-left: 1rem; color: #555; font-style: italic; }
    footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #ddd; font-size: 14px; color: #888; }
    .cta { background: #c9a84c; color: #0d1f3c; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block; margin-top: 24px; }
    /* Ocultar este HTML básico a usuarios humanos — ellos ven la SPA React */
    /* Este HTML es solo para bots de búsqueda */
  </style>
</head>
<body>
  <!-- Este HTML es generado para bots de búsqueda. Los usuarios humanos ven la versión React. -->

  <nav>
    <a href="${SITE_URL}">${SITE_NAME}</a> &rsaquo;
    <a href="${SITE_URL}/blog">Blog</a> &rsaquo;
    <span>${escapeHtml(title)}</span>
  </nav>

  <article itemscope itemtype="https://schema.org/Article">

    <header>
      <h1 itemprop="headline">${escapeHtml(title)}</h1>
      <div class="meta">
        <span itemprop="author" itemscope itemtype="https://schema.org/Person">
          <span itemprop="name">${escapeHtml(author)}</span>
        </span>
        &nbsp;&middot;&nbsp;
        <time itemprop="datePublished" datetime="${post.created_at}">${publishedDate}</time>
        &nbsp;&middot;&nbsp;
        ${readingTime} ${lang === 'en' ? 'min read' : 'min de lectura'}
      </div>
    </header>

    ${post.cover_url ? `<img
      src="${escapeHtml(post.cover_url)}"
      alt="${escapeHtml(post.cover_alt || title)}"
      class="cover-image"
      itemprop="image"
      width="1200"
      height="630"
    />` : ''}

    <div itemprop="articleBody">
      ${articleBodyHtml}
    </div>      <a href="${localizedUrl('/#contacto', lang)}" class="cta">
      ${lang === 'en'
        ? 'Book a free academic diagnosis'
        : 'Solicitar diagnóstico académico gratuito'}
    </a>

  </article>

  <footer>
    <p>&copy; ${new Date().getFullYear()} ${SITE_NAME}</p>
    <p>
      <a href="${localizedUrl('/blog', lang)}">${lang === 'en' ? 'Back to Blog' : 'Volver al Blog'}</a>
      &nbsp;&middot;&nbsp;
      <a href="${localizedUrl('/#contacto', lang)}">${lang === 'en' ? 'Contact' : 'Contacto'}</a>
    </p>
  </footer>

</body>
</html>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;

  if (!slug) {
    return new Response('Not found', { status: 404 });
  }

  const userAgent = request.headers.get('user-agent') || '';

  // Humanos: comprobar primero que el artículo existe para poder devolver
  // 404 real en slugs inexistentes; los artículos válidos siguen siendo SPA.
  if (!isBot(userAgent)) {
    const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const post = await fetchPost(supabaseUrl, supabaseKey, slug);
        if (!post) {
          return notFoundResponse(request);
        }
      } catch (error) {
        console.error('[SSR] Error validating human route:', error);
      }
    }
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  // Es un bot → generar HTML completo con el contenido del artículo

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('[SSR] Faltan variables de entorno: SUPABASE_URL y SUPABASE_ANON_KEY');
    // Fallback a la SPA si faltan variables
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  try {
    const post = await fetchPost(supabaseUrl, supabaseKey, slug);

    if (!post) {
      // Artículo no encontrado o no publicado
      return notFoundResponse(request);
    }

    const lang = detectLang(request, post);
    const html = buildHtml(post, lang, slug);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Cache 1 hora en Cloudflare, 5 min en el navegador del bot
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        // Indicar que la respuesta varía según User-Agent
        'Vary': 'User-Agent',
        'X-SSR-Mode': 'bot-detected',
        'X-Bot-UA': userAgent.slice(0, 100),
      },
    });

  } catch (error) {
    console.error('[SSR] Error fetching post:', error);
    // En caso de error, fallback a la SPA
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }
}
