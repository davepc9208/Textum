// src/pages/ColeccionListPage.tsx
// Listado de piezas de un tipo de colección — /colecciones/:tipo

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { POST_SUMMARY_FIELDS, supabase, Post } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BackToTop from '../components/BackToTop';
import { localizedPath } from '../lib/locale';
import { PageError, PageSkeleton } from '../components/AsyncState';

type CollectionType = 'principio' | 'categoria' | 'herramienta' | 'eii';

// Tipos reales según PRESENTACIÓN_DE_LA_COLECCIÓN.docx
const META = {
  principio:   { es: { label: 'Principios TEXTUM',        code: 'PT', tag: 'Fundamentos metodológicos'   }, en: { label: 'TEXTUM Principles',          code: 'PT', tag: 'Methodological foundations' } },
  categoria:   { es: { label: 'Categorías Metodológicas', code: 'CM', tag: 'Componentes estructurales'   }, en: { label: 'Methodological Categories',   code: 'CM', tag: 'Structural components'      } },
  herramienta: { es: { label: 'Herramientas TEXTUM',      code: 'HT', tag: 'Instrumentos de evaluación'  }, en: { label: 'TEXTUM Tools',               code: 'HT', tag: 'Evaluation instruments'     } },
  eii:         { es: { label: 'Enfoque Investigativo Integral', code: 'EII', tag: 'Totalidad dinámica'         }, en: { label: 'Integral Research Approach',  code: 'EII', tag: 'Dynamic whole'              } },
};

export default function ColeccionListPage() {
  const { tipo } = useParams<{ tipo: string }>();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const collectionType = tipo as CollectionType;
  const meta = META[collectionType]?.[lang];

  useSEO({
    title: meta
      ? `${meta.label} | Colecciones TEXTUM`
      : 'Colecciones TEXTUM',
    description: lang === 'es'
      ? `${meta?.label ?? 'Colección'} — contenido editorial profundo de TEXTUM Mentoría Académica.`
      : `${meta?.label ?? 'Collection'} — deep editorial content from TEXTUM Academic Mentoring.`,
    canonical: `/colecciones/${tipo}`,
    lang,
  });

  useEffect(() => {
    if (!collectionType || !META[collectionType]) {
      navigate(localizedPath('/colecciones', lang));
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPosts([]);
    setHasMore(false);
    setLoadError(false);

    const loadFirstPage = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select(POST_SUMMARY_FIELDS)
        .eq('published', true)
        .eq('collection_type', collectionType)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(10);
      if (cancelled) return;
      setPosts(error ? [] : (data as unknown as Post[] ?? []));
      setHasMore(!error && (data?.length ?? 0) === 10);
      setLoadError(Boolean(error));
      setLoading(false);
    };

    loadFirstPage();
    return () => { cancelled = true; };
  }, [collectionType, navigate, reloadKey, lang]);

  const loadMore = async () => {
    const last = posts[posts.length - 1];
    if (!last || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SUMMARY_FIELDS)
      .eq('published', true)
      .eq('collection_type', collectionType)
      .or(`created_at.lt.${last.created_at},and(created_at.eq.${last.created_at},id.lt.${last.id})`)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(10);
    if (!error && data) {
      setPosts(current => [...current, ...(data as unknown as Post[])]);
      setHasMore(data.length === 10);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const title   = (p: Post) => lang === 'es' ? p.title_es   : p.title_en;
  const excerpt = (p: Post) => lang === 'es' ? p.excerpt_es : p.excerpt_en;

  if (!meta) return null;

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main id="main-content">
      {/* Hero */}
      <div className="gradient-bg pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="orb orb-gold w-[400px] h-[400px] top-[-60px] right-[-60px] opacity-10" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Link
            to={localizedPath('/colecciones', lang)}
            className="inline-flex items-center gap-2 text-gold/60 text-xs tracking-widest hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft size={13} />
            {lang === 'es' ? 'Colecciones TEXTUM' : 'TEXTUM Collections'}
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-[10px] tracking-[0.3em] text-gold/40 uppercase">{meta.code}</span>
            <span className="w-px h-3 bg-gold/20" />
            <span className="text-[10px] tracking-[0.2em] text-gold/60 border border-gold/25 px-2.5 py-0.5 rounded-full uppercase">{meta.tag}</span>
          </div>

          <h1 className="font-serif text-5xl md:text-6xl font-light text-white leading-tight">
            {meta.label}
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
          <svg viewBox="0 0 1440 64" preserveAspectRatio="none" className="w-full h-full">
            <path d="M0,64 C360,0 1080,64 1440,0 L1440,64 L0,64Z" fill="#faf7f2" />
          </svg>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {loading ? (
          <PageSkeleton cards={3} />
        ) : loadError ? (
          <PageError
            title={lang === 'es' ? 'No se pudo cargar la colección' : 'The collection could not be loaded'}
            description={lang === 'es' ? 'Comprueba tu conexión e inténtalo de nuevo. El contenido volverá a estar disponible cuando el servicio se recupere.' : 'Check your connection and try again. The content will be available when the service recovers.'}
            retry={() => setReloadKey(value => value + 1)}
            retryLabel={lang === 'es' ? 'Intentar de nuevo' : 'Try again'}
          />
        ) : posts.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-navy/10 rounded-sm">
            <p className="font-serif text-2xl text-navy/65 italic mb-2">
              {lang === 'es' ? 'Próximamente' : 'Coming soon'}
            </p>
            <p className="text-sm text-navy/70 font-light">
              {lang === 'es'
                ? 'Estamos preparando el contenido de esta colección.'
                : 'We are preparing the content for this collection.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post, i) => (
              <Link
                key={post.id}
                to={localizedPath(`/colecciones/${collectionType}/${post.slug}`, lang)}
                className="group flex flex-col md:flex-row gap-6 bg-white border border-navy/8 rounded-sm p-6 md:p-8 hover:border-gold/30 hover:shadow-lg transition-all duration-300"
              >
                {/* Número de pieza */}
                <div className="flex-shrink-0 flex items-start gap-4 md:flex-col md:items-center md:w-16">
                  <span className="font-serif text-3xl font-light text-navy/15 group-hover:text-gold/30 transition-colors leading-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-px h-full min-h-[40px] bg-navy/8 hidden md:block" />
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {post.cover_url && (
                    <img
                      src={post.cover_url}
                      alt={post.cover_alt ?? title(post)}
                      loading="lazy"
                      decoding="async"
                      className="w-full aspect-[3/2] object-cover rounded-sm mb-5"
                    />
                  )}
                  <div className="flex items-center gap-3 mb-3 text-xs text-navy/40">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} aria-hidden="true" />
                      {new Date(post.created_at).toLocaleDateString(
                        lang === 'es' ? 'es-ES' : 'en-GB',
                        { year: 'numeric', month: 'long', day: 'numeric' }
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} aria-hidden="true" />
                      {post.reading_time} {t.blog.minRead}
                    </span>
                    <span className="text-gold/70">{post.author}</span>
                  </div>
                  <h2 className="font-serif text-xl md:text-2xl font-light text-navy leading-snug mb-2 group-hover:text-gold transition-colors duration-200">
                    {title(post)}
                  </h2>
                  <p className="text-sm text-navy/55 leading-relaxed font-light line-clamp-2">
                    {excerpt(post)}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-xs text-gold font-medium group-hover:gap-3 transition-all duration-200">
                    {lang === 'es' ? 'Leer pieza' : 'Read piece'}
                    <ArrowRight size={12} aria-hidden="true" />
                  </div>
                </div>
              </Link>
            ))}
            {hasMore && (
              <div className="flex justify-center pt-6">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="border border-navy/20 text-navy/65 hover:border-gold/50 hover:text-navy px-7 py-3 text-xs tracking-[0.15em] rounded-sm transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (lang === 'es' ? 'CARGANDO…' : 'LOADING…') : (lang === 'es' ? 'CARGAR MÁS' : 'LOAD MORE')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
