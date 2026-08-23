// src/components/Testimonios.tsx
// v2 — barra de progreso por tarjeta + fondo navy (Contact pasa a cream)

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { ExternalLink } from 'lucide-react';

type Testimonio = {
  name: string;
  institution: string;
  country: string;
  service_es: string;
  service_en: string;
  quote_es: string;
  quote_en: string;
  links: { label: string; url: string }[];
};

const TESTIMONIOS: Testimonio[] = [
  {
    name: 'Zulmi Consuelo Tenorio Polo',
    institution: 'Universidad César Vallejo',
    country: 'Perú',
    service_es: 'Publicación científica',
    service_en: 'Scientific publication',
    quote_es: 'Nuestro artículo no fluía y ya no sabíamos cómo mejorarlo. TEXTUM intervino justo donde lo necesitábamos: estructura, coherencia y redacción académica. Nos dieron la seguridad para presentar un manuscrito sólido y publicable. Cumplimos nuestro objetivo con una mentoría profesional, ágil y ajustada a nuestras necesidades.',
    quote_en: 'Our article was not flowing and we no longer knew how to improve it. TEXTUM stepped in exactly where we needed it: structure, coherence and academic writing. They gave us the confidence to present a solid, publishable manuscript. We achieved our goal with professional, agile mentoring tailored to our needs.',
    links: [
      { label: 'Dialnet', url: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10513571' },
      { label: 'Podium · UPR', url: 'https://podium.upr.edu.cu/index.php/podium/article/view/1845' },
    ],
  },
  {
    name: 'Xu Kong',
    institution: 'Universidad de Linyi',
    country: 'China',
    service_es: 'Publicación científica',
    service_en: 'Scientific publication',
    quote_es: 'Quería publicar en una revista internacional pero me faltaba experiencia y claridad para estructurar mi investigación. La Dra. Vilma identificó mis debilidades, mejoró la coherencia del diseño y afinó mi expresión académica. Gracias a su guía logré publicar en una revista de alta visibilidad internacional.',
    quote_en: 'I wanted to publish in an international journal but lacked the experience and clarity to structure my research. Dr. Vilma identified my weaknesses, improved the coherence of the design and refined my academic expression. Thanks to her guidance I managed to publish in a high-visibility international journal.',
    links: [
      { label: 'REDIE · UABC', url: 'https://redie.uabc.mx/redie/article/view/6118/2689' },
    ],
  },
  {
    name: 'Omar Silva Ramos',
    institution: 'Doctor en Ciencias Pedagógicas',
    country: 'Latinoamérica',
    service_es: 'Publicación científica',
    service_en: 'Scientific publication',
    quote_es: 'Tenía el borrador pero necesitaba convertirlo en un manuscrito con el rigor que exigen las revistas científicas. TEXTUM me acompañó en todo el proceso: estructura, argumentación, estilo académico y criterios editoriales. Logré publicar y adquirí herramientas que aplicaré en mis futuras investigaciones.',
    quote_en: 'I had the draft but needed to turn it into a manuscript with the rigour that scientific journals demand. TEXTUM supported me throughout the entire process: structure, argumentation, academic style and editorial criteria. I achieved publication and gained tools I will apply in my future research.',
    links: [
      { label: 'Mendive · Vol. 23, 2025', url: 'https://mendive.upr.edu.cu/index.php/MendiveUPR/article/view/3874' },
    ],
  },
];

const INTERVAL_MS = 6000;


function QuoteIcon() {
  return (
    <svg width="32" height="24" viewBox="0 0 32 24" fill="currentColor" className="text-gold/25 mb-4" aria-hidden="true">
      <path d="M0 24V14.4C0 6.4 5.2 1.6 15.6 0l1.6 3.2C11.2 4.4 8 7.2 7.2 12H12V24H0zm20 0V14.4C20 6.4 25.2 1.6 35.6 0L37.2 3.2C31.2 4.4 28 7.2 27.2 12H32V24H20z" />
    </svg>
  );
}

// Barra de progreso animada — se reinicia con cada cambio de tarjeta
function ProgressBar({ active, paused }: { active: number; paused: boolean }) {
  return (
    <div className="w-full h-px bg-white/10 relative overflow-hidden rounded-full mt-8">
      <div
        key={`progress-${active}`} // key fuerza remount = reinicio de animación
        className="absolute left-0 top-0 h-full w-full origin-left bg-gold/60 rounded-full"
        style={{
          animation: paused
            ? 'none'
            : `progressBar ${INTERVAL_MS}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes progressBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>
    </div>
  );
}

export default function Testimonios() {
  const { lang } = useLang();
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
    }, 280);
  }, [animating]);

  const next = useCallback(() => {
    goTo((active + 1) % TESTIMONIOS.length, 'next');
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + TESTIMONIOS.length) % TESTIMONIOS.length, 'prev');
  }, [active, goTo]);

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(next, INTERVAL_MS);
  }, [next]);

  const stopInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!paused) startInterval();
    else stopInterval();
    return stopInterval;
  }, [paused, startInterval, stopInterval]);

  const t = TESTIMONIOS[active];
  const quote = lang === 'es' ? t.quote_es : t.quote_en;
  const service = lang === 'es' ? t.service_es : t.service_en;

  const heading = {
    eyebrow:       lang === 'es' ? 'Resultados verificables'   : 'Verifiable results',
    title:         lang === 'es' ? 'Investigadores que '        : 'Researchers who ',
    titleEm:       lang === 'es' ? 'publicaron'                 : 'published',
    sub:           lang === 'es'
      ? 'Cada testimonio está respaldado por una publicación real en revista indexada.'
      : 'Every testimonial is backed by a real publication in an indexed journal.',
    verifiedLabel: lang === 'es' ? 'Publicación verificable'   : 'Verifiable publication',
    prev:          lang === 'es' ? 'Testimonio anterior'        : 'Previous testimonial',
    next:          lang === 'es' ? 'Siguiente testimonio'       : 'Next testimonial',
  };

  return (
    <section id="testimonios" className="section-navy py-24 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[300px] h-[300px] top-0 right-0 opacity-8" style={{ animationDelay: '1s' }} />
      <div className="orb orb-gold w-[200px] h-[200px] bottom-0 left-0 opacity-6" style={{ animationDelay: '3s' }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{heading.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-4">
            {heading.title}
            <em className="not-italic text-gold">{heading.titleEm}</em>
          </h2>
          <p className="text-white/40 text-sm font-light max-w-md mx-auto">{heading.sub}</p>
        </div>

        {/* Carrusel */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="relative"
        >
          {/* Flecha izquierda — desktop */}
          <button
            onClick={prev}
            aria-label={heading.prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold hover:border-gold/50 transition-all duration-200 hidden md:flex z-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Card */}
          <div
            className={`glass-navy border border-gold/15 rounded-sm px-8 py-10 md:px-12 md:py-12 transition-all duration-280 ${
              animating
                ? direction === 'next'
                  ? 'opacity-0 translate-x-3'
                  : 'opacity-0 -translate-x-3'
                : 'opacity-100 translate-x-0'
            }`}
          >
            <QuoteIcon />

            {/* Cita */}
            <blockquote className="font-serif italic text-xl md:text-2xl text-white/85 leading-relaxed font-light mb-8">
              "{quote}"
            </blockquote>

            {/* Separador */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-gold/40" />
              <svg width="6" height="6" viewBox="0 0 6 6" aria-hidden="true">
                <rect x="3" y="0" width="4" height="4" transform="rotate(45 3 3)" fill="#c9a84c" opacity="0.5" />
              </svg>
            </div>

            {/* Autor */}
            <div className="flex items-center gap-4 mb-6">
             <div>
                <p className="font-semibold text-white text-sm leading-tight">{t.name}</p>
                <p className="text-white/45 text-xs mt-0.5">{t.institution} · {t.country}</p>
                <span className="inline-block mt-1.5 text-[10px] tracking-[0.15em] uppercase text-gold/60 border border-gold/25 px-2 py-0.5 rounded-full">
                  {service}
                </span>
              </div>
            </div>

            {/* Publicaciones verificables */}
            <div className="flex flex-wrap gap-3 mb-2">
              <p className="w-full text-[10px] tracking-[0.2em] text-white/25 uppercase mb-1">
                {heading.verifiedLabel}
              </p>
              {t.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-gold/70 border border-gold/20 px-3 py-1.5 rounded-sm hover:border-gold/50 hover:text-gold transition-all duration-200"
                >
                  <ExternalLink size={11} aria-hidden="true" />
                  {link.label}
                </a>
              ))}
            </div>

            {/* Barra de progreso */}
            <ProgressBar active={active} paused={paused} />
          </div>

          {/* Flecha derecha — desktop */}
          <button
            onClick={next}
            aria-label={heading.next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold hover:border-gold/50 transition-all duration-200 hidden md:flex z-10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center gap-3 mt-8" role="tablist"
          aria-label={lang === 'es' ? 'Navegación de testimonios' : 'Testimonials navigation'}>
          {TESTIMONIOS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Testimonio ${i + 1}`}
              onClick={() => goTo(i, i > active ? 'next' : 'prev')}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-colors duration-300"
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 h-2 bg-gold' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
                aria-hidden="true"
              />
            </button>
          ))}
        </div>

        {/* Navegación móvil */}
        <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
          <button onClick={prev} aria-label={heading.prev}
            className="w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button onClick={next} aria-label={heading.next}
            className="w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
