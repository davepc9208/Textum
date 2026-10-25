import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeKeywords } from '../functions/_shared/editorial.js';

test('normalizes semicolons and commas to a clean comma-separated keyword list', () => {
  assert.equal(
    normalizeKeywords('  tesis doctoral ; APA 7,  escritura científica ; ; mentoría académica  '),
    'tesis doctoral, APA 7, escritura científica, mentoría académica',
  );
});

test('returns an empty string for missing or separator-only keywords', () => {
  assert.equal(normalizeKeywords(' ; , ; '), '');
  assert.equal(normalizeKeywords(''), '');
  assert.equal(normalizeKeywords(null), '');
});
