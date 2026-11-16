import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/[[path]].js';

const origin = 'https://www.mentoriatextum.com';

function makeContext(pathname, { method = 'GET', env = {} } = {}) {
  return {
    request: new Request(`${origin}${pathname}`, { method }),
    env,
    next: async () => new Response('<html lang="es"><head>'
      + '<title>TEXTUM — Mentoría Académica Internacional | Tesis, publicación y defensa</title>'
      + '<meta name="description" content="Mentoría académica para TFG, TFM y tesis doctoral: metodología TEXTUM FLUX®, publicación en Scopus/Latindex y defensa oral. Diagnóstico gratuito." />'
      + '<meta property="og:title" content="TEXTUM — Mentoría Académica Internacional | Tesis, publicación y defensa" />'
      + '<meta property="og:description" content="Mentoría académica para TFG, TFM y tesis doctoral. Método TEXTUM FLUX®. Diagnóstico gratuito." />'
      + '<meta property="og:locale" content="es_ES" />'
      + '<meta name="twitter:title" content="TEXTUM — Mentoría Académica Internacional" />'
      + '<meta name="twitter:description" content="Mentoría académica para TFG, TFM y tesis doctoral. Método TEXTUM FLUX®. Diagnóstico gratuito." />'
      + '<link rel="canonical" href="https://www.mentoriatextum.com/" />'
      + '<link rel="alternate" hreflang="es" href="https://www.mentoriatextum.com/" />'
      + '<link rel="alternate" hreflang="en" href="https://www.mentoriatextum.com/?lang=en" />'
      + '<link rel="alternate" hreflang="x-default" href="https://www.mentoriatextum.com/" />'
      + '<meta property="og:url" content="https://www.mentoriatextum.com/" />'
      + '</head><body><h1>shell</h1></body></html>',
    { headers: { 'Content-Type': 'text/html' } }),
  };
}

test('legacy /es redirects 301 to /', async () => {
  const res = await onRequest(makeContext('/es'));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), '/');
});

test('legacy /en/blog redirects 301 to /blog?lang=en', async () => {
  const res = await onRequest(makeContext('/en/blog'));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), '/blog?lang=en');
});

test('legacy /es/blog/slug redirects 301 preserving the slug', async () => {
  const res = await onRequest(makeContext('/es/blog/como-diferenciar-un-problema'));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), '/blog/como-diferenciar-un-problema');
});

test('legacy /en/contacto redirects to /?lang=en#contacto', async () => {
  const res = await onRequest(makeContext('/en/contacto'));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), '/?lang=en#contacto');
});

test('legacy redirect preserves extra query params (utm)', async () => {
  const res = await onRequest(makeContext('/es?utm_source=fb'));
  assert.equal(res.status, 301);
  assert.equal(res.headers.get('Location'), '/?utm_source=fb');
});

test('app routes get a self-canonical instead of the homepage canonical', async () => {
  const res = await onRequest(makeContext('/blog'));
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/blog" \/>/);
  assert.match(html, /<link rel="alternate" hreflang="es" href="https:\/\/www\.mentoriatextum\.com\/blog" \/>/);
  assert.match(html, /<link rel="alternate" hreflang="en" href="https:\/\/www\.mentoriatextum\.com\/blog\?lang=en" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.mentoriatextum\.com\/blog" \/>/);
});

test('?lang=en gets the EN variant as its own canonical and html lang', async () => {
  const res = await onRequest(makeContext('/blog?lang=en'));
  const html = await res.text();
  assert.equal(res.status, 200);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/blog\?lang=en" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/www\.mentoriatextum\.com\/blog\?lang=en" \/>/);
  assert.match(html, /<html lang="en">/);
});

test('noindex routes are not canonical-rewritten and keep X-Robots-Tag', async () => {
  const res = await onRequest(makeContext('/baja'));
  const html = await res.text();
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  // El shell no fue reescrito: canonical sigue apuntando a la home declarada.
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/" \/>/);
});

test('the Flux collection routes are recognized app routes', async () => {
  for (const pathname of ['/colecciones/flux', '/colecciones/flux/flux-01']) {
    const res = await onRequest(makeContext(pathname));
    const html = await res.text();
    assert.equal(res.status, 200, pathname);
    assert.match(html, new RegExp(`<link rel="canonical" href="${origin.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}${pathname}" />`), pathname);
  }
});

test('the eii collection routes are recognized app routes', async () => {
  for (const pathname of ['/colecciones/eii', '/colecciones/eii/eii-01']) {
    const res = await onRequest(makeContext(pathname));
    const html = await res.text();
    assert.equal(res.status, 200, pathname);
    assert.match(html, new RegExp(`<link rel="canonical" href="${origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${pathname}" />`), pathname);
  }
});

test('the eii download route keeps its noindex header', async () => {
  const res = await onRequest(makeContext('/colecciones/eii/eii-01/descargar'));
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('unknown path without extension gets the branded 404', async () => {
  const res = await onRequest(makeContext('/esto-no-existe'));
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('unknown path with extension passes through to assets', async () => {
  const context = makeContext('/missing-file.js');
  let called = false;
  context.next = async () => {
    called = true;
    return new Response('console.log("ok")', { headers: { 'Content-Type': 'text/javascript' } });
  };
  const res = await onRequest(context);
  assert.equal(called, true);
  assert.equal(res.status, 200);
});

test('knowledge files (faq.md, llms.txt) are served with noindex', async () => {
  for (const pathname of ['/faq.md', '/llms.txt', '/services.md', '/schema.jsonld']) {
    const context = makeContext(pathname);
    context.next = async () => new Response('knowledge', { headers: { 'Content-Type': 'text/plain' } });
    const res = await onRequest(context);
    assert.equal(res.status, 200, pathname);
    assert.equal(res.headers.get('X-Robots-Tag'), 'noindex, nofollow', pathname);
  }
});

test('regular assets keep their original headers (no noindex)', async () => {
  const context = makeContext('/assets/index-abc123.js');
  context.next = async () => new Response('console.log(1)', { headers: { 'Content-Type': 'application/javascript' } });
  const res = await onRequest(context);
  assert.equal(res.headers.get('X-Robots-Tag'), null);
});

test('POST requests are passed through', async () => {
  const context = makeContext('/api/contact', { method: 'POST' });
  let called = false;
  context.next = async () => {
    called = true;
    return new Response('ok');
  };
  await onRequest(context);
  assert.equal(called, true);
});

// El HTML servido debe traer el título y la descripción de la ruta y del idioma,
// no los de la portada: Google descartaba la home inglesa por duplicada.
test('cada ruta e idioma reciben su propio título y descripción', async () => {
  const cases = [
    ['/', '<title>TEXTUM — Mentoría Académica Internacional | Titulación, Publicación y Defensa</title>'],
    ['/?lang=en', '<title>TEXTUM — International Academic Mentoring | Degree Projects, Publication &amp; Defence</title>'],
    ['/blog?lang=en', '<title>Academic Blog | Research and Scientific Writing Articles — TEXTUM</title>'],
    ['/colecciones/herramienta', '<title>Herramientas TEXTUM | Colecciones TEXTUM</title>'],
    ['/colecciones/herramienta?lang=en', '<title>TEXTUM Tools | TEXTUM Collections</title>'],
    ['/casos', '<title>Rigor que puedes comprobar — TEXTUM</title>'],
  ];
  for (const [pathname, expected] of cases) {
    const res = await onRequest(makeContext(pathname));
    const html = await res.text();
    assert.ok(html.includes(expected), pathname + ' debería servir ' + expected + '\\n' + html.slice(0, 300));
  }
});

test('la home inglesa envía su propia descripción y su og:locale', async () => {
  const res = await onRequest(makeContext('/?lang=en'));
  const html = await res.text();
  assert.match(html, /<meta name="description" content="Academic mentoring programmes/);
  assert.match(html, /<meta property="og:locale" content="en_GB" \/>/);
  assert.doesNotMatch(html, /Mentoría académica para TFG, TFM y tesis doctoral/);
});
