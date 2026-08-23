// src/components/Footer.tsx
import { useEffect, useState } from 'react';
import { Mail, Linkedin, Instagram, Facebook } from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { localizedPath } from '../lib/locale';

const socialLinks = [
  { icon: Linkedin,  href: 'https://www.linkedin.com/company/mentor%C3%ADa-textum', label: 'LinkedIn'  },
  { icon: Instagram, href: 'https://www.instagram.com/mentoria_textum/',             label: 'Instagram' },
  { icon: Facebook,  href: 'https://www.facebook.com/MentoriaTextum',               label: 'Facebook'  },
];

export default function Footer() {
  const { t, lang } = useLang();
  const f = t.footer;
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingSection, setPendingSection] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname !== '/' || !pendingSection) return;

    let frame = 0;
    const scrollWhenReady = () => {
      const target = document.getElementById(pendingSection);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setPendingSection(null);
        return;
      }
      frame = window.requestAnimationFrame(scrollWhenReady);
    };

    frame = window.requestAnimationFrame(scrollWhenReady);
    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, pendingSection]);

  const goToSection = (sectionId: string) => {
    if (location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      setPendingSection(sectionId);
      navigate(localizedPath('/', lang));
    }
  };

  const navLinks = [
    { label: t.nav.inicio,                                        action: () => goToSection('inicio') },
    { label: lang === 'es' ? 'Filosofía'    : 'Philosophy',       action: () => goToSection('filosofia') },
    { label: lang === 'es' ? 'Equipo'       : 'Team',             action: () => goToSection('sobre-mi') },
    { label: t.nav.valores,                                        action: () => goToSection('valores') },
    { label: t.nav.servicios,                                      action: () => goToSection('servicios') },
    { label: t.nav.blog,                                           action: () => navigate(localizedPath('/blog', lang)) },
    { label: lang === 'es' ? 'Colecciones'  : 'Collections',      action: () => navigate(localizedPath('/colecciones', lang)) },
    { label: lang === 'es' ? 'Casos y credenciales' : 'Cases & credentials', action: () => navigate('/casos') },
    { label: lang === 'es' ? 'Testimonios'  : 'Testimonials',     action: () => goToSection('testimonios') },
    { label: t.nav.contacto,                                       action: () => goToSection('contacto') },
  ];

  return (
    <footer className="bg-[#070f1e] text-white/60 pt-16 pb-8 px-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-12 pb-12 border-b border-white/8">

          {/* Brand */}
          <div>
            <div className="flex flex-col gap-1 mb-4">
              <span className="font-serif text-3xl tracking-[0.2em] text-white font-light">TEXTUM</span>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-gold/50" />
                <svg width="7" height="7" viewBox="0 0 7 7">
                  <rect x="3.5" y="0" width="5" height="5" transform="rotate(45 3.5 3.5)" fill="#c9a84c" />
                </svg>
                <div className="h-px w-8 bg-gold/50" />
              </div>
              <p className="font-serif italic text-sm text-white/50">{f.tagline}</p>
            </div>
            <p className="text-xs leading-relaxed text-white/70 font-light max-w-xs">{f.desc}</p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">{f.navTitle}</h4>
            <ul className="space-y-0">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <button type="button" onClick={l.action}
                    className="block w-full text-left py-2.5 text-sm text-white/50 hover:text-gold active:text-gold transition-colors duration-200 tracking-wide touch-manipulation">
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">{f.contactTitle}</h4>
            <div className="space-y-0">
              <a href="mailto:contacto@mentoriatextum.com"
                className="flex items-center gap-3 py-2.5 text-sm text-white/50 hover:text-gold active:text-gold transition-colors group touch-manipulation">
                <Mail size={15} className="text-gold/50 group-hover:text-gold transition-colors flex-shrink-0" />
                contacto@mentoriatextum.com
              </a>
              <a href="https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM."
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 py-2.5 text-sm text-white/50 hover:text-[#25D366] active:text-[#25D366] transition-colors group touch-manipulation">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                </svg>
                +34 614 63 84 06
              </a>
              <div className="flex items-center gap-3 pt-3">
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a key={s.label} href={s.href} aria-label={s.label}
                      className="w-11 h-11 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/15 hover:border-gold/30 active:bg-gold/20 transition-all group touch-manipulation">
                      <Icon size={15} className="text-white/50 group-hover:text-gold transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/70 tracking-wide">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-center sm:text-left">
            <p>© {new Date().getFullYear()} TEXTUM — Mentoría Académica. {f.rights}</p>
            <nav className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <Link
                to={localizedPath('/privacidad', lang)}
                className="text-white/45 hover:text-gold transition-colors"
              >
                {lang === 'es' ? 'Privacidad' : 'Privacy'}
              </Link>
              <span className="text-white/20 hidden sm:inline" aria-hidden>|</span>
              <Link
                to={localizedPath('/baja', lang)}
                className="text-white/45 hover:text-gold transition-colors"
              >
                {lang === 'es' ? 'Baja de comunicaciones' : 'Unsubscribe'}
              </Link>
            </nav>
          </div>
          <p className="text-gold/70">{f.designed}</p>
        </div>
      </div>
    </footer>
  );
}
