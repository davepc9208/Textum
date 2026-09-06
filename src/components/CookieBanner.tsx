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

const GA4_ID = (import.meta.env.VITE_GA4_ID as string | undefined)?.trim() || '';
const META_PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined)?.trim() || '';

let analyticsStarted = false;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}

function initGa4(id: string) {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag(...args: unknown[]) { w.dataLayer!.push(args); };
  w.gtag('js', new Date());
  w.gtag('config', id, { anonymize_ip: true });
  void loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

type FbqFn = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
};

function initMetaPixel(id: string) {
  const w = window as Window & { fbq?: FbqFn; _fbq?: FbqFn };
  if (w.fbq) return;
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  } as FbqFn;
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  w.fbq = fbq;
  w._fbq = fbq;
  void loadScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', id);
  fbq('track', 'PageView');
}

/** Inicializa la analítica (Clarity + GA4 + Meta Pixel) solo con consentimiento. */
export async function initAnalyticsIfAllowed() {
  if (getCookieConsent() !== 'accepted' || analyticsStarted) return;
  analyticsStarted = true;
  try {
    const Clarity = (await import('@microsoft/clarity')).default;
    Clarity.init('xzsgo2fjo4');
  } catch (e) {
    console.warn('[TEXTUM] Clarity no se pudo inicializar', e);
  }
  if (GA4_ID) { try { initGa4(GA4_ID); } catch (e) { console.warn('[TEXTUM] GA4 no se pudo inicializar', e); } }
  if (META_PIXEL_ID) { try { initMetaPixel(META_PIXEL_ID); } catch (e) { console.warn('[TEXTUM] Meta Pixel no se pudo inicializar', e); } }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Dejar que el contenido principal pinte antes del consentimiento.
    // El banner no debe convertirse en el elemento LCP en móviles lentos.
    if (getCookieConsent() === null) {
      let timer: number | null = null;
      const showBanner = () => {
        timer = window.setTimeout(() => setVisible(true), 2500);
      };

      if (document.readyState === 'complete') showBanner();
      else window.addEventListener('load', showBanner, { once: true });

      return () => {
        window.removeEventListener('load', showBanner);
        if (timer !== null) window.clearTimeout(timer);
      };
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
