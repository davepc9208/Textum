import { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

type ArticleCoverProps = {
  src: string;
  alt: string;
};

type ArticleHeroProps = ArticleCoverProps & {
  title: string;
  author: string;
  date: string;
  readingTime: string;
  category?: string | null;
};

export function ImageLightbox({ src, alt, onClose }: ArticleCoverProps & { onClose: () => void }) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[60] bg-navy/95 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Cerrar portada"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-sm shadow-2xl cursor-default"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

export function ArticleHero({
  src,
  alt,
  title,
  author,
  date,
  readingTime,
  category,
}: ArticleHeroProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="relative overflow-hidden bg-navy shadow-[0_18px_45px_rgba(13,31,60,0.16)]">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ampliar portada"
          className="group absolute inset-0 z-0 h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
        >
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
          />
        </button>
        {/* Capa uniforme explícita: no depende de las clases de opacidad de Tailwind. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ backgroundColor: 'rgba(6, 19, 38, 0.68)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: 'linear-gradient(to top, rgba(6, 19, 38, 0.98) 0%, rgba(6, 19, 38, 0.82) 44%, rgba(6, 19, 38, 0.58) 100%)' }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10"
          style={{ background: 'linear-gradient(to right, rgba(6, 19, 38, 0.72) 0%, rgba(6, 19, 38, 0.32) 58%, rgba(6, 19, 38, 0.12) 100%)' }}
        />

        <div className="pointer-events-none relative z-20 flex min-h-[26rem] items-end px-6 pb-8 pt-28 sm:min-h-[31rem] sm:px-10 sm:pb-10 lg:min-h-[34rem] lg:px-14 lg:pb-12">
          <div className="max-w-4xl">
            {category && (
              <span className="mb-4 inline-flex border border-gold/60 bg-gold px-3 py-1 text-[10px] font-medium tracking-[0.2em] text-navy uppercase">
                {category}
              </span>
            )}
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs tracking-wide text-white/75 sm:text-sm">
              <span className="font-medium text-gold">{author}</span>
              <span className="h-1 w-1 rounded-full bg-gold/70" aria-hidden="true" />
              <span>{date}</span>
              <span className="h-1 w-1 rounded-full bg-gold/70" aria-hidden="true" />
              <span>{readingTime}</span>
            </div>
            <h1 className="max-w-4xl font-serif text-4xl font-light leading-[0.98] text-white sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div className="mt-6 flex items-center gap-3" aria-hidden="true">
              <div className="h-px w-16 bg-gold" />
              <svg width="8" height="8" viewBox="0 0 8 8" className="text-gold">
                <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="currentColor" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

export default function ArticleCover({ src, alt }: ArticleCoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ampliar portada"
        className="group relative w-full max-w-[440px] mx-auto lg:mx-0 overflow-hidden rounded-sm border border-gold/35 bg-navy shadow-[0_18px_45px_rgba(13,31,60,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-cream"
      >
        <span className="block aspect-[16/9] p-2 sm:p-3">
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </span>
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-navy/85 to-transparent px-4 pb-3 pt-8 text-[10px] tracking-[0.16em] text-white/85 uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={12} aria-hidden="true" />
          Ampliar portada
        </span>
      </button>

      {open && <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
