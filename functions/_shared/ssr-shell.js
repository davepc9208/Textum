// functions/_shared/ssr-shell.js
// Render SSR "para todos": inserta el <head> y el cuerpo del artículo ya
// renderizado dentro del shell real de la SPA (index.html) y añade un
// "data island" JSON para que React no vuelva a pedir el artículo a Supabase.
//
// Si no se puede obtener el shell (tests, o fallo de ASSETS) cae a una página
// HTML autónoma con todo el SEO, para no dejar nunca a un bot sin contenido.

const HEAD_START = '<!-- SSR:HEAD:START -->';
const HEAD_END = '<!-- SSR:HEAD:END -->';

async function loadShell(request, env, context) {
  try {
    let res = null;
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      res = await env.ASSETS.fetch(new URL('/index.html', request.url).toString());
    } else if (context && typeof context.next === 'function') {
      res = await context.next();
    }
    if (!res || !res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType && !contentType.includes('text/html')) return null;
    const html = await res.text();
    if (!html.includes('id="root"') || !html.includes(HEAD_START)) return null;
    return html;
  } catch {
    return null;
  }
}

function standalonePage({ lang, headHtml, bodyHtml }) {
  return `<!doctype html><html lang="${lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">${headHtml}<style>body{font-family:Georgia,'Times New Roman',serif;max-width:820px;margin:0 auto;padding:24px;color:#0d1f3c;line-height:1.7;background:#faf7f2}h1{font-weight:400;line-height:1.2}img{max-width:100%;height:auto}a{color:#b08b1e}blockquote{border-left:3px solid #c9a84c;padding-left:1rem;color:#555;font-style:italic}</style></head><body>${bodyHtml}</body></html>`;
}

function dataIsland(data) {
  if (!data) return '';
  // < evita que un </script> dentro del JSON cierre la etiqueta.
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<script id="__SSR_DATA__" type="application/json">${json}</script>`;
}

export async function renderSsrPage({
  request,
  env,
  context,
  lang,
  headHtml,
  bodyHtml,
  data,
  status = 200,
  cacheControl = 'public, max-age=0, s-maxage=120, stale-while-revalidate=600',
}) {
  const shell = await loadShell(request, env, context);
  let html;

  if (shell) {
    html = shell
      .replace(new RegExp(`${HEAD_START}[\\s\\S]*?${HEAD_END}`), () => `${HEAD_START}${headHtml}${HEAD_END}`)
      .replace(/<html\s+lang="[^"]*"/i, `<html lang="${lang}"`)
      .replace(/<h1\s+id="ssr-home-h1"[\s\S]*?<\/h1>/i, '');

    const injected = `<div id="ssr-content">${bodyHtml}</div>${dataIsland(data)}`;
    if (html.includes('<div id="ssr-content" hidden></div>')) {
      html = html.replace('<div id="ssr-content" hidden></div>', injected);
    } else {
      html = html.replace('</body>', `${injected}</body>`);
    }
  } else {
    html = standalonePage({ lang, headHtml, bodyHtml });
  }

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-SSR': shell ? 'shell' : 'standalone',
    },
  });
}
