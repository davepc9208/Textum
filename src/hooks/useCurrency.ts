// src/hooks/useCurrency.ts
// Detecta la región del visitante y devuelve la moneda apropiada.
// Europa → EUR · Resto del mundo → USD
// Fallback a USD si la API falla o tarda más de 3s.

import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR';

// Países que usan EUR como moneda oficial (zona euro + países europeos de facto)
const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES',
  // Países europeos que aunque no son zona euro sus compradores prefieren EUR:
  'GB','CH','SE','NO','DK','PL','CZ','HU','RO','BG','HR','RS','BA','ME','MK','AL',
  // Andorra, Monaco, San Marino, Kosovo, Montenegro (usan EUR)
  'AD','MC','SM','XK',
]);

const CACHE_KEY = 'textum_currency';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  currency: Currency;
  timestamp: number;
}

function readCache(): Currency | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) return null;
    return entry.currency;
  } catch {
    return null;
  }
}

function writeCache(currency: Currency) {
  try {
    const entry: CacheEntry = { currency, timestamp: Date.now() };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage no disponible — ignorar
  }
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Leer caché primero
    const cached = readCache();
    if (cached) {
      setCurrency(cached);
      setLoading(false);
      return;
    }

    // 2. Timeout de 3s — si la API tarda, usamos USD
    const timer = setTimeout(() => {
      setCurrency('USD');
      setLoading(false);
    }, 3000);

    // 3. Llamada a la API de geolocalización (sin API key requerida)
    fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) })
      .then((r) => r.json())
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

    return () => clearTimeout(timer);
  }, []);

  return { currency, loading };
}

// Helper para formatear precio según moneda
export function formatPrice(usd: number, eur: number, currency: Currency): string {
  if (currency === 'EUR') {
    return `${eur} €`;
  }
  return `${usd} USD`;
}
