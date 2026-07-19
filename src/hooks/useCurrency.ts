// src/hooks/useCurrency.ts
// v3 — usa Cloudflare cdn-cgi/trace para detección de país.
// Elimina ipapi.co que causaba ~2600ms de LCP (identificado en PageSpeed).
// cdn-cgi/trace es el endpoint nativo de Cloudflare: ~10ms, sin rate limit,
// sin claves, disponible en cualquier dominio de Cloudflare Pages.
//
// Flujo:
// 1. Lectura síncrona de sessionStorage → resultado inmediato (sin fetch)
// 2. Estimación síncrona por timezone con Intl.DateTimeFormat → estado inicial instantáneo
// 3. Confirmación asíncrona diferida (idle/500ms) con cdn-cgi/trace
// 4. Escritura en sessionStorage con TTL de 7 días

import { useState, useEffect } from 'react';

export type Currency = 'USD' | 'EUR';

// Países de la zona euro + Europa ampliada que prefiere EUR
const EUR_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT','LV','LT','LU',
  'MT','NL','PT','SK','SI','ES',
  'GB','CH','SE','NO','DK','PL','CZ','HU','RO','BG','HR','RS','BA',
  'ME','MK','AL','AD','MC','SM','XK','LI','IS',
]);

// Timezones europeas para estimación síncrona inicial
const EUR_TZ_PREFIXES = ['Europe/', 'Atlantic/'];

const CACHE_KEY  = 'textum_currency_v3';
const CACHE_TTL  = 7 * 24 * 60 * 60 * 1000; // 7 días

interface CacheEntry { currency: Currency; timestamp: number }

function readCache(): Currency | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry.currency;
  } catch { return null; }
}

function writeCache(currency: Currency) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ currency, timestamp: Date.now() }));
  } catch { /* storage lleno — ignorar */ }
}

// Estimación síncrona por timezone (no requiere fetch)
function guessFromTimezone(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return EUR_TZ_PREFIXES.some(p => tz.startsWith(p)) ? 'EUR' : 'USD';
  } catch { return 'USD'; }
}

// Parsea la respuesta de texto plano de cdn-cgi/trace
// Formato: "key=value\nkey=value\n..."
function parseTrace(text: string): Record<string, string> {
  return Object.fromEntries(
    text.trim().split('\n').map(l => l.split('='))
  );
}

export function useCurrency(): { currency: Currency; loading: boolean } {
  // Estado inicial: caché → estimación timezone → USD
  const [currency, setCurrency] = useState<Currency>(() => {
    return readCache() ?? guessFromTimezone();
  });
  // Si ya tenemos caché, no mostramos spinner
  const [loading, setLoading] = useState(() => readCache() === null);

  useEffect(() => {
    // Si ya hay caché, no hacemos nada más
    if (readCache() !== null) {
      setLoading(false);
      return;
    }

    const doFetch = () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);

      // cdn-cgi/trace: endpoint nativo de Cloudflare, ~10ms, siempre disponible
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
          // Mantiene la estimación por timezone ya aplicada
          setLoading(false);
        });
    };

    // Diferir post-LCP: idle o 500ms
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
