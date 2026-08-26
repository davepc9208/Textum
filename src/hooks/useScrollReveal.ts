import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    // Accesibilidad + rendimiento: si el usuario prefiere menos movimiento,
    // los elementos se muestran directamente, sin transiciones ni observer.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [pathname]);
}
