import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeKeywords, parseEditorialSheet } from '../functions/_shared/editorial.js';

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

const FICHA_SAMPLE = `[
TEXTUM
Ficha editorial
Cuando el objetivo general y los objetivos específicos no cuentan la misma historia
ESPAÑOL · ARTÍCULO 12
1. Identificación editorial
Título (H1): Cuando el objetivo general y los objetivos específicos no cuentan la misma historia
Subtítulo: Cómo construir coherencia entre lo que quieres investigar y lo que realmente haces
Autoría: Vilma María Pérez Viñas
Marca: TEXTUM. Mentoría Académica
Categoría principal: Filosofía y método TEXTUM
Tema central: Coherencia entre la pregunta de investigación, el objetivo general y las decisiones posteriores del estudio.
Estado editorial: Ficha de preparación y control de publicación; comprobar los destinos de enlaces y CTA en el CMS antes de publicar.
2. Resumen y extracto
Extracto breve: Los objetivos pueden parecer correctos por separado y, sin embargo, no construir una dirección coherente cuando se leen en conjunto.
Resumen: Los objetivos de investigación no son una lista de tareas ni una combinación de verbos metodológicos.
Palabras clave: objetivo general; objetivos específicos; objetivos de investigación; cómo formular objetivos
3. SEO y URL
Título SEO: Objetivo general y objetivos específicos: cómo lograr coherencia | TEXTUM
Meta descripción: ¿Tus objetivos de investigación realmente responden a tu pregunta? Aprende a revisar la relación entre objetivo general y coherencia metodológica.
Slug: objetivo-general-objetivos-especificos-coherencia
URL canónica: Confirmar en el CMS a partir del dominio y del slug definitivo.
4. CTA y conversión
Texto del botón (CTA): REVISAR LA COHERENCIA DE MIS OBJETIVOS
`;

test('parses the important fields of an editorial sheet document', () => {
  const sheet = parseEditorialSheet(FICHA_SAMPLE);

  assert.equal(sheet.title, 'Cuando el objetivo general y los objetivos específicos no cuentan la misma historia');
  assert.equal(sheet.subtitle, 'Cómo construir coherencia entre lo que quieres investigar y lo que realmente haces');
  assert.equal(sheet.author, 'Vilma María Pérez Viñas');
  assert.equal(sheet.seoTitle, 'Objetivo general y objetivos específicos: cómo lograr coherencia | TEXTUM');
  assert.equal(sheet.metaDescription.startsWith('¿Tus objetivos de investigación'), true);
  assert.equal(sheet.excerpt.startsWith('Los objetivos pueden parecer correctos'), true);
  assert.equal(sheet.keywords, 'objetivo general, objetivos específicos, objetivos de investigación, cómo formular objetivos');
  assert.equal(sheet.slug, 'objetivo-general-objetivos-especificos-coherencia');
  assert.equal(sheet.category, 'filosofia-metodo');
});

test('ignores unknown labels and stray checklist lines', () => {
  const sheet = parseEditorialSheet(TEXTUM_FICHA_CHECKLIST);
  assert.equal(sheet.title, 'Ficha de prueba');
  assert.equal(sheet.keywords, '');
  assert.equal(sheet.author, '');
});

const TEXTUM_FICHA_CHECKLIST = `Título: Ficha de prueba
Tema central: Lista de verificación antes de publicar.
☐  El título y subtítulo coinciden con la versión aprobada del artículo.
☐  Los enlaces conducen a páginas publicadas.
Estado editorial: Ficha de preparación.
`;

test('falls back to the long summary when the sheet lacks the short excerpt', () => {
  const sheet = parseEditorialSheet('Resumen: Texto largo que sirve de extracto.\n');
  assert.equal(sheet.excerpt, 'Texto largo que sirve de extracto.');
});

const ENGLISH_FICHA_SAMPLE = `[
TEXTUM
Editorial sheet
When the general objective and the specific objectives do not tell the same story
ENGLISH · ARTICLE 12
Title (H1): When the general objective and the specific objectives do not tell the same story
Subtitle: How to build coherence between what you want to research and what you actually do
Authorship: Vilma María Pérez Viñas
Category (main): Filosofía y método TEXTUM
Short excerpt: Research objectives may look right in isolation and yet fail to build a coherent direction when read together.
Summary: Research objectives are neither a task list nor a combination of methodological verbs.
Keywords: general objective; specific objectives; research objectives; how to formulate objectives
SEO title: General objective and specific objectives: how to achieve coherence | TEXTUM
Meta description: Do your research objectives really answer your question?
Slug: general-objective-specific-objectives-coherence
`;

test('parses the English-language editorial sheet labels', () => {
  const sheet = parseEditorialSheet(ENGLISH_FICHA_SAMPLE);

  assert.equal(sheet.title, 'When the general objective and the specific objectives do not tell the same story');
  assert.equal(sheet.subtitle, 'How to build coherence between what you want to research and what you actually do');
  assert.equal(sheet.author, 'Vilma María Pérez Viñas');
  assert.equal(sheet.seoTitle, 'General objective and specific objectives: how to achieve coherence | TEXTUM');
  assert.equal(sheet.metaDescription, 'Do your research objectives really answer your question?');
  assert.equal(sheet.excerpt, 'Research objectives may look right in isolation and yet fail to build a coherent direction when read together.');
  assert.equal(sheet.keywords, 'general objective, specific objectives, research objectives, how to formulate objectives');
  assert.equal(sheet.slug, 'general-objective-specific-objectives-coherence');
  assert.equal(sheet.category, 'filosofia-metodo');
});

test('the English summary still completes the excerpt when the short one is missing', () => {
  const sheet = parseEditorialSheet('Summary: Long text used as the excerpt.\nCategory: Rigor de la escritura\n');
  assert.equal(sheet.excerpt, 'Long text used as the excerpt.');
});
