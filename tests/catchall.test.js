import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from '../functions/[[path]].js';

const origin = 'https://www.mentoriatextum.com';

function makeContext(pathname, { method = 'GET', env = {} } = {}) {
  return {
    request: new Request(`${origin}${pathname}`, { method }),
    env,
    next: async () => new Response('<html lang="es"><head>'
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
