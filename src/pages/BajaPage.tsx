// src/pages/BajaPage.tsx
// Página pública de baja de comunicaciones / newsletter

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

type Status = 'idle' | 'loading' | 'ok' | 'error';

export default function BajaPage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setMessage('Enlace incompleto. Usa el enlace de baja que aparece en el correo de TEXTUM.');
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'No se pudo completar la baja. Inténtalo de nuevo o escríbenos.');
          return;
        }
        setStatus('ok');
        setMessage(
          data.message ||
            'Te has dado de baja correctamente. No recibirás más comunicaciones comerciales de TEXTUM.'
        );
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('Error de red. Revisa tu conexión e inténtalo de nuevo.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, token]);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-lg mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="font-serif text-xl tracking-[0.2em] text-navy">
            TEXTUM
          </Link>
          <Link to="/" className="text-xs tracking-widest text-navy/50 hover:text-navy uppercase">
            Inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-navy/10 rounded-sm shadow-lg p-8 text-center">
          <p className="text-[11px] tracking-[0.3em] text-gold uppercase mb-3">Comunicaciones</p>
          <h1 className="font-serif text-2xl text-navy mb-4">Baja de la lista</h1>

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <svg className="animate-spin w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-navy/60">Procesando tu baja…</p>
            </div>
          )}

          {status === 'ok' && (
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-green-50 flex items-center justify-center text-green-600 text-xl">
                ✓
              </div>
              <p className="text-sm text-navy/70 leading-relaxed">{message}</p>
              {email && (
                <p className="text-xs text-navy/40">
                  Email: <span className="text-navy/60">{email}</span>
                </p>
              )}
              <p className="text-xs text-navy/40 leading-relaxed">
                Seguirás pudiendo usar la web y descargar documentos. Solo dejamos de enviarte
                emails de novedades y mentoría no solicitados.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-4">
              <p className="text-sm text-red-600 leading-relaxed">{message}</p>
              <p className="text-xs text-navy/50">
                Si el problema continúa, escribe a{' '}
                <a href="mailto:contacto@mentoriatextum.com" className="text-gold underline">
                  contacto@mentoriatextum.com
                </a>
              </p>
            </div>
          )}

          <Link
            to="/"
            className="inline-block mt-6 text-xs tracking-widest uppercase text-navy/50 hover:text-gold transition-colors"
          >
            ← Volver a TEXTUM
          </Link>
        </div>
      </main>
    </div>
  );
}
