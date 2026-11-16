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

// Título y descripción por ruta e idioma. El shell de index.html trae los de la
// portada en español, así que sin esto Google recibe el mismo <title> en todas
// las rutas y en los dos idiomas, y descarta la versión inglesa por duplicada.
// La copy es la misma que declara useSEO en cada página, para que el HTML
// servido y el DOM ya renderizado no discrepen.
const ROUTE_META = {
  '/': {
    es: {
      title: 'TEXTUM — Mentoría Académica Internacional | Titulación, Publicación y Defensa',
      description: 'Programas de mentoría académica para titulación, publicación científica y defensa oral. Rigor metodológico, uso ético de IA, estándares internacionales. Diagnóstico gratuito.',
    },
    en: {
      title: 'TEXTUM — International Academic Mentoring | Degree Projects, Publication & Defence',
      description: 'Academic mentoring programmes for degree projects, scientific publication and oral defence. Methodological rigour, ethical AI use, international standards. Free diagnosis.',
    },
  },
  '/blog': {
    es: {
      title: 'Blog Académico | Artículos sobre Investigación y Redacción Científica — TEXTUM',
      description: 'Lee artículos y guías escritas por nuestras doctoras sobre redacción académica, metodología de investigación, APA 7 y cómo defender tu tesis con éxito.',
    },
    en: {
      title: 'Academic Blog | Research and Scientific Writing Articles — TEXTUM',
      description: 'Read articles and guides written by our doctors on academic writing, research methodology, APA 7 and how to successfully defend your thesis.',
    },
  },
  '/colecciones': {
    es: {
      title: 'Colección TEXTUM | Pensar metodológicamente la investigación científica',
      description: 'Principios, categorías metodológicas y herramientas para fortalecer el pensamiento metodológico de investigadores y estudiantes de posgrado. TEXTUM Mentoría Académica.',
    },
    en: {
      title: 'TEXTUM Collection | Thinking methodologically about scientific research',
      description: 'Principles, methodological categories and tools to strengthen methodological thinking for researchers and postgraduate students. TEXTUM Academic Mentoring.',
    },
  },
  '/casos': {
    es: {
      title: 'Rigor que puedes comprobar — TEXTUM',
      description: 'Conoce al equipo, revisa nuestras identificaciones ORCID y consulta publicaciones vinculadas a procesos de mentoría.',
    },
    en: {
      title: 'Rigour you can verify — TEXTUM',
      description: 'Meet the team, review our ORCID identifiers and consult publications connected to mentoring processes.',
    },
  },
  '/privacidad': {
    es: {
      title: 'Política de privacidad — TEXTUM',
      description: 'Información sobre el tratamiento de datos personales, cookies y derechos de los usuarios de mentoriatextum.com.',
    },
    en: {
      title: 'Privacy Policy — TEXTUM',
      description: 'Information on personal data processing, cookies and user rights on mentoriatextum.com.',
    },
  },
  '/piloto-doctorado': {
    es: {
      title: 'Piloto metodológico para programas de doctorado — TEXTUM',
      description: 'Un piloto TEXTUM para detectar incoherencias metodológicas en proyectos doctorales antes de que lleguen a la defensa.',
    },
  },
};

// Los listados /colecciones/<tipo> arman su título con la etiqueta del tipo.
const COLLECTION_META = {
  principio:   { es: 'Principios TEXTUM',              en: 'TEXTUM Principles' },
  categoria:   { es: 'Categorías Metodológicas',       en: 'Methodological Categories' },
  herramienta: { es: 'Herramientas TEXTUM',            en: 'TEXTUM Tools' },
  eii:         { es: 'Enfoque Investigativo Integral', en: 'Integral Research Approach' },
  flux:        { es: 'TEXTUM Flux®',                   en: 'TEXTUM Flux®' },
};

function routeMeta(pathname, lang) {
  const key = lang === 'en' ? 'en' : 'es';

  const collection = /^\/colecciones\/([^/]+)$/.exec(pathname);
  if (collection && COLLECTION_META[collection[1]]) {
    const label = COLLECTION_META[collection[1]][key];
    return key === 'en'
      ? { title: label + ' | TEXTUM Collections', description: label + ' — deep editorial content from TEXTUM Academic Mentoring.' }
      : { title: label + ' | Colecciones TEXTUM', description: label + ' — contenido editorial profundo de TEXTUM Mentoría Académica.' };
  }

  // Las piezas (/blog/<slug>, /colecciones/<tipo>/<slug>) traen su propio SSR;
  // aquí solo caen los listados y el resto de rutas de la app.
  const entry = ROUTE_META[collection ? '/colecciones' : pathname] || ROUTE_META['/'];
  return entry[key] || entry.es;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Sustituye título, descripción y sus copias sociales por los de la ruta.
function rewriteMeta(html, meta) {
  const title = escapeAttr(meta.title);
  const description = escapeAttr(meta.description);
  return html
    .replace(/<title>[^<]*<\/title>/i, '<title>' + title + '</title>')
    .replace(/<meta name="description"\s+content="[^"]*"\s*\/?>/i, '<meta name="description" content="' + description + '" />')
    .replace(/<meta property="og:title"\s+content="[^"]*"\s*\/?>/i, '<meta property="og:title" content="' + title + '" />')
    .replace(/<meta property="og:description"\s+content="[^"]*"\s*\/?>/i, '<meta property="og:description" content="' + description + '" />')
    .replace(/<meta property="og:locale"\s+content="[^"]*"\s*\/?>/i, '<meta property="og:locale" content="' + meta.locale + '" />')
    .replace(/<meta name="twitter:title"\s+content="[^"]*"\s*\/?>/i, '<meta name="twitter:title" content="' + title + '" />')
    .replace(/<meta name="twitter:description"\s+content="[^"]*"\s*\/?>/i, '<meta name="twitter:description" content="' + description + '" />');
}

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

// Reescribe el <head> del shell: título, descripción y copias sociales según
// ruta e idioma, y canonical/hreflang/og:url para que cada ruta se canonicalice
// a sí misma. Con ?lang=en la
// canonical es la variante EN — igual que hace useSEO en el cliente — para que
// el HTML servido y el DOM renderizado no discrepen.
function rewriteHead(html, pathname, lang) {
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
  const meta = { ...routeMeta(pathname, lang), locale: lang === 'en' ? 'en_GB' : 'es_ES' };
  return rewriteMeta(out, meta);
}

const APP_ROUTES = [
  /^\/$/,
  /^\/blog(?:\/[^/]+)?$/,
  /^\/colecciones$/,
  /^\/colecciones\/(?:principio|categoria|herramienta|eii|flux)(?:\/[^/]+(?:\/descargar)?)?$/,
  /^\/textum-redaccion-2026$/,
  /^\/baja$/,
  /^\/privacidad$/,
  /^\/casos$/,
  /^\/piloto-doctorado$/,
];

function isAppRoute(pathname) {
  return APP_ROUTES.some((pattern) => pattern.test(pathname));
}

function isNoIndexAppRoute(pathname) {
  return pathname === '/baja'
    || pathname === '/textum-redaccion-2026'
    || /^\/colecciones\/(?:principio|categoria|herramienta|eii|flux)\/[^/]+\/descargar$/.test(pathname);
}

// Archivos de conocimiento para LLMs (llms.txt, faq.md...): útiles para
// modelos de lenguaje, no para el índice web. Google los rastrea igualmente
// (robots.txt los permite) y los reporta como "Rastreada: actualmente sin
// indexar" en GSC; esta cabecera lo declara explícitamente.
const KNOWLEDGE_FILES = new Set([
  '/llms.txt',
  '/llms-full.md',
  '/faq.md',
  '/services.md',
  '/about.md',
  '/methodology.md',
  '/ai-policy.md',
  '/schema.jsonld',
]);

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
      const rewritten = rewriteHead(html, url.pathname, lang);
      headers.delete('content-length');
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
    const response = typeof context.next === 'function'
      ? await context.next()
      : await env.ASSETS.fetch(request);
    if (KNOWLEDGE_FILES.has(url.pathname)) {
      const headers = new Headers(response.headers);
      headers.set('X-Robots-Tag', 'noindex, nofollow');
      return new Response(response.body, { status: response.status, headers });
    }
    return response;
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
