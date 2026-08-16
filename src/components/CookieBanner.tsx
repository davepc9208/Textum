// src/components/CookieBanner.tsx
// Banner RGPD: cookies esenciales siempre; analítica (Clarity) solo con consentimiento.

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'textum_cookie_consent';

export type CookieConsent = 'accepted' | 'rejected' | null;

export function getCookieConsent(): CookieConsent {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'accepted' || v === 'rejected') return v;
  } catch {
    // ignore
  }
  return null;
}

export function setCookieConsent(value: 'accepted' | 'rejected') {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('textum-cookie-consent', { detail: value }));
}

/** Inicializa Microsoft Clarity solo si el usuario aceptó analítica */
export async function initAnalyticsIfAllowed() {
  if (getCookieConsent() !== 'accepted') return;
  try {
    const Clarity = (await import('@microsoft/clarity')).default;
    Clarity.init('xzsgo2fjo4');
  } catch (e) {
    console.warn('[TEXTUM] Clarity no se pudo inicializar', e);
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Mostrar solo si aún no hay decisión
    if (getCookieConsent() === null) {
      // Pequeño delay para no competir con el LCP
      const t = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(t);
    }
    // Si ya aceptó en visitas anteriores, arrancar analítica
    initAnalyticsIfAllowed();
  }, []);

  const accept = () => {
    setCookieConsent('accepted');
    setVisible(false);
    initAnalyticsIfAllowed();
  };

  const reject = () => {
    setCookieConsent('rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed bottom-0 inset-x-0 z-[9998] p-4 sm:p-6 pointer-events-none"
    >
      <div className="max-w-3xl mx-auto pointer-events-auto bg-navy text-white rounded-sm shadow-2xl border border-gold/25 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-serif text-lg text-gold mb-2">Cookies y privacidad</p>
            <p className="text-sm text-white/75 leading-relaxed font-light">
              Usamos cookies esenciales para el funcionamiento del sitio. Con tu permiso,
              también utilizamos Microsoft Clarity para entender cómo se usa la web y mejorarla.
              Puedes aceptar o rechazar las cookies de analítica. Más información en nuestra{' '}
              <a
                href="/privacidad"
                className="text-gold underline underline-offset-2 hover:text-gold-light"
              >
                política de privacidad
              </a>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={reject}
              className="px-5 py-2.5 text-xs tracking-widest uppercase border border-white/25 text-white/80 hover:border-white/50 hover:text-white rounded-sm transition-colors"
            >
              Solo esenciales
            </button>
            <button
              type="button"
              onClick={accept}
              className="px-5 py-2.5 text-xs tracking-widest uppercase bg-gold text-navy font-semibold hover:bg-gold-light rounded-sm transition-colors"
            >
              Aceptar todas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
