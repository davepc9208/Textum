import { Mail, Globe, Linkedin, Instagram, Facebook } from 'lucide-react';

const navLinks = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#sobre-mi', label: 'Sobre nosotros' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#valores', label: 'Valores' },
  { href: '#contacto', label: 'Contacto' },
];

const socialLinks = [
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

export default function Footer() {
  return (
    <footer className="bg-[#070f1e] text-white/60 pt-16 pb-8 px-6 relative overflow-hidden">
      {/* Gold top border */}
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
              <p className="font-serif italic text-sm text-white/50">De la corrección al aprendizaje</p>
            </div>
            <p className="text-xs leading-relaxed text-white/40 font-light max-w-xs">
              Mentoría académica personalizada que transforma la corrección en aprendizaje real y duradero.
            </p>
          </div>

          {/* Nav */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">Navegación</h4>
            <ul className="space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm text-white/50 hover:text-gold transition-colors duration-200 tracking-wide"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs tracking-[0.25em] text-gold/70 uppercase mb-5">Contacto</h4>
            <div className="space-y-4">
              <a href="mailto:hola@mentoriatextum.com" className="flex items-center gap-3 text-sm text-white/50 hover:text-gold transition-colors group">
                <Mail size={15} className="text-gold/50 group-hover:text-gold transition-colors" />
                hola@mentoriatextum.com
              </a>
              <a href="#" className="flex items-center gap-3 text-sm text-white/50 hover:text-gold transition-colors group">
                <Globe size={15} className="text-gold/50 group-hover:text-gold transition-colors" />
                www.mentoriatextum.com
              </a>
              <div className="flex items-center gap-3 pt-2">
                {socialLinks.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.label}
                      href={s.href}
                      aria-label={s.label}
                      className="w-9 h-9 rounded-sm bg-white/5 border border-white/10 flex items-center justify-center hover:bg-gold/15 hover:border-gold/30 transition-all group"
                    >
                      <Icon size={15} className="text-white/50 group-hover:text-gold transition-colors" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs text-white/25 tracking-wide">
          <p>© {new Date().getFullYear()} TEXTUM — Mentoría Académica. Todos los derechos reservados.</p>
          <p className="text-gold/30">Diseñado con excelencia</p>
        </div>
      </div>
    </footer>
  );
}
