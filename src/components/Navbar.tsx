// src/components/Navbar.tsx
// Navegación ampliada según TEXTUM_NEW_PROPUESTA.docx
//
// FIX ANDROID: handleAnchorClick ahora usa scrollIntoView() directamente
// en lugar de depender del comportamiento nativo de href="#section".
// En Android Chrome el href="#section" sobre elementos React a veces no
// registra el tap o navega incorrectamente. scrollIntoView es más confiable.

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);
  const [active, setActive]     = useState('');
  const location                = useLocation();
  const isHome                  = location.pathname === '/';

  const anchorLinks = [
    { href: '#inicio',      label: t.nav.inicio },
    { href: '#metodo',      label: lang === 'es' ? 'Método'      : 'Method'      },
    { href: '#servicios',   label: t.nav.servicios },
    { href: '#colecciones', label: lang === 'es' ? 'Colecciones' : 'Collections' },
    { href: '#sobre-mi',    label: lang === 'es' ? 'Equipo'      : 'Team'        },
    { href: '#contacto',    label: t.nav.contacto },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const ids = ['inicio', 'metodo', 'servicios', 'colecciones', 'sobre-mi', 'contacto'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.35 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isHome]);

  // FIX ANDROID: en lugar de href="#section" nativo (poco fiable en Android Chrome),
  // usamos scrollIntoView() directamente. Si no estamos en home, redirigimos
  // con window.location.href que es más fiable que React Router para anclas cross-page.
  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);

    const id = href.replace('#', '');

    if (isHome) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      window.location.href = '/' + href;
    }
  };

  // Helper para el CTA "Diagnóstico" que siempre apunta a #contacto
  const handleContactoCta = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/#contacto';
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'glass-navy py-3 shadow-[0_4px_30px_rgba(0,0,0,0.25)]'
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <text x="2" y="32" fontFamily="Cormorant Garamond, serif" fontSize="34" fontWeight="600" fill="#c9a84c">T</text>
            </svg>
          </div>
          <span className="font-serif font-semibold text-xl tracking-[0.18em] text-white">TEXTUM</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden lg:flex items-center gap-6">
          {anchorLinks.map((l) => (
            <li key={l.href}>
              <a
                href={isHome ? l.href : '/' + l.href}
                onClick={(e) => handleAnchorClick(e, l.href)}
                className={`nav-link text-[11px] tracking-widest font-light transition-colors duration-200 touch-manipulation ${
                  isHome && active === l.href.slice(1)
                    ? 'text-gold active'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {l.label.toUpperCase()}
              </a>
            </li>
          ))}
          {/* Blog — router link */}
          <li>
            <Link
              to="/blog"
              className={`nav-link text-[11px] tracking-widest font-light transition-colors duration-200 touch-manipulation ${
                location.pathname.startsWith('/blog') ? 'text-gold active' : 'text-white/80 hover:text-white'
              }`}
            >
              {t.nav.blog.toUpperCase()}
            </Link>
          </li>
        </ul>

        {/* Derecha: idioma + CTA */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Toggle idioma */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="relative flex items-center px-1 py-1 rounded-full border border-gold/30 text-xs tracking-[0.1em] hover:border-gold/50 transition-colors duration-200 touch-manipulation"
            aria-label="Switch language"
          >
            <span
              className="absolute top-1 bottom-1 w-8 rounded-full bg-gold transition-transform duration-300 ease-out"
              style={{ transform: lang === 'es' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <span className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'es' ? 'text-navy font-semibold' : 'text-gold/60'}`}>ES</span>
            <span className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'en' ? 'text-navy font-semibold' : 'text-gold/60'}`}>EN</span>
          </button>

          {/* CTA */}
          <a
            href={isHome ? '#contacto' : '/#contacto'}
            onClick={handleContactoCta}
            className="btn-primary px-5 py-2.5 text-[11px] tracking-[0.12em] rounded-sm touch-manipulation"
          >
            <span>{lang === 'es' ? 'DIAGNÓSTICO GRATIS' : 'FREE DIAGNOSIS'}</span>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-white p-2 touch-manipulation"
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden overflow-hidden transition-all duration-400 ${
        open ? 'max-h-[36rem] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="glass-navy border-t border-gold/20 px-6 py-5 flex flex-col gap-1">
          {anchorLinks.map((l) => (
            <a
              key={l.href}
              href={isHome ? l.href : '/' + l.href}
              onClick={(e) => handleAnchorClick(e, l.href)}
              className="block py-3 text-white/80 text-sm tracking-widest hover:text-gold active:text-gold transition-colors touch-manipulation"
            >
              {l.label.toUpperCase()}
            </a>
          ))}
          <Link
            to="/blog"
            onClick={() => setOpen(false)}
            className="block py-3 text-white/80 text-sm tracking-widest hover:text-gold active:text-gold transition-colors touch-manipulation"
          >
            {t.nav.blog.toUpperCase()}
          </Link>

          <div className="h-px bg-white/10 my-2" />

          {/* Toggle idioma mobile */}
          <button
            onClick={() => { setLang(lang === 'es' ? 'en' : 'es'); setOpen(false); }}
            className="relative flex items-center px-1 py-1 rounded-full border border-gold/30 text-xs tracking-[0.1em] w-fit touch-manipulation"
          >
            <span
              className="absolute top-1 bottom-1 w-8 rounded-full bg-gold transition-transform duration-300 ease-out"
              style={{ transform: lang === 'es' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <span className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'es' ? 'text-navy font-semibold' : 'text-gold/60'}`}>ES</span>
            <span className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'en' ? 'text-navy font-semibold' : 'text-gold/60'}`}>EN</span>
          </button>

          <a
            href={isHome ? '#contacto' : '/#contacto'}
            onClick={(e) => { handleContactoCta(e); setOpen(false); }}
            className="btn-primary text-center px-6 py-3 text-xs tracking-widest rounded-sm mt-2 touch-manipulation"
          >
            <span>{lang === 'es' ? 'DIAGNÓSTICO GRATIS' : 'FREE DIAGNOSIS'}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
