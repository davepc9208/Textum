import type { Locale } from './locale';
import type { Post } from './supabase';

/** Campos localizados con fallback a la estructura histórica de posts. */
export function postSlug(post: Post, lang: Locale): string {
  if (lang === 'en') return post.slug_en || post.slug_es || post.slug;
  return post.slug_es || post.slug;
}

export function postCover(post: Post, lang: Locale): string {
  if (lang === 'en') return post.cover_url_en || post.cover_url_es || post.cover_url;
  return post.cover_url_es || post.cover_url;
}

export function postCoverAlt(post: Post, lang: Locale, fallbackTitle: string): string {
  if (lang === 'en') return post.cover_alt_en || post.cover_alt_es || post.cover_alt || fallbackTitle;
  return post.cover_alt_es || post.cover_alt || fallbackTitle;
}

/** Slug seguro para el filtro OR de PostgREST (los slugs del editor son ASCII). */
export function slugFilter(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function localizedPostPath(post: Post, lang: Locale, prefix = '/blog'): string {
  return `${prefix}/${postSlug(post, lang)}`;
}
