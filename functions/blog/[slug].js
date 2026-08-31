// functions/blog/[slug].js
// SSR "para todos" de /blog/[slug].
//
// Antes se detectaba el User-Agent y solo se renderizaba para bots (cloaking).
// Ahora se sirve a TODOS el HTML del artículo ya renderizado, inyectado en el
// shell real de la SPA + un "data island" JSON para que React no vuelva a pedir
// el artículo a Supabase. Contenido siempre fresco, sin lista de bots que
// mantener y sin riesgo de cloaking.

import { fetchWithRetry } from '../_shared/security.js';
import { escapeHtml, sanitizeArticleHtml, stripHtml, truncate } from '../_shared/sanitize-html.js';
import { renderSsrPage } from '../_shared/ssr-shell.js';

const SITE_URL = 'https://www.mentoriatextum.com';
const SITE_NAME = 'TEXTUM — Mentoría Académica Internacional';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

function formatDate(isoString) {
  return isoString ? String(isoString).slice(0, 10) : '';
}

function localizedUrl(path, lang) {
  const url = new URL(path, SITE_URL);
  if (lang === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  return url.toString();
}

function detectLang(request, post) {
  const url = new URL(request.url);
  const langParam = url.searchParams.get('lang');
  if (langParam === 'en') return 'en';
  if (langParam === 'es') return 'es';

  const acceptLang = (request.headers.get('accept-language') || '').toLowerCase();
  if (acceptLang.includes('en') && !acceptLang.startsWith('es')) {
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
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
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

function buildHead(post, lang, slug) {
  const title = lang === 'en' ? (post.title_en || post.title_es) : post.title_es;
  const excerpt = lang === 'en' ? (post.excerpt_en || post.excerpt_es) : post.excerpt_es;
  const content = lang === 'en' ? (post.content_en || post.content_es) : post.content_es;
  const keywords = lang === 'en' ? (post.keywords_en || post.keywords_es || '') : (post.keywords_es || '');

  const canonicalUrl = localizedUrl(`/blog/${slug}`, lang);
  const esUrl = localizedUrl(`/blog/${slug}`, 'es');
  const enUrl = localizedUrl(`/blog/${slug}`, 'en');
  const ogImage = post.cover_url || DEFAULT_OG_IMAGE;
  const ogImageAlt = post.cover_alt || title;
  const author = post.author || SITE_NAME;
  const metaDescription = truncate(stripHtml(excerpt || content), 155);
  const readingTime = post.reading_time || 1;

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDescription,
    image: ogImage,
    datePublished: post.created_at,
    dateModified: post.updated_at || post.created_at,
    author: { '@type': 'Person', name: author },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-512.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
    timeRequired: `PT${readingTime}M`,
    inLanguage: lang === 'en' ? 'en-GB' : 'es-ES',
    url: canonicalUrl,
  });

  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Blog', item: localizedUrl('/blog', lang) },
      { '@type': 'ListItem', position: 2, name: title, item: canonicalUrl },
    ],
  });

  return `
  <title>${escapeHtml(title)} — ${SITE_NAME}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  <meta name="robots" content="index, follow" />
  <meta name="author" content="${escapeHtml(author)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
  <link rel="canonical" href="${canonicalUrl}" />
  <link rel="alternate" hreflang="es" href="${esUrl}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="x-default" href="${esUrl}" />
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
  <meta property="article:published_time" content="${escapeHtml(post.created_at)}" />
  <meta property="article:author" content="${escapeHtml(author)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  <meta name="twitter:image" content="${escapeHtml(ogImage)}" />
  <meta name="twitter:image:alt" content="${escapeHtml(ogImageAlt)}" />
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json">${breadcrumbSchema}</script>`;
}

const SSR_STYLE = '<style>.ssr-article{font-family:Georgia,"Times New Roman",serif;max-width:800px;margin:0 auto;padding:24px;color:#0d1f3c;line-height:1.7}.ssr-article nav{font-size:14px;margin-bottom:16px;color:#666}.ssr-article nav a{color:#c9a84c;text-decoration:none}.ssr-article h1{font-size:2rem;font-weight:400;line-height:1.2;margin:.5rem 0 1rem}.ssr-article .ssr-meta{font-size:.9rem;color:#666;margin-bottom:1.5rem}.ssr-article img{max-width:100%;height:auto;border-radius:4px;margin:1rem 0}.ssr-article h2{font-size:1.5rem;margin-top:2rem}.ssr-article h3{font-size:1.25rem;margin-top:1.5rem}.ssr-article p{margin-bottom:1.1rem}.ssr-article ul,.ssr-article ol{margin-bottom:1.1rem;padding-left:1.5rem}.ssr-article blockquote{border-left:3px solid #c9a84c;padding-left:1rem;color:#555;font-style:italic}.ssr-article a{color:#b08b1e}.ssr-article .ssr-cta{display:inline-block;margin-top:2rem;background:#c9a84c;color:#0d1f3c;padding:12px 24px;border-radius:4px;font-weight:bold;text-decoration:none}</style>';

function buildBody(post, lang, slug) {
  const title = lang === 'en' ? (post.title_en || post.title_es) : post.title_es;
  const content = lang === 'en' ? (post.content_en || post.content_es) : post.content_es;
  const author = post.author || SITE_NAME;
  const publishedDate = formatDate(post.created_at);
  const readingTime = post.reading_time || 1;
  const readLabel = lang === 'en' ? 'min read' : 'min de lectura';
  const ctaLabel = lang === 'en' ? 'Book a free academic diagnosis' : 'Solicitar diagnóstico académico gratuito';
  const backLabel = lang === 'en' ? 'Back to Blog' : 'Volver al Blog';

  const body = content
    ? `<div class="article-content">${sanitizeArticleHtml(content)}</div>`
    : `<p>${escapeHtml(stripHtml(content))}</p>`;

  return `${SSR_STYLE}
<article class="ssr-article" itemscope itemtype="https://schema.org/Article">
  <nav>
    <a href="${SITE_URL}">${SITE_NAME}</a> &rsaquo;
    <a href="${localizedUrl('/blog', lang)}">Blog</a> &rsaquo;
    <span>${escapeHtml(title)}</span>
  </nav>
  <h1 itemprop="headline">${escapeHtml(title)}</h1>
  <p class="ssr-meta">
    <span itemprop="author">${escapeHtml(author)}</span> &middot;
    <time itemprop="datePublished" datetime="${escapeHtml(post.created_at)}">${publishedDate}</time> &middot;
    ${readingTime} ${readLabel}
  </p>
  ${post.cover_url ? `<img src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.cover_alt || title)}" width="1200" height="630" itemprop="image" />` : ''}
  <div itemprop="articleBody">${body}</div>
  <a class="ssr-cta" href="${localizedUrl('/#contacto', lang)}">${ctaLabel}</a>
  <p style="margin-top:2rem"><a href="${localizedUrl('/blog', lang)}">${backLabel}</a></p>
</article>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;

  if (!slug) return notFoundResponse(request);

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  // Sin configuración de Supabase no podemos renderizar: deja pasar a la SPA.
  if (!supabaseUrl || !supabaseKey) {
    console.error('[SSR] Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  let post;
  try {
    post = await fetchPost(supabaseUrl, supabaseKey, slug);
  } catch (error) {
    console.error('[SSR] Error fetching post:', error);
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  if (!post) return notFoundResponse(request);

  const lang = detectLang(request, post);

  return renderSsrPage({
    request,
    env,
    context,
    lang,
    headHtml: buildHead(post, lang, slug),
    bodyHtml: buildBody(post, lang, slug),
    data: { type: 'post', post },
  });
}
