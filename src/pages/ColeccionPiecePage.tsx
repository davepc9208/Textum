// src/pages/ColeccionPiecePage.tsx
// Artículo individual de una Colección — /colecciones/:tipo/:slug
// Mismo render que PostPage pero con breadcrumb de colección y sin ShareCard

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, X, Download } from 'lucide-react';
import { supabase, Post } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { useSEO, injectSchema, removeSchema } from '../hooks/useSEO';
import { sanitizeHtml } from '../lib/sanitize';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ShareButtons from '../components/ShareButtons';
import WhatsAppCTA from '../components/WhatsAppCTA';
import BackToTop from '../components/BackToTop';


const SITE_URL = 'https://mentoriatextum.com';

const TYPE_LABELS: Record<string, { es: string; en: string }> = {
  principio:   { es: 'Principios TEXTUM',        en: 'TEXTUM Principles'         },
  categoria:   { es: 'Categorías Metodológicas', en: 'Methodological Categories' },
  herramienta: { es: 'Herramientas TEXTUM',      en: 'TEXTUM Tools'              },
};

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out" onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Cerrar">
        <X size={18} />
      </button>
      <img src={src} alt={alt} className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl cursor-default" onClick={e => e.stopPropagation()} />
    </div>
  );
}

export default function ColeccionPiecePage() {
  const { tipo, slug } = useParams<{ tipo: string; slug: string }>();
  const { lang, t } = useLang();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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
    el.querySelectorAll('img').forEach(img => { img.style.cursor = 'zoom-in'; });
    el.addEventListener('click', openLightbox);
    return () => el.removeEventListener('click', openLightbox);
  }, [post, openLightbox]);

  useEffect(() => {
    if (!slug) return;
    supabase.from('posts').select('*').eq('slug', slug).eq('published', true).single()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [slug]);

  const postTitle   = post ? (lang === 'es' ? post.title_es   : post.title_en)   : '';
  const postExcerpt = post ? (lang === 'es' ? post.excerpt_es : post.excerpt_en) : '';
  const content     = post ? (lang === 'es' ? post.content_es : post.content_en) : '';
  const canonicalUrl = post ? `${SITE_URL}/colecciones/${tipo}/${post.slug}` : undefined;
  const typeLabel = tipo ? (TYPE_LABELS[tipo]?.[lang] ?? '') : '';

  useSEO(post ? {
    title: `${postTitle} | ${typeLabel} — TEXTUM`,
    description: postExcerpt.slice(0, 155),
    canonical: `/colecciones/${tipo}/${post.slug}`,
    ogImage: post.cover_url,
    ogImageAlt: post.cover_alt ?? postTitle,
    ogType: 'article',
    articleMeta: { publishedTime: post.created_at, author: post.author },
    lang,
  } : { title: 'Colecciones TEXTUM', description: '', lang });

  useEffect(() => {
    if (!post || !tipo) return;
    injectSchema({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postTitle,
      description: postExcerpt.slice(0, 155),
      image: post.cover_url,
      datePublished: post.created_at,
      author: { '@type': 'Person', name: post.author },
      publisher: { '@type': 'Organization', name: 'TEXTUM — Mentoría Académica', logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.svg` } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/colecciones/${tipo}/${post.slug}` },
    }, 'schema-coleccion-piece');
    injectSchema({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Colecciones', item: `${SITE_URL}/colecciones` },
        { '@type': 'ListItem', position: 2, name: typeLabel,     item: `${SITE_URL}/colecciones/${tipo}` },
        { '@type': 'ListItem', position: 3, name: postTitle,     item: `${SITE_URL}/colecciones/${tipo}/${post.slug}` },
      ],
    }, 'schema-coleccion-breadcrumb');
    return () => { removeSchema('schema-coleccion-piece'); removeSchema('schema-coleccion-breadcrumb'); };
  }, [post, lang, postTitle, postExcerpt, tipo, typeLabel]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <svg className="animate-spin w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      ) : !post ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-serif text-2xl text-navy/40">Pieza no encontrada.</p>
          <Link to={`/colecciones/${tipo}`} className="text-gold text-sm hover:underline">
            <ArrowLeft size={14} className="inline mr-1" />Volver a {typeLabel}
          </Link>
        </div>
      ) : (
        <>
          {post.cover_url && (
            <div className="relative h-72 md:h-96 overflow-hidden">
              <img src={post.cover_url} alt={post.cover_alt ?? postTitle} loading="eager" fetchPriority="high" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
            </div>
          )}

          <div className="max-w-3xl mx-auto px-6 py-16">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-navy/35 mb-10">
              <Link to="/colecciones" className="hover:text-gold transition-colors">
                {lang === 'es' ? 'Colecciones' : 'Collections'}
              </Link>
              <span aria-hidden="true">/</span>
              <Link to={`/colecciones/${tipo}`} className="hover:text-gold transition-colors">
                {typeLabel}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-navy/50 truncate max-w-[200px]">{postTitle}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <div className="flex flex-wrap items-center gap-4 text-navy/50 text-sm">
                <span className="flex items-center gap-1.5"><Calendar size={13} aria-hidden="true" />
                  {new Date(post.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5"><Clock size={13} aria-hidden="true" />{post.reading_time} {t.blog.minRead}</span>
                <span className="text-gold font-medium">{post.author}</span>
              </div>
              <ShareButtons title={postTitle} url={canonicalUrl} />
            </div>

            <h1 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-8">
              {postTitle}
            </h1>

            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent" />
              <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true">
                <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
              </svg>
            </div>

            {/* SEGURIDAD: sanitizeHtml previene XSS del contenido de Supabase */}
            <div
              ref={contentRef}
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-light prose-headings:text-navy prose-p:text-navy/75 prose-p:leading-relaxed prose-p:font-light prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-strong:text-navy prose-blockquote:border-l-gold prose-blockquote:text-navy/60 prose-blockquote:font-serif prose-blockquote:italic prose-li:text-navy/70 prose-img:rounded-sm prose-img:shadow-md"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
            />

            {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />}

            {/* CTA Descarga PDF profesional */}
<div className="mt-14 p-7 bg-navy/[0.03] border border-navy/10 rounded-2xl">
  <h3 className="font-serif text-lg text-navy mb-2">
    {lang === 'es' ? 'Versión PDF profesional' : 'Professional PDF version'}
  </h3>
  <p className="text-sm text-navy/65 mb-5 leading-relaxed">
    {lang === 'es'
      ? 'Formato listo para citar, imprimir y usar offline (incluye QR y referencia APA).'
      : 'Ready-to-cite format for printing and offline use (includes QR and APA reference).'}
  </p>
  <Link
    to={`/colecciones/${tipo}/${slug}/descargar`}
    className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-cream text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
  >
    <Download size={15} />
    {lang === 'es' ? 'Descargar PDF' : 'Download PDF'}
  </Link>
</div>

            {/* CTA WhatsApp — al final de cada pieza de Colección */}
            <WhatsAppCTA />

            <div className="mt-10 pt-8 border-t border-navy/10">
              <Link to={`/colecciones/${tipo}`} className="inline-flex items-center gap-2 text-gold text-sm hover:gap-3 transition-all duration-200">
                <ArrowLeft size={14} aria-hidden="true" />
                {lang === 'es' ? `Volver a ${typeLabel}` : `Back to ${typeLabel}`}
              </Link>
            </div>
          </div>
        </>
      )}

      <Footer />
      <BackToTop />
    </div>
  );
}
