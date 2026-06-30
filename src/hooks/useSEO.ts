import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  articleMeta?: {
    publishedTime: string;
    author: string;
    tags?: string[];
  };
  lang?: 'es' | 'en';
  noindex?: boolean;
  keywords?: string;
}

const SITE_URL = 'https://mentoriatextum.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

export function useSEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  articleMeta,
  lang = 'es',
  noindex = false,
  keywords,
}: SEOProps) {
  useEffect(() => {
    // Title
    document.title = title;

    // Lang
    document.documentElement.lang = lang;

    // Helper to set/create meta tags
    const setMeta = (attr: string, value: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${value}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Helper to set/create link tags
    const setLink = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };

    const canonicalUrl = canonical
      ? `${SITE_URL}${canonical}`
      : SITE_URL + window.location.pathname;
    const image = ogImage || DEFAULT_IMAGE;

    // Standard meta
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    if (keywords) setMeta('name', 'keywords', keywords);

    // Canonical
    setLink('canonical', canonicalUrl);

    // Open Graph
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:image:width', '1200');
    setMeta('property', 'og:image:height', '630');
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:locale', lang === 'es' ? 'es_EC' : 'en_GB');
    setMeta('property', 'og:site_name', 'TEXTUM — Mentoría Académica');

    // Twitter Card
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);

    // Article-specific meta
    if (ogType === 'article' && articleMeta) {
      setMeta('property', 'article:published_time', articleMeta.publishedTime);
      setMeta('property', 'article:author', articleMeta.author);
      if (articleMeta.tags) {
        articleMeta.tags.forEach((tag, i) => {
          let el = document.querySelector(`meta[property="article:tag"][data-index="${i}"]`) as HTMLMetaElement | null;
          if (!el) {
            el = document.createElement('meta');
            el.setAttribute('property', 'article:tag');
            el.setAttribute('data-index', String(i));
            document.head.appendChild(el);
          }
          el.setAttribute('content', tag);
        });
      }
    }

    // Cleanup on unmount
    return () => {
      document.title = 'TEXTUM — Mentoría Académica';
    };
  }, [title, description, canonical, ogImage, ogType, lang, noindex, articleMeta, keywords]);
}

// ── JSON-LD Schema helpers ──────────────────────────────────────────────────

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
