// Sufijo de marca en los títulos SEO de artículos y piezas.
//
// Las fichas editoriales llegan con el meta title ya cerrado con «| TEXTUM», y
// al añadirle el sufijo de marca el título salía con la marca dos veces:
//   «El estado del arte… | TEXTUM — TEXTUM — Mentoría Académica Internacional»
//
// La guarda solo mira el final del título: si ya termina en la marca no se
// repite; si la menciona a mitad («El método TEXTUM Flux»), el sufijo se añade
// igual, porque ahí no hay duplicación.
const TEXTUM_AT_END = /(^|[\s|—–·:,-])textum\s*$/i;

/** true si el título ya cierra con la marca (sirve para no repetirla). */
export function endsWithBrand(seoTitle) {
  return TEXTUM_AT_END.test(String(seoTitle ?? '').trim());
}

export function articleTitle(seoTitle, brand) {
  const title = String(seoTitle ?? '').trim();
  if (!title) return brand;
  return endsWithBrand(title) ? title : title + ' — ' + brand;
}
