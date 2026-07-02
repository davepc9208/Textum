import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Values from './components/Values';
import Contact from './components/Contact';
import Footer from './components/Footer';
import BlogPage from './pages/BlogPage';
import PostPage from './pages/PostPage';
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

// ── Schema: Organización global ──────────────────────────────────────────────
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'TEXTUM — Mentoría Académica',
  url: 'https://mentoriatextum.com',
  logo: 'https://mentoriatextum.com/favicon.svg',
  description:
    'Mentoría académica personalizada para estudiantes universitarios y de posgrado en Ecuador y Perú. Especialistas en Examen Complexivo y Artículo Científico.',
  address: { '@type': 'PostalAddress', addressCountry: 'EC' },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'revedit917@gmail.com',
    contactType: 'customer support',
    availableLanguage: ['Spanish', 'English'],
  },
  sameAs: [
    'https://orcid.org/0000-0003-3041-096X',
    'https://orcid.org/0000-0002-8947-1364',
  ],
};

// ── Schema: Servicios (BreadcrumbList) ───────────────────────────────────────
const SERVICES_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Servicios de Mentoría Académica TEXTUM',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Mentoría Examen Complexivo',
      description:
        'Acompañamiento académico para la titulación universitaria. Planes Básico, Avanzado y Premium.',
      url: 'https://mentoriatextum.com/#servicios',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Mentoría Artículo Científico',
      description:
        'Revisión y co-redacción de artículos para publicación en revistas indexadas Scopus y Latindex.',
      url: 'https://mentoriatextum.com/#servicios',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Mentoría de Oratoria Académica y Defensa Oral',
      description:
        'Preparación para la sustentación oral ante el tribunal de titulación.',
      url: 'https://mentoriatextum.com/#servicios',
    },
  ],
};

// ── Schema: Blog (Blog) ──────────────────────────────────────────────────────
const BLOG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog TEXTUM — Mentoría Académica',
  url: 'https://mentoriatextum.com/blog',
  description:
    'Artículos y guías académicas sobre investigación, redacción científica y defensa oral.',
  publisher: {
    '@type': 'Organization',
    name: 'TEXTUM — Mentoría Académica',
    logo: { '@type': 'ImageObject', url: 'https://mentoriatextum.com/favicon.svg' },
  },
};

// ── Páginas ──────────────────────────────────────────────────────────────────

function HomePage() {
  useScrollReveal();

  useSEO({
    title: 'TEXTUM — Mentoría Académica | Examen Complexivo y Artículo Científico',
    description:
      'Mentoría académica personalizada para estudiantes universitarios en Ecuador y Perú. Especialistas en Examen Complexivo, Artículo Científico y Defensa Oral. Reserva tu sesión gratis.',
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
        <Hero />
        <About />
        <Services />
        <Values />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}

function BlogListPage() {
  useSEO({
    title: 'Blog Académico | Artículos sobre Investigación y Redacción Científica — TEXTUM',
    description:
      'Lee artículos y guías escritas por nuestras doctoras sobre redacción académica, metodología de investigación, APA 7 y cómo defender tu tesis con éxito.',
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
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<PostPage />} />
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
