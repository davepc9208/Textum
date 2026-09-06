// functions/_shared/attribution.js
// Normaliza el objeto de atribución que envía el cliente a columnas seguras de
// la tabla `leads`. Solo trunca y descarta tipos raros; nunca lanza.

function str(value, max) {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : null;
}

function isoOrNull(value) {
  if (typeof value !== 'string') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Objeto plano con solo las claves presentes, listo para .insert(). */
export function attributionForInsert(input) {
  const a = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const fields = {
    utm_source: str(a.utm_source, 120),
    utm_medium: str(a.utm_medium, 120),
    utm_campaign: str(a.utm_campaign, 150),
    utm_term: str(a.utm_term, 150),
    utm_content: str(a.utm_content, 150),
    gclid: str(a.gclid, 200),
    fbclid: str(a.fbclid, 200),
    referrer: str(a.referrer, 200),
    landing_path: str(a.landing_path, 300),
    first_seen_at: isoOrNull(a.first_seen_at),
  };
  const row = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value != null) row[key] = value;
  }
  return row;
}

/** Líneas HTML para incrustar la atribución en un email de aviso. */
export function attributionSummaryHtml(input, escapeHtml) {
  const row = attributionForInsert(input);
  const keys = Object.keys(row);
  if (keys.length === 0) return '';
  const items = keys
    .map((k) => `<li><strong>${k}:</strong> ${escapeHtml(String(row[k]))}</li>`)
    .join('');
  return `<hr><p style="font-size:12px;color:#667"><strong>Atribución:</strong></p><ul style="font-size:12px;color:#667">${items}</ul>`;
}
