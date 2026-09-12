// functions/[[path]].js
// Cloudflare Pages catch-all — SPA shell for known routes, static 404 for the rest.
// NO imports from _shared/security.js or any other module.
//
// IMPORTANTE: las reglas de public/_redirects NO se aplican a peticiones que
// resuelve una Pages Function (docs de Cloudflare), y este catch-all matchea
// todas las URLs. Por eso los redirects legacy /es /en /contacto viven aquí.

// Legacy prefixed URLs (indexadas antes de migrar a ?lang=en) → canonical 301.
const LEGACY_REDIRECTS = {
  '/es': '/',
  '/es/': '/',
  '/en': '/?lang=en',
  '/en/': '/?lang=en',
  '/contacto': '/#contacto',
  '/es/contacto': '/#contacto',
  '/en/contacto': '/?lang=en#contacto',
};

// Conserva el query string (p. ej. ?utm_...) al redirigir legacy paths.
function redirect301(target, search) {
  const url = new URL(target, 'https://www.mentoriatextum.com');
  const targetParams = new URLSearchParams(url.search);
  for (const [key, value] of new URLSearchParams(search)) {
    if (!targetParams.has(key)) targetParams.append(key, value);
  }
  url.search = targetParams.toString();
  return new Response(null, {
    status: 301,
    headers: { Location: `${url.pathname}${url.search}${url.hash}` },
  });
}

function legacyRedirect(pathname, search) {
  const target = LEGACY_REDIRECTS[pathname];
  return target ? redirect301(target, search) : null;
}

// Google indexó rutas /es/... y /en/... de artículos legacy: redirige 301
// preservando el slug. /en/* añade ?lang=en (idioma que servía esa ruta).
// Se normaliza la barra final (/es/blog/foo/ → /blog/foo) porque las rutas de
// la app no aceptan barra final y caerían en el 404.
function legacyPrefixedPath(pathname, search) {
  const match = /^\/(es|en)\/(.+)$/.exec(pathname);
  if (!match) return null;
  const rest = match[2].replace(/\/+$/, '');
  return redirect301(match[1] === 'en' ? `/${rest}?lang=en` : `/${rest}`, search);
}

// Reescribe canonical/hreflang/og:url declarados en index.html (todos apuntan
// a la home) para que canonicalicen a la ruta servida. Con ?lang=en la
// canonical es la variante EN — igual que hace useSEO en el cliente — para que
// el HTML servido y el DOM renderizado no discrepen.
function rewriteCanonicals(html, pathname, lang) {
  const es = `https://www.mentoriatextum.com${pathname}`;
  const en = `${es}?lang=en`;
  const self = lang === 'en' ? en : es;
  let out = html
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${self}" />`)
    .replace(/<link rel="alternate" hreflang="es" href="[^"]*" \/>/, `<link rel="alternate" hreflang="es" href="${es}" />`)
    .replace(/<link rel="alternate" hreflang="en" href="[^"]*" \/>/, `<link rel="alternate" hreflang="en" href="${en}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href="[^"]*" \/>/, `<link rel="alternate" hreflang="x-default" href="${es}" />`)
    .replace(/<meta property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${self}" />`);
  if (lang === 'en') {
    out = out.replace(/<html lang="es">/i, '<html lang="en">');
  }
  return out;
}

const APP_ROUTES = [
  /^\/$/,
  /^\/blog(?:\/[^/]+)?$/,
  /^\/colecciones$/,
  /^\/colecciones\/(?:principio|categoria|herramienta|eii)(?:\/[^/]+(?:\/descargar)?)?$/,
  /^\/textum-redaccion-2026$/,
  /^\/baja$/,
  /^\/privacidad$/,
  /^\/casos$/,
];

function isAppRoute(pathname) {
  return APP_ROUTES.some((pattern) => pattern.test(pathname));
}

function isNoIndexAppRoute(pathname) {
  return pathname === '/baja'
    || pathname === '/textum-redaccion-2026'
    || /^\/colecciones\/(?:principio|categoria|herramienta|eii)\/[^/]+\/descargar$/.test(pathname);
}

function notFoundHtml(lang) {
  const isEn = lang === 'en';
  const title = isEn ? 'This page does not exist' : 'Esta pagina no existe';
  const desc = isEn
    ? 'The link may be incomplete, changed, or no longer available.'
    : 'El enlace puede estar incompleto, haber cambiado o ya no estar disponible.';
  const home = isEn ? 'Back to home' : 'Volver al inicio';
  const blog = isEn ? 'Explore the blog' : 'Explorar el blog';

  return `<!doctype html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>404 - TEXTUM</title><style>:root{color-scheme:light;--navy:#0d1f3c;--gold:#c9a84c;--cream:#faf7f2}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--cream);color:var(--navy);font-family:Inter,Arial,sans-serif;text-align:center}main{max-width:560px}p{color:#5b6575;line-height:1.7;font-size:15px}h1{font:300 clamp(42px,8vw,72px)/1.1 Georgia,serif;margin:12px 0 16px}a{display:inline-block;margin:12px 6px;padding:13px 22px;background:var(--navy);color:var(--cream);text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px}a.secondary{background:transparent;color:var(--navy);border:1px solid #cfd3da}</style></head><body><main><div style="font-size:12px;letter-spacing:.35em;color:var(--gold);text-transform:uppercase">Error 404</div><h1>${title}</h1><p>${desc}</p><a href="/">${home}</a><a class="secondary" href="/blog">${blog}</a></main></body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return typeof context.next === 'function'
      ? context.next()
      : new Response('Method not allowed', { status: 405 });
  }

  const legacy = legacyRedirect(url.pathname, url.search) || legacyPrefixedPath(url.pathname, url.search);
  if (legacy) return legacy;

  if (isAppRoute(url.pathname)) {
    const response = typeof context.next === 'function'
      ? await context.next()
      : await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    const headers = new Headers(response.headers);
    if (isNoIndexAppRoute(url.pathname)) {
      headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    // Canonical por ruta: el shell declara la canonical de la home; reescribe
    // canonical/hreflang/og:url para que la ruta servida se canonicalice a sí
    // misma (evita "duplicada, Google eligió otra canónica" en /blog, /colecciones...).
    if (!isNoIndexAppRoute(url.pathname)) {
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es';
      const html = await response.text();
      const rewritten = rewriteCanonicals(html, url.pathname, lang);
      return new Response(rewritten, {
        status: 200,
        headers,
      });
    }
    return new Response(response.body, {
      status: 200,
      headers,
    });
  }

  // Pass static assets (JS, CSS, images, fonts, favicons, sitemaps...) through
  // unchanged. The catch-all runs for every request, so without this guard a
  // browser request for e.g. /assets/index-abc123.js would be answered with an
  // HTML 404 instead of the real file, the module script would never execute
  // and the page would render blank after deploy.
  const lastSegment = url.pathname.split('/').pop() || '';
  const hasFileExtension = /\.[a-zA-Z0-9]{1,8}$/.test(lastSegment);
  if (hasFileExtension) {
    return typeof context.next === 'function'
      ? await context.next()
      : await env.ASSETS.fetch(request);
  }

  const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'es';
  return new Response(notFoundHtml(lang), {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
