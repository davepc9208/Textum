import { SITE_URL } from './constants.js';

export function buildHreflang(path: string) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const es = new URL(cleanPath, SITE_URL).toString();
  const enUrl = new URL(cleanPath, SITE_URL);
  enUrl.searchParams.set('lang', 'en');
  const en = enUrl.toString();
  return `
    <xhtml:link rel="alternate" hreflang="es" href="${es}" />
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${es}" />
  `;
}
