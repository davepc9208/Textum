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
    email: 'contacto@mentoriatextum.com',
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

// ── Schema: FAQ ──────────────────────────────────────────────────────────────
const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es el Examen Complexivo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'El Examen Complexivo es una modalidad de titulación universitaria en Ecuador y Perú que consiste en la elaboración y defensa oral de un ensayo académico ante un tribunal. TEXTUM ofrece mentoría especializada para prepararlo con éxito.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cuánto cuesta la mentoría para el Examen Complexivo?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TEXTUM ofrece tres planes: Básico (150 USD), Avanzado (200 USD) y Mentoría Premium (250 USD). También existe el servicio de Co-creación Intensiva desde cero por 300 USD.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Ayudan a publicar artículos científicos en revistas indexadas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí. TEXTUM ofrece mentoría para Artículo Científico con planes desde 250 USD, incluyendo revisión IMRyD, formato APA/Vancouver, simulación de revisión por pares y acompañamiento hasta la aceptación en revistas Scopus o Latindex.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Las sesiones son presenciales u online?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Todas las sesiones de mentoría TEXTUM son 100% online por videollamada, lo que permite atender estudiantes en Ecuador, Perú y cualquier país hispanohablante.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo reservo una sesión de mentoría gratuita?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Puedes reservar tu sesión de diagnóstico gratuita desde el formulario de contacto en mentoriatextum.com o escribiendo directamente a contacto@mentoriatextum.com.',
      },
    },
  ],
};

// ── Schema: Personas (doctoras) ──────────────────────────────────────────────
const PERSONS_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Vilma María Pérez Viñas',
    jobTitle: 'Doctora en Ciencias Pedagógicas — Mentora Principal de Investigación',
    url: 'https://orcid.org/0000-0003-3041-096X',
    sameAs: 'https://orcid.org/0000-0003-3041-096X',
    worksFor: { '@type': 'Organization', name: 'TEXTUM — Mentoría Académica' },
    knowsAbout: ['Redacción académica', 'Didáctica de la Lengua Inglesa', 'Investigación científica', 'Traducción'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Yadyra de la Caridad Piñera Concepción',
    jobTitle: 'Doctora en Ciencias Pedagógicas — Mentora Principal de Estructura',
    url: 'https://orcid.org/0000-0002-8947-1364',
    sameAs: 'https://orcid.org/0000-0002-8947-1364',
    worksFor: { '@type': 'Organization', name: 'TEXTUM — Mentoría Académica' },
    award: 'Premio Nacional de Investigación Científica, El Salvador, 2025',
    knowsAbout: ['Didáctica del Español', 'Artículos científicos', 'Asesoría de tesis', 'Publicaciones académicas'],
  },
];
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
    injectSchema(FAQ_SCHEMA, 'schema-faq');
    injectSchema(PERSONS_SCHEMA[0], 'schema-person-vilma');
    injectSchema(PERSONS_SCHEMA[1], 'schema-person-yadyra');
    return () => {
      removeSchema('schema-org');
      removeSchema('schema-services');
      removeSchema('schema-faq');
      removeSchema('schema-person-vilma');
      removeSchema('schema-person-yadyra');
    };
  }, []);

  return (
    <div className="relative">
      <Navbar />
      <Hero />
      <About />
      <Services />
      <Values />
      <Contact />
      <Footer />
    </div>
  );
}

function BlogListPage() {
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
