// src/hooks/useCurrency.ts
//
// Detección de moneda 100% en cliente, sin red: se lee una caché en localStorage
// (7 días) y, si no hay, se estima por zona horaria (Europe/* y Atlantic/* → EUR;
// el resto → USD). Sin llamadas a /cdn-cgi/trace ni a APIs de geolocalización,
// para no añadir peticiones a la ruta crítica.
//
// Los precios que se muestran son orientativos; el importe real se fija en el
// servidor en el momento del cobro.

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
