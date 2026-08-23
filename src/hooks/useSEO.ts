// src/hooks/useSEO.ts
// Fix 1: bug selector hreflang — setLink ahora usa selectores específicos
//         por rel+hreflang para no sobreescribir elementos existentes.
// Fix 4: limpieza de article:tag metas al desmontar — el cleanup elimina
//         todos los <meta property="article:tag"> del DOM, evitando que
//         se acumulen al navegar entre artículos.

import { useEffect } from 'react';
import { canonicalVariants, SITE_URL } from '../lib/locale';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  articleMeta?: {
    publishedTime: string;
    modifiedTime?: string;
    author: string;
    tags?: string[];
  };
  lang?: 'es' | 'en';
  noindex?: boolean;
  keywords?: string;
}

const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_IMAGE_ALT = 'TEXTUM — Mentoría Académica Internacional';

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  articleMeta,
  lang = 'es',
  noindex = false,
  keywords,
}: SEOProps) {
  useEffect(() => {
    // ── Title ──────────────────────────────────────────────────────
    document.title = title;

    // ── Lang attribute ─────────────────────────────────────────────
    document.documentElement.lang = lang;

    // ── Helper: meta ───────────────────────────────────────────────
    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(
        `meta[${attr}="${value}"]`
      ) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Fix 1: setLink ahora usa selectores que incluyen TODOS los atributos
    // relevantes para no confundir un hreflang alternate con el canonical.
    // — Sin hreflang: selector por rel + data-seo (evita colisión con
    //   cualquier otro <link rel="alternate"> del DOM, como los de RSS).
    // — Con hreflang: selector por rel + hreflang (único y específico).
    const setLink = (
      rel: string,
      href: string,
      hreflang?: string
    ) => {
      let selector: string;
      let el: HTMLLinkElement | null;

      if (hreflang) {
        selector = `link[rel="${rel}"][hreflang="${hreflang}"]`;
        el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('link');
          el.setAttribute('rel', rel);
          el.setAttribute('hreflang', hreflang);
          document.head.appendChild(el);
        }
      } else {
        // Reutilizar el canonical del HTML inicial evita publicar dos
        // canonicals cuando React termina de hidratar la SPA.
        selector = `link[rel="${rel}"]`;
        el = document.querySelector(selector);
        if (!el) {
          el = document.createElement('link');
          el.setAttribute('rel', rel);
          el.setAttribute('data-seo', '');
          document.head.appendChild(el);
        }
      }

      el.setAttribute('href', href);
    };

    const canonicalPath = canonical || window.location.pathname;
    const variants = canonicalVariants(canonicalPath);
    const canonicalUrl = lang === 'en' ? variants.en : variants.es;
    const image    = ogImage    || DEFAULT_IMAGE;
    const imageAlt = ogImageAlt || DEFAULT_IMAGE_ALT;

    // ── Standard meta ──────────────────────────────────────────────
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    if (keywords) setMeta('name', 'keywords', keywords);

    // ── Canonical ──────────────────────────────────────────────────
    setLink('canonical', canonicalUrl);

    // ── Hreflang alternates ────────────────────────────────────────
    // Fix 1: ahora cada llamada usa su propio selector con hreflang,
    // no interfiere con el canonical ni entre sí.
    setLink('alternate', variants.es, 'es');
    setLink('alternate', variants.en, 'en');
    setLink('alternate', variants.xDefault, 'x-default');

    // ── Open Graph ─────────────────────────────────────────────────
    setMeta('property', 'og:title',          title);
    setMeta('property', 'og:description',    description);
    setMeta('property', 'og:url',            canonicalUrl);
    setMeta('property', 'og:image',          image);
    setMeta('property', 'og:image:alt',      imageAlt);
    setMeta('property', 'og:image:width',    '1200');
    setMeta('property', 'og:image:height',   '630');
    setMeta('property', 'og:type',           ogType);
    setMeta('property', 'og:locale',         lang === 'es' ? 'es_ES' : 'en_GB');
    setMeta('property', 'og:site_name',      'TEXTUM — Mentoría Académica');

    // Alternate locale
    let ogLocaleAltEl = document.querySelector(
      'meta[property="og:locale:alternate"]'
    ) as HTMLMetaElement | null;
    if (!ogLocaleAltEl) {
      ogLocaleAltEl = document.createElement('meta');
      ogLocaleAltEl.setAttribute('property', 'og:locale:alternate');
      document.head.appendChild(ogLocaleAltEl);
    }
    ogLocaleAltEl.setAttribute('content', lang === 'es' ? 'en_GB' : 'es_ES');

    // ── Twitter Card ───────────────────────────────────────────────
    setMeta('name', 'twitter:card',        'summary_large_image');
    setMeta('name', 'twitter:title',       title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image',       image);
    setMeta('name', 'twitter:image:alt',   imageAlt);

    // ── Article-specific ──────────────────────────────────────────
    if (ogType === 'article' && articleMeta) {
      setMeta('property', 'article:published_time', articleMeta.publishedTime);
      if (articleMeta.modifiedTime) {
        setMeta('property', 'article:modified_time', articleMeta.modifiedTime);
      }
      setMeta('property', 'article:author', articleMeta.author);

      articleMeta.tags?.forEach((tag, i) => {
        let el = document.querySelector(
          `meta[property="article:tag"][data-index="${i}"]`
        ) as HTMLMetaElement | null;
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute('property', 'article:tag');
          el.setAttribute('data-index', String(i));
          document.head.appendChild(el);
        }
        el.setAttribute('content', tag);
      });
    }

    // ── Cleanup ────────────────────────────────────────────────────
    // Fix 4: eliminar TODOS los article:tag metas al desmontar.
    // Sin esto, al navegar entre artículos los tags del anterior
    // se acumulan en el <head> indefinidamente.
    return () => {
      document.title = 'TEXTUM — Mentoría Académica';

      // Eliminar article:tag metas
      document
        .querySelectorAll('meta[property="article:tag"]')
        .forEach(el => el.remove());

      // Eliminar article:published_time y article:modified_time
      document
        .querySelectorAll('meta[property^="article:"]')
        .forEach(el => el.remove());
    };
  }, [title, description, canonical, ogImage, ogImageAlt, ogType, lang, noindex, articleMeta, keywords]);
}

// ── JSON-LD helpers ────────────────────────────────────────────────────────

export function injectSchema(schema: object, id = 'schema-main') {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(schema);
}

export function removeSchema(id = 'schema-main') {
  document.getElementById(id)?.remove();
}

export const SITE_URL_EXPORT = SITE_URL;
