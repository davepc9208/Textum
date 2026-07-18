// src/components/ScrollToTop.tsx
// Reinicia el scroll al inicio en cada cambio de ruta.
// Sin esto, React Router mantiene la posición de scroll anterior,
// causando que al navegar a /blog la página aparezca al final.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
