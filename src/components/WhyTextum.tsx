// src/components/WhyTextum.tsx
// CAMBIO: fondo navy en lugar de cream para alternar correctamente con
// la nueva posición en el orden de secciones (entre AcademicIntegrity cream
// y ColeccionesTextum cream). El contenido funciona bien en oscuro:
// los checks dorados y el escudo son elementos que ya se usan en contexto navy.

import { useLang } from '../i18n/LangContext';
import { WHY_TEXTUM } from '../data/services';
import { Check } from 'lucide-react';

export default function WhyTextum() {
  const { lang } = useLang();
  const w = WHY_TEXTUM[lang];

  return (
    <section id="diferencial" className="section-navy py-24 px-6 relative overflow-hidden">
      {/* Orb decorativo — igual que otras secciones navy */}
      <div className="orb orb-gold w-[350px] h-[350px] top-0 right-0 opacity-8" style={{ animationDelay: '1s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Columna izquierda — texto */}
          <div className="reveal-left">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{w.eyebrow}</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-6">
              {w.title.split(' es ')[0]} es{' '}
              <em className="not-italic text-gold">
                {w.title.split(' es ')[1]}
              </em>
            </h2>
            <p className="text-base text-white/60 leading-relaxed font-light mb-8">
              {w.body}
            </p>
            <a
              href="#contacto"
              className="btn-primary inline-block px-8 py-3.5 text-xs tracking-[0.15em] rounded-sm"
            >
              <span>{lang === 'es' ? 'AGENDAR DIAGNÓSTICO ACADÉMICO' : 'BOOK AN ACADEMIC DIAGNOSIS'}</span>
            </a>
          </div>

          {/* Columna derecha — 5 diferenciales */}
          <div className="reveal-right">
            <ul className="space-y-0 divide-y divide-white/8">
              {w.items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-start gap-5 py-5 group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full border border-gold/30 bg-gold/5 flex items-center justify-center group-hover:bg-gold/20 group-hover:border-gold/60 transition-all duration-200">
                    <Check size={14} className="text-gold" strokeWidth={2.5} />
                  </div>
                  <p className="text-sm text-white/65 leading-relaxed pt-1 group-hover:text-white transition-colors duration-200">
                    {item}
                  </p>
                </li>
              ))}
            </ul>

            {/* Sello de cierre */}
            <div className="mt-8 flex items-center gap-4 pt-6 border-t border-white/10">
              <div className="flex-shrink-0">
                <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4L6 9.5V20C6 27.5 12.2 34.4 20 36C27.8 34.4 34 27.5 34 20V9.5L20 4Z"
                    stroke="#c9a84c" strokeWidth="1.5" fill="rgba(201,168,76,0.06)" />
                  <path d="M14 20L18 24L26 16" stroke="#c9a84c" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xs text-white/35 font-light leading-relaxed italic">
                {lang === 'es'
                  ? 'Alineados con estándares de calidad académica de América Latina y Europa.'
                  : 'Aligned with academic quality standards across Latin America and Europe.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
