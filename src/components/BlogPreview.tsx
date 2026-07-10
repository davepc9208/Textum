// src/components/BlogPreview.tsx
// Bloque del blog en homepage — intro + 3 categorías + CTA
// Ubicación en App.tsx: entre ColeccionesTextum y Contact

import { useLang } from '../i18n/LangContext';
import { Link } from 'react-router-dom';

const content = {
  es: {
    eyebrow: 'Blog TEXTUM',
    title1: 'Conocimiento para',
    title2: 'investigadores',
    intro: 'El conocimiento forma parte de nuestra metodología. En el Blog TEXTUM compartimos análisis, guías y recursos sobre investigación, escritura científica, defensa académica e innovación metodológica para acompañar el desarrollo de investigadores, docentes y estudiantes de posgrado.',
    categories: [
      {
        key: 'filosofia-metodo',
        label: 'Filosofía y Método TEXTUM',
        desc: 'Principios de la metodología TEXTUM, arquitectura metodológica, pensamiento crítico y diseño de investigaciones.',
        topics: ['Arquitectura metodológica', 'Pensamiento crítico', 'Diseño de investigaciones'],
      },
      {
        key: 'rigor-escritura',
        label: 'Rigor y Escritura Científica',
        desc: 'Redacción académica, normas APA, Vancouver e IEEE, artículos científicos, revisión metodológica y publicación.',
        topics: ['Redacción académica', 'Normas APA 7', 'Publicación científica'],
      },
      {
        key: 'sustentacion-defensa',
        label: 'Sustentación y Defensa Oral',
        desc: 'Preparación de defensa, diseño de presentaciones, comunicación científica y oratoria académica.',
        topics: ['Preparación de defensa', 'Oratoria académica', 'Preguntas del tribunal'],
      },
    ],
    cta: 'Explorar el Blog TEXTUM',
    ctaSub: 'Artículos y recursos escritos por nuestras doctoras',
  },
  en: {
    eyebrow: 'TEXTUM Blog',
    title1: 'Knowledge for',
    title2: 'researchers',
    intro: 'Knowledge is part of our methodology. The TEXTUM Blog shares analysis, guides and resources on research, scientific writing, academic defence and methodological innovation to support the development of researchers, educators and postgraduate students.',
    categories: [
      {
        key: 'filosofia-metodo',
        label: 'TEXTUM Philosophy & Method',
        desc: 'Principles of TEXTUM methodology, methodological architecture, critical thinking and research design.',
        topics: ['Methodological architecture', 'Critical thinking', 'Research design'],
      },
      {
        key: 'rigor-escritura',
        label: 'Rigour & Scientific Writing',
        desc: 'Academic writing, APA, Vancouver and IEEE standards, scientific articles, methodological review and publication.',
        topics: ['Academic writing', 'APA 7 standards', 'Scientific publication'],
      },
      {
        key: 'sustentacion-defensa',
        label: 'Defence & Oral Presentation',
        desc: 'Defence preparation, presentation design, scientific communication and academic oratory.',
        topics: ['Defence preparation', 'Academic oratory', 'Panel questions'],
      },
    ],
    cta: 'Explore the TEXTUM Blog',
    ctaSub: 'Articles and resources written by our doctoral researchers',
  },
};

export default function BlogPreview() {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <section id="blog-preview" className="section-navy py-24 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[350px] h-[350px] top-0 left-0 opacity-8" style={{ animationDelay: '1s' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-6">
            {c.title1} <em className="not-italic text-gold">{c.title2}</em>
          </h2>
          <p className="text-white/50 text-sm font-light leading-relaxed max-w-2xl mx-auto">
            {c.intro}
          </p>
        </div>

        {/* Categorías */}
        <div className="grid md:grid-cols-3 gap-6 stagger">
          {c.categories.map((cat, i) => (
            <Link
              key={i}
              to={`/blog?categoria=${cat.key}`}
              className="reveal group glass-navy border border-white/10 rounded-sm p-8 hover:border-gold/30 transition-all duration-300 flex flex-col"
            >
              {/* Línea */}
              <div className="w-8 h-px bg-gold/30 mb-5 group-hover:w-14 transition-all duration-300" />

              {/* Nombre */}
              <h3 className="font-serif text-lg font-light text-white mb-3 leading-snug group-hover:text-gold transition-colors duration-200">
                {cat.label}
              </h3>

              {/* Descripción */}
              <p className="text-xs text-white/45 leading-relaxed font-light flex-1 mb-6">
                {cat.desc}
              </p>

              {/* Topics */}
              <div className="flex flex-wrap gap-2">
                {cat.topics.map(t => (
                  <span key={t} className="text-[10px] tracking-wide text-gold/50 border border-gold/20 px-2.5 py-1 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12 reveal">
          <Link
            to="/blog"
            className="inline-flex flex-col items-center gap-1 group"
          >
            <span className="btn-primary px-10 py-4 text-xs tracking-[0.18em] rounded-sm">
              {c.cta}
            </span>
            <span className="text-white/30 text-[10px] tracking-wide font-light mt-1">
              {c.ctaSub}
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
