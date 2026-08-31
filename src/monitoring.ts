// src/monitoring.ts
// Sentry se carga de forma diferida (import dinámico) para que el SDK no viaje
// en el bundle inicial de la home. Si no hay DSN válido, nunca se descarga.

type SentryModule = typeof import('@sentry/react');

const rawDsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim() || '';
const environment = (import.meta.env.MODE || 'development') as string;

function isValidDsn(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.username) && url.hostname.endsWith('.ingest.sentry.io');
  } catch {
    return false;
  }
}

const dsn = isValidDsn(rawDsn) ? rawDsn : '';

let sentry: SentryModule | null = null;
let loadPromise: Promise<SentryModule | null> | null = null;

function loadSentry(): Promise<SentryModule | null> {
  if (!dsn) return Promise.resolve(null);
  if (sentry) return Promise.resolve(sentry);
  if (!loadPromise) {
    loadPromise = import('@sentry/react')
      .then((mod) => {
        mod.init({
          dsn,
          environment,
          release: import.meta.env.VITE_APP_VERSION as string | undefined,
          tracesSampleRate: environment === 'production' ? 0.1 : 0,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          sendDefaultPii: false,
        });
        sentry = mod;
        return mod;
      })
      .catch(() => null);
  }
  return loadPromise;
}

// Precarga el SDK cuando el navegador está inactivo, sin bloquear la carga.
if (dsn && typeof window !== 'undefined') {
  const warm = () => { void loadSentry(); };
  const ric = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => void;
  }).requestIdleCallback;
  if (ric) ric(warm, { timeout: 3000 });
  else window.setTimeout(warm, 2000);
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  console.error('[TEXTUM] application error', { error, ...context });
  if (!dsn) return;
  void loadSentry().then((mod) => {
    if (!mod) return;
    mod.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
      mod.captureException(error);
    });
  });
}
