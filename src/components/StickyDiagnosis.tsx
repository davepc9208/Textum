// src/components/StickyDiagnosis.tsx
// Fix accesibilidad: aria-hidden no debe contener elementos focusables
// Solución: mover aria-hidden al <a> cuando está oculto, no al wrapper

import { useState, useEffect } from 'react';
import { useLang } from '../i18n/LangContext';
import { diagnosisHref, trackConversion } from '../lib/conversion';

export default function StickyDiagnosis() {
  const { lang } = useLang();

  // FIX: dos estados (visible + nearContact) fusionados en uno solo (show).
  // Antes: cada evento scroll disparaba dos setState → dos renders por scroll.
  // Ahora: un único setState con el valor final → un render por scroll.
  const [show, setShow] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  useEffect(() => {
    const onAssistantState = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      setAssistantOpen(detail?.open === true);
    };
    window.addEventListener('textum-assistant-state', onAssistantState);

    const onScroll = () => {
      const scrolled = window.scrollY > 400;
      const contactEl = document.getElementById('contacto');
      const nearContact = contactEl
        ? (() => {
            const r = contactEl.getBoundingClientRect();
            return r.top < window.innerHeight && r.bottom > 0;
          })()
        : false;
      setShow(scrolled && !nearContact);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('textum-assistant-state', onAssistantState);
    };
  }, []);
  const label = lang === 'es' ? 'Agendar diagnóstico' : 'Book a diagnosis';
  const ariaLabel = lang === 'es'
    ? 'Agendar diagnóstico académico gratuito'
    : 'Book a free academic diagnosis';

  // FIX ACCESIBILIDAD:
  // Antes: div aria-hidden="true" contenía <a> focusable → error de accesibilidad
  // Ahora: el wrapper nunca tiene aria-hidden; el <a> tiene tabIndex y aria-hidden propios
  // cuando no es visible, impidiendo foco sin romper el árbol de accesibilidad
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        show && !assistantOpen
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <a
        href={diagnosisHref()}
        onClick={() => trackConversion('diagnosis_cta_click', { placement: 'sticky' })}
        aria-label={ariaLabel}
        aria-hidden={show && !assistantOpen ? undefined : 'true'}
        tabIndex={show && !assistantOpen ? 0 : -1}
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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
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
