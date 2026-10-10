import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCandidate,
  classifyRole,
  cleanSerperResults,
  dedupeCandidates,
  extractEmails,
  serperQueries,
  validateInput,
} from '../functions/api/prospecting-search.js';

test('validateInput normaliza región, disciplina y límite', () => {
  assert.deepEqual(validateInput({ region: 'espana', topic: 'educacion', limit: 20 }), { region: 'espana', topic: 'educacion', limit: 20 });
  assert.deepEqual(validateInput({ region: 'inventada', topic: 'rara', limit: 999 }), { region: 'todas', topic: 'todas', limit: 40 });
  assert.deepEqual(validateInput({ limit: 0 }), { region: 'todas', topic: 'todas', limit: 5 });
});

test('serperQueries genera queries dirigidas por región', () => {
  const queriesEspana = serperQueries({ region: 'espana', topic: 'educacion' });
  assert.ok(Array.isArray(queriesEspana) && queriesEspana.length === 3);
  assert.ok(queriesEspana.every((query) => query.includes('site:es')));
  assert.ok(queriesEspana[0].includes('coordinador de programa de doctorado'));

  const queriesLatam = serperQueries({ region: 'latam', topic: 'todas' });
  assert.ok(queriesLatam[0].includes('México'));
});

test('cleanSerperResults descarta redes sociales y no institucionales', () => {
  const results = cleanSerperResults([
    { link: 'https://www.universidad.es/escuela-doctorado/contacto', title: 'Escuela Internacional de Doctorado' },
    { link: 'https://www.linkedin.com/in/coordinadora-doctorado', title: 'Coordinadora en LinkedIn' },
    { link: 'https://blognofederado.com/doctorado', title: 'Blog sobre doctorados' },
    { link: 'https://unam.mx/posgrado/coordinacion', title: 'Coordinación de Posgrado UNAM' },
  ], 'espana');
  assert.equal(results.length, 1);
  assert.match(results[0].link, /universidad\.es/);
});

test('cleanSerperResults filtra LATAM excluyendo España', () => {
  const results = cleanSerperResults([
    { link: 'https://www.uchile.cl/escuela-de-posgrado', title: 'Escuela de Posgrado Universidad de Chile' },
    { link: 'https://www.ucm.es/doctorado', title: 'Doctorado UCM España' },
  ], 'latam');
  assert.equal(results.length, 1);
  assert.match(results[0].link, /uchile\.cl/);
});

test('extractEmails prioriza mailto y descarta basura', () => {
  const html = `<!doctype html><html><body>
    <a href="mailto:Coordinacion.Doctorado@universidad.es">Coord.</a>
    <a href="mailto:noreply@universidad.es">noreply</a>
    <a href="mailto:jdoe@gmail.com">gmail</a>
    <p>Escríbenos a secretaria.posgrado (at) universidad.es</p>
    <span>logo staticCorreo logo@banner.png</span>
  </body></html>`;
  const emails = extractEmails(html);
  assert.ok(emails.includes('coordinacion.doctorado@universidad.es'));
  assert.ok(emails.includes('secretaria.posgrado@universidad.es'));
  assert.ok(!emails.some((email) => email.includes('noreply')));
  assert.ok(!emails.some((email) => email.endsWith('gmail.com')));
  assert.ok(!emails.some((email) => email.endsWith('.png')));
});

test('extractEmails maneja mailto con entidad HTML (@ codificado)', () => {
  const html = `<a href="mailto:doctorado&#64;escuela.es">Contacto</a>`;
  const emails = extractEmails(html);
  assert.ok(emails.includes('doctorado@escuela.es'));
});

test('extractEmails devuelve opciones vacías en HTML sin correos', () => {
  assert.deepEqual(extractEmails('<html><body><p>Sin correos en esta página.</p></body></html>'), []);
});

test('buildCandidate institutes, etiqueta rol y basis documentada', () => {
  const candidate = buildCandidate('coordinacion.doctorado@uchile.cl', 'https://www.uchile.cl/escuela-de-posgrado', 'Escuela de Posgrado — Universidad de Chile');
  assert.equal(candidate.email, 'coordinacion.doctorado@uchile.cl');
  assert.equal(candidate.institution, 'UCHILE');
  assert.match(candidate.role, /Coordinación de programa doctoral|Escuela de Posgrado|Unidad de investigación/);
  assert.match(candidate.contact_basis, /Correo publicado en https:\/\/www\.uchile\.cl/);
  assert.ok(candidate.tags.includes('autodiscovery'));
  assert.equal(candidate.approved, undefined); // no se aprueba nunca automáticamente
});

test('classifyRole detecta escuela de posgrado y unidad de investigación', () => {
  assert.equal(classifyRole('Escuela de Posgrado - Coordinación'), 'posgrado');
  assert.equal(classifyRole('Vicerrectoría de Investigación / Unidad de Investigación'), 'investigacion');
  assert.equal(classifyRole('Coordinador del Programa de Doctorado en Educación'), 'doctoral');
  assert.equal(classifyRole('Página sin señales'), 'doctoral'); // fallback conservador
});

test('dedupeCandidates solo cosecha correos únicos', () => {
  const base = { name: 'Contacto', email: 'a@x.es', institution: null, department: null, programme: null, role: null, country: null, language: 'es', source_url: null, contact_basis: null, tags: [] };
  const dupe = { ...base, email: 'A@X.ES' };
  const other = { ...base, email: 'b@x.es' };
  const result = dedupeCandidates([base, dupe, other]);
  assert.equal(result.length, 2);
  assert.deepEqual(result.map((item) => item.email), ['a@x.es', 'b@x.es']);
});
