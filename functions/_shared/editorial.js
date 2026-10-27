export function normalizeKeywords(value) {
  return (value ?? '')
    .split(/[;,]/)
    .map(keyword => keyword.trim())
    .filter(Boolean)
    .join(', ');
}

// Etiquetas de la ficha editorial que se reconocen, en su forma canónica y
// también con variantes habituales (mayúsculas, acentos, paréntesis, etc.).
// Las fichas se preparan en español y en inglés (artículo ES/EN), así que cada
// etiqueta reconoce ambas formas. El chequeo va sobre el texto sin acentos ni
// mayúsculas, de modo que "Título SEO" y "titulo seo" son lo mismo.
const SHEET_FIELD_PATTERNS = {
  title:       /^(titulo|title)( h1)?$/,
  subtitle:    /^(subtitulo|subtitle)$/,
  seoTitle:    /^(titulo seo|seo title)$/,
  metaDescription: /^(meta descripcion|meta description)$/,
  excerpt:     /^(extracto breve|short excerpt|excerpt)$/,
  summary:     /^(resumen|summary)( (ejecutivo|executive))?$/,
  keywords:    /^(palabras clave|keywords)$/,
  slug:        /^slug$/,
  author:      /^(autoria|author(?:ship)?)$/,
  category:    /^(categoria|category)( (principal|main))?$/,
};

// Etiquetas de los selectores de categoría del editor admin → valor de la BD.
// Se aceptan también los nombres en inglés que puede traer la ficha EN.
const CATEGORY_KEY_BY_MATCH = [
  ['filosofia', 'filosofia-metodo'],
  ['philosophy', 'filosofia-metodo'],
  ['rigor', 'rigor-escritura'],
  ['sustentacion', 'sustentacion-defensa'],
  ['defensa', 'sustentacion-defensa'],
];

// "ÁéÍ → aei" para comparar etiquetas sin depender de acentos ni mayúsculas.
function unaccent(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function parseEditorialSheet(text) {
  const values = {};

  for (const rawLine of String(text ?? '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Una línea tipo "Etiqueta: valor" donde la etiqueta esté en la lista.
    const labelMatch = line.match(/^([^:]{1,40}):\s*([\s\S]*)$/);
    const label = labelMatch ? unaccent(labelMatch[1].replace(/\(.*?\)/g, '')) : null;
    const field = label && Object.keys(SHEET_FIELD_PATTERNS).find(name => SHEET_FIELD_PATTERNS[name].test(label));

    if (field) {
      values[field] = labelMatch[2].trim();
      continue;
    }

    // Continuación multilínea: una línea corta con dos puntos que no es una
    // etiqueta conocida cierra el campo abierto (p. ej. "Tema central: ...").
    if (/^[A-ZÁÉÍÓÚÜÑ0-9][^:]{0,28}:\s/.test(line)) {
      continue;
    }
    // Otras líneas sueltas (prosa, casillas de verificación) se ignoran.
  }

  // El campo largo "Resumen" completa el extracto si la ficha no trae
  // "Extracto breve" (Summary cumple el mismo papel en la ficha EN).
  if (!values.excerpt && values.summary) values.excerpt = values.summary;

  const categoryValue = unaccent(values.category ?? '');
  const categoryHit = CATEGORY_KEY_BY_MATCH.find(([needle]) => categoryValue.includes(needle));

  return {
    title: values.title ?? '',
    subtitle: values.subtitle ?? '',
    seoTitle: values.seoTitle ?? '',
    metaDescription: values.metaDescription ?? '',
    excerpt: values.excerpt ?? '',
    keywords: normalizeKeywords(values.keywords),
    slug: values.slug ?? '',
    author: values.author ?? '',
    category: categoryHit ? categoryHit[1] : '',
  };
}
