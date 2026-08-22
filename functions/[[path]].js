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

  return [CHAR](60)+[CHAR](33)+'doctype html'+
[CHAR](60)+'html lang="'+lang+'"'+[CHAR](62)+
[CHAR](60)+'head'+
[CHAR](60)+'meta charset="UTF-8"'+[CHAR](62)+
[CHAR](60)+'meta name="viewport" content="width=device-width, initial-scale=1"'+[CHAR](62)+
[CHAR](60)+'meta name="robots" content="noindex, nofollow"'+[CHAR](62)+
[CHAR](60)+'title'+[CHAR](62)+'404 - TEXTUM'+[CHAR](60)+'/title'+[CHAR](62)+
[CHAR](60)+'style'+[CHAR](62)+':root{color-scheme:light;--navy:#0d1f3c;--gold:#c9a84c;--cream:#faf7f2}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--cream);color:var(--navy);font-family:Inter,Arial,sans-serif;text-align:center}main{max-width:560px}p{color:#5b6575;line-height:1.7;font-size:15px}h1{font:300 clamp(42px,8vw,72px)/1.1 Georgia,serif;margin:12px 0 16px}a{display:inline-block;margin:12px 6px;padding:13px 22px;background:var(--navy);color:var(--cream);text-decoration:none;font-size:12px;letter-spacing:.12em;text-transform:uppercase;border-radius:3px}a.secondary{background:transparent;color:var(--navy);border:1px solid #cfd3da}'+
[CHAR](60)+'/style'+[CHAR](62)+
[CHAR](60)+'/head'+[CHAR](62)+
[CHAR](60)+'body'+[CHAR](62)+
[CHAR](60)+'main'+[CHAR](62)+
[CHAR](60)+'div style="font-size:12px;letter-spacing:.35em;color:var(--gold);text-transform:uppercase"'+[CHAR](62)+'Error 404'+[CHAR](60)+'/div'+[CHAR](62)+
[CHAR](60)+'h1'+[CHAR](62)+title+[CHAR](60)+'/h1'+[CHAR](62)+
[CHAR](60)+'p'+[CHAR](62)+desc+[CHAR](60)+'/p'+[CHAR](62)+
[CHAR](60)+'a href="/"'+[CHAR](62)+home+[CHAR](60)+'/a'+[CHAR](62)+
[CHAR](60)+'a class="secondary" href="/blog"'+[CHAR](62)+blog+[CHAR](60)+'/a'+[CHAR](62)+
[CHAR](60)+'/main'+[CHAR](62)+
[CHAR](60)+'/body'+[CHAR](62)+
[CHAR](60)+'/html'+[CHAR](62);
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
