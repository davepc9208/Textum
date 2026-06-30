import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { supabase, Post } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CATEGORIES = {
  es: [
    {
      key: 'filosofia-metodo',
      label: 'Filosofía y Método TEXTUM',
      desc: '«Estrategias de aprendizaje activo y herramientas pedagógicas diseñadas para transformar tus dudas en certezas. En esta sección descubrirás por qué la verdadera mentoría va más allá de una simple revisión formal, dándote las competencias necesarias para apropiarte de tu investigación, comprender el origen de cada error y convertirte en un autor completamente autónomo.»',
    },
    {
      key: 'rigor-escritura',
      label: 'Rigor y Escritura Científica',
      desc: '«Herramientas de andamiaje, pautas metodológicas y recursos visuales diseñados para estructurar tu investigación con excelencia. Aquí encontrarás las claves de utilidad universal para dominar la redacción académica de tus capítulos, aplicar de forma ética las nuevas tecnologías y alinear tu manuscrito con las normas internacionales más exigentes, garantizando un trabajo sólido y libre de rechazos.»',
    },
    {
      key: 'sustentacion-defensa',
      label: 'Sustentación y Defensa Oral',
      desc: '«Estrategias de oratoria, guiones de discurso y técnicas de control emocional diseñados para el paso final de tu titulación. En esta sección te ofrecemos los recursos universales para estructurar tu presentación visual, dominar el escenario y responder con solvencia metodológica ante las preguntas del tribunal, transformando los nervios en seguridad para defender tu trabajo con elocuencia.»',
    },
  ],
  en: [
    {
      key: 'filosofia-metodo',
      label: 'TEXTUM Philosophy & Method',
      desc: '«Active learning strategies and pedagogical tools designed to transform your doubts into certainties. In this section you will discover why true mentoring goes beyond a simple formal review, giving you the skills to take ownership of your research, understand the root of each error and become a fully autonomous author.»',
    },
    {
      key: 'rigor-escritura',
      label: 'Rigour & Scientific Writing',
      desc: '«Scaffolding tools, methodological guidelines and visual resources designed to structure your research with excellence. Here you will find the universal keys to mastering academic writing, applying new technologies ethically and aligning your manuscript with the most demanding international standards, ensuring a solid, rejection-free piece of work.»',
    },
    {
      key: 'sustentacion-defensa',
      label: 'Defence & Oral Presentation',
      desc: '«Oratory strategies, speech scripts and emotional control techniques designed for the final step of your graduation. In this section we offer universal resources to structure your visual presentation, command the stage and respond with methodological confidence to panel questions, turning nerves into security so you defend your work with eloquence.»',
    },
  ],
};

export default function BlogPage() {
  const { lang, t } = useLang();
  const b = t.blog;
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = CATEGORIES[lang];

  useEffect(() => {
    supabase
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setPosts(data ?? []);
        setLoading(false);
      });
  }, []);

  const title = (p: Post) => lang === 'es' ? p.title_es : p.title_en;
  const excerpt = (p: Post) => lang === 'es' ? p.excerpt_es : p.excerpt_en;

  const filtered = activeCategory
    ? posts.filter(p => p.category === activeCategory)
    : posts;

  // Artículo destacado: primero de rigor-escritura si no hay filtro activo, si no el primero del filtro
  const featured = filtered[0] ?? null;
  const rest = filtered.slice(1);

  const activeCategoryData = categories.find(c => c.key === activeCategory) ?? null;

  // SEO dinámico — cambia según el filtro de categoría activo
  useSEO({
    title: activeCategoryData
      ? `${activeCategoryData.label} | Blog TEXTUM Mentoría Académica`
      : (lang === 'es'
          ? 'Blog Académico | Artículos sobre Investigación y Redacción Científica — TEXTUM'
          : 'Academic Blog | Research and Scientific Writing Articles — TEXTUM'),
    description: activeCategoryData
      ? activeCategoryData.desc.replace(/[«»]/g, '').slice(0, 155)
      : (lang === 'es'
          ? 'Lee artículos y guías escritas por nuestras doctoras sobre redacción académica, metodología de investigación, APA 7 y cómo defender tu tesis con éxito.'
          : 'Read articles and guides written by our doctors on academic writing, research methodology, APA 7 and how to successfully defend your thesis.'),
    canonical: activeCategory ? `/blog?categoria=${activeCategory}` : '/blog',
    ogType: 'website',
    lang,
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {/* Header hero */}
      <div className="gradient-bg pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="orb orb-gold w-[400px] h-[400px] top-[-80px] right-[-80px] opacity-15" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{b.label}</p>
          <h1 className="font-serif text-5xl md:text-6xl font-light text-white leading-tight">
            {b.title1} <em className="not-italic text-gold">{b.title2}</em>
          </h1>
          <p className="text-white/50 text-sm mt-4 font-light">{b.subtitle}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,64 C360,0 1080,64 1440,0 L1440,64 L0,64Z" fill="#faf7f2" />
          </svg>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Category filters */}
        <div className="mb-10">
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-5 py-2.5 text-xs tracking-[0.15em] rounded-sm border transition-all duration-200 ${
                activeCategory === null
                  ? 'bg-navy text-gold border-navy'
                  : 'bg-white text-navy/60 border-navy/15 hover:border-gold/40 hover:text-navy'
              }`}
            >
              {lang === 'es' ? 'TODOS' : 'ALL'}
            </button>
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
                className={`px-5 py-2.5 text-xs tracking-[0.15em] rounded-sm border transition-all duration-200 ${
                  activeCategory === cat.key
                    ? 'bg-gold text-navy border-gold font-medium'
                    : 'bg-white text-navy/60 border-navy/15 hover:border-gold/40 hover:text-navy'
                }`}
              >
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Dynamic category description */}
          {activeCategoryData && (
            <div className="max-w-3xl mx-auto text-center">
              <p className="text-sm text-navy/65 leading-relaxed font-serif italic">
                {activeCategoryData.desc}
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-serif text-2xl text-navy/40 italic">{b.empty}</p>
          </div>
        ) : (
          <>
            {/* Featured article — full width */}
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="group block mb-10 bg-white rounded-sm shadow-sm border border-navy/8 hover:shadow-xl hover:border-gold/30 transition-all duration-300 overflow-hidden"
              >
                <div className="flex flex-col md:flex-row">
                  {featured.cover_url && (
                    <div className="relative md:w-1/2 h-64 md:h-auto overflow-hidden flex-shrink-0">
                      <img
                        src={featured.cover_url}
                        alt={featured.cover_alt ?? title(featured)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-navy/20" />
                      {featured.category && (
                        <span className="absolute top-4 left-4 text-[10px] tracking-[0.2em] uppercase bg-gold text-navy px-3 py-1 rounded-full font-medium">
                          {categories.find(c => c.key === featured.category)?.label ?? featured.category}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col justify-center p-8 md:p-10 flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-gold text-xs font-semibold">{featured.author[0]}</span>
                      </div>
                      <div>
                        <p className="text-xs text-navy/60 font-medium">{featured.author}</p>
                        <div className="flex items-center gap-2 text-navy/40 text-xs">
                          <Calendar size={10} />
                          <span>{new Date(featured.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-light text-navy leading-snug mb-3 group-hover:text-gold transition-colors duration-200">
                      {title(featured)}
                    </h2>
                    <p className="text-sm text-navy/60 leading-relaxed font-light mb-6">{excerpt(featured)}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-navy/8">
                      <div className="flex items-center gap-1.5 text-xs text-navy/40">
                        <Clock size={12} />
                        <span>{featured.reading_time} {b.minRead}</span>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-gold font-medium group-hover:gap-2 transition-all duration-200">
                        {b.readMore} <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest — 3-column grid */}
            {rest.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.slug}`}
                    className="group bg-white rounded-sm shadow-sm border border-navy/8 hover:shadow-lg hover:border-gold/30 transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    {post.cover_url && (
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={post.cover_url}
                          alt={post.cover_alt ?? title(post)}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-navy/30 to-transparent" />
                        {post.category && (
                          <span className="absolute top-3 left-3 text-[10px] tracking-[0.15em] uppercase bg-gold/90 text-navy px-2.5 py-0.5 rounded-full font-medium">
                            {categories.find(c => c.key === post.category)?.label ?? post.category}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-gold text-xs font-semibold">{post.author[0]}</span>
                        </div>
                        <div>
                          <p className="text-xs text-navy/60 font-medium">{post.author}</p>
                          <div className="flex items-center gap-2 text-navy/40 text-xs">
                            <Calendar size={10} />
                            <span>{new Date(post.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <h2 className="font-serif text-xl font-light text-navy leading-snug mb-3 group-hover:text-gold transition-colors duration-200">
                        {title(post)}
                      </h2>
                      <p className="text-sm text-navy/60 leading-relaxed font-light flex-1">{excerpt(post)}</p>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-navy/8">
                        <div className="flex items-center gap-1.5 text-xs text-navy/40">
                          <Clock size={12} />
                          <span>{post.reading_time} {b.minRead}</span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gold font-medium group-hover:gap-2 transition-all duration-200">
                          {b.readMore} <ArrowRight size={12} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
