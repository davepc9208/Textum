import * as Sentry from '@sentry/react';

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

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    release: import.meta.env.VITE_APP_VERSION as string | undefined,
    tracesSampleRate: environment === 'production' ? 0.1 : 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    sendDefaultPii: false,
  });
}

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (dsn) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => scope.setExtra(key, value));
      Sentry.captureException(error);
    });
  }
  console.error('[TEXTUM] application error', { error, ...context });
}
