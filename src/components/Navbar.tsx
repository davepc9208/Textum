import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';

export default function Navbar() {
  const { lang, setLang, t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const location = useLocation();
  const isHome = location.pathname === '/';

  const links = [
    { href: '#inicio', label: t.nav.inicio },
    { href: '#sobre-mi', label: t.nav.sobre },
    { href: '#servicios', label: t.nav.servicios },
    { href: '#valores', label: t.nav.valores },
    { href: '#contacto', label: t.nav.contacto },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const ids = ['inicio', 'sobre-mi', 'servicios', 'valores', 'contacto'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { threshold: 0.45 }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isHome]);

  const handleAnchorClick = (href: string) => {
    setOpen(false);
    if (!isHome) {
      // navega a home y luego al anchor
      window.location.href = '/' + href;
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-navy py-3 shadow-[0_4px_30px_rgba(0,0,0,0.25)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <text x="2" y="32" fontFamily="Cormorant Garamond, serif" fontSize="34" fontWeight="600" fill="#c9a84c">T</text>
            </svg>
          </div>
          <span className="font-serif font-semibold text-xl tracking-[0.18em] text-white">TEXTUM</span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={isHome ? l.href : '/' + l.href}
                onClick={() => handleAnchorClick(l.href)}
                className={`nav-link text-xs tracking-widest font-light transition-colors duration-200 ${
                  isHome && active === l.href.slice(1) ? 'text-gold active' : 'text-white/80 hover:text-white'
                }`}
              >
                {l.label.toUpperCase()}
              </a>
            </li>
          ))}
          {/* Blog link */}
          <li>
            <Link
              to="/blog"
              className={`nav-link text-xs tracking-widest font-light transition-colors duration-200 ${
                location.pathname.startsWith('/blog') ? 'text-gold active' : 'text-white/80 hover:text-white'
              }`}
            >
              {t.nav.blog.toUpperCase()}
            </Link>
          </li>
        </ul>

        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm border border-gold/30 text-gold text-xs tracking-[0.12em] hover:bg-gold/10 transition-all duration-200"
            aria-label="Switch language"
          >
            <span className={lang === 'es' ? 'opacity-100 font-semibold' : 'opacity-50'}>ES</span>
            <span className="text-gold/30">|</span>
            <span className={lang === 'en' ? 'opacity-100 font-semibold' : 'opacity-50'}>EN</span>
          </button>

          {/* CTA */}
          <a
            href={isHome ? '#contacto' : '/#contacto'}
            className="btn-primary px-6 py-2.5 text-xs tracking-[0.15em] rounded-sm"
          >
            <span>{t.nav.reservar}</span>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden text-white p-2"
          aria-label="Menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-400 ${
          open ? 'max-h-[28rem] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="glass-navy border-t border-gold/20 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={isHome ? l.href : '/' + l.href}
              onClick={() => setOpen(false)}
              className="text-white/80 text-sm tracking-widest py-1 hover:text-gold transition-colors"
            >
              {l.label.toUpperCase()}
            </a>
          ))}
          <Link
            to="/blog"
            onClick={() => setOpen(false)}
            className="text-white/80 text-sm tracking-widest py-1 hover:text-gold transition-colors"
          >
            {t.nav.blog.toUpperCase()}
          </Link>

          {/* Language toggle mobile */}
          <button
            onClick={() => { setLang(lang === 'es' ? 'en' : 'es'); setOpen(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-sm border border-gold/30 text-gold text-xs tracking-[0.12em] hover:bg-gold/10 transition-all w-fit"
          >
            <span className={lang === 'es' ? 'font-semibold' : 'opacity-50'}>ES</span>
            <span className="text-gold/30">|</span>
            <span className={lang === 'en' ? 'font-semibold' : 'opacity-50'}>EN</span>
          </button>

          <a
            href={isHome ? '#contacto' : '/#contacto'}
            onClick={() => setOpen(false)}
            className="btn-primary text-center px-6 py-3 text-xs tracking-widest rounded-sm mt-1"
          >
            <span>{t.nav.reservar}</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
