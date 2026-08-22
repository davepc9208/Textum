// functions/[[path]].js
// Cloudflare Pages catch-all — SPA shell for known routes, static 404 for the rest.
// NO imports from _shared/security.js or any other module.
// Redirects for /es, /en, /es/blog/*, /en/blog/* are handled by public/_redirects.

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

  if (isAppRoute(url.pathname)) {
    const response = typeof context.next === 'function'
      ? await context.next()
      : await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    return new Response(response.body, {
      status: 200,
      headers: response.headers,
    });
  }

  // Pass static assets (JS, CSS, images, fonts, favicons, sitemaps...) through
  // unchanged. The catch-all runs for every request, so without this guard a
  // browser request for e.g. /assets/index-abc123.js would be answered with an
  // HTML 404 instead of the real file, the module script would never execute
  // and the page would render blank after deploy.
  const lastSegment = url.pathname.split('/').pop() || '';
  const hasFileExtension = lastSegment.includes('.') && !lastSegment.endsWith('.');
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
