// functions/_shared/sanitize-html.js
// Utilidades de HTML compartidas por las funciones SSR (blog y colecciones).
//
// sanitizeArticleHtml es un sanitizador por LISTA BLANCA basado en regex. El
// contenido lo escribe un admin con MFA (Tiptap), pero al servirse también a
// humanos se restringe a un conjunto conocido de etiquetas y atributos.
// (Lo ideal en el runtime de Workers sería HTMLRewriter; queda como mejora.)

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function stripHtml(value) {
  return String(value ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncate(text, maxLength) {
  const value = String(text ?? '');
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}

const ALLOWED_TAGS = new Set([
  'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 's', 'sub', 'sup', 'mark', 'small',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'a', 'img', 'figure', 'figcaption', 'span', 'div',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
]);

const ALLOWED_ATTR = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height', 'loading', 'decoding']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};

// HTML decodes character references inside URL attributes before navigation.
// Decode them here too so encoded javascript:/data: schemes cannot bypass checks.
function decodeHtmlAttribute(value) {
  return value
    .replace(/&colon;?/gi, ':')
    .replace(/&tab;?/gi, '\t')
    .replace(/&newline;?/gi, '\n')
    .replace(/&#(?:x([0-9a-f]+)|([0-9]+));?/gi, (_match, hex, decimal) => {
      const codePoint = Number.parseInt(hex || decimal, hex ? 16 : 10);
      if (!Number.isFinite(codePoint) || codePoint === 0 || codePoint > 0x10ffff || (codePoint >= 0xd800 && codePoint <= 0xdfff)) return '\uFFFD';
      return String.fromCodePoint(codePoint);
    });
}

function isSafeUrl(value) {
  const normalized = decodeHtmlAttribute(String(value)).replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  return !/^(?:javascript|vbscript|data):/i.test(normalized);
}

export function sanitizeArticleHtml(html) {
  let out = String(html || '');

  // 1. Elementos peligrosos: se eliminan junto con su contenido.
  out = out.replace(
    /<(script|style|iframe|object|embed|noscript|template|svg|math|form|base|meta|link)\b[\s\S]*?<\/\1\s*>/gi,
    '',
  );
  out = out.replace(/<(script|style|iframe|object|embed|form|base|meta|link)\b[^>]*\/?>/gi, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Cada etiqueta: fuera de la lista blanca → se descarta.
  out = out.replace(/<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, (_match, slash, rawName, rawAttrs) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (slash) return `</${name}>`;

    const allowed = ALLOWED_ATTR[name];
    const attrs = [];
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/g;
    let m;
    while ((m = attrRe.exec(rawAttrs)) !== null) {
      const attr = m[1].toLowerCase();
      const rawValue = m[2] ?? m[3] ?? m[4] ?? '';
      const value = rawValue;
      if (attr.startsWith('on')) continue;
      if (attr === 'class') {
        attrs.push(`class="${value.replace(/["<>]/g, '').slice(0, 200)}"`);
        continue;
      }
      if (!allowed || !allowed.has(attr)) continue;
      if ((attr === 'href' || attr === 'src') && !isSafeUrl(rawValue)) continue;
      attrs.push(`${attr}="${rawValue.replace(/"/g, '&quot;')}"`);
    }
    if (name === 'a' && !attrs.some((a) => a.startsWith('rel='))) attrs.push('rel="nofollow ugc"');
    return `<${name}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`;
  });

  // 3. Defensivo: cualquier handler on* que hubiera sobrevivido.
  out = out.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return out;
}
