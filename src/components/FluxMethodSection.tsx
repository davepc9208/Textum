// src/components/FluxMethodSection.tsx
// Método TEXTUM FLUX extraído como sección independiente con fondo navy.
// Se coloca entre Values (cream) y Services (cream) para romper la monotonía
// de fondos claros consecutivos.
// El contenido es idéntico al FluxMethod que existía dentro de Services.tsx,
// pero ahora es una sección autónoma con su propio id="metodo".

import { useLang } from '../i18n/LangContext';
import { FLUX_METHOD } from '../data/services';

export default function FluxMethodSection() {
  const { lang } = useLang();
  const m = FLUX_METHOD[lang];

  return (
    <section id="metodo" className="section-navy py-24 px-6 relative overflow-hidden scroll-mt-20">
      <div className="orb orb-gold w-[300px] h-[300px] bottom-0 left-0 opacity-8" style={{ animationDelay: '2s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">{m.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-4">
            {m.title}
          </h2>
          <p className="text-white/50 text-sm font-light max-w-2xl mx-auto leading-relaxed">{m.intro}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-sm overflow-hidden reveal">
          {m.steps.map((step) => (
            <div
              key={step.n}
              className="bg-navy/80 p-8 flex flex-col gap-4 group hover:bg-gold/5 transition-colors duration-300"
            >
              <span className="font-serif text-4xl font-light text-gold/30 group-hover:text-gold/60 transition-colors leading-none">
                {step.n}
              </span>
              <div className="w-8 h-px bg-gold/30 group-hover:w-12 transition-all duration-300" />
              <h3 className="font-serif text-lg text-white font-light">{step.title}</h3>
              <p className="text-xs text-white/45 leading-relaxed font-light">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 px-6 py-5 glass-navy border border-white/8 rounded-sm max-w-3xl mx-auto reveal">
          <p className="text-xs text-white/40 font-light italic text-center leading-relaxed">{m.closing}</p>
        </div>

        {/* CTA hacia servicios */}
        <div className="text-center mt-10 reveal">
          <a
            href="#servicios"
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] text-gold border border-gold/30 px-6 py-3 rounded-sm hover:bg-gold hover:text-navy transition-all duration-200"
          >
            {lang === 'es' ? 'VER PROGRAMAS DE ACOMPAÑAMIENTO' : 'VIEW MENTORING PROGRAMMES'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
