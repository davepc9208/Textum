import assert from 'node:assert/strict';
import test from 'node:test';
import { sanitizeArticleHtml } from '../functions/_shared/sanitize-html.js';

test('removes dangerous URL schemes from anchor and image attributes', () => {
  const sanitized = sanitizeArticleHtml([
    '<a href="javascript:alert(1)">plain</a>',
    '<a href="java&#x73;cript:alert(1)">hex entity</a>',
    '<a href="ja&#118;ascript&colon;alert(1)">decimal and named entities</a>',
    '<a href="java&#x09;script:alert(1)">control character</a>',
    '<a href="data:text/html,evil">data URL</a>',
    '<a href="vbscript:msgbox(1)">vbscript URL</a>',
    '<img src="data:text/html,evil">',
  ].join(''));

  assert.doesNotMatch(sanitized, /href="(?:javascript|data|vbscript):/i);
  assert.doesNotMatch(sanitized, /src="data:/i);
  assert.match(sanitized, /<a rel="nofollow ugc">plain<\/a>/);
  assert.match(sanitized, /<a rel="nofollow ugc">hex entity<\/a>/);
  assert.match(sanitized, /<a rel="nofollow ugc">decimal and named entities<\/a>/);
  assert.match(sanitized, /<a rel="nofollow ugc">control character<\/a>/);
});

test('preserves safe relative and HTTPS URLs without changing their entity escaping', () => {
  const sanitized = sanitizeArticleHtml([
    '<a href="/contacto?source=blog&amp;lang=es">local</a>',
    '<a href="https://example.com/a?x=1&amp;y=2">external</a>',
    '<img src="https://cdn.example/image.png" alt="image">',
  ].join(''));

  assert.match(sanitized, /href="\/contacto\?source=blog&amp;lang=es"/);
  assert.match(sanitized, /href="https:\/\/example\.com\/a\?x=1&amp;y=2"/);
  assert.match(sanitized, /src="https:\/\/cdn\.example\/image\.png"/);
});
