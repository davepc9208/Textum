// src/components/Footer.tsx
//
// FIX ANDROID: el <Link to="/blog"> dentro de <li> no registraba el tap
// en Android Chrome porque el área táctil era demasiado pequeña.
// Solución:
//   1. touch-manipulation en todos los enlaces del footer (desactiva el
//      doble-tap-to-zoom de iOS/Android que introduce un delay de 300ms).
//   2. py-2 añadido a cada enlace para aumentar el área de toque.
//   3. block en lugar de inline para que el área de toque ocupe todo el ancho.

import { Mail, Globe, Linkedin, Instagram, Facebook } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';

const socialLinks = [
  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook,  href: '#', label: 'Facebook' },
];

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;

  const navLinks = [
    { href: '/#inicio',    label: t.nav.inicio },
    { href: '/#sobre-mi',  label: t.nav.sobre },
    { href: '/#servicios', label: t.nav.servicios },
    { href: '/#valores',   label: t.nav.valores },
    { href: '/blog',       label: t.nav.blog, isRouter: true },
    { href: '/#contacto',  label: t.nav.contacto },
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
            <p className="text-xs leading-relaxed text-white/40 font-light max-w-xs">{f.desc}</p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">{f.navTitle}</h4>
            <ul className="space-y-1">
              {navLinks.map((l) => (
                <li key={l.href}>
                  {l.isRouter ? (
                    // FIX: block + py-2 amplía el área de toque en Android.
                    // touch-manipulation elimina el delay de 300ms del doble tap.
                    <Link
                      to="/blog"
                      className="
                        block py-2
                        text-sm text-white/50
                        hover:text-gold active:text-gold
                        transition-colors duration-200 tracking-wide
                        touch-manipulation
                      "
                    >
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      className="
                        block py-2
                        text-sm text-white/50
                        hover:text-gold active:text-gold
                        transition-colors duration-200 tracking-wide
                        touch-manipulation
                      "
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">{f.contactTitle}</h4>
            <div className="space-y-2">
              <a
                href="mailto:contacto@mentoriatextum.com"
                className="
                  flex items-center gap-3 py-2
                  text-sm text-white/50
                  hover:text-gold active:text-gold
                  transition-colors group touch-manipulation
                "
              >
                <Mail size={15} className="text-gold/50 group-hover:text-gold transition-colors flex-shrink-0" />
                contacto@mentoriatextum.com
              </a>
              <a
                href="https://mentoriatextum.com/"
                className="
                  flex items-center gap-3 py-2
                  text-sm text-white/50
                  hover:text-gold active:text-gold
                  transition-colors group touch-manipulation
                "
              >
                <Globe size={15} className="text-gold/50 group-hover:text-gold transition-colors flex-shrink-0" />
                mentoriatextum.com
              </a>
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="
                        w-11 h-11
                        rounded-sm bg-white/5 border border-white/10
                        flex items-center justify-center
                        hover:bg-gold/15 hover:border-gold/30
                        active:bg-gold/20
                        transition-all group touch-manipulation
                      "
                    >
                      <Icon size={15} className="text-white/50 group-hover:text-gold transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/40 tracking-wide">
          <p>© {new Date().getFullYear()} TEXTUM — Mentoría Académica. {f.rights}</p>
          <p className="text-gold/30">{f.designed}</p>
        </div>
      </div>
    </footer>
  );
}
