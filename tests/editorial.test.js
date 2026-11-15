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

// Ficha del artículo 13 tal y como la devuelve mammoth.extractRawText: cada
// párrafo y cada celda de tabla acaban en salto de línea doble, y la etiqueta
// queda en un párrafo con el valor en el siguiente.
const FICHA_TABLA_ES = `T E X T U M

MENTORÍA ACADÉMICA · FICHA EDITORIAL

El estado del arte no es una lista de antecedentes

ESPAÑOL · ARTÍCULO 13

1. Identificación editorial

Título (H1)

El estado del arte no es una lista de antecedentes

Subtítulo

Cómo pasar de acumular literatura a construir un mapa del conocimiento

Autoría

Vilma María Pérez Viñas

Marca

TEXTUM. Mentoría Académica

Idioma

Español

Categoría principal

Filosofía y método TEXTUM

Tipo de contenido

Artículo de blog · divulgación metodológica

2. Propósito y argumento central

Mostrar que el estado del arte no se construye mediante la acumulación de publicaciones.

Idea fuerza

Tener mucha literatura no equivale a comprender el conocimiento disponible.

6. Metadatos SEO y publicación

Meta title

El estado del arte no es una lista de antecedentes

TEXTUM

Meta description

Tener muchos artículos no significa comprender el conocimiento existente. Aprende a analizar la literatura.

Slug recomendado

estado-del-arte-posicionamiento-investigacion

Palabra clave principal

estado del arte

Palabras clave secundarias

cómo hacer un estado del arte; revisión bibliográfica; revisión de literatura

URL canónica

Confirmar en el CMS con el dominio y el slug definitivos.

Resumen editorial

El estado del arte no consiste en acumular antecedentes ni en presentar una sucesión de autores.

Palabras clave

estado del arte; cómo hacer un estado del arte; revisión bibliográfica; revisión de literatura; antecedentes de investigación; posicionamiento de la investigación.

7. Comprobación antes de publicar

☐ El título, subtítulo y autoría coinciden con la versión española aprobada.
`;

test('parses a sheet laid out as tables (label and value in separate paragraphs)', () => {
  const sheet = parseEditorialSheet(FICHA_TABLA_ES);

  assert.equal(sheet.title, 'El estado del arte no es una lista de antecedentes');
  assert.equal(sheet.subtitle, 'Cómo pasar de acumular literatura a construir un mapa del conocimiento');
  assert.equal(sheet.author, 'Vilma María Pérez Viñas');
  assert.equal(sheet.seoTitle, 'El estado del arte no es una lista de antecedentes');
  assert.equal(sheet.metaDescription.startsWith('Tener muchos artículos'), true);
  assert.equal(sheet.slug, 'estado-del-arte-posicionamiento-investigacion');
  assert.equal(sheet.excerpt.startsWith('El estado del arte no consiste en acumular'), true);
  assert.equal(sheet.category, 'filosofia-metodo');
  assert.equal(
    sheet.keywords,
    'estado del arte, cómo hacer un estado del arte, revisión bibliográfica, revisión de literatura, antecedentes de investigación, posicionamiento de la investigación',
  );
});

const FICHA_TABLA_EN = `EDITORIAL SHEET — INTERNAL USE

TEXTUM. International Academic Mentoring

Article 13 — English version

Article identification

Title: The State of the Art Is Not a List of Previous Studies

Subtitle: Moving from collecting literature to building a map of knowledge

Author: Vilma María Pérez Viñas

Brand: TEXTUM. International Academic Mentoring

Content type: Methodological blog article

Editorial summary

A state-of-the-art review is not an accumulation of sources or a succession of author-by-author summaries.

Keywords

state-of-the-art review; how to conduct a state-of-the-art review; literature review; research background; research positioning; research gap

SEO editorial

Meta title: The State of the Art Is Not a List of Previous Studies | TEXTUM

Meta description: Downloading many articles does not mean understanding existing knowledge.

Suggested slug: state-of-the-art-research-positioning
`;

test('parses a sheet with headings and inline labels without colons in the layout', () => {
  const sheet = parseEditorialSheet(FICHA_TABLA_EN);

  assert.equal(sheet.title, 'The State of the Art Is Not a List of Previous Studies');
  assert.equal(sheet.subtitle, 'Moving from collecting literature to building a map of knowledge');
  assert.equal(sheet.author, 'Vilma María Pérez Viñas');
  assert.equal(sheet.seoTitle, 'The State of the Art Is Not a List of Previous Studies | TEXTUM');
  assert.equal(sheet.metaDescription.startsWith('Downloading many articles'), true);
  assert.equal(sheet.slug, 'state-of-the-art-research-positioning');
  assert.equal(sheet.excerpt.startsWith('A state-of-the-art review'), true);
  assert.equal(sheet.keywords.split(', ').length, 6);
});

test('parses a sheet pasted as a markdown table', () => {
  const sheet = parseEditorialSheet([
    '| **Título (H1)** | Artículo de prueba |',
    '| **Subtítulo** | Un subtítulo cualquiera |',
    '| **Meta title** | Artículo de prueba | TEXTUM |',
    '| **Slug recomendado** | articulo-de-prueba |',
    '| **Palabras clave** | coherencia; metodología |',
  ].join('\n'));

  assert.equal(sheet.title, 'Artículo de prueba');
  assert.equal(sheet.subtitle, 'Un subtítulo cualquiera');
  assert.equal(sheet.seoTitle, 'Artículo de prueba | TEXTUM');
  assert.equal(sheet.slug, 'articulo-de-prueba');
  assert.equal(sheet.keywords, 'coherencia, metodología');
});
