export type Locale = 'es' | 'en';

export const SITE_URL = 'https://www.mentoriatextum.com';

export function getLocaleFromUrl(): Locale | null {
  if (typeof window === 'undefined') return null;
  const value = new URL(window.location.href).searchParams.get('lang');
  return value === 'en' || value === 'es' ? value : null;
}

export function localizedPath(path: string, lang: Locale): string {
  const url = new URL(path, SITE_URL);
  url.searchParams.delete('lang');
  if (lang === 'en') url.searchParams.set('lang', 'en');
  return `${url.pathname}${url.search}${url.hash}`;
}

export function localizedUrl(path: string, lang: Locale): string {
  return new URL(localizedPath(path, lang), SITE_URL).toString();
}

export function canonicalVariants(path: string): { es: string; en: string; xDefault: string } {
  return {
    es: localizedUrl(path, 'es'),
    en: localizedUrl(path, 'en'),
    xDefault: localizedUrl(path, 'es'),
  };
}
