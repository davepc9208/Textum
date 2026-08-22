import { fetchWithRetry } from './_shared/security.js';

const APP_ROUTES = [
  /^\/$/,
  /^\/blog(?:\/[^/]+)?$/,
  /^\/colecciones$/,
  /^\/colecciones\/(?:principio|categoria|herramienta)(?:\/[^/]+(?:\/descargar)?)?$/,
  /^\/textum-redaccion-2026$/,
  /^\/baja$/,
  /^\/privacidad$/,
  /^\/casos$/,
];

function isAppRoute(pathname) {
  return APP_ROUTES.some((pattern) => pattern.test(pathname));
}

function legacyRedirect(pathname, request) {
  const match = pathname.match(/^\/(es|en)(\/.*)?$/);
  if (!match) return null;

  const target = new URL(match[2] || '/', request.url);
  if (match[1] === 'en') target.searchParams.set('lang', 'en');
  else target.searchParams.delete('lang');
  return Response.redirect(target.toString(), 301);
}

async function fetchAsset(env, request, pathname) {
  const url = new URL(pathname, request.url);
  const assetRequest = new Request(url, request);
  return env.ASSETS.fetch(assetRequest);
}

async function findPublishedCollection(env, type, slug) {
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const query = new URL(`${supabaseUrl}/rest/v1/posts`);
  query.searchParams.set('slug', `eq.${slug}`);
  query.searchParams.set('collection_type', `eq.${type}`);
  query.searchParams.set('published', 'eq.true');
  query.searchParams.set('select', 'id');
  query.searchParams.set('limit', '1');

  try {
    const response = await fetchWithRetry(query, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    }, { retries: 1, timeoutMs: 5000 });
    if (!response.ok) return null;
    const posts = await response.json();
    return Array.isArray(posts) && posts.length > 0;
  } catch {
    return null;
  }
}

function notFoundResponse(request) {
  const isEnglish = new URL(request.url).searchParams.get('lang') === 'en';
  const copy = isEnglish
    ? { lang: 'en', label: 'Error 404', title: 'This page does not exist', description: 'The link may be incomplete, changed, or no longer available.', home: 'Back to home', blog: 'Explore the blog' }
    : { lang: 'es', label: 'Error 404', title: 'Esta página no existe', description: 'El enlace puede estar incompleto, haber cambiado o ya no estar disponible.', home: 'Volver al inicio', blog: 'Explorar el blog' };
  const html = `<!doctype html>
<html lang="${copy.lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>404 — TEXTUM</title>
  <style>
    :root{color-scheme:light;--navy:#0d1f3c;--gold:#c9a84c;--cream:#faf7f2}
    *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--cream);color:var(--navy);font-family:Inter,Arial,sans-serif;text-align:center}
    main{max-width:560px}p{color:#5b6575;line-height:1.7;font-size:15px}h1{font:300 clamp(42px,8vw,72px)/1.1 Georgia,serif;margin:12px 0 16px}a{display:inline-block;margin:12px 6px;padding:13px 22px;background:var(--navy);color:var(--cream);text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px}a.secondary{background:transparent;color:var(--navy);border:1px solid #cfd3da}
  </style>
</head>
<body><main><div style="font-size:12px;letter-spacing:.35em;color:var(--gold);text-transform:uppercase">${copy.label}</div><h1>${copy.title}</h1><p>${copy.description}</p><a href="/">${copy.home}</a><a class="secondary" href="/blog">${copy.blog}</a></main></body>
</html>`;
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const redirect = legacyRedirect(url.pathname, request);
  if (redirect) return redirect;

  if ((request.method === 'GET' || request.method === 'HEAD') && isAppRoute(url.pathname)) {
    const collectionMatch = url.pathname.match(/^\/colecciones\/(principio|categoria|herramienta)\/([^/]+)(?:\/descargar)?$/);
    if (collectionMatch && (await findPublishedCollection(env, collectionMatch[1], collectionMatch[2])) === false) {
      return notFoundResponse(request);
    }

    const response = await fetchAsset(env, request, '/index.html');
    return new Response(response.body, {
      status: 200,
      headers: response.headers,
    });
  }

  const response = typeof context.next === 'function'
    ? await context.next()
    : await fetchAsset(env, request, url.pathname);

  if (response.status !== 404) return response;
  return notFoundResponse(request);
}
