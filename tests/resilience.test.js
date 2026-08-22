import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as translate } from '../functions/api/translate.js';
import { onRequest as distribute } from '../functions/api/distribute.js';
import { onRequest as blogPost } from '../functions/blog/[slug].js';
import { onRequestPost as contact } from '../functions/api/contact.js';
import { onRequestPost as uploadImage } from '../functions/api/upload-image.js';
import { onRequest as catchAll } from '../functions/[[path]].js';

const origin = 'https://www.mentoriatextum.com';

function jsonRequest(path, body) {
  return new Request(`${origin}${path}`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('catch-all returns static 404 with noindex for unknown routes', async () => {
  const response = await catchAll({
    request: new Request(`${origin}/ruta-inexistente`),
    env: {},
  });
  assert.equal(response.status, 404);
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/i);
  const html = await response.text();
  assert.match(html, /Error 404/i);
  assert.match(html, /Esta pagina no existe/i);
});

test('catch-all returns English 404 when lang=en', async () => {
  const response = await catchAll({
    request: new Request(`${origin}/unknown?lang=en`),
    env: {},
  });
  assert.equal(response.status, 404);
  const html = await response.text();
  assert.match(html, /This page does not exist/i);
});

test('catch-all passes static assets through instead of 404ing them', async () => {
  let nextCalled = false;
  const response = await catchAll({
    request: new Request(`${origin}/assets/index-abc123.js`),
    env: {},
    next: async () => {
      nextCalled = true;
      return new Response('console.log(1)', { status: 200, headers: { 'Content-Type': 'application/javascript' } });
    },
  });
  assert.equal(response.status, 200);
  assert.equal(nextCalled, true);
  assert.match(response.headers.get('Content-Type'), /javascript/);
});

test('catch-all passes CSS assets through via ASSETS when next is unavailable', async () => {
  const response = await catchAll({
    request: new Request(`${origin}/assets/index-abc123.css`),
    env: {
      ASSETS: {
        fetch: async () => new Response('body{}', { status: 200, headers: { 'Content-Type': 'text/css' } }),
      },
    },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /css/);
});

test('catch-all serves SPA shell for known app routes', async () => {
  let nextCalled = false;
  const response = await catchAll({
    request: new Request(`${origin}/blog`),
    env: {},
    next: async () => {
      nextCalled = true;
      return new Response('<html>spa</html>', { headers: { 'Content-Type': 'text/html' } });
    },
  });
  assert.equal(response.status, 200);
  assert.equal(nextCalled, true);
});

test('catch-all falls back to ASSETS when next is unavailable', async () => {
  const response = await catchAll({
    request: new Request(`${origin}/casos`),
    env: {
      ASSETS: {
        fetch: async () => new Response('<html>index</html>', { status: 200 }),
      },
    },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /index/);
});

test('returns a branded 404 for an unpublished blog slug', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]', { status: 200 });
  try {
    const response = await blogPost({
      request: new Request(`${origin}/blog/no-existe`),
      env: { SUPABASE_URL: 'https://supabase.example', SUPABASE_ANON_KEY: 'anon-test-key' },
      params: { slug: 'no-existe' },
      next: async () => new Response('shell'),
    });
    assert.equal(response.status, 404);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects contact requests without required fields', async () => {
  const response = await contact({ request: jsonRequest('/api/contact', {}), env: {} });
  assert.equal(response.status, 400);
});

test('rejects admin translation requests without a bearer token', async () => {
  const response = await translate({
    request: jsonRequest('/api/translate', { title_es: 'Título', content_es: '<p>Contenido</p>' }),
    env: { GROQ_API_KEY: 'test-key' },
  });
  assert.equal(response.status, 401);
});

test('rejects admin distribution requests without a bearer token', async () => {
  const response = await distribute({
    request: jsonRequest('/api/distribute', { title: 'Título', slug: 'titulo', content: '<p>Contenido</p>' }),
    env: { GROQ_API_KEY: 'test-key' },
  });
  assert.equal(response.status, 401);
});

test('rejects image uploads without a bearer token', async () => {
  const form = new FormData();
  form.append('file', new Blob(['not-an-image'], { type: 'image/png' }), 'image.png');
  const response = await uploadImage({
    request: new Request(`${origin}/api/upload-image`, { method: 'POST', body: form }),
    env: {},
  });
  assert.equal(response.status, 401);
});

test('rejects malformed translation input', async () => {
  const response = await translate({
    request: new Request(`${origin}/api/translate`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{',
    }),
    env: {},
  });
  assert.equal(response.status, 400);
});

test('rejects malformed distribution input', async () => {
  const response = await distribute({
    request: new Request(`${origin}/api/distribute`, {
      method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{',
    }),
    env: {},
  });
  assert.equal(response.status, 400);
});