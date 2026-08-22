import { ArrowLeft, BookOpen, Compass, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const COPY = {
  es: {
    label: 'Error 404',
    title: 'Esta página no existe',
    description: 'El enlace puede estar incompleto, haber cambiado o ya no estar disponible.',
    home: 'Volver al inicio',
    blog: 'Explorar el blog',
    back: 'Volver atrás',
  },
  en: {
    label: 'Error 404',
    title: 'This page does not exist',
    description: 'The link may be incomplete, changed, or no longer available.',
    home: 'Back to home',
    blog: 'Explore the blog',
    back: 'Go back',
  },
} as const;

export function NotFoundContent() {
  const { lang } = useLang();
  const copy = COPY[lang];

  return (
    <main className="min-h-[calc(100vh-9rem)] flex items-center justify-center px-6 py-24 bg-cream">
      <div className="max-w-xl mx-auto text-center">
        <div className="relative w-28 h-28 mx-auto mb-8 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-gold/30" />
          <div className="absolute inset-3 rounded-full border border-gold/15" />
          <Compass size={34} strokeWidth={1} className="text-gold" aria-hidden="true" />
        </div>
        <p className="text-xs tracking-[0.35em] text-gold uppercase mb-4">{copy.label}</p>
        <h1 className="font-serif text-4xl md:text-6xl font-light text-navy leading-tight mb-5">
          {copy.title}
        </h1>
        <p className="text-navy/55 text-sm md:text-base font-light leading-relaxed max-w-md mx-auto mb-10">
          {copy.description}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs tracking-widest rounded-sm">
            <Home size={14} aria-hidden="true" />
            <span>{copy.home}</span>
          </Link>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 text-xs tracking-widest rounded-sm border border-navy/20 text-navy/65 hover:border-gold/50 hover:text-navy transition-colors">
            <BookOpen size={14} aria-hidden="true" />
            {copy.blog}
          </Link>
          <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-4 py-3 text-xs tracking-widest text-navy/45 hover:text-gold transition-colors">
            <ArrowLeft size={14} aria-hidden="true" />
            {copy.back}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function NotFoundPage() {
  const { lang } = useLang();
  const copy = COPY[lang];

  useSEO({
    title: `${copy.label} — TEXTUM`,
    description: copy.description,
    noindex: true,
    lang,
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <NotFoundContent />
      <Footer />
    </div>
  );
}
