// src/components/StickyDiagnosis.tsx
// Botón flotante sticky "Agendar diagnóstico académico"
// Se añade UNA VEZ en App.tsx, fuera del <main>, justo antes de </BrowserRouter>
// Visible siempre en desktop y móvil — se oculta cuando el usuario está en #contacto

import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LangContext';

export default function StickyDiagnosis() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);
  const [nearContact, setNearContact] = useState(false);

  // Aparece tras 400px de scroll, desaparece cuando #contacto es visible
  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);

      const contactEl = document.getElementById('contacto');
      if (contactEl) {
        const rect = contactEl.getBoundingClientRect();
        setNearContact(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const show = visible && !nearContact;

  const label = lang === 'es' ? 'Agendar diagnóstico' : 'Book a diagnosis';
  const ariaLabel = lang === 'es'
    ? 'Agendar diagnóstico académico gratuito'
    : 'Book a free academic diagnosis';

  return (
    <div
      aria-hidden={!show}
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href="#contacto"
        aria-label={ariaLabel}
        className="
          flex items-center gap-2.5
          bg-gold text-navy
          font-semibold text-xs tracking-[0.15em]
          px-5 py-3.5 rounded-sm
          shadow-[0_8px_32px_rgba(201,168,76,0.45)]
          hover:bg-gold-light hover:shadow-[0_12px_40px_rgba(201,168,76,0.55)]
          active:scale-95
          transition-all duration-200
          whitespace-nowrap
        "
      >
        {/* Icono calendario */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8"  y1="2" x2="8"  y2="6" />
          <line x1="3"  y1="10" x2="21" y2="10" />
        </svg>
        {label}
      </a>
    </div>
  );
}
