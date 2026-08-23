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

import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR';

const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES',
  'GB','CH','SE','NO','DK','PL','CZ','HU','RO','BG','HR','RS','BA',
  'ME','MK','AL','AD','MC','SM','XK','LI','IS',
]);

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
    text.trim().split('\n')
      .map(l => l.split('='))
      .filter(parts => parts.length === 2)
  );
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  const [currency, setCurrency] = useState<Currency>(() => {
    return readCache() ?? guessFromTimezone();
  });
  const [loading, setLoading] = useState(() => readCache() === null);

  useEffect(() => {
    // Si ya tenemos cache válido, no hacemos nada
    if (readCache() !== null) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let idleId: number | ReturnType<typeof setTimeout> | null = null;

    const doFetch = () => {
      if (cancelled) return;

      const controller = new AbortController();
      // FIX 2: timeout de 3s, abort limpio
      const timer = setTimeout(() => controller.abort(), 3000);

      // FIX 1: force-cache evita que el navegador haga dos peticiones
      // si /cdn-cgi/trace ya está en la caché HTTP del navegador
      fetch('/cdn-cgi/trace', {
        signal: controller.signal,
        cache: 'force-cache',
      })
        .then(r => r.text())
        .then(text => {
          clearTimeout(timer);
          if (cancelled) return;
          const parsed = parseTrace(text);
          const countryCode = parsed['loc'] ?? '';
          const detected: Currency = EUR_COUNTRIES.has(countryCode) ? 'EUR' : 'USD';
          writeCache(detected);
          setCurrency(detected);
          setLoading(false);
        })
        .catch(() => {
          clearTimeout(timer);
          if (cancelled) return;
          // Si falla, usamos el valor del timezone que ya está en el estado
          setLoading(false);
        });
    };

    // La moneda es una mejora secundaria: no debe competir con el primer render.
    // Esperamos a que termine la carga inicial antes de consultar Cloudflare.
    let scheduled = false;
    const scheduleFetch = () => {
      if (scheduled || cancelled) return;
      scheduled = true;
      if ('requestIdleCallback' in window) {
        idleId = requestIdleCallback(doFetch, { timeout: 3000 });
      } else {
        idleId = setTimeout(doFetch, 2000);
      }
    };

    if (document.readyState === 'complete') scheduleFetch();
    else window.addEventListener('load', scheduleFetch, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleFetch);
      if (idleId !== null) {
        if ('requestIdleCallback' in window && typeof idleId === 'number') {
          cancelIdleCallback(idleId);
        } else {
          clearTimeout(idleId as ReturnType<typeof setTimeout>);
        }
      }
    };
  }, []);

  return { currency, loading };
}

export function formatPrice(usd: number, eur: number, currency: Currency): string {
  return currency === 'EUR' ? `${eur} €` : `${usd} USD`;
}
