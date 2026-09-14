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

test('blog SSR uses independent English slug and cover when they are configured', async () => {
  const restore = mockSupabase([{
    ...post,
    collection_type: null,
    slug: 'articulo-es',
    slug_es: 'articulo-es',
    slug_en: 'english-article',
    cover_url: 'https://cdn.example/es-cover.png',
    cover_url_es: 'https://cdn.example/es-cover.png',
    cover_url_en: 'https://cdn.example/en-cover.png',
    cover_alt_es: 'Portada en español',
    cover_alt_en: 'English cover',
  }]);
  try {
    const response = await blogPost({
      request: new Request(`${origin}/blog/english-article?lang=en`),
      env,
      params: { slug: 'english-article' },
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.ok(html.includes('canonical" href="https://www.mentoriatextum.com/blog/english-article?lang=en'), 'canonical EN');
    assert.ok(html.includes('hreflang="es" href="https://www.mentoriatextum.com/blog/articulo-es"'), 'hreflang ES');
    assert.ok(html.includes('hreflang="en" href="https://www.mentoriatextum.com/blog/english-article?lang=en"'), 'hreflang EN');
    assert.ok(html.includes('og:image" content="https://cdn.example/en-cover.png"'), 'OG image EN');
    assert.ok(html.includes('English cover'), 'alt EN');
  } finally {
    restore();
  }
});

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

test('blog SSR ignores Accept-Language: only ?lang decides the served language', async () => {
  const restore = mockSupabase([
    { ...post, collection_type: null, title_en: 'English title', content_en: '<p>English</p>' },
  ]);
  try {
    const spanish = await blogPost({
      request: new Request(`${origin}/blog/test-principle`, { headers: { 'Accept-Language': 'en-US,en;q=0.9' } }),
      env,
      params: { slug: 'test-principle' },
    });
    const spanishHtml = await spanish.text();
    assert.equal(spanish.status, 200);
    assert.match(spanishHtml, /<html lang="es">/);
    assert.match(spanishHtml, /Principio de prueba/);
    assert.doesNotMatch(spanishHtml, /English title/);

    const english = await blogPost({
      request: new Request(`${origin}/blog/test-principle?lang=en`),
      env,
      params: { slug: 'test-principle' },
    });
    const englishHtml = await english.text();
    assert.match(englishHtml, /<html lang="en">/);
    assert.match(englishHtml, /English title/);
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
    assert.match(html, /assets\/index-abc123\.js/);
    assert.doesNotMatch(html, /<title>Home<\/title>/);
    assert.match(html, /Principio de prueba/);
    assert.doesNotMatch(html, /ssr-home-h1/);
    assert.match(html, /<div id="ssr-content"><style/);
    assert.match(html, /<script id="__SSR_DATA__" type="application\/json">/);
    assert.match(html, /"type":"post"/);
  } finally {
    restore();
  }
});

test('collection SSR accepts the eii type with its own labels and canonicals', async () => {
  const restore = mockSupabase([{ ...post, slug: 'eii-01', collection_type: 'eii', title_es: 'El Enfoque Investigativo Integral', title_en: 'The Integral Research Approach' }]);
  try {
    const spanish = await collectionPost({
      request: new Request(`${origin}/colecciones/eii/eii-01`),
      env,
      params: { tipo: 'eii', slug: 'eii-01' },
    });
    const spanishHtml = await spanish.text();
    assert.equal(spanish.status, 200);
    assert.match(spanishHtml, /<html lang="es">/);
    assert.match(spanishHtml, /<h1>El Enfoque Investigativo Integral<\/h1>/);
    assert.match(spanishHtml, /Enfoque Investigativo Integral — TEXTUM<\/title>/);
    assert.match(spanishHtml, /rel="canonical" href="https:\/\/www\.mentoriatextum\.com\/colecciones\/eii\/eii-01"/);
    assert.match(spanishHtml, /hreflang="es" href="https:\/\/www\.mentoriatextum\.com\/colecciones\/eii\/eii-01"/);
    assert.match(spanishHtml, /hreflang="en" href="https:\/\/www\.mentoriatextum\.com\/colecciones\/eii\/eii-01\?lang=en"/);
    assert.match(spanishHtml, /href="https:\/\/www\.mentoriatextum\.com\/colecciones\/eii"/);

    const english = await collectionPost({
      request: new Request(`${origin}/colecciones/eii/eii-01?lang=en`),
      env,
      params: { tipo: 'eii', slug: 'eii-01' },
    });
    const englishHtml = await english.text();
    assert.match(englishHtml, /<html lang="en">/);
    assert.match(englishHtml, /Integral Research Approach — TEXTUM<\/title>/);
  } finally {
    restore();
  }
});

test('collection SSR rejects unknown collection types', async () => {
  const response = await collectionPost({
    request: new Request(`${origin}/colecciones/otro/xx`),
    env,
    params: { tipo: 'otro', slug: 'xx' },
  });
  assert.equal(response.status, 404);
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow');
});

test('dynamic sitemap publishes one URL per locale with correct hreflang pairs', async () => {
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
    assert.match(xml, /<loc>https:\/\/www\.mentoriatextum\.com\/colecciones\/eii<\/loc>/);
    assert.equal((xml.match(/<loc>/g) || []).length, 22);
    assert.match(xml, /hreflang="en" href="https:\/\/www\.mentoriatextum\.com\/blog\/blog-01\?lang=en"/);
  } finally {
    restore();
  }
});
