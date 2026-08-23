// src/pages/BajaPage.tsx
// Baja de comunicaciones: con enlace del email (token) o introduciendo el correo

import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import { localizedPath } from '../lib/locale';

type Status = 'idle' | 'loading' | 'ok' | 'error';

export default function BajaPage() {
  const { lang } = useLang();
  const [params] = useSearchParams();

  useSEO({
    title: lang === 'en' ? 'Unsubscribe — TEXTUM' : 'Baja de comunicaciones — TEXTUM',
    description: lang === 'en'
      ? 'Manage your TEXTUM communication preferences.'
      : 'Gestiona tus preferencias de comunicación con TEXTUM.',
    canonical: '/baja',
    lang,
    noindex: true,
  });
  const emailParam = params.get('email') || '';
  const tokenParam = params.get('token') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!emailParam || !tokenParam) return;

    let cancelled = false;
    (async () => {
      setStatus('loading');
      try {
        const res = await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailParam, token: tokenParam }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setStatus('error');
          setMessage(data.error || 'No se pudo completar la baja. Inténtalo de nuevo o usa el formulario.');
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
  }, [emailParam, tokenParam]);

  const submitForm = async (e: FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus('error');
      setMessage('Introduce un correo electrónico válido.');
      return;
    }

    setStatus('loading');
    setMessage('');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('error');
        setMessage(data.error || 'No se pudo completar la baja.');
        return;
      }
      setStatus('ok');
      setMessage(
        data.message ||
          'Te has dado de baja correctamente. No recibirás más comunicaciones comerciales de TEXTUM.'
      );
    } catch {
      setStatus('error');
      setMessage('Error de red. Revisa tu conexión e inténtalo de nuevo.');
    }
  };

  const showForm = status === 'idle' || status === 'error' || (status === 'loading' && !tokenParam);

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="border-b border-navy/10 bg-white">
        <div className="max-w-lg mx-auto px-6 py-5 flex items-center justify-between">
          <Link to={localizedPath('/', lang)} className="font-serif text-xl tracking-[0.2em] text-navy">
            TEXTUM
          </Link>
          <Link to={localizedPath('/', lang)} className="text-xs tracking-widest text-navy/50 hover:text-navy uppercase">
            Inicio
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md bg-white border border-navy/10 rounded-sm shadow-lg p-8 text-center">
          <p className="text-[11px] tracking-[0.3em] text-gold uppercase mb-3">Comunicaciones</p>
          <h1 className="font-serif text-2xl text-navy mb-4">Baja de la lista</h1>
          <p className="text-sm text-navy/55 leading-relaxed mb-6 font-light">
            Dejarás de recibir emails de novedades y mentoría de TEXTUM. Podrás seguir usando la web
            y descargar recursos si lo necesitas.
          </p>

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
              {(email || emailParam) && (
                <p className="text-xs text-navy/40">
                  Email: <span className="text-navy/60">{email || emailParam}</span>
                </p>
              )}
            </div>
          )}

          {showForm && status !== 'loading' && (
            <form onSubmit={submitForm} className="text-left space-y-4">
              {status === 'error' && message && (
                <p className="text-sm text-red-600 leading-relaxed text-center">{message}</p>
              )}
              <div>
                <label htmlFor="baja-email" className="block text-xs tracking-widest uppercase text-navy/50 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="baja-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full border border-navy/15 rounded-sm px-4 py-3 text-sm text-navy focus:outline-none focus:border-gold/60 bg-cream/40"
                />
              </div>
              <button
                type="submit"
                className="w-full btn-primary py-3 text-xs tracking-widest rounded-sm"
              >
                <span>Confirmar baja</span>
              </button>
              <p className="text-[11px] text-navy/40 text-center leading-relaxed">
                Si llegaste desde un correo de TEXTUM, también puedes usar el enlace de baja de ese
                mensaje.
              </p>
            </form>
          )}

          <Link
            to={localizedPath('/', lang)}
            className="inline-block mt-6 text-xs tracking-widest uppercase text-navy/50 hover:text-gold transition-colors"
          >
            ← Volver a TEXTUM
          </Link>
        </div>
      </main>
    </div>
  );
}
