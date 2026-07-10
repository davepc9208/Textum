// src/components/AcademicIntegrity.tsx
// Bloque de integridad académica y uso ético de IA
// Se coloca entre About y Services en App.tsx

import { useLang } from '../i18n/LangContext';

const content = {
  es: {
    label: 'Integridad académica',
    title1: 'Tu autoría,',
    title2: 'siempre intacta',
    body: 'En TEXTUM trabajamos con herramientas de análisis asistido por IA para identificar patrones estructurales y metodológicos en tu documento. Nunca utilizamos la IA para generar texto en tu nombre ni para sustituir tu voz académica. Cada palabra de tu investigación es tuya. Nuestra función es ayudarte a comprender, mejorar y defender lo que tú has creado.',
    standards: [
      { code: 'APA 7', desc: 'Norma de referencia' },
      { code: 'IMRyD', desc: 'Estructura científica' },
      { code: 'Scopus', desc: 'Indexación internacional' },
      { code: 'Latindex', desc: 'Indexación LATAM' },
      { code: 'ANECA', desc: 'Estándar europeo' },
      { code: 'Bologna', desc: 'Marco europeo de titulación' },
    ],
    aiNote: 'IA como herramienta de análisis, nunca de escritura.',
    pledge: 'Declaración de integridad',
  },
  en: {
    label: 'Academic integrity',
    title1: 'Your authorship,',
    title2: 'always intact',
    body: 'At TEXTUM we use AI-assisted analysis tools to identify structural and methodological patterns in your document. We never use AI to generate text on your behalf or to replace your academic voice. Every word of your research is yours. Our role is to help you understand, improve and defend what you have created.',
    standards: [
      { code: 'APA 7', desc: 'Reference standard' },
      { code: 'IMRaD', desc: 'Scientific structure' },
      { code: 'Scopus', desc: 'International indexing' },
      { code: 'Latindex', desc: 'LATAM indexing' },
      { code: 'ANECA', desc: 'European standard' },
      { code: 'Bologna', desc: 'European degree framework' },
    ],
    aiNote: 'AI as an analysis tool, never a writing substitute.',
    pledge: 'Integrity declaration',
  },
};

// Icono escudo con check — inline SVG para no añadir dependencias
function ShieldCheckIcon() {
  return (
    <svg
      width="40" height="40" viewBox="0 0 40 40"
      fill="none" xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M20 4L6 9.5V20C6 27.5 12.2 34.4 20 36C27.8 34.4 34 27.5 34 20V9.5L20 4Z"
        stroke="#c9a84c" strokeWidth="1.5" fill="rgba(201,168,76,0.08)"
      />
      <path
        d="M14 20L18 24L26 16"
        stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

// Icono IA — cerebro simplificado
function AIIcon() {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2a4 4 0 0 1 4 4v1h1a3 3 0 0 1 0 6h-1v1a4 4 0 0 1-8 0v-1H7a3 3 0 0 1 0-6h1V6a4 4 0 0 1 4-4z" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
    </svg>
  );
}

export default function AcademicIntegrity() {
  const { lang } = useLang();
  const c = content[lang];

  return (
    <section
      id="integridad"
      className="section-cream py-20 px-6 relative overflow-hidden"
      aria-label={c.label}
    >
      {/* Fondo sutil */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none select-none"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #0d1f3c 0px, #0d1f3c 1px,
            transparent 1px, transparent 12px
          )`,
        }}
        aria-hidden="true"
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* Columna izquierda — texto principal */}
          <div className="reveal-left">
            <div className="flex items-center gap-4 mb-6">
              <ShieldCheckIcon />
              <p className="text-xs tracking-[0.3em] text-gold uppercase">{c.label}</p>
            </div>

            <h2 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-6">
              {c.title1}<br />
              <em className="not-italic text-gold-gradient">{c.title2}</em>
            </h2>

            <p className="text-base text-navy/70 leading-relaxed font-light mb-8">
              {c.body}
            </p>

            {/* Nota IA — chip destacado */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-sm bg-navy/5 border border-navy/10 text-sm text-navy/70">
              <span className="text-gold">
                <AIIcon />
              </span>
              <span className="font-light">{c.aiNote}</span>
            </div>
          </div>

          {/* Columna derecha — estándares */}
          <div className="reveal-right">
            <div className="glass-cream rounded-sm p-8 border border-gold/15 shadow-sm">

              <p className="text-xs tracking-[0.25em] text-navy/50 uppercase mb-6">
                {c.pledge}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {c.standards.map((std) => (
                  <div
                    key={std.code}
                    className="flex flex-col items-center text-center p-4 rounded-sm border border-navy/8 bg-white/80 hover:border-gold/30 hover:bg-white transition-all duration-200 group"
                  >
                    <span className="font-serif text-lg font-semibold text-navy group-hover:text-gold transition-colors duration-200">
                      {std.code}
                    </span>
                    <span className="text-[10px] tracking-wide text-navy/45 mt-1 leading-tight">
                      {std.desc}
                    </span>
                  </div>
                ))}
              </div>

              {/* Línea de cierre */}
              <div className="mt-8 pt-6 border-t border-navy/8 flex items-center gap-3">
                <div className="w-6 h-px bg-gold/40" />
                <p className="text-xs text-navy/40 font-light italic leading-relaxed">
                  {lang === 'es'
                    ? 'Alineados con los estándares de calidad académica de América Latina y Europa.'
                    : 'Aligned with academic quality standards across Latin America and Europe.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
