// src/pages/ColeccionesPage.tsx


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { PageError, PageSkeleton } from '../components/AsyncState';
import { localizedPath } from '../lib/locale';

const COLLECTIONS = {
  es: [
    {
      type: 'principio',
      code: 'PT',
      label: 'Principios TEXTUM',
      desc: 'Fundamentos que explican las relaciones esenciales que organizan y orientan el proceso investigador. Cada principio desarrolla un aspecto clave del pensamiento metodológico científico.',
      stripOpacity: 1.0,
    },
    {
      type: 'categoria',
      code: 'CM',
      label: 'Categorías Metodológicas',
      desc: 'Componentes estructurales que conforman el diseño de una investigación científica. Describen los elementos esenciales que articulan el sistema metodológico.',
      stripOpacity: 1.0,
    },
    {
      type: 'herramienta',
      code: 'HT',
      label: 'Herramientas TEXTUM',
      desc: 'Instrumentos de apoyo para formular, revisar, representar y evaluar la calidad metodológica de una investigación. Recursos prácticos para investigadores y directores de tesis.',
      stripOpacity: 1.0,
    },
  ],
  en: [
    {
      type: 'principio',
      code: 'PT',
      label: 'TEXTUM Principles',
      desc: 'Foundations that explain the essential relationships organising and guiding the research process. Each principle develops a key aspect of scientific methodological thinking.',
      stripOpacity: 1.0,
    },
    {
      type: 'categoria',
      code: 'CM',
      label: 'Methodological Categories',
      desc: 'Structural components that make up the design of a scientific investigation. They describe the essential elements that articulate the methodological system.',
      stripOpacity: 1.0,
    },
    {
      type: 'herramienta',
      code: 'HT',
      label: 'TEXTUM Tools',
      desc: 'Support instruments for formulating, reviewing, representing and evaluating the methodological quality of a research project. Practical resources for researchers and thesis supervisors.',
      stripOpacity: 1.0,
    },
  ],
};

const I18N = {
  es: {
    colLabel:       'Colección TEXTUM. Mentoría Académica',
    intro1:         'La investigación científica no se reduce a la aplicación de métodos, técnicas o procedimientos. Constituye un proceso de construcción de conocimiento en el que cada decisión metodológica adquiere sentido por las relaciones que establece con las demás.',
    intro2:         'Esta colección reúne un conjunto de principios, categorías metodológicas y herramientas diseñados para fortalecer el pensamiento metodológico de investigadores, estudiantes de grado y posgrado, directores de tesis y docentes universitarios.',
    intro3:         'Cada documento puede consultarse de manera independiente; sin embargo, su verdadero alcance se comprende al integrarlo con los demás materiales de la colección.',
    systemNote:     'Esta colección propone comprender la investigación como un sistema metodológico dinámico, en el que la dirección científica, la articulación entre sus componentes, la revisión permanente de las decisiones y la claridad conceptual permiten construir conocimiento con rigor y coherencia.',
    structureLabel: 'Estructura de la Colección',
    brand:          'TEXTUM. Mentoría Académica',
    browse:         'Explorar',
    pieces:         'documentos',
    soon:           'Próximamente',
  },
  en: {
    colLabel:       'TEXTUM Collection. Academic Mentoring',
    intro1:         'Scientific research is not reducible to the application of methods, techniques or procedures. It constitutes a process of knowledge construction in which every methodological decision acquires meaning through its relationships with the others.',
    intro2:         'This collection brings together a set of principles, methodological categories and tools designed to strengthen the methodological thinking of researchers, undergraduate and postgraduate students, thesis supervisors and university educators.',
    intro3:         'Each document can be consulted independently; however, its full scope is understood by integrating it with the other materials in the collection.',
    systemNote:     'This collection proposes understanding research as a dynamic methodological system, in which scientific direction, the articulation between components, ongoing review of decisions and conceptual clarity allow knowledge to be built with rigour and coherence.',
    structureLabel: 'Collection Structure',
    brand:          'TEXTUM. Academic Mentoring',
    browse:         'Explore',
    pieces:         'documents',
    soon:           'Coming soon',
  },
};

export default function ColeccionesPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const s        = I18N[lang];
  const cols     = COLLECTIONS[lang];

  const [counts, setCounts]               = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [loadError, setLoadError]         = useState(false);
  const [reloadKey, setReloadKey]         = useState(0);

  useSEO({
    title: lang === 'es'
      ? 'Colección TEXTUM | Pensar metodológicamente la investigación científica'
      : 'TEXTUM Collection | Thinking methodologically about scientific research',
    description: lang === 'es'
      ? 'Principios, categorías metodológicas y herramientas para fortalecer el pensamiento metodológico de investigadores y estudiantes de posgrado. TEXTUM Mentoría Académica.'
      : 'Principles, methodological categories and tools to strengthen methodological thinking for researchers and postgraduate students. TEXTUM Academic Mentoring.',
    canonical: '/colecciones',
    ogType: 'website',
    lang,
  });

  useEffect(() => {
    Promise.resolve(supabase
      .from('posts')
      .select('collection_type')
      .eq('published', true)
      .not('collection_type', 'is', null)
      .then(({ data, error }) => {
        if (error) {
          setLoadError(true);
          setLoadingCounts(false);
          return;
        }
        const c: Record<string, number> = {};
        (data ?? []).forEach(row => {
          if (row.collection_type) c[row.collection_type] = (c[row.collection_type] ?? 0) + 1;
        });
        setCounts(c);
        setLoadError(false);
        setLoadingCounts(false);
      })
      )
      .catch(() => {
        setLoadError(true);
        setLoadingCounts(false);
      });
  }, [reloadKey]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="gradient-bg pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="orb orb-gold w-[500px] h-[500px] top-[-80px] right-[-80px] opacity-10" />
        <div className="orb orb-gold w-[250px] h-[250px] bottom-[-40px] left-[8%] opacity-6"
          style={{ animationDelay: '3s' }} />

        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <p className="text-[11px] tracking-[0.35em] text-gold/60 uppercase mb-6">
            {s.colLabel}
          </p>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
            {lang === 'es' ? (
              <>Pensar metodológicamente<br /><em className="not-italic text-gold">la investigación científica</em></>
            ) : (
              <>Thinking methodologically<br /><em className="not-italic text-gold">about scientific research</em></>
            )}
          </h1>

          <div className="flex items-center justify-center gap-4 my-8">
            <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/50" />
            <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
              <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
            </svg>
            <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/50" />
          </div>

          </div>

        {/* Wave de separación */}
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,64 C360,0 1080,64 1440,0 L1440,64 L0,64Z" fill="#faf7f2" />
          </svg>
        </div>
      </div>

      {/* ── Contenido principal ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-20">

        {/* Etiqueta de estructura */}
        <div className="flex items-center gap-4 mb-14">
          <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/50" />
          <p className="text-[10px] tracking-[0.35em] text-navy/75 uppercase">
            {s.structureLabel}
          </p>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-navy/10 to-transparent" />
        </div>

        {/* Cards */}
        {loadingCounts && !loadError ? (
          <PageSkeleton cards={3} />
        ) : loadError ? (
          <PageError
            title={lang === 'es' ? 'No se pudo cargar la colección' : 'The collection could not be loaded'}
            description={lang === 'es' ? 'Comprueba tu conexión e inténtalo de nuevo.' : 'Check your connection and try again.'}
            retry={() => { setLoadError(false); setLoadingCounts(true); setReloadKey(value => value + 1); }}
            retryLabel={lang === 'es' ? 'Intentar de nuevo' : 'Try again'}
          />
        ) : (
        <div className="space-y-4">
          {cols.map((col) => {
            const count = counts[col.type] ?? 0;
            return (
              <button
                key={col.type}
                type="button"
                onClick={() => navigate(localizedPath(`/colecciones/${col.type}`, lang))}
                className="group flex w-full text-left rounded-sm bg-white border border-navy/8 hover:border-gold/30 hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                {/* Franja lateral — style inline para evitar purga de Tailwind */}
                <div
                  style={{
                    width: '4px',
                    flexShrink: 0,
                    backgroundColor: `rgba(13,31,60,${col.stripOpacity})`,
                  }}
                />

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-6 p-6 md:p-8">

                  {/* Código */}
                  <div className="flex-shrink-0 sm:w-20 text-center">
                    <span className="font-mono text-xl font-light text-navy/65 tracking-widest">
                      {col.code}
                    </span>
                  </div>

                  {/* Separador vertical */}
                  <div className="hidden sm:block w-px self-stretch bg-navy/8" />

                  {/* Nombre + descripción */}
                  <div className="flex-1 min-w-0">
                    <h2 className="font-serif text-xl md:text-2xl font-light text-navy leading-snug mb-2 group-hover:text-gold transition-colors duration-200">
                      {col.label}
                    </h2>
                    <p className="text-sm text-navy/50 leading-relaxed font-light">
                      {col.desc}
                    </p>
                  </div>

                  {/* CTA */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <span className="text-xs text-navy/70 font-light">
                      {loadingCounts ? '—' : count > 0 ? `${count} ${s.pieces}` : s.soon}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs tracking-[0.15em] text-gold border border-gold/30 px-4 py-2 rounded-sm group-hover:bg-gold group-hover:text-navy transition-all duration-200 whitespace-nowrap">
                      {s.browse}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                        aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        )}

        {/* Cita del sistema metodológico */}
        <div className="mt-16 glass-cream rounded-sm p-8 border border-gold/15 shadow-sm">
          <svg className="mb-4 text-gold/40" width="28" height="20" viewBox="0 0 32 24"
            fill="currentColor" aria-hidden="true">
            <path d="M0 24V14.4C0 6.4 5.2 1.6 15.6 0l1.6 3.2C11.2 4.4 8 7.2 7.2 12H12V24H0zm20 0V14.4C20 6.4 25.2 1.6 35.6 0L37.2 3.2C31.2 4.4 28 7.2 27.2 12H32V24H20z"/>
          </svg>
          <p className="font-serif italic text-base md:text-lg text-navy/70 leading-relaxed font-light">
            {s.systemNote}
          </p>
          <div className="flex items-center gap-3 mt-6 mb-4">
            <div className="w-8 h-px bg-gold/40" />
            <p className="text-xs tracking-[0.2em] text-gold/60 uppercase">{s.brand}</p>
          </div>
          <p className="text-xs text-navy/65 font-light leading-relaxed">{s.intro3}</p>
        </div>

      </div>

      <Footer />
      <BackToTop />
    </div>
  );
}
