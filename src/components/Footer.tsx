// src/components/Footer.tsx
//
// FIXES ANDROID:
// 1. href="/#seccion" reemplazado por useNavigate + scrollIntoView.
//    En Android lento, href="/#seccion" navega a / y pierde el hash.
// 2. <Link to="/blog"> reemplazado por button + navigate() para garantizar
//    que React Router maneje la navegación aunque la hidratación sea tardía.
// 3. touch-manipulation en todos los elementos interactivos elimina el
//    delay de 300ms del doble-tap-zoom en Android/iOS.
// 4. block py-2.5 en todos los links amplía el área táctil a ~44px mínimo.

import { Mail, Globe, Linkedin, Instagram, Facebook } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';

const socialLinks = [
  { icon: Linkedin,  href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook,  href: '#', label: 'Facebook' },
];

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;
  const navigate = useNavigate();

  // Navega a una sección del homepage de forma confiable en Android.
  // Si ya estamos en /, hace scroll directo.
  // Si estamos en otra ruta, navega a / y espera a que el DOM esté listo.
  const goToSection = (sectionId: string) => {
    if (window.location.pathname === '/') {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  const navLinks = [
    { label: t.nav.inicio,    action: () => goToSection('inicio') },
    { label: t.nav.sobre,     action: () => goToSection('sobre-mi') },
    { label: t.nav.servicios, action: () => goToSection('servicios') },
    { label: t.nav.valores,   action: () => goToSection('valores') },
    { label: t.nav.blog,      action: () => navigate('/blog') },
    { label: t.nav.contacto,  action: () => goToSection('contacto') },
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

          {/* Nav — todos los links son botones para máxima fiabilidad en Android */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">{f.navTitle}</h4>
            <ul className="space-y-0">
              {navLinks.map((l) => (
                <li key={l.label}>
                  <button
                    type="button"
                    onClick={l.action}
                    className="
                      block w-full text-left py-2.5
                      text-sm text-white/50
                      hover:text-gold active:text-gold
                      transition-colors duration-200 tracking-wide
                      touch-manipulation
                    "
                  >
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
              <a
                href="mailto:contacto@mentoriatextum.com"
                className="
                  flex items-center gap-3 py-2.5
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
                  flex items-center gap-3 py-2.5
                  text-sm text-white/50
                  hover:text-gold active:text-gold
                  transition-colors group touch-manipulation
                "
              >
                <Globe size={15} className="text-gold/50 group-hover:text-gold transition-colors flex-shrink-0" />
                mentoriatextum.com
              </a>
              <div className="flex items-center gap-3 pt-3">
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
