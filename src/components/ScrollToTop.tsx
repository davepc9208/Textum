// src/components/ScrollToTop.tsx
// Reinicia el scroll en cada cambio de ruta.
// - Sin hash: vuelve al inicio de la página (comportamiento SPA).
// - Con hash (ej. /#filosofia): desplaza a la sección indicada, respetando
//   la altura de la navbar fija. Reintenta brevemente por si la sección
//   aún no ha montado tras la navegación.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const NAVBAR_OFFSET = 88;

function scrollToHash(id: string) {
  if (id === 'inicio') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }
  const el = document.getElementById(id);
  if (!el) return false;
  const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_OFFSET;
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  return true;
}

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      let attempts = 0;
      const tryScroll = () => {
        if (scrollToHash(id)) return;
        attempts += 1;
        if (attempts < 12) window.setTimeout(tryScroll, 80);
      };
      // Espera un frame para que la sección de destino exista tras el render
      window.requestAnimationFrame(() => window.setTimeout(tryScroll, 0));
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}
