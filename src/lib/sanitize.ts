// src/lib/sanitize.ts
import DOMPurify from 'dompurify';

/** Sanitiza HTML de artículos (blog / colecciones) antes de dangerouslySetInnerHTML */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel', 'loading', 'decoding', 'fetchpriority'],
    ADD_TAGS: ['iframe'], // si no usáis iframes, quitar
    FORBID_TAGS: ['script', 'style', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
  });
}
