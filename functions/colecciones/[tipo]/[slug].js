// functions/colecciones/[tipo]/[slug].js
// Server-rendered collection article for search and social crawlers.
import { fetchWithRetry } from '../../_shared/security.js';

const SITE_URL = 'https://www.mentoriatextum.com';
const SITE_NAME = 'TEXTUM — Mentoría Académica Internacional';
const TYPES = new Set(['principio', 'categoria', 'herramienta']);
const BOT_PATTERNS = [
  'googlebot', 'google-inspectiontool', 'adsbot-google', 'bingbot', 'slurp',
  'duckduckbot', 'baiduspider', 'yandexbot', 'facebookexternalhit',
  'twitterbot', 'linkedinbot', 'whatsapp', 'telegrambot', 'applebot',
  'semrushbot', 'ahrefsbot', 'gptbot', 'claude-web', 'anthropic-ai',
  'perplexitybot', 'cohere-ai', 'ccbot',
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function stripHtml(value) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function sanitizeArticleHtml(value) {
  return String(value ?? '')
    .replace(/<\/?(?:script|style|iframe|object|embed|form|base|meta|link)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(['"])\s*(?:javascript|vbscript|data):[\s\S]*?\1/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(?:javascript|vbscript|data):[^\s>]+/gi, '')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
}

function isBot(userAgent) {
  const ua = String(userAgent || '').toLowerCase();
  return BOT_PATTERNS.some(pattern => ua.includes(pattern));
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

function buildHtml(post, type, slug, lang) {
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
  const typeLabel = type === 'principio'
    ? (lang === 'en' ? 'TEXTUM Principles' : 'Principios TEXTUM')
    : type === 'categoria'
      ? (lang === 'en' ? 'Methodological Categories' : 'Categorías Metodológicas')
      : (lang === 'en' ? 'TEXTUM Tools' : 'Herramientas TEXTUM');
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
      { '@type': 'ListItem', position: 2, name: typeLabel, item: localizedUrl(`/colecciones/${type}`, lang) },
      { '@type': 'ListItem', position: 3, name: title, item: canonical },
    ],
  });

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | ${escapeHtml(typeLabel)} — TEXTUM</title>
<meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="es" href="${esUrl}"><link rel="alternate" hreflang="en" href="${enUrl}"><link rel="alternate" hreflang="x-default" href="${esUrl}">
<meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:site_name" content="${SITE_NAME}"><meta property="og:locale" content="${lang === 'en' ? 'en_GB' : 'es_ES'}">
<meta property="article:published_time" content="${escapeHtml(post.created_at)}"><meta property="article:author" content="${escapeHtml(author)}">
<script type="application/ld+json">${articleSchema}</script><script type="application/ld+json">${breadcrumbSchema}</script>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
</head>
<body>
<nav><a href="${localizedUrl('/', lang)}">TEXTUM</a> / <a href="${localizedUrl('/colecciones', lang)}">${lang === 'en' ? 'Collections' : 'Colecciones'}</a> / <a href="${localizedUrl(`/colecciones/${type}`, lang)}">${escapeHtml(typeLabel)}</a></nav>
<main><article><header><h1>${escapeHtml(title)}</h1><p>${escapeHtml(author)}</p></header>${post.cover_url ? `<img src="${escapeHtml(post.cover_url)}" alt="${escapeHtml(post.cover_alt || title)}" width="1200" height="630">` : ''}<p>${escapeHtml(excerpt)}</p><div>${sanitizeArticleHtml(content)}</div></article></main>
<footer><a href="${localizedUrl('/', lang)}">${lang === 'en' ? 'Back to home' : 'Volver al inicio'}</a></footer>
</body></html>`;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const type = params.tipo;
  const slug = params.slug;
  if (!TYPES.has(type) || !slug) return notFound(request);

  if (!isBot(request.headers.get('user-agent'))) {
    if (typeof context.next === 'function') return context.next();
    return env.ASSETS.fetch(request);
  }

  try {
    const post = await fetchPost(env, slug, type);
    if (!post) return notFound(request);
    return new Response(buildHtml(post, type, slug, langFromRequest(request)), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=3600',
        'Vary': 'User-Agent, Accept-Language',
        'X-SSR-Mode': 'collection',
      },
    });
  } catch (error) {
    console.error('[SSR] Collection error:', error);
    return new Response('Collection temporarily unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '60',
      },
    });
  }
}
