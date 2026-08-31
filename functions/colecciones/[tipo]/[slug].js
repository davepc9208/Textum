// functions/colecciones/[tipo]/[slug].js
// SSR "para todos" de /colecciones/[tipo]/[slug]. Mismo enfoque que blog/[slug].js:
// se sirve a todos el artículo renderizado dentro del shell de la SPA + data island.
import { fetchWithRetry } from '../../_shared/security.js';
import { escapeHtml, sanitizeArticleHtml, stripHtml } from '../../_shared/sanitize-html.js';
import { renderSsrPage } from '../../_shared/ssr-shell.js';

const SITE_URL = 'https://www.mentoriatextum.com';
const SITE_NAME = 'TEXTUM — Mentoría Académica Internacional';
const TYPES = new Set(['principio', 'categoria', 'herramienta']);

function typeLabel(type, lang) {
  if (type === 'principio') return lang === 'en' ? 'TEXTUM Principles' : 'Principios TEXTUM';
  if (type === 'categoria') return lang === 'en' ? 'Methodological Categories' : 'Categorías Metodológicas';
  return lang === 'en' ? 'TEXTUM Tools' : 'Herramientas TEXTUM';
}

function langFromRequest(request) {
  const url = new URL(request.url);
  const explicit = url.searchParams.get('lang');
  if (explicit === 'en' || explicit === 'es') return explicit;
  const acceptLanguage = request.headers.get('accept-language') || '';
  return /^en(?:-|,|;)/i.test(acceptLanguage) ? 'en' : 'es';
}

function localizedUrl(path, lang) {
  const url = new URL(path, SITE_URL);
  if (lang === 'en') url.searchParams.set('lang', 'en');
  else url.searchParams.delete('lang');
  return url.toString();
}

function notFound(request) {
  const lang = langFromRequest(request);
  const english = lang === 'en';
  const title = english ? 'This page does not exist' : 'Esta página no existe';
  const description = english
    ? 'The collection document may have been moved, unpublished, or is no longer available.'
    : 'El documento de la colección puede haber cambiado, no estar publicado o ya no estar disponible.';
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>404 — TEXTUM</title></head><body><main><p>404</p><h1>${title}</h1><p>${description}</p><a href="${localizedUrl('/', lang)}">${english ? 'Back to home' : 'Volver al inicio'}</a></main></body></html>`;
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

async function fetchPost(env, slug, type) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) throw new Error('Supabase environment is missing');

  const endpoint = `${supabaseUrl}/rest/v1/posts?slug=eq.${encodeURIComponent(slug)}&collection_type=eq.${encodeURIComponent(type)}&published=eq.true&select=*&limit=1`;
  const response = await fetchWithRetry(endpoint, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
  }, { retries: 1, timeoutMs: 6000 });

  if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
  const posts = await response.json();
  return posts?.[0] ?? null;
}

function buildHead(post, type, slug, lang) {
  const title = lang === 'en' ? (post.title_en || post.title_es) : post.title_es;
  const excerpt = lang === 'en' ? (post.excerpt_en || post.excerpt_es) : post.excerpt_es;
  const content = lang === 'en' ? (post.content_en || post.content_es) : post.content_es;
  const path = `/colecciones/${type}/${slug}`;
  const canonical = localizedUrl(path, lang);
  const esUrl = localizedUrl(path, 'es');
  const enUrl = localizedUrl(path, 'en');
  const description = (stripHtml(excerpt || content) || title).slice(0, 155);
  const image = post.cover_url || `${SITE_URL}/og-default.png`;
  const author = post.author || SITE_NAME;
  const label = typeLabel(type, lang);

  const articleSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished: post.created_at,
    author: { '@type': 'Person', name: author },
    publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-512.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    inLanguage: lang === 'en' ? 'en-GB' : 'es-ES',
    url: canonical,
  });
  const breadcrumbSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: lang === 'en' ? 'Collections' : 'Colecciones', item: localizedUrl('/colecciones', lang) },
      { '@type': 'ListItem', position: 2, name: label, item: localizedUrl(`/colecciones/${type}`, lang) },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  });

  return `
  <title>${escapeHtml(title)} | ${escapeHtml(label)} — TEXTUM</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="${canonical}" />
  <link rel="alternate" hreflang="es" href="${esUrl}" />
  <link rel="alternate" hreflang="en" href="${enUrl}" />
  <link rel="alternate" hreflang="x-default" href="${esUrl}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta property="og:site_name" content="${SITE_NAME}" />
  <meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'es_ES'}" />
  <meta property="article:published_time" content="${escapeHtml(post.created_at)}" />
  <meta property="article:author" content="${escapeHtml(author)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  <script type="application/ld+json">${articleSchema}</script>
  <script type="application/ld+json">${breadcrumbSchema}</script>`;
}

const SSR_STYLE = '<style>.ssr-article{font-family:Georgia,"Times New Roman",serif;max-width:800px;margin:0 auto;padding:24px;color:#0d1f3c;line-height:1.7}.ssr-article nav{font-size:14px;margin-bottom:16px;color:#666}.ssr-article nav a{color:#c9a84c;text-decoration:none}.ssr-article h1{font-size:2rem;font-weight:400;line-height:1.2;margin:.5rem 0 1rem}.ssr-article .ssr-meta{font-size:.9rem;color:#666;margin-bottom:1.5rem}.ssr-article img{max-width:100%;height:auto;border-radius:4px;margin:1rem 0}.ssr-article h2{font-size:1.5rem;margin-top:2rem}.ssr-article h3{font-size:1.25rem;margin-top:1.5rem}.ssr-article p{margin-bottom:1.1rem}.ssr-article ul,.ssr-article ol{margin-bottom:1.1rem;padding-left:1.5rem}.ssr-article blockquote{border-left:3px solid #c9a84c;padding-left:1rem;color:#555;font-style:italic}.ssr-article a{color:#b08b1e}</style>';

function buildBody(post, type, slug, lang) {
  const title = lang === 'en' ? (post.title_en || post.title_es) : post.title_es;
  const excerpt = lang === 'en' ? (post.excerpt_en || post.excerpt_es) : post.excerpt_es;
  const content = lang === 'en' ? (post.content_en || post.content_es) : post.content_es;
  const author = post.author || SITE_NAME;
  const label = typeLabel(type, lang);
  const backLabel = lang === 'en' ? 'Back to home' : 'Volver al inicio';

  return `${SSR_STYLE}
<article class="ssr-article">
  <nav>
    <a href="${localizedUrl('/', lang)}">TEXTUM</a> /
    <a href="${localizedUrl('/colecciones', lang)}">${lang === 'en' ? 'Collections' : 'Colecciones'}</a> /
    <a href="${localizedUrl(`/colecciones/${type}`, lang)}">${escapeHtml(label)}</a>
  </nav>
  <h1>${escapeHtml(title)}</h1>
  <p class="ssr-meta">${escapeHtml(author)}</p>
  ${post.cover_url ? `<img src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.cover_alt || title)}" width="1200" height="630" />` : ''}
  ${excerpt ? `<p><em>${escapeHtml(excerpt)}</em></p>` : ''}
  <div>${sanitizeArticleHtml(content)}</div>
  <p style="margin-top:2rem"><a href="${localizedUrl('/', lang)}">${backLabel}</a></p>
</article>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const type = params.tipo;
  const slug = params.slug;
  if (!TYPES.has(type) || !slug) return notFound(request);

  let post;
  try {
    post = await fetchPost(env, slug, type);
  } catch (error) {
    console.error('[SSR] Collection error:', error);
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  if (!post) return notFound(request);

  const lang = langFromRequest(request);

  return renderSsrPage({
    request,
    env,
    context,
    lang,
    headHtml: buildHead(post, type, slug, lang),
    bodyHtml: buildBody(post, type, slug, lang),
    data: { type: 'coleccion', tipo: type, post },
  });
}
