import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, X } from 'lucide-react';
import { supabase, Post } from '../lib/supabase';
import { useLang } from '../i18n/LangContext';
import { useSEO, injectSchema, removeSchema } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-navy/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Cerrar"
      >
        <X size={18} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl cursor-default"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { lang, t } = useLang();
  const b = t.blog;
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
    // Add cursor and zoom hint to all images in content
    el.querySelectorAll('img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.title = 'Clic para ampliar';
    });
    el.addEventListener('click', openLightbox);
    return () => el.removeEventListener('click', openLightbox);
  }, [post, openLightbox]);

  useEffect(() => {
    if (!slug) return;
    supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()
      .then(({ data }) => {
        setPost(data);
        setLoading(false);
      });
  }, [slug]);

  const postTitle = post ? (lang === 'es' ? post.title_es : post.title_en) : '';
  const postExcerpt = post ? (lang === 'es' ? post.excerpt_es : post.excerpt_en) : '';
  const content = post ? (lang === 'es' ? post.content_es : post.content_en) : '';

  // SEO dinámico por artículo
  useSEO(post ? {
    title: `${postTitle} — TEXTUM Mentoría Académica`,
    description: postExcerpt.slice(0, 155),
    canonical: `/blog/${post.slug}`,
    ogImage: post.cover_url || undefined,
    ogType: 'article',
    articleMeta: {
      publishedTime: post.created_at,
      author: post.author,
    },
    lang,
  } : {
    title: 'Artículo — TEXTUM Mentoría Académica',
    description: 'Artículo académico del blog de TEXTUM.',
    lang,
  });

  // Schema Article JSON-LD
  useEffect(() => {
    if (!post) return;
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: postTitle,
      description: postExcerpt.slice(0, 155),
      image: post.cover_url || undefined,
      datePublished: post.created_at,
      author: {
        '@type': 'Person',
        name: post.author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'TEXTUM — Mentoría Académica',
        logo: { '@type': 'ImageObject', url: 'https://mentoriatextum.com/favicon.svg' },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://mentoriatextum.com/blog/${post.slug}`,
      },
      timeRequired: `PT${post.reading_time}M`,
      inLanguage: lang === 'es' ? 'es-EC' : 'en-GB',
    };
    injectSchema(schema, 'schema-article');
    return () => removeSchema('schema-article');
  }, [post, lang, postTitle, postExcerpt]);

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />

      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <svg className="animate-spin w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      ) : !post ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <p className="font-serif text-2xl text-navy/40">Artículo no encontrado.</p>
          <Link to="/blog" className="text-gold text-sm hover:underline">{b.backToBlog}</Link>
        </div>
      ) : (
        <>
          {/* Cover */}
          {post.cover_url && (
            <div className="relative h-72 md:h-96 overflow-hidden">
              <img src={post.cover_url} alt={post.cover_alt ?? postTitle} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/20 to-transparent" />
            </div>
          )}

          <div className="max-w-3xl mx-auto px-6 py-16">
            {/* Back */}
            <Link to="/blog" className="inline-flex items-center gap-2 text-gold text-sm mb-10 hover:gap-3 transition-all duration-200">
              <ArrowLeft size={14} />
              {b.backToBlog}
            </Link>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-navy/50 text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                {new Date(post.created_at).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />
                {post.reading_time} {b.minRead}
              </span>
              <span className="text-gold font-medium">{b.by} {post.author}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-4xl md:text-5xl font-light text-navy leading-tight mb-8">{postTitle}</h1>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-px bg-gradient-to-r from-gold to-transparent" />
              <svg width="8" height="8" viewBox="0 0 8 8">
                <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
              </svg>
            </div>

            {/* Content — rendered as HTML (stored as HTML in Supabase) */}
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
              dangerouslySetInnerHTML={{ __html: content }}
            />

            {lightbox && (
              <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
            )}

            {/* Back link bottom */}
            <div className="mt-16 pt-8 border-t border-navy/10">
              <Link to="/blog" className="inline-flex items-center gap-2 text-gold text-sm hover:gap-3 transition-all duration-200">
                <ArrowLeft size={14} />
                {b.backToBlog}
              </Link>
            </div>
          </div>
        </>
      )}

      <Footer />
    </div>
  );
}
