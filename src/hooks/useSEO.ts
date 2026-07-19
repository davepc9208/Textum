// src/hooks/useSEO.ts
// Fix og:locale: es_EC → es_ES para audiencia europea/internacional
// Fix og:image:alt añadido (mejora accesibilidad OG y LinkedIn)
// Fix article:modified_time añadido cuando está disponible

import { useEffect } from 'react';

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

const SITE_URL = 'https://mentoriatextum.com';
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

    // ── Helpers ────────────────────────────────────────────────────
    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]`;
      let el = document.querySelector(selector) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        if (hreflang) el.setAttribute('hreflang', hreflang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    const canonicalUrl = canonical
      ? `${SITE_URL}${canonical}`
      : SITE_URL + window.location.pathname;
    const image    = ogImage    || DEFAULT_IMAGE;
    const imageAlt = ogImageAlt || DEFAULT_IMAGE_ALT;

    // ── Standard meta ──────────────────────────────────────────────
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    if (keywords) setMeta('name', 'keywords', keywords);

    // ── Canonical ──────────────────────────────────────────────────
    setLink('canonical', canonicalUrl);

    // ── Hreflang alternates ────────────────────────────────────────
    // Ayuda a Google a entender que la misma URL sirve contenido bilingüe
    setLink('alternate', canonicalUrl, lang);
    setLink('alternate', canonicalUrl, 'x-default');

    // ── Open Graph ─────────────────────────────────────────────────
    setMeta('property', 'og:title',       title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url',         canonicalUrl);
    setMeta('property', 'og:image',       image);
    setMeta('property', 'og:image:alt',   imageAlt);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height','630');
    setMeta('property', 'og:type',        ogType);

    // Fix: es_ES para mercado español/europeo, es_EC era demasiado local
    // y confundía a LinkedIn/Facebook en el mercado objetivo principal
    const ogLocale = lang === 'es' ? 'es_ES' : 'en_GB';
    setMeta('property', 'og:locale', ogLocale);

    // Alternate locale: permite que FB muestre en ambos idiomas
    const ogLocaleAlt = lang === 'es' ? 'en_GB' : 'es_ES';
    let ogLocaleAltEl = document.querySelector('meta[property="og:locale:alternate"]') as HTMLMetaElement | null;
    if (!ogLocaleAltEl) {
      ogLocaleAltEl = document.createElement('meta');
      ogLocaleAltEl.setAttribute('property', 'og:locale:alternate');
      document.head.appendChild(ogLocaleAltEl);
    }
    ogLocaleAltEl.setAttribute('content', ogLocaleAlt);

    setMeta('property', 'og:site_name', 'TEXTUM — Mentoría Académica');

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
    return () => {
      document.title = 'TEXTUM — Mentoría Académica';
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
