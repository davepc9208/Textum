// src/lib/sanitize.ts
// Sanitiza HTML antes de pasarlo a dangerouslySetInnerHTML.
// Previene ataques XSS almacenado provenientes de contenido guardado en Supabase.
//
// INSTALAR:
//   npm install dompurify @types/dompurify
//
// USO en PostPage.tsx y AdminPage.tsx (preview):
//   import { sanitizeHtml } from '../lib/sanitize';
//   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />

import DOMPurify from 'dompurify';

// ── Hook global: se registra una sola vez al importar el módulo ──────────────
if (typeof window !== 'undefined') {
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    if (node.tagName !== 'A') return;

    // 1. Forzar rel seguro en todos los enlaces que abran nueva pestaña
    if (node.getAttribute('target') === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }

    // 2. Bloquear protocolos peligrosos (javascript:, data:, vbscript:)
    const href = node.getAttribute('href') ?? '';
    if (/^(javascript|data|vbscript):/i.test(href.trim())) {
      node.removeAttribute('href');
    }
  });
}

// ── Tags generados por Tiptap StarterKit + Image + Link ─────────────────────
const ALLOWED_TAGS = [
  // Estructura
  'p', 'br', 'hr',
  // Encabezados
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Formato inline
  'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'code', 'kbd', 'sup', 'sub',
  // Bloques
  'blockquote', 'pre',
  // Listas
  'ul', 'ol', 'li',
  // Media
  'img',
  // Enlace
  'a',
  // Tabla
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
];

const ALLOWED_ATTR = [
  // Imágenes
  'src', 'srcset', 'sizes', 'alt', 'width', 'height', 'loading', 'decoding',
  // Enlaces
  'href', 'target', 'rel',
  // Clases Tiptap
  'class',
  // Accesibilidad
  'title', 'aria-label',
];

/**
 * Sanitiza una cadena HTML y devuelve HTML seguro para renderizar.
 *
 * @example
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  // En SSR / entornos sin DOM devolvemos string vacío por seguridad.
  if (typeof window === 'undefined') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Prohibir atributos inline style (pueden usarse para UI redressing)
    FORBID_ATTR: ['style'],
    // No permitir atributos data-* (innecesarios y potencialmente peligrosos)
    ALLOW_DATA_ATTR: false,
  });
}
