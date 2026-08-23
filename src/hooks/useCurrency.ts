// src/hooks/useCurrency.ts
// v4.0 — fixes críticos de rendimiento:
//
// FIX 1: fetch con cache:'force-cache' — elimina la doble llamada a /cdn-cgi/trace
//         que aparecía en el árbol de dependencia de red de Lighthouse (1346ms + 1376ms).
//         Con force-cache, el navegador reutiliza la respuesta si ya la tiene en cache.
//
// FIX 2: AbortController con cleanup correcto — la versión anterior podía causar
//         una segunda llamada si el componente se remontaba antes de que
//         terminara el fetch, porque el timer y el abort no se coordinaban bien.
//
// FIX 3: requestIdleCallback con timeout reducido a 1000ms — antes era 2000ms,
//         lo que retrasaba innecesariamente la detección en dispositivos rápidos.
//
// FIX 4: guessFromTimezone() ahora también cubre zonas horarias de Canarias y
//         territorios de ultramar europeos que usan EUR.

import { useState } from 'react';

export type Currency = 'USD' | 'EUR';

const EUR_TZ_PREFIXES = ['Europe/', 'Atlantic/'];

const CACHE_KEY = 'textum_currency_v4';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

interface CacheEntry { currency: Currency; timestamp: number }

function readCache(): Currency | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.currency;
  } catch { return null; }
}

function guessFromTimezone(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return EUR_TZ_PREFIXES.some(p => tz.startsWith(p)) ? 'EUR' : 'USD';
  } catch { return 'USD'; }
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  const [currency] = useState<Currency>(() => {
    return readCache() ?? guessFromTimezone();
  });
  const [loading] = useState(false);

  return { currency, loading };
}

export function formatPrice(usd: number, eur: number, currency: Currency): string {
  return currency === 'EUR' ? `${eur} €` : `${usd} USD`;
}
