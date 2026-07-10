// src/hooks/useCurrency.ts
// Fix rendimiento: diferir el fetch de ipapi.co post-LCP
// usando requestIdleCallback o setTimeout(500ms)
// Así no bloquea el paint inicial

import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR';

const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES',
  'GB','CH','SE','NO','DK','PL','CZ','HU','RO','BG','HR','RS','BA','ME','MK','AL',
  'AD','MC','SM','XK',
]);

const CACHE_KEY = 'textum_currency';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry { currency: Currency; timestamp: number; }

function readCache(): Currency | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.currency;
  } catch { return null; }
}

function writeCache(currency: Currency) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ currency, timestamp: Date.now() }));
  } catch { /* ignorar */ }
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    // 1. Caché — respuesta inmediata sin fetch
    const cached = readCache();
    if (cached) {
      setCurrency(cached);
      setLoading(false);
      return;
    }

    // 2. Diferir el fetch hasta que el browser esté idle (post-LCP)
    // Evita que ipapi.co compita con recursos críticos en la carga inicial
    const doFetch = () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      fetch('https://ipapi.co/json/', { signal: controller.signal })
        .then(r => r.json())
        .then((data: { country_code?: string }) => {
          clearTimeout(timer);
          const detected: Currency = EUR_COUNTRIES.has(data.country_code ?? '') ? 'EUR' : 'USD';
          writeCache(detected);
          setCurrency(detected);
          setLoading(false);
        })
        .catch(() => {
          clearTimeout(timer);
          setCurrency('USD');
          setLoading(false);
        });
    };

    // requestIdleCallback si disponible, sino setTimeout de 600ms
    // (600ms es suficiente para que el LCP ya haya pintado)
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(doFetch, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const id = setTimeout(doFetch, 600);
      return () => clearTimeout(id);
    }
  }, []);

  return { currency, loading };
}

export function formatPrice(usd: number, eur: number, currency: Currency): string {
  return currency === 'EUR' ? `${eur} €` : `${usd} USD`;
}
