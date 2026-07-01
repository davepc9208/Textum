import { SITE_URL } from "./constants.js";

export function buildHreflang(path: string) {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  const es = `${SITE_URL}/es${cleanPath}`;
  const en = `${SITE_URL}/en${cleanPath}`;

  return `
    <xhtml:link rel="alternate" hreflang="es" href="${es}" />
    <xhtml:link rel="alternate" hreflang="en" href="${en}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${es}" />
  `;
}