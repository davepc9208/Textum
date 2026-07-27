// src/components/Navbar.tsx
// Fix 6 (accesibilidad): toggle idioma con aria-label dinámico que indica
// el idioma activo y el idioma al que se cambiará. Los spans ES/EN tienen
// aria-current="true" para el idioma activo.

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
    { href: '#coleccion-textum', label: lang === 'es' ? 'Colección TEXTUM' : 'TEXTUM Collection' },
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
    const ids = ['inicio', 'metodo', 'servicios', 'coleccion-textum', 'sobre-mi', 'contacto'];
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

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    setOpen(false);
    const id = href.replace('#', '');
    if (isHome) {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/' + href;
    }
  };

  const handleContactoCta = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isHome) {
      document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.href = '/#contacto';
    }
  };

  const nextLang = lang === 'es' ? 'en' : 'es';
  // Fix 6: aria-label dinámico indica idioma activo y acción
  const langToggleLabel = lang === 'es'
    ? 'Idioma actual: Español. Cambiar a English'
    : 'Current language: English. Switch to Español';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled
        ? 'glass-navy py-3 shadow-[0_4px_30px_rgba(0,0,0,0.25)]'
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">

        <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <text x="2" y="32" fontFamily="Cormorant Garamond, serif" fontSize="34" fontWeight="600" fill="#c9a84c">T</text>
            </svg>
          </div>
          <span className="font-serif font-semibold text-xl tracking-[0.18em] text-white">TEXTUM</span>
        </Link>

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
          <li>
            <Link
              to="/colecciones"
              className={`nav-link text-[11px] tracking-widest font-light transition-colors duration-200 touch-manipulation ${
                location.pathname.startsWith('/colecciones') ? 'text-gold active' : 'text-white/80 hover:text-white'
              }`}
            >
              {lang === 'es' ? 'COLECCIONES' : 'COLLECTIONS'}
            </Link>
          </li>
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          {/* Fix 6: aria-label dinámico + aria-current en spans */}
          <button
            onClick={() => setLang(nextLang)}
            className="relative flex items-center px-1 py-1 rounded-full border border-gold/30 text-xs tracking-[0.1em] hover:border-gold/50 transition-colors duration-200 touch-manipulation"
            aria-label={langToggleLabel}
          >
            <span
              className="absolute top-1 bottom-1 w-8 rounded-full bg-gold transition-transform duration-300 ease-out"
              aria-hidden="true"
              style={{ transform: lang === 'es' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <span
              className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'es' ? 'text-navy font-semibold' : 'text-gold/60'}`}
              aria-current={lang === 'es' ? 'true' : undefined}
            >
              ES
            </span>
            <span
              className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'en' ? 'text-navy font-semibold' : 'text-gold/60'}`}
              aria-current={lang === 'en' ? 'true' : undefined}
            >
              EN
            </span>
          </button>

          <a
            href="https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM."
            target="_blank"
            rel="noopener noreferrer"
            aria-label={lang === 'es' ? 'Contactar por WhatsApp' : 'Contact via WhatsApp'}
            className="flex items-center justify-center w-9 h-9 rounded-sm border border-white/20 text-white/70 hover:border-[#25D366]/60 hover:text-[#25D366] transition-colors duration-200 touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
          </a>
          <a
            href={isHome ? '#contacto' : '/#contacto'}
            onClick={handleContactoCta}
            className="btn-primary px-5 py-2.5 text-[11px] tracking-[0.12em] rounded-sm touch-manipulation"
          >
            <span>{lang === 'es' ? 'DIAGNÓSTICO GRATIS' : 'FREE DIAGNOSIS'}</span>
          </a>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-white p-2 touch-manipulation"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

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
          <Link
            to="/colecciones"
            onClick={() => setOpen(false)}
            className={`block py-3 text-sm tracking-widest transition-colors touch-manipulation ${
              location.pathname.startsWith('/colecciones') ? 'text-gold' : 'text-white/80 hover:text-gold active:text-gold'
            }`}
          >
            {lang === 'es' ? 'COLECCIONES' : 'COLLECTIONS'}
          </Link>

          <div className="h-px bg-white/10 my-2" />

          <button
            onClick={() => { setLang(nextLang); setOpen(false); }}
            className="relative flex items-center px-1 py-1 rounded-full border border-gold/30 text-xs tracking-[0.1em] w-fit touch-manipulation"
            aria-label={langToggleLabel}
          >
            <span
              className="absolute top-1 bottom-1 w-8 rounded-full bg-gold transition-transform duration-300 ease-out"
              aria-hidden="true"
              style={{ transform: lang === 'es' ? 'translateX(0%)' : 'translateX(100%)' }}
            />
            <span
              className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'es' ? 'text-navy font-semibold' : 'text-gold/60'}`}
              aria-current={lang === 'es' ? 'true' : undefined}
            >
              ES
            </span>
            <span
              className={`relative z-10 w-8 text-center py-1 transition-colors duration-200 ${lang === 'en' ? 'text-navy font-semibold' : 'text-gold/60'}`}
              aria-current={lang === 'en' ? 'true' : undefined}
            >
              EN
            </span>
          </button>

          <a
            href="https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM."
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 py-3 text-sm tracking-widest text-[#25D366] hover:text-[#25D366]/80 transition-colors touch-manipulation"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
            </svg>
            WHATSAPP
          </a>
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
