// src/App.tsx — orden definitivo según TEXTUM_NEW_PROPUESTA.docx

import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar            from './components/Navbar';
import Hero              from './components/Hero';
import Filosofia         from './components/Filosofia';
import About             from './components/About';
import AcademicIntegrity from './components/AcademicIntegrity';
import Services          from './components/Services';
import PricesTextum      from './components/PricesTextum';
import WhyTextum         from './components/WhyTextum';
import ColeccionesTextum from './components/ColeccionesTextum';
import BlogPreview       from './components/BlogPreview';
import Values            from './components/Values';
import Contact           from './components/Contact';
import Footer            from './components/Footer';
import StickyDiagnosis   from './components/StickyDiagnosis';
import BlogPage          from './pages/BlogPage';
import PostPage          from './pages/PostPage';
import { useScrollReveal } from './hooks/useScrollReveal';
import { useSEO, injectSchema, removeSchema } from './hooks/useSEO';

const AdminPage = lazy(() => import('./pages/AdminPage'));

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

const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'TEXTUM — Mentoría Académica Internacional',
  url: 'https://mentoriatextum.com',
  logo: 'https://mentoriatextum.com/favicon.svg',
  description: 'Programas de mentoría académica internacional para titulación, publicación científica y defensa académica con rigor metodológico y uso ético de IA.',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'contacto@mentoriatextum.com',
    contactType: 'customer support',
    availableLanguage: ['Spanish', 'English'],
  },
  sameAs: [
    'https://orcid.org/0000-0003-3041-096X',
    'https://orcid.org/0000-0002-8947-1364',
  ],
};

const SERVICES_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Programas de Mentoría Académica TEXTUM',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Titulación — Ajuste de Estilo y Norma',          url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 2, name: 'Titulación — Mentoría Avanzada FLUX',            url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 3, name: 'Titulación — Co-creación de Alta Intensidad',    url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 4, name: 'Publicación — Adaptación Editorial',             url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 5, name: 'Publicación — Pre-arbitraje Científico + FLUX',  url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 6, name: 'Publicación — Acompañamiento Editorial Premium', url: 'https://mentoriatextum.com/#servicios' },
    { '@type': 'ListItem', position: 7, name: 'Defensa — Alta Defensa y Oratoria Académica',   url: 'https://mentoriatextum.com/#servicios' },
  ],
};

const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog TEXTUM — Mentoría Académica',
  url: 'https://mentoriatextum.com/blog',
  description: 'Artículos y guías académicas sobre investigación, redacción científica y defensa oral.',
  publisher: {
    '@type': 'Organization',
    name: 'TEXTUM — Mentoría Académica',
    logo: { '@type': 'ImageObject', url: 'https://mentoriatextum.com/favicon.svg' },
  },
};

function HomePage() {
  useScrollReveal();

  useSEO({
    title: 'TEXTUM — Mentoría Académica Internacional | Titulación, Publicación y Defensa',
    description: 'Programas de mentoría académica para titulación, publicación científica y defensa oral. Rigor metodológico, uso ético de IA, estándares internacionales. Diagnóstico gratuito.',
    canonical: '/',
    ogType: 'website',
    lang: 'es',
  });

  useEffect(() => {
    injectSchema(ORG_SCHEMA, 'schema-org');
    injectSchema(SERVICES_SCHEMA, 'schema-services');
    return () => {
      removeSchema('schema-org');
      removeSchema('schema-services');
    };
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <main>
        {/* 1 — Hero */}
        <Hero />
        {/* 2 — Filosofía TEXTUM */}
        <Filosofia />
        {/* 3 — Sobre el equipo */}
        <About />
        {/* 4 — Integridad académica + estándares internacionales */}
        <AcademicIntegrity />
        {/* 5 — Programas + Método FLUX */}
        <Services />
        {/* 6 — Tabla de precios resumen */}
        <PricesTextum />
        {/* 7 — Por qué TEXTUM es diferente */}
        <WhyTextum />
        {/* 8 — Colecciones TEXTUM (propiedad intelectual) */}
        <ColeccionesTextum />
        {/* 9 — Blog preview en homepage */}
        <BlogPreview />
        {/* 10 — Valores */}
        <Values />
        {/* 11 — Contacto / Diagnóstico */}
        <Contact />
      </main>
      <Footer />
      {/* Botón sticky — fuera del flujo de secciones */}
      <StickyDiagnosis />
    </div>
  );
}

function BlogListPage() {
  useSEO({
    title: 'Blog Académico | Artículos sobre Investigación y Redacción Científica — TEXTUM',
    description: 'Lee artículos y guías escritas por nuestras doctoras sobre redacción académica, metodología de investigación, APA 7 y cómo defender tu tesis con éxito.',
    canonical: '/blog',
    ogType: 'website',
    lang: 'es',
  });

  useEffect(() => {
    injectSchema(BLOG_SCHEMA, 'schema-blog');
    return () => removeSchema('schema-blog');
  }, []);

  return <BlogPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/"                   element={<HomePage />} />
      <Route path="/blog"               element={<BlogListPage />} />
      <Route path="/blog/:slug"         element={<PostPage />} />
      <Route
        path="/textum-redaccion-2026"
        element={
          <Suspense fallback={<PageLoader />}>
            <AdminPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
