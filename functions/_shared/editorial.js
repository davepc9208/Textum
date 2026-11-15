export function normalizeKeywords(value) {
  return (value ?? '')
    .split(/[;,]/)
    // Las listas de las fichas suelen terminar en punto; no forma parte del término.
    .map(keyword => keyword.trim().replace(/[.;,]+$/, '').trim())
    .filter(Boolean)
    .join(', ');
}

// Etiquetas de la ficha editorial que se reconocen, en su forma canónica y
// también con variantes habituales (mayúsculas, acentos, paréntesis, etc.).
// Las fichas se preparan en español y en inglés (artículo ES/EN), así que cada
// etiqueta reconoce ambas formas. El chequeo va sobre el texto sin acentos ni
// mayúsculas, de modo que "Título SEO" y "titulo seo" son lo mismo.
//
// Las fichas cambian de diseño con frecuencia: unas traen «Etiqueta: valor» en
// líneas seguidas y otras lo traen en tablas. El parser no asume ninguna de las
// dos formas; solo necesita reconocer la etiqueta y encontrar su valor.
const SHEET_FIELD_PATTERNS = {
  title:            /^(titulo|title)( h1)?$/,
  subtitle:         /^(subtitulo|subtitle)( h2)?$/,
  seoTitle:         /^(titulo seo|seo title|titulo meta|meta titulo|meta title)$/,
  metaDescription:  /^(meta descripcion|meta description|descripcion seo|seo description)$/,
  excerpt:          /^(extracto|extracto breve|short excerpt|excerpt)$/,
  summary:          /^(resumen|summary|resumen editorial|editorial summary|resumen ejecutivo|executive summary)$/,
  keywords:         /^(palabras clave|keywords|palabras clave principales|palabra clave principal|primary keywords|main keyword)$/,
  keywordsSecondary: /^(palabras clave secundarias|palabras clave de apoyo|secondary keywords)$/,
  slug:             /^(slug|slug recomendado|slug sugerido|suggested slug|recommended slug)$/,
  author:           /^(autoria|autor|autora|author|authorship)$/,
  category:         /^(categoria|category)( (principal|main))?$/,
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

// Quita la decoración que puede traer el texto según cómo se haya extraído el
// documento: encabezados markdown (#), viñetas, negritas/cursivas y barras de
// tabla en los extremos.
function stripDecorations(line) {
  return String(line ?? '')
    .replace(/\u00a0/g, ' ')
    .replace(/^[\s#>*\-–—•·]+/, '')
    .replace(/\*\*|__|`/g, '')
    .replace(/^\|+|\|+$/g, '')
    .trim();
}

// Compara una etiqueta con la lista de campos conocidos.
function matchField(label) {
  const clean = unaccent(String(label ?? '').replace(/\(.*?\)/g, ''))
    .replace(/\s+/g, ' ')
    .replace(/[:\s]+$/, '')
    .trim();
  if (!clean || clean.length > 40) return null;
  return Object.keys(SHEET_FIELD_PATTERNS).find(name => SHEET_FIELD_PATTERNS[name].test(clean)) ?? null;
}

// "Etiqueta | valor | extra" → ['Etiqueta', 'valor | extra'].
function splitRow(line) {
  if (!line.includes('|')) return [line, ''];
  const cells = line.split('|').map(cell => cell.trim());
  while (cells.length > 1 && !cells[0]) cells.shift();
  while (cells.length > 1 && !cells[cells.length - 1]) cells.pop();
  return [cells[0], cells.slice(1).filter(Boolean).join(' | ')];
}

function countTerms(value) {
  return String(value ?? '').split(/[;,]/).filter(term => term.trim()).length;
}

export function parseEditorialSheet(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const found = {};
  const keywordCandidates = [];

  const record = (field, value) => {
    const clean = String(value ?? '').trim();
    if (!clean) return;
    if (field === 'keywords' || field === 'keywordsSecondary') {
      keywordCandidates.push(clean);
      return;
    }
    // El primer valor encontrado gana: si la ficha repite una etiqueta en una
    // lista de comprobación posterior, no sobrescribe el dato real.
    if (!found[field]) found[field] = clean;
  };

  for (let index = 0; index < lines.length; index++) {
    const line = stripDecorations(lines[index]);
    if (!line) continue;
    // Casillas de verificación y restos de listas.
    if (/^[☐☑✓×]/.test(line)) continue;

    // 1) Fila de tabla: "Etiqueta | valor" (venga del extractor que venga).
    const [firstCell, restCells] = splitRow(line);
    const rowField = matchField(firstCell);
    if (rowField && restCells) {
      record(rowField, restCells);
      continue;
    }

    // 2) Formato clásico "Etiqueta: valor".
    const colon = line.match(/^([^:]{1,40}):\s*([\s\S]*)$/);
    const colonField = colon ? matchField(colon[1]) : null;
    if (colonField) {
      record(colonField, colon[2]);
      continue;
    }

    // 3) "Etiqueta\tvalor": celdas de tabla separadas por tabulación.
    if (line.includes('\t')) {
      const [label, ...rest] = line.split('\t');
      const tabField = matchField(label);
      if (tabField) {
        record(tabField, rest.join(' '));
        continue;
      }
    }

    // 4) Etiqueta sola en su párrafo (celdas de tabla una por línea, o
    //    encabezado de sección): el valor es el párrafo siguiente.
    const bareField = matchField(line);
    if (!bareField) continue;
    for (let next = index + 1; next < lines.length; next++) {
      const candidate = stripDecorations(lines[next]);
      if (!candidate) continue;
      // Si el siguiente párrafo es otra etiqueta, este campo venía vacío.
      if (matchField(candidate)) break;
      record(bareField, candidate);
      index = next;
      break;
    }
  }

  // El campo largo "Resumen" completa el extracto si la ficha no trae
  // "Extracto breve" (Summary cumple el mismo papel en la ficha EN).
  if (!found.excerpt && found.summary) found.excerpt = found.summary;

  // Las fichas repiten las palabras clave en sitios distintos (principal,
  // secundarias y lista final); nos quedamos con la lista más completa.
  const keywords = keywordCandidates
    .slice()
    .sort((a, b) => countTerms(b) - countTerms(a))[0] ?? '';

  const categoryValue = unaccent(found.category ?? '');
  const categoryHit = CATEGORY_KEY_BY_MATCH.find(([needle]) => categoryValue.includes(needle));

  return {
    title: found.title ?? '',
    subtitle: found.subtitle ?? '',
    seoTitle: found.seoTitle ?? '',
    metaDescription: found.metaDescription ?? '',
    excerpt: found.excerpt ?? '',
    keywords: normalizeKeywords(keywords),
    slug: found.slug ?? '',
    author: found.author ?? '',
    category: categoryHit ? categoryHit[1] : '',
  };
}
