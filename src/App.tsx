// src/App.tsx
// v5 — Testimonios añadidos entre Services y Contact
//
// ORDEN FINAL Y FONDOS:
// Hero             (navy gradient)
// Filosofia        (cream)
// About            (cream)
// AcademicIntegrity (cream)
// WhyTextum        (navy)
// ColeccionesTextum (cream)
// BlogPreview      (navy)
// Values           (cream)
// FluxMethodSection (navy)
// Services         (cream)
// Testimonios      (navy)   ← nuevo — se fusiona visualmente con Contact
// Contact          (navy)   ← mismo fondo, separados por divisor interno

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar               from './components/Navbar';
import Hero                 from './components/Hero';
import Filosofia            from './components/Filosofia';
import About                from './components/About';
import AcademicIntegrity    from './components/AcademicIntegrity';
import WhyTextum            from './components/WhyTextum';
import ColeccionesTextum    from './components/ColeccionesTextum';
import BlogPreview          from './components/BlogPreview';
import Values               from './components/Values';
import FluxMethodSection    from './components/FluxMethodSection';
import Services             from './components/Services';
import Testimonios          from './components/Testimonios';
import Contact              from './components/Contact';
import Footer               from './components/Footer';
import StickyDiagnosis      from './components/StickyDiagnosis';
import BackToTop            from './components/BackToTop';
import AssistantWidget      from './components/AssistantWidget';
import { useScrollReveal }  from './hooks/useScrollReveal';
import { useSEO, injectSchema, removeSchema } from './hooks/useSEO';
import { useLang }          from './i18n/LangContext';
import DescargaPage from './pages/DescargaPage';
import CookieBanner from './components/CookieBanner';
import BajaPage from './pages/BajaPage';
import PrivacidadPage from './pages/PrivacidadPage';
import NotFoundPage from './pages/NotFoundPage';
import AuthorityPage from './pages/AuthorityPage';

const BlogPage           = lazy(() => import('./pages/BlogPage'));
const PostPage           = lazy(() => import('./pages/PostPage'));
const AdminPage          = lazy(() => import('./pages/AdminPage'));
const ColeccionesPage    = lazy(() => import('./pages/ColeccionesPage'));
const ColeccionListPage  = lazy(() => import('./pages/ColeccionListPage'));
const ColeccionPiecePage = lazy(() => import('./pages/ColeccionPiecePage'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <svg className="animate-spin w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// NOTA: el schema de EducationalOrganization y el ItemList de programas viven en
// index.html (versión completa con @id, fundadoras, ORCID y precios). No se
// vuelven a inyectar aquí para no enviar nodos duplicados y contradictorios.

const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog TEXTUM — Mentoría Académica',
  url: 'https://www.mentoriatextum.com/blog',
  description: 'Artículos y guías académicas sobre investigación, redacción científica y defensa oral.',
  publisher: { '@type': 'Organization', name: 'TEXTUM — Mentoría Académica', logo: { '@type': 'ImageObject', url: 'https://www.mentoriatextum.com/favicon.svg' } },
};

function HomePage() {
  const { lang } = useLang();
  useScrollReveal();

  useSEO({
    title: lang === 'es'
      ? 'TEXTUM — Mentoría Académica Internacional | Titulación, Publicación y Defensa'
      : 'TEXTUM — International Academic Mentoring | Degree Projects, Publication & Defence',
    description: lang === 'es'
      ? 'Programas de mentoría académica para titulación, publicación científica y defensa oral. Rigor metodológico, uso ético de IA, estándares internacionales. Diagnóstico gratuito.'
      : 'Academic mentoring programmes for degree projects, scientific publication and oral defence. Methodological rigour, ethical AI use, international standards. Free diagnosis.',
    canonical: '/',
    ogType: 'website',
    lang,
  });

  return (
    <div className="relative">
      <Navbar />
      <main id="main-content">
        <Hero />
        <Filosofia />
        <About />
        <AcademicIntegrity />
        <WhyTextum />
        <ColeccionesTextum />
        <BlogPreview />
        <Values />
        <FluxMethodSection />
        <Services />
        <Testimonios />
        <Contact />
      </main>
      <Footer />
      <StickyDiagnosis />
      <BackToTop />
    </div>
  );
}

function BlogListPage() {
  const { lang } = useLang();

  useSEO({
    title: lang === 'es'
      ? 'Blog Académico | Artículos sobre Investigación y Redacción Científica — TEXTUM'
      : 'Academic Blog | Research and Scientific Writing Articles — TEXTUM',
    description: lang === 'es'
      ? 'Lee artículos y guías escritas por nuestras doctoras sobre redacción académica, metodología de investigación, APA 7 y cómo defender tu tesis con éxito.'
      : 'Read articles and guides written by our doctors on academic writing, research methodology, APA 7 and how to successfully defend your thesis.',
    canonical: '/blog',
    ogType: 'website',
    lang,
  });

  useEffect(() => {
    injectSchema(BLOG_SCHEMA, 'schema-blog');
    return () => removeSchema('schema-blog');
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <BlogPage />
    </Suspense>
  );
}

export default function App() {
  const { lang } = useLang();
  return (
    <>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[10000] focus:bg-gold focus:text-navy focus:px-4 focus:py-3 focus:text-xs focus:font-semibold focus:rounded-sm"
    >
      {lang === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}
    </a>
    <CookieBanner />
      <Routes>
      <Route path="/"    element={<HomePage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><PostPage /></Suspense>} />
      <Route path="/colecciones" element={<Suspense fallback={<PageLoader />}><ColeccionesPage /></Suspense>} />
      <Route path="/colecciones/:tipo" element={<Suspense fallback={<PageLoader />}><ColeccionListPage /></Suspense>} />
      <Route path="/colecciones/:tipo/:slug" element={<Suspense fallback={<PageLoader />}><ColeccionPiecePage /></Suspense>} />
      <Route path="/textum-redaccion-2026" element={<Suspense fallback={<PageLoader />}><AdminPage /></Suspense>} />
      <Route path="/colecciones/:tipo/:slug/descargar" element={<DescargaPage />} />
      <Route path="/baja" element={<BajaPage />} />
      <Route path="/privacidad" element={<PrivacidadPage />} />
      <Route path="/casos" element={<AuthorityPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    <AssistantWidget />
    </>
  );
}
