// src/pages/PostPage.tsx
// Fix 6: BreadcrumbList JSON-LD añadido
// Fix 7: ShareCard y ShareButtons reciben url canónica explícita

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft } from 'lucide-react';
import { supabase, Post } from '../lib/supabase';
import { ssrPost, dropSsrContent } from '../lib/ssrData';
import { useLang } from '../i18n/LangContext';
import { useSEO, injectSchema, removeSchema } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import ShareCard from '../components/ShareCard';
import RelatedPosts from '../components/RelatedPosts';
import WhatsAppCTA from '../components/WhatsAppCTA';
import BackToTop from '../components/BackToTop';
import { sanitizeHtml } from '../lib/sanitize';
import { localizedPath, localizedUrl } from '../lib/locale';
import { PageError, PageSkeleton } from '../components/AsyncState';
import { NotFoundContent } from './NotFoundPage';
import ArticleCover, { ImageLightbox } from '../components/ArticleCover';

const SITE_URL = 'https://www.mentoriatextum.com';

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const b = t.blog;
  const [post, setPost] = useState<Post | null>(() => ssrPost(slug));
  const [loading, setLoading] = useState(() => !ssrPost(slug));
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Quita el artículo pre-renderizado por SSR en cuanto React monta el real.
  useLayoutEffect(() => { dropSsrContent(); }, []);

  const openLightbox = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setLightbox({ src: img.src, alt: img.alt });
    }
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.title = 'Clic para ampliar';
    });
    el.addEventListener('click', openLightbox);
    return () => el.removeEventListener('click', openLightbox);
  }, [post, openLightbox]);

  useEffect(() => {
    if (!slug) return;
    // El SSR ya entregó este artículo en la primera carga: no repetimos la consulta.
    if (reloadKey === 0 && ssrPost(slug)) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    Promise.resolve(supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single())
      .then(({ data, error }) => {
        if (cancelled) return;
        setPost(data);
        setLoadError(Boolean(error));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setPost(null);
        setLoadError(true);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [slug, reloadKey]);

  const postTitle   = post ? (lang === 'es' ? post.title_es   : post.title_en)   : '';
  const postExcerpt = post ? (lang === 'es' ? post.excerpt_es : post.excerpt_en) : '';
  const content     = post ? (lang === 'es' ? post.content_es : post.content_en) : '';

  // URL canónica del artículo — usada en SEO, ShareCard y ShareButtons
  const canonicalUrl = post ? localizedUrl(`/blog/${post.slug}`, lang) : undefined;

  useSEO(post ? {
    title: `${postTitle} — TEXTUM Mentoría Académica`,
    description: postExcerpt.slice(0, 155),
    canonical: `/blog/${post.slug}`,
    ogImage: post.cover_url,
    ogImageAlt: post.cover_alt ?? postTitle,
    ogType: 'article',
    articleMeta: {
      publishedTime: post.created_at,
      author: post.author,
    },
    keywords: lang === 'es'
  ? post.keywords_es || `${post.category ?? ''}, mentoría académica, ${post.author}`
  : post.keywords_en || `${post.category ?? ''}, academic mentoring, ${post.author}`,
    lang,
  } : {
    title: 'Artículo — TEXTUM Mentoría Académica',
    description: 'Artículo académico del blog de TEXTUM.',
    lang,
    noindex: !post,
  });

  // Schema Article JSON-LD
  useEffect(() => {
    if (!post) return;

    const articleSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postTitle,
      description: postExcerpt.slice(0, 155),
      image: post.cover_url,
      datePublished: post.created_at,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'TEXTUM — Mentoría Académica',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo-512.png`, width: 512, height: 512 },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': localizedUrl(`/blog/${post.slug}`, lang),
      },
      timeRequired: `PT${post.reading_time}M`,
      inLanguage: lang === 'es' ? 'es-ES' : 'en-GB',
    };

    // Fix 6: BreadcrumbList — aparece en Google como ruta de migas
    // "mentoriatextum.com › Blog › Título del artículo"
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Blog',
          item: localizedUrl('/blog', lang),
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: postTitle,
          item: localizedUrl(`/blog/${post.slug}`, lang),
        },
      ],
    };

    injectSchema(articleSchema, 'schema-article');
    injectSchema(breadcrumbSchema, 'schema-breadcrumb');

    return () => {
      removeSchema('schema-article');
      removeSchema('schema-breadcrumb');
    };
  }, [post, lang, postTitle, postExcerpt]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      <main id="main-content">
      {loading ? (
        <div className="max-w-3xl mx-auto px-6 py-20"><PageSkeleton cards={1} /></div>
      ) : loadError ? (
        <div className="max-w-3xl mx-auto px-6 py-20">
          <PageError
            title={lang === 'es' ? 'No se pudo cargar el artículo' : 'The article could not be loaded'}
            description={lang === 'es' ? 'Comprueba tu conexión e inténtalo de nuevo.' : 'Check your connection and try again.'}
            retry={() => setReloadKey(value => value + 1)}
            retryLabel={lang === 'es' ? 'Intentar de nuevo' : 'Try again'}
          />
        </div>
      ) : !post ? (
        <NotFoundContent />
      ) : (
        <>
          <div className="pt-24 md:pt-28">
            <div className="max-w-6xl mx-auto px-6 py-10 md:py-14">
              <div className={`grid gap-10 lg:gap-14 items-center ${post.cover_url ? 'lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]' : ''}`}>
                {post.cover_url && <ArticleCover src={post.cover_url} alt={post.cover_alt ?? postTitle} />}

                <div className="max-w-3xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-7">
                    <div className="flex flex-wrap items-center gap-4 text-navy/50 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} aria-hidden="true" />
                        {new Date(post.created_at).toLocaleDateString(
                          lang === 'es' ? 'es-ES' : 'en-GB',
                          { year: 'numeric', month: 'long', day: 'numeric' }
                        )}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} aria-hidden="true" />
                        {post.reading_time} {b.minRead}
                      </span>
                    </div>
                    <ShareButtons title={postTitle} url={canonicalUrl} />
                  </div>

                  <p className="text-xs tracking-[0.2em] text-gold uppercase mb-4">{b.by} {post.author}</p>
                  <h1 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-8">
                    {postTitle}
                  </h1>

                  <div className="flex items-center gap-4">
                    <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent" />
                    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                      <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-6 pb-16">
            <Link
              to={localizedPath('/blog', lang)}
              className="inline-flex items-center gap-2 text-gold text-sm mb-10 hover:gap-3 transition-all duration-200"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              {b.backToBlog}
            </Link>

            <div
              ref={contentRef}
              className="prose prose-lg max-w-none
                prose-headings:font-serif prose-headings:font-light prose-headings:text-navy
                prose-p:text-navy/75 prose-p:leading-relaxed prose-p:font-light
                prose-a:text-gold prose-a:no-underline hover:prose-a:underline
                prose-strong:text-navy prose-strong:font-semibold
                prose-blockquote:border-l-gold prose-blockquote:text-navy/60 prose-blockquote:font-serif prose-blockquote:italic
                prose-li:text-navy/70
                prose-img:rounded-sm prose-img:shadow-md prose-img:transition-opacity prose-img:hover:opacity-90"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />

            {lightbox && (
              <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
            )}

            {/* CTA WhatsApp — aparece antes del ShareCard */}
            <WhatsAppCTA />

            {/* Fix 7: url canónica explícita en ShareCard */}
            <ShareCard title={postTitle} url={canonicalUrl} />
            <RelatedPosts currentId={post.id} category={post.category} />

            <div className="mt-16 pt-8 border-t border-navy/10">
              <Link
                to={localizedPath('/blog', lang)}
                className="inline-flex items-center gap-2 text-gold text-sm hover:gap-3 transition-all duration-200"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {b.backToBlog}
              </Link>
            </div>
          </div>
        </>
      )}

      </main>

      <Footer />
      <BackToTop />
    </div>
  );
}
