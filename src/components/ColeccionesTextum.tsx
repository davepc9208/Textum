// src/components/ColeccionesTextum.tsx
// Propiedad intelectual de TEXTUM — no es un servicio
// Ubicación en App.tsx: entre WhyTextum y BlogPreview

import { useLang } from '../i18n/LangContext';

const content = {
  es: {
    eyebrow: 'Colecciones TEXTUM',
    title1: 'Una escuela de',
    title2: 'pensamiento metodológico',
    intro: 'TEXTUM no es únicamente una mentoría académica. Es una escuela de pensamiento que integra principios, metodologías y recursos para fortalecer la autonomía intelectual, el rigor científico y la formación de investigadores.',
    collections: [
      {
        icon: '◈',
        name: 'Principios TEXTUM',
        desc: 'La filosofía que orienta nuestra manera de investigar, escribir, argumentar y acompañar procesos académicos desde una perspectiva ética y formativa.',
        cta_es: 'Conocer los Principios TEXTUM',
        cta_en: 'Discover TEXTUM Principles',
        href: '/blog?categoria=filosofia-metodo',
      },
      {
        icon: '◈',
        name: 'Método TEXTUM FLUX®',
        desc: 'Nuestro modelo de acompañamiento metodológico integra criterio experto, organización del proceso investigativo y uso responsable de herramientas de inteligencia artificial para fortalecer el trabajo del autor sin sustituir su autoría.',
        cta_es: 'Explorar el Método FLUX',
        cta_en: 'Explore the FLUX Method',
        href: '#metodo',
      },
      {
        icon: '◈',
        name: 'Enfoque Investigativo Integral',
        desc: 'Una visión del proceso académico que articula diagnóstico, arquitectura metodológica, escritura científica, publicación y defensa como etapas conectadas de un mismo recorrido.',
        cta_es: 'Descubrir el enfoque',
        cta_en: 'Discover the approach',
        href: '/blog?categoria=rigor-escritura',
      },
    ],
  },
  en: {
    eyebrow: 'TEXTUM Collections',
    title1: 'A school of',
    title2: 'methodological thought',
    intro: 'TEXTUM is not merely academic mentoring. It is a school of thought that integrates principles, methodologies and resources to strengthen intellectual autonomy, scientific rigour and researcher development.',
    collections: [
      {
        icon: '◈',
        name: 'TEXTUM Principles',
        desc: 'The philosophy that guides our way of researching, writing, arguing and supporting academic processes from an ethical and formative perspective.',
        cta_es: 'Conocer los Principios TEXTUM',
        cta_en: 'Discover TEXTUM Principles',
        href: '/blog?categoria=filosofia-metodo',
      },
      {
        icon: '◈',
        name: 'TEXTUM FLUX® Method',
        desc: 'Our methodological support model integrates expert judgement, organisation of the research process and responsible use of artificial intelligence tools to strengthen the author´s work without replacing their authorship.',
        cta_es: 'Explorar el Método FLUX',
        cta_en: 'Explore the FLUX Method',
        href: '#metodo',
      },
      {
        icon: '◈',
        name: 'Integral Research Approach',
        desc: 'A vision of the academic process that articulates diagnosis, methodological architecture, scientific writing, publication and defence as connected stages of a single journey.',
        cta_es: 'Descubrir el enfoque',
        cta_en: 'Discover the approach',
        href: '/blog?categoria=rigor-escritura',
      },
    ],
  },
};

export default function ColeccionesTextum() {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <section id="colecciones" className="section-cream py-24 px-6 relative overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.02]" aria-hidden>
        <span className="font-serif text-[30vw] font-bold text-navy leading-none">C</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-6">
            {c.title1} <em className="not-italic text-gold-gradient">{c.title2}</em>
          </h2>
          <p className="text-base text-navy/60 font-light leading-relaxed max-w-2xl mx-auto">
            {c.intro}
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 stagger">
          {c.collections.map((col, i) => (
            <div
              key={i}
              className="reveal group flex flex-col bg-white border border-navy/8 rounded-sm p-8 hover:border-gold/30 hover:shadow-lg transition-all duration-300"
            >
              {/* Icono */}
              <span className="font-serif text-4xl text-gold/40 group-hover:text-gold/70 transition-colors duration-300 mb-6 leading-none select-none">
                {col.icon}
              </span>

              {/* Línea decorativa */}
              <div className="w-8 h-px bg-gold/30 mb-5 group-hover:w-14 transition-all duration-300" />

              {/* Nombre */}
              <h3 className="font-serif text-xl font-light text-navy mb-4 leading-snug">
                {col.name}
              </h3>

              {/* Descripción */}
              <p className="text-sm text-navy/60 leading-relaxed font-light flex-1 mb-8">
                {col.desc}
              </p>

              {/* CTA */}
              <a
                href={col.href}
                className="inline-flex items-center gap-2 text-xs tracking-[0.15em] text-gold border border-gold/30 px-4 py-2.5 rounded-sm hover:bg-gold hover:text-navy transition-all duration-200 self-start"
              >
                {lang === 'es' ? col.cta_es : col.cta_en}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>

        {/* Nota de propiedad intelectual */}
        <div className="mt-12 text-center reveal">
          <p className="text-xs text-navy/30 font-light tracking-wide">
            {lang === 'es'
              ? 'Las Colecciones TEXTUM son propiedad intelectual de TEXTUM — Mentoría Académica Internacional.'
              : 'TEXTUM Collections are intellectual property of TEXTUM — International Academic Mentoring.'}
          </p>
        </div>

      </div>
    </section>
  );
}
