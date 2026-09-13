import { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

type ArticleCoverProps = {
  src: string;
  alt: string;
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
