export const CAL_LINK = (import.meta.env.VITE_CAL_LINK as string | undefined)?.trim() || '';
export const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim() || '';
export const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || '';

export function diagnosisHref() {
  return CAL_LINK || '#contacto';
}

type W = Window & {
  clarity?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

/**
 * Registra una conversión en todos los canales de analítica disponibles.
 * Cada destino es best-effort: si no está cargado (sin consentimiento o sin ID),
 * simplemente no hace nada.
 */
export function trackConversion(event: string, metadata: Record<string, string> = {}) {
  const w = window as W;
  // Evento interno (lo escuchan experimentos / listeners propios).
  w.dispatchEvent(new CustomEvent('textum-conversion', { detail: { event, ...metadata } }));
  // Microsoft Clarity
  w.clarity?.('event', event);
  // GA4 (gtag). Nombre de evento en snake_case, ya lo está.
  w.gtag?.('event', event, metadata);
  // Meta Pixel — evento personalizado.
  w.fbq?.('trackCustom', event, metadata);
}
