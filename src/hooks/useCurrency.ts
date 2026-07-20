// src/hooks/useCurrency.ts
// v3.1 — localStorage en lugar de sessionStorage.
// sessionStorage se borra al cerrar la pestaña, haciendo el TTL de 7 días inútil.
// localStorage persiste entre sesiones → cdn-cgi/trace se llama una vez por semana
// en lugar de una vez por pestaña.

import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR';

const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES',
  'GB','CH','SE','NO','DK','PL','CZ','HU','RO','BG','HR','RS','BA',
  'ME','MK','AL','AD','MC','SM','XK','LI','IS',
]);

const EUR_TZ_PREFIXES = ['Europe/', 'Atlantic/'];

const CACHE_KEY = 'textum_currency_v3';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 días

interface CacheEntry { currency: Currency; timestamp: number }

function readCache(): Currency | null {
  try {
    // localStorage persiste entre sesiones (era sessionStorage)
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

function writeCache(currency: Currency) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ currency, timestamp: Date.now() }));
  } catch { /* storage lleno — ignorar */ }
}

function guessFromTimezone(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return EUR_TZ_PREFIXES.some(p => tz.startsWith(p)) ? 'EUR' : 'USD';
  } catch { return 'USD'; }
}

function parseTrace(text: string): Record<string, string> {
  return Object.fromEntries(
    text.trim().split('\n').map(l => l.split('='))
  );
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  const [currency, setCurrency] = useState<Currency>(() => {
    return readCache() ?? guessFromTimezone();
  });
  const [loading, setLoading] = useState(() => readCache() === null);

  useEffect(() => {
    if (readCache() !== null) {
      setLoading(false);
      return;
    }

    const doFetch = () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      fetch('/cdn-cgi/trace', { signal: controller.signal })
        .then(r => r.text())
        .then(text => {
          clearTimeout(timer);
          const parsed = parseTrace(text);
          const countryCode = parsed['loc'] ?? '';
          const detected: Currency = EUR_COUNTRIES.has(countryCode) ? 'EUR' : 'USD';
          writeCache(detected);
          setCurrency(detected);
          setLoading(false);
        })
        .catch(() => {
          clearTimeout(timer);
          setLoading(false);
        });
    };

    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(doFetch, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(doFetch, 500);
      return () => clearTimeout(id);
    }
  }, []);

  return { currency, loading };
}

export function formatPrice(usd: number, eur: number, currency: Currency): string {
  return currency === 'EUR' ? `${eur} €` : `${usd} USD`;
}
