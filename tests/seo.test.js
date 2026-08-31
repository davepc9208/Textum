import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest as blogPost } from '../functions/blog/[slug].js';
import { onRequest as collectionPost } from '../functions/colecciones/[tipo]/[slug].js';
import { onRequest as sitemap } from '../functions/sitemap.xml.js';

const origin = 'https://www.mentoriatextum.com';
const env = {
  SUPABASE_URL: 'https://supabase.example',
  SUPABASE_ANON_KEY: 'anon-test-key',
};

const post = {
  id: 'collection-1',
  slug: 'pt-01',
  collection_type: 'principio',
  title_es: 'Principio de prueba',
  title_en: 'Test principle',
  excerpt_es: 'Resumen en español.',
  excerpt_en: 'English summary.',
  content_es: '<p>Contenido <strong>seguro</strong>.</p>',
  content_en: '<p>Safe <strong>content</strong>.</p>',
  author: 'TEXTUM',
  cover_url: '',
  cover_alt: null,
  created_at: '2026-01-01T00:00:00.000Z',
  published: true,
};

function mockSupabase(result) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
  return () => { globalThis.fetch = originalFetch; };
}

test('blog SSR uses the requested English canonical and all hreflang variants', async () => {
  const restore = mockSupabase([{ ...post, collection_type: null }]);
  try {
    const response = await blogPost({
      request: new Request(`${origin}/blog/test-principle?lang=en`, { headers: { 'User-Agent': 'Googlebot' } }),
      env,
      params: { slug: 'test-principle' },
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<link rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/blog\/test-principle\?lang=en"/);
    assert.match(html, /hreflang="es" href="https:\/\/www\.mentoriatextum\.com\/blog\/test-principle"/);
    assert.match(html, /hreflang="en" href="https:\/\/www\.mentoriatextum\.com\/blog\/test-principle\?lang=en"/);
    assert.match(html, /hreflang="x-default"/);
  } finally {
    restore();
  }
});

test('collection SSR renders the article for every visitor (no cloaking)', async () => {
  for (const ua of ['Mozilla/5.0', 'Googlebot']) {
    const restore = mockSupabase([post]);
    try {
      const response = await collectionPost({
        request: new Request(`${origin}/colecciones/principio/pt-01?lang=en`, { headers: { 'User-Agent': ua } }),
        env,
        params: { tipo: 'principio', slug: 'pt-01' },
      });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(html, /<html lang="en">/);
      assert.match(html, /<h1>Test principle<\/h1>/);
      assert.match(html, /hreflang="es"/);
      assert.match(html, /hreflang="en"/);
      assert.match(html, /rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/colecciones\/principio\/pt-01\?lang=en"/);
    } finally {
      restore();
    }
  }
});

test('SSR splices head + article + data island into the real SPA shell', async () => {
  const shell = [
    '<!doctype html><html lang="es"><head>',
    '<link rel="icon" href="/favicon.svg">',
    '<!-- SSR:HEAD:START -->',
    '<title>Home</title><meta name="description" content="home">',
    '<!-- SSR:HEAD:END -->',
    '</head><body>',
    '<h1 id="ssr-home-h1" style="position:absolute">Home hidden heading</h1>',
    '<div id="ssr-content" hidden></div>',
    '<div id="root"></div>',
    '<script type="module" src="/assets/index-abc123.js"></script>',
    '</body></html>',
  ].join('\n');

  const restore = mockSupabase([{ ...post, collection_type: null }]);
  try {
    const response = await blogPost({
      request: new Request(`${origin}/blog/test-principle`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      env,
      params: { slug: 'test-principle' },
      next: async () => new Response(shell, { headers: { 'Content-Type': 'text/html' } }),
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-SSR'), 'shell');
    // El bundle real de la SPA sigue presente
    assert.match(html, /assets\/index-abc123\.js/);
    // La home <title> ha sido sustituida por la del artículo
    assert.doesNotMatch(html, /<title>Home<\/title>/);
    assert.match(html, /Principio de prueba/);
    // El heading oculto de la home se elimina en páginas de artículo
    assert.doesNotMatch(html, /ssr-home-h1/);
    // Contenido del artículo inyectado + data island para React
    assert.match(html, /<div id="ssr-content"><style/);
    assert.match(html, /<script id="__SSR_DATA__" type="application\/json">/);
    assert.match(html, /"type":"post"/);
  } finally {
    restore();
  }
});

test('dynamic sitemap has one canonical loc per resource and excludes contacto', async () => {
  const restore = mockSupabase([
    { slug: 'pt-01', collection_type: 'principio', created_at: '2026-01-01T00:00:00.000Z' },
    { slug: 'blog-01', collection_type: null, created_at: '2026-01-02T00:00:00.000Z' },
  ]);
  try {
    const response = await sitemap({ env });
    const xml = await response.text();
    assert.equal(response.status, 200);
    assert.match(xml, /xmlns:xhtml/);
    assert.doesNotMatch(xml, /contacto/);
    assert.equal((xml.match(/<loc>/g) || []).length, 10);
    assert.match(xml, /hreflang="en" href="https:\/\/www\.mentoriatextum\.com\/blog\/blog-01\?lang=en"/);
  } finally {
    restore();
  }
});
