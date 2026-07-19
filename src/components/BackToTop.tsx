// src/components/BackToTop.tsx
// Botón "volver arriba" — aparece al bajar más de 600px
// Misma estética que StickyDiagnosis pero posicionado abajo-izquierda
// para no colisionar con él. En mobile ocupa abajo-izquierda de forma
// natural; en tablet/desktop mantiene posición fija.

import { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Volver al inicio de la página"
        className="
          w-11 h-11
          flex items-center justify-center
          bg-navy/80 border border-gold/30
          rounded-sm
          shadow-[0_4px_20px_rgba(13,31,60,0.4)]
          hover:bg-navy hover:border-gold/60
          hover:shadow-[0_8px_30px_rgba(13,31,60,0.5)]
          active:scale-95
          transition-all duration-200
          touch-action-manipulation
          backdrop-blur-sm
        "
        style={{ touchAction: 'manipulation' }}
      >
        {/* Flecha hacia arriba — minimal, sin librería */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#c9a84c"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
