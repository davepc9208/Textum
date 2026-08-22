import { ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LangContext';
import { useSEO } from '../hooks/useSEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { diagnosisHref, trackConversion } from '../lib/conversion';

const CASES = [
  {
    person: 'Zulmi Consuelo Tenorio Polo',
    institution: 'Universidad César Vallejo · Perú',
    service: { es: 'Publicación científica', en: 'Scientific publication' },
    result: { es: 'Artículo publicado con respaldo editorial verificable.', en: 'Published article with verifiable editorial record.' },
    links: [
      { label: 'Dialnet', url: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10513571' },
      { label: 'Podium · UPR', url: 'https://podium.upr.edu.cu/index.php/podium/article/view/1845' },
    ],
  },
  {
    person: 'Xu Kong',
    institution: 'Universidad de Linyi · China',
    service: { es: 'Publicación científica', en: 'Scientific publication' },
    result: { es: 'Publicación internacional consultable en REDIE · UABC.', en: 'International publication available through REDIE · UABC.' },
    links: [{ label: 'REDIE · UABC', url: 'https://redie.uabc.mx/redie/article/view/6118/2689' }],
  },
  {
    person: 'Omar Silva Ramos',
    institution: 'Doctor en Ciencias Pedagógicas · Latinoamérica',
    service: { es: 'Publicación científica', en: 'Scientific publication' },
    result: { es: 'Manuscrito publicado en Mendive · Vol. 23, 2025.', en: 'Manuscript published in Mendive · Vol. 23, 2025.' },
    links: [{ label: 'Mendive', url: 'https://mendive.upr.edu.cu/index.php/MendiveUPR/article/view/3874' }],
  },
];

const CREDENTIALS = [
  {
    name: 'Vilma María Pérez Viñas',
    role: { es: 'Doctora en Ciencias Pedagógicas', en: 'Doctor of Pedagogical Sciences' },
    orcid: 'https://orcid.org/0000-0003-3041-096X',
  },
  {
    name: 'Yadyra de la Caridad Piñera Concepción',
    role: { es: 'Doctora en Ciencias Pedagógicas · más de 80 publicaciones declaradas', en: 'Doctor of Pedagogical Sciences · over 80 declared publications' },
    orcid: 'https://orcid.org/0000-0002-8947-1364',
  },
];

export default function AuthorityPage() {
  const { lang } = useLang();
  const copy = lang === 'es'
    ? {
        eyebrow: 'Autoridad verificable',
        title: 'Rigor que puedes comprobar',
        intro: 'Conoce al equipo, revisa nuestras identificaciones ORCID y consulta publicaciones vinculadas a procesos de mentoría.',
        cases: 'Casos con publicación verificable',
        credentials: 'Credenciales del equipo',
        verify: 'Ver perfil ORCID',
        read: 'Consultar publicación',
        cta: '¿Quieres revisar tu proyecto?',
        ctaButton: 'Solicitar diagnóstico académico',
        back: 'Volver al inicio',
      }
    : {
        eyebrow: 'Verifiable authority',
        title: 'Rigour you can verify',
        intro: 'Meet the team, review our ORCID identifiers and consult publications connected to mentoring processes.',
        cases: 'Cases with verifiable publications',
        credentials: 'Team credentials',
        verify: 'View ORCID profile',
        read: 'View publication',
        cta: 'Would you like to review your project?',
        ctaButton: 'Request an academic diagnosis',
        back: 'Back to home',
      };

  useSEO({
    title: `${copy.title} — TEXTUM`,
    description: copy.intro,
    canonical: '/casos',
    lang,
  });

  return (
    <div className="min-h-screen bg-cream">
      <Navbar />
      <main>
        <header className="gradient-bg pt-36 pb-24 px-6 text-center">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{copy.eyebrow}</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white font-light leading-tight mb-5">{copy.title}</h1>
          <p className="max-w-2xl mx-auto text-white/55 text-sm leading-relaxed">{copy.intro}</p>
        </header>

        <section className="max-w-5xl mx-auto px-6 py-20" aria-labelledby="cases-title">
          <h2 id="cases-title" className="font-serif text-3xl text-navy mb-8">{copy.cases}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {CASES.map((item) => (
              <article key={item.person} className="bg-white border border-navy/10 rounded-sm p-6 shadow-sm">
                <ShieldCheck size={22} className="text-gold mb-5" aria-hidden="true" />
                <h3 className="font-serif text-xl text-navy leading-snug">{item.person}</h3>
                <p className="text-xs text-navy/45 mt-2">{item.institution}</p>
                <p className="text-[10px] tracking-[0.15em] text-gold uppercase mt-4">{item.service[lang]}</p>
                <p className="text-sm text-navy/65 leading-relaxed mt-4">{item.result[lang]}</p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {item.links.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-gold border border-gold/25 px-3 py-1.5 rounded-sm hover:border-gold/60 transition-colors">
                      <ExternalLink size={11} aria-hidden="true" /> {link.label}
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-navy px-6 py-20" aria-labelledby="credentials-title">
          <div className="max-w-5xl mx-auto">
            <h2 id="credentials-title" className="font-serif text-3xl text-white mb-8">{copy.credentials}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {CREDENTIALS.map((credential) => (
                <article key={credential.orcid} className="border border-gold/20 rounded-sm p-6">
                  <h3 className="font-serif text-2xl text-white">{credential.name}</h3>
                  <p className="text-sm text-white/55 mt-2">{credential.role[lang]}</p>
                  <a href={credential.orcid} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 text-xs text-gold hover:text-white transition-colors">
                    <ExternalLink size={13} aria-hidden="true" /> {copy.verify}
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="font-serif text-3xl text-navy mb-5">{copy.cta}</h2>
          <a href={diagnosisHref()} onClick={() => trackConversion('diagnosis_cta_click', { placement: 'authority' })} className="btn-primary inline-flex px-8 py-3.5 text-xs tracking-[0.15em] rounded-sm">
            {copy.ctaButton}
          </a>
          <div className="mt-8"><Link to="/" className="text-sm text-gold hover:underline">{copy.back}</Link></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
