// src/components/Testimonios.tsx
// Sección de testimonios con carrusel automático + navegación manual.
// Se coloca justo antes de Contact en App.tsx.
//
// DISEÑO:
// - Fondo navy para contrastar con Services (cream) y fusionarse con Contact (navy)
// - Avatar con iniciales — mismo formato para los tres (sin foto, decisión deliberada)
// - Carrusel auto-avanza cada 6s, se pausa al hover
// - Enlace a publicación verificable en cada testimonio
// - Indicadores de posición (dots) en la parte inferior
// - Transición suave fade+slide
// - Barra de progreso que muestra el tiempo restante para el cambio

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLang } from '../i18n/LangContext';
import { ExternalLink } from 'lucide-react';

type Testimonio = {
  initials: string;
  color: string; // color del avatar
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
    initials: 'ZT',
    color: '#c9a84c', // gold
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
    initials: 'XK',
    color: '#1a3160', // navy light
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
    initials: 'OS',
    color: '#c9a84c', // gold
    name: 'Omar Silva Ramos',
    institution: 'Doctor en Ciencias Pedagógicas',
    country: 'Cuba',
    service_es: 'Publicación científica',
    service_en: 'Scientific publication',
    quote_es: 'Tenía el borrador pero necesitaba convertirlo en un manuscrito con el rigor que exigen las revistas científicas. TEXTUM me acompañó en todo el proceso: estructura, argumentación, estilo académico y criterios editoriales. Logré publicar y adquirí herramientas que aplicaré en mis futuras investigaciones.',
    quote_en: 'I had the draft but needed to turn it into a manuscript with the rigour that scientific journals demand. TEXTUM supported me throughout the entire process: structure, argumentation, academic style and editorial criteria. I achieved publication and gained tools I will apply in my future research.',
    links: [
      { label: 'Mendive · Vol. 23, 2025', url: 'https://mendive.upr.edu.cu/index.php/MendiveUPR/article/view/3874' },
    ],
  },
];

function Avatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-gold/30 shadow-lg"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      <span className="font-serif text-lg font-semibold text-white tracking-wide">
        {initials}
      </span>
    </div>
  );
}

// Icono de comillas tipográficas
function QuoteIcon() {
  return (
    <svg
      width="32" height="24" viewBox="0 0 32 24"
      fill="currentColor"
      className="text-gold/25 mb-4"
      aria-hidden="true"
    >
      <path d="M0 24V14.4C0 6.4 5.2 1.6 15.6 0l1.6 3.2C11.2 4.4 8 7.2 7.2 12H12V24H0zm20 0V14.4C20 6.4 25.2 1.6 35.6 0L37.2 3.2C31.2 4.4 28 7.2 27.2 12H32V24H20z" />
    </svg>
  );
}

export default function Testimonios() {
  const { lang } = useLang();
  const [active, setActive] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isHoveringRef = useRef(false);
  const isPausedRef = useRef(false);

  const INTERVAL_DURATION = 6000; // 6 segundos
  const PROGRESS_INTERVAL = 50; // actualizar progreso cada 50ms

  const goTo = useCallback((index: number, dir: 'next' | 'prev' = 'next') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setActive(index);
      setAnimating(false);
      // Reiniciar progreso
      setProgress(0);
    }, 300);
  }, [animating]);

  const next = useCallback(() => {
    goTo((active + 1) % TESTIMONIOS.length, 'next');
  }, [active, goTo]);

  const prev = useCallback(() => {
    goTo((active - 1 + TESTIMONIOS.length) % TESTIMONIOS.length, 'prev');
  }, [active, goTo]);

  // Iniciar el auto-avance
  const startInterval = useCallback(() => {
    // Limpiar intervalos existentes
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    // No iniciar si está pausado o en hover
    if (isPausedRef.current || isHoveringRef.current) return;

    setProgress(0);

    // Intervalo para actualizar la barra de progreso
    progressRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (PROGRESS_INTERVAL / INTERVAL_DURATION) * 100;
        return Math.min(newProgress, 100);
      });
    }, PROGRESS_INTERVAL);

    // Intervalo para cambiar de testimonio
    intervalRef.current = setInterval(() => {
      // Verificar que no esté pausado ni en hover
      if (!isPausedRef.current && !isHoveringRef.current) {
        next();
      }
    }, INTERVAL_DURATION);
  }, [next]);

  // Detener el auto-avance
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
  }, []);

  // Pausar (cuando el usuario interactúa)
  const pauseAutoPlay = useCallback(() => {
    isPausedRef.current = true;
    stopInterval();
  }, [stopInterval]);

  // Reanudar
  const resumeAutoPlay = useCallback(() => {
    isPausedRef.current = false;
    if (!isHoveringRef.current) {
      startInterval();
    }
  }, [startInterval]);

  // Manejar hover
  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    stopInterval();
  }, [stopInterval]);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    if (!isPausedRef.current) {
      startInterval();
    }
  }, [startInterval]);

  // Iniciar/Reiniciar cuando cambia el testimonio activo
  useEffect(() => {
    // Si está pausado o en hover, no reiniciar automáticamente
    if (isPausedRef.current || isHoveringRef.current) return;
    startInterval();
    return stopInterval;
  }, [active, startInterval, stopInterval]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopInterval();
    };
  }, [stopInterval]);

  const t = TESTIMONIOS[active];
  const quote = lang === 'es' ? t.quote_es : t.quote_en;
  const service = lang === 'es' ? t.service_es : t.service_en;

  const heading = {
    eyebrow: lang === 'es' ? 'Testimonios' : 'Testimonials',
    title: lang === 'es'
      ? <>Investigadores que <em className="not-italic text-gold">publicaron</em></>
      : <>Researchers who <em className="not-italic text-gold">published</em></>,
    sub: lang === 'es'
      ? 'Cada testimonio está respaldado por una publicación real en revista indexada.'
      : 'Every testimonial is backed by a real publication in an indexed journal.',
    verifiedLabel: lang === 'es' ? 'Publicación verificable' : 'Verifiable publication',
  };

  return (
    <section
      id="testimonios"
      className="section-navy py-24 px-6 relative overflow-hidden"
    >
      <div className="orb orb-gold w-[300px] h-[300px] top-0 right-0 opacity-8" style={{ animationDelay: '1s' }} />
      <div className="orb orb-gold w-[200px] h-[200px] bottom-0 left-0 opacity-6" style={{ animationDelay: '3s' }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">
            {heading.eyebrow}
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight mb-4">
            {heading.title}
          </h2>
          <p className="text-white/40 text-sm font-light max-w-md mx-auto">
            {heading.sub}
          </p>
        </div>

        {/* Carrusel */}
        <div
          ref={wrapperRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={pauseAutoPlay}
          onTouchEnd={resumeAutoPlay}
          className="relative"
        >
          {/* Barra de progreso */}
          <div className="absolute -top-4 left-0 right-0 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold/60 rounded-full transition-all duration-50 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Card principal */}
          <div
            className={`
              glass-navy border border-gold/15 rounded-sm p-8 md:p-12
              transition-all duration-300
              ${animating
                ? direction === 'next'
                  ? 'opacity-0 translate-x-4'
                  : 'opacity-0 -translate-x-4'
                : 'opacity-100 translate-x-0'
              }
            `}
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
              <Avatar initials={t.initials} color={t.color} />
              <div>
                <p className="font-semibold text-white text-sm leading-tight">{t.name}</p>
                <p className="text-white/45 text-xs mt-0.5">{t.institution} · {t.country}</p>
                <span className="inline-block mt-1.5 text-[10px] tracking-[0.15em] uppercase text-gold/60 border border-gold/25 px-2 py-0.5 rounded-full">
                  {service}
                </span>
              </div>
            </div>

            {/* Enlaces a publicaciones */}
            <div className="flex flex-wrap gap-3">
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
          </div>

          {/* Navegación lateral */}
          <button
            onClick={() => { pauseAutoPlay(); prev(); setTimeout(resumeAutoPlay, 500); }}
            aria-label={lang === 'es' ? 'Testimonio anterior' : 'Previous testimonial'}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold hover:border-gold/50 transition-all duration-200 hidden md:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => { pauseAutoPlay(); next(); setTimeout(resumeAutoPlay, 500); }}
            aria-label={lang === 'es' ? 'Siguiente testimonio' : 'Next testimonial'}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold hover:border-gold/50 transition-all duration-200 hidden md:flex"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Dots de navegación */}
        <div className="flex items-center justify-center gap-3 mt-8" role="tablist" aria-label={lang === 'es' ? 'Navegación de testimonios' : 'Testimonials navigation'}>
          {TESTIMONIOS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === active}
              aria-label={`Testimonio ${i + 1}`}
              onClick={() => { pauseAutoPlay(); goTo(i, i > active ? 'next' : 'prev'); setTimeout(resumeAutoPlay, 500); }}
              className={`rounded-full transition-all duration-300 ${
                i === active
                  ? 'w-6 h-2 bg-gold'
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Navegación móvil */}
        <div className="flex items-center justify-center gap-4 mt-6 md:hidden">
          <button
            onClick={() => { pauseAutoPlay(); prev(); setTimeout(resumeAutoPlay, 500); }}
            aria-label={lang === 'es' ? 'Anterior' : 'Previous'}
            className="w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={() => { pauseAutoPlay(); next(); setTimeout(resumeAutoPlay, 500); }}
            aria-label={lang === 'es' ? 'Siguiente' : 'Next'}
            className="w-10 h-10 rounded-full bg-navy border border-gold/20 flex items-center justify-center text-gold/50 hover:text-gold transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}