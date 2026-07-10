// src/components/Filosofia.tsx
// Nuevo componente — "Filosofía TEXTUM"
// Ubicación en App.tsx: entre <Hero /> y <Services /> (que contiene el Método)
// id="filosofia" para que el CTA secundario del Hero pueda enlazar si se desea

import { useLang } from '../i18n/LangContext';

const content = {
  es: {
    eyebrow: 'Filosofía TEXTUM',
    title1: 'Mentoría académica',
    title2: 'como intervención integral',
    body: 'En TEXTUM entendemos la mentoría académica como una intervención integral en el proceso de escritura y el desarrollo de competencias del autor. Trabajamos para fortalecer la claridad conceptual, la coherencia metodológica y la autonomía intelectual, de modo que cada proyecto avance con mayor solidez científica y mayor capacidad de defensa.',
    closing: 'Nuestro acompañamiento no se limita a mejorar un texto: fortalece todo el proceso académico y tu capacidad como autor para avanzar con criterio propio y rigor académico.',
    pillars: [
      { label: 'Claridad conceptual', icon: '◎' },
      { label: 'Coherencia metodológica', icon: '◈' },
      { label: 'Autonomía intelectual', icon: '◆' },
      { label: 'Rigor científico', icon: '◉' },
    ],
  },
  en: {
    eyebrow: 'TEXTUM Philosophy',
    title1: 'Academic mentoring',
    title2: 'as integral intervention',
    body: 'At TEXTUM we understand academic mentoring as an integral intervention in the writing process and the development of the author´s competencies. We work to strengthen conceptual clarity, methodological coherence and intellectual autonomy, so that each project advances with greater scientific rigour and a stronger capacity for defence.',
    closing: 'Our support goes beyond improving a text: it strengthens the entire academic process and your capacity as an author to advance with your own informed judgement and academic rigour.',
    pillars: [
      { label: 'Conceptual clarity', icon: '◎' },
      { label: 'Methodological coherence', icon: '◈' },
      { label: 'Intellectual autonomy', icon: '◆' },
      { label: 'Scientific rigour', icon: '◉' },
    ],
  },
};

export default function Filosofia() {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <section
      id="filosofia"
      className="section-cream py-24 px-6 relative overflow-hidden"
    >
      {/* Watermark decorativo */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.018]"
        aria-hidden
      >
        <span className="font-serif text-[28vw] font-bold text-navy leading-none">F</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Columna izquierda — texto */}
          <div className="reveal-left">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.eyebrow}</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-8">
              {c.title1}<br />
              <em className="not-italic text-gold-gradient">{c.title2}</em>
            </h2>

            <p className="text-base text-navy/70 leading-relaxed font-light mb-6">
              {c.body}
            </p>

            {/* Línea divisora dorada */}
            <div className="flex items-center gap-3 my-6">
              <div className="w-10 h-px bg-gold/50" />
              <svg width="7" height="7" viewBox="0 0 7 7">
                <rect x="3.5" y="0" width="5" height="5" transform="rotate(45 3.5 3.5)" fill="#c9a84c" />
              </svg>
            </div>

            <p className="text-sm text-navy/55 leading-relaxed font-light italic">
              {c.closing}
            </p>
          </div>

          {/* Columna derecha — 4 pilares */}
          <div className="reveal-right">
            <div className="grid grid-cols-2 gap-px bg-navy/8 rounded-sm overflow-hidden">
              {c.pillars.map((pillar, i) => (
                <div
                  key={i}
                  className="bg-cream p-8 flex flex-col gap-4 group hover:bg-navy transition-colors duration-500"
                >
                  <span className="font-serif text-3xl text-gold/40 group-hover:text-gold/70 transition-colors duration-300 leading-none select-none">
                    {pillar.icon}
                  </span>
                  <div className="w-6 h-px bg-gold/30 group-hover:w-10 transition-all duration-300" />
                  <p className="font-serif text-base text-navy group-hover:text-white transition-colors duration-300 leading-snug">
                    {pillar.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Cita de cierre */}
            <div className="mt-6 px-6 py-5 border border-gold/15 rounded-sm bg-white/60">
              <p className="text-xs text-navy/40 tracking-[0.2em] uppercase mb-2">
                {lang === 'es' ? 'Nuestro compromiso' : 'Our commitment'}
              </p>
              <p className="text-sm text-navy/65 font-light leading-relaxed">
                {lang === 'es'
                  ? 'Rigor científico, claridad argumentativa e integridad académica — diseñado para LATAM y Europa.'
                  : 'Scientific rigour, argumentative clarity and academic integrity — designed for LATAM and Europe.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
