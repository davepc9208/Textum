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

test('collection SSR is bot-only and returns localized metadata', async () => {
  let restore = mockSupabase([post]);
  try {
    const human = await collectionPost({
      request: new Request(`${origin}/colecciones/principio/pt-01?lang=en`, { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      env,
      params: { tipo: 'principio', slug: 'pt-01' },
      next: async () => new Response('spa-shell'),
    });
    assert.equal(human.status, 200);
    assert.equal(await human.text(), 'spa-shell');

    restore();
    restore = mockSupabase([post]);
    const bot = await collectionPost({
      request: new Request(`${origin}/colecciones/principio/pt-01?lang=en`, { headers: { 'User-Agent': 'Googlebot' } }),
      env,
      params: { tipo: 'principio', slug: 'pt-01' },
    });
    const html = await bot.text();
    assert.equal(bot.status, 200);
    assert.match(html, /<html lang="en">/);
    assert.match(html, /<h1>Test principle<\/h1>/);
    assert.match(html, /hreflang="es"/);
    assert.match(html, /hreflang="en"/);
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
