import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as translate } from '../functions/api/translate.js';
import { onRequest as distribute } from '../functions/api/distribute.js';
import { onRequest as blogPost } from '../functions/blog/[slug].js';
import { onRequestPost as contact, onRequestOptions as contactOptions } from '../functions/api/contact.js';
import { onRequestPost as leadMagnet, onRequestOptions as leadMagnetOptions } from '../functions/api/lead-magnet.js';
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

test('catch-all marks utility app routes as noindex before React loads', async () => {
  const response = await catchAll({
    request: new Request(`${origin}/colecciones/principio/pt-01/descargar`),
    env: {},
    next: async () => new Response('<html>download</html>', { headers: { 'Content-Type': 'text/html' } }),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
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

test('contact failures return a valid localized 500 response instead of throwing', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Resend unavailable'); };
  try {
    const response = await contact({
      request: jsonRequest('/api/contact', {
        name: 'Test User',
        email: 'test@example.com',
        message: 'A valid contact message',
        lang: 'en',
      }),
      env: { RESEND_API_KEY: 'test-key' },
    });
    assert.equal(response.status, 500);
    assert.match(await response.text(), /Server error/i);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), origin);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('public API preflight responses never use a wildcard CORS origin', async () => {
  const request = new Request(`${origin}/api/contact`, { headers: { Origin: origin } });
  const contactResponse = await contactOptions({ request, env: {} });
  const leadResponse = await leadMagnetOptions({ request, env: {} });
  assert.equal(contactResponse.headers.get('Access-Control-Allow-Origin'), origin);
  assert.equal(leadResponse.headers.get('Access-Control-Allow-Origin'), origin);
  assert.notEqual(contactResponse.headers.get('Access-Control-Allow-Origin'), '*');
  assert.notEqual(leadResponse.headers.get('Access-Control-Allow-Origin'), '*');
});

test('lead magnet requires an explicit privacy acceptance', async () => {
  const response = await leadMagnet({
    request: jsonRequest('/api/lead-magnet', {
      name: 'Test User',
      email: 'test@example.com',
      resource_slug: 'pt-01',
      resource_type: 'principio',
    }),
    env: {},
  });
  assert.equal(response.status, 400);
  assert.match(await response.text(), /privacidad/i);
});

test('lead magnet rejects malformed optional fields without throwing', async () => {
  const response = await leadMagnet({
    request: jsonRequest('/api/lead-magnet', {
      name: 'Test User',
      email: 'test@example.com',
      resource_slug: 'pt-01',
      resource_type: 'principio',
      institution: { invalid: true },
      privacy_accepted: true,
    }),
    env: {},
  });
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