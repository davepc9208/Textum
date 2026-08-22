export const CAL_LINK = (import.meta.env.VITE_CAL_LINK as string | undefined)?.trim() || '';

export function diagnosisHref() {
  return CAL_LINK || '#contacto';
}

export function trackConversion(event: string, metadata: Record<string, string> = {}) {
  window.dispatchEvent(new CustomEvent('textum-conversion', { detail: { event, ...metadata } }));
  const clarity = (window as Window & { clarity?: (...args: unknown[]) => void }).clarity;
  clarity?.('event', event);
}
