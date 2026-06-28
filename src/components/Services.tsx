import { useState } from 'react';
import { Check } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

type Tier = {
  name: string;
  price: string;
  priceNote: string;
  highlight: boolean;
  badge?: string;
  tagline?: string;
  features: string[];
};

type AddonTier = {
  name: string;
  price: string;
  priceNote: string;
  label: string;
  desc?: string;
  features: string[];
};

type Service = {
  title: string;
  subtitle: string;
  tiers: Tier[];
  addon?: AddonTier;
};

const servicesEs: Service[] = [
  {
    title: 'Examen Complexivo',
    subtitle: 'Tu titulación, con acompañamiento real',
    tiers: [
      {
        name: 'Básico', price: '150 USD', priceNote: 'estructura estándar (ej. 25 págs. o similar)', highlight: false,
        tagline: 'Ideal para revisiones finales de estructura y formato APA 7.',
        features: ['Corrección de estilo (ortografía, gramática y sintaxis)', 'Alineación del formato APA 7 (citas y referencias)', 'Revisión de coherencia: diagnóstico → propuesta', 'Informe técnico breve de errores frecuentes'],
      },
      {
        name: 'Avanzado', price: '200 USD', priceNote: 'estructura estándar (ej. 25 págs. o similar)', highlight: true, badge: 'Más elegido',
        tagline: 'Ideal para quienes quieren entender y corregir sus errores antes de sustentar.',
        features: ['Corrección de estilo profunda (ortografía, gramática y sintaxis)', 'Alineación del formato APA 7 completo (citas y referencias)', 'Revisión metodológica: consistencia interna del proyecto', 'Informe pedagógico personalizado con la causa de cada error', '1 sesión de mentoría en vivo para resolver dudas'],
      },
      {
        name: 'Mentoría Premium', price: '250 USD', priceNote: 'estructura estándar (ej. 25 págs. o similar)', highlight: false,
        tagline: 'Cobertura total: revisión y ajustes continuos hasta la aprobación de tu titulación.',
        features: ['Todo lo del Plan Avanzado', 'Simulación del tribunal de sustentación (preguntas tipo + respuestas modelo)', 'Dos sesiones 1:1 (60 min cada una: borrador + defensa oral)', 'Acompañamiento hasta la aprobación (correo/WhatsApp sin límite)', 'Garantía de satisfacción: revisamos hasta que quedes conforme'],
      },
    ],
    addon: {
      name: 'Mentoría de Co-creación Intensiva', price: '300 USD',
      priceNote: 'estructura estándar de hasta 25 págs. o similar',
      label: 'RECOMENDADO SI EMPIEZAS DESDE CERO',
      desc: 'Ideal para estudiantes que se enfrentan a plazos exigentes o sufren bloqueos al escribir. Te acompañamos en la co-estructuración, pulimos la redacción y guiamos metodológicamente la escritura de tu ensayo en sesiones semanales junto a nuestras investigadoras doctoradas.',
      features: ['Estructuración guiada desde la primera página', 'Plan de investigación, diseño metodológico y andamiaje', 'Redacción asistida y tutoría académica semanal', 'Desarrollo completo del esquema (Introducción, Teoría, Propuesta, Conclusiones)', 'Acompañamiento de Máxima Exigencia para asegurar tu aprendizaje activo'],
    },
  },
  {
    title: 'Artículo Científico',
    subtitle: 'Tu puerta a la publicación indexada',
    tiers: [
      {
        name: 'Básico', price: '250 USD', priceNote: 'adaptado a las normas de extensión de la revista elegida', highlight: false,
        tagline: 'Ideal para manuscritos listos para envío con correcciones de forma.',
        features: ['Corrección de estilo', 'Adaptación de formato integral (márgenes, tablas)', 'Auditoría de citas (APA/Vancouver)', 'Verificación de Keywords', 'Ajuste de Resumen/Abstract', 'Informe técnico'],
      },
      {
        name: 'Avanzado', price: '350 USD', priceNote: 'adaptado a las normas de extensión de la revista elegida', highlight: true, badge: 'Más elegido',
        tagline: 'Ideal para investigadores que quieren maximizar su tasa de aceptación.',
        features: ['Todo lo del Plan Básico', 'Informe pedagógico personalizado', '1 sesión en vivo', 'Revisión profunda IMRyD', 'Auditoría de coherencia del Resumen', 'Optimización visual de gráficos'],
      },
      {
        name: 'Mentoría Premium', price: '500 USD', priceNote: 'adaptado a las normas de extensión de la revista elegida', highlight: false,
        tagline: 'Cobertura total: acompañamiento hasta la aceptación final del manuscrito.',
        features: ['Todo lo del Plan Avanzado', 'Dos sesiones 1:1 (60 min)', 'Mentoría de reestructuración formato universidad → revista', 'Simulación real de revisión por pares', 'Co-elaboración de respuestas al comité editorial', 'Cobertura total hasta la aceptación final'],
      },
    ],
    addon: {
      name: 'Mentoría de Co-creación Científica', price: '600 USD',
      priceNote: 'adaptado a las normas de extensión de la revista elegida',
      label: 'RECOMENDADO PARA DOCENTES E INVESTIGADORES',
      desc: 'Ideal para profesionales de la educación y ciencias sociales que necesitan publicar bajo plazos exigentes o sufren bloqueos al escribir. Te acompañamos en la co-estructuración, pulimos la redacción y guiamos metodológicamente la escritura de tu manuscrito bajo estándares internacionales Scopus o Latindex.',
      features: ['Auditoría metodológica adaptada al factor de impacto', 'Guía exhaustiva en la redacción de la estructura IMRyD', 'Co-elaboración y optimización técnica del Abstract y título', 'Auditoría completa y estructuración de referencias', 'Sesiones 1:1 que garantizan tu aprendizaje activo y apropiación metodológica'],
    },
  },
];

const servicesEn: Service[] = [
  {
    title: 'Comprehensive Exam',
    subtitle: 'Your graduation, with real support',
    tiers: [
      {
        name: 'Basic', price: '150 USD', priceNote: 'standard structure (e.g. 25 pages or similar)', highlight: false,
        tagline: 'Ideal for final reviews of structure and APA 7 format.',
        features: ['Style correction (spelling, grammar and syntax)', 'Full APA 7 format alignment (citations and references)', 'Coherence review: diagnosis → proposal', 'Brief technical report of frequent errors'],
      },
      {
        name: 'Advanced', price: '200 USD', priceNote: 'standard structure (e.g. 25 pages or similar)', highlight: true, badge: 'Most popular',
        tagline: 'Ideal for those who want to understand and fix their mistakes before defending.',
        features: ['In-depth style correction (spelling, grammar and syntax)', 'Full APA 7 format alignment (citations and references)', 'Methodological review: internal consistency of the project', 'Personalised pedagogical report explaining the cause of each error', '1 live mentoring session to resolve doubts'],
      },
      {
        name: 'Premium Mentoring', price: '250 USD', priceNote: 'standard structure (e.g. 25 pages or similar)', highlight: false,
        tagline: 'Full coverage: continuous review and adjustments until your graduation is approved.',
        features: ['Everything in Advanced', 'Panel simulation (sample questions + model answers)', 'Two 1:1 sessions (60 min each: draft + oral defence)', 'Support until approval (unlimited email/WhatsApp)', 'Satisfaction guarantee: we review until you are satisfied'],
      },
    ],
    addon: {
      name: 'Intensive Co-creation Mentoring', price: '300 USD',
      priceNote: 'standard structure up to 25 pages or similar',
      label: 'RECOMMENDED IF YOU ARE STARTING FROM SCRATCH',
      desc: 'Ideal for students facing tight deadlines or writing blocks. We guide you through co-structuring, refine the writing and provide methodological coaching in weekly sessions with our doctoral researchers.',
      features: ['Guided structuring from the very first page', 'Research plan, methodological design and scaffolding', 'Assisted writing and weekly academic tutoring', 'Full outline development (Introduction, Theory, Proposal, Conclusions)', 'Maximum-rigour accompaniment to ensure your active learning'],
    },
  },
  {
    title: 'Scientific Article',
    subtitle: 'Your gateway to indexed publication',
    tiers: [
      {
        name: 'Basic', price: '250 USD', priceNote: 'adapted to the word-count norms of your chosen journal', highlight: false,
        tagline: 'Ideal for manuscripts ready for submission with formal corrections.',
        features: ['Style correction', 'Full format adaptation (margins, tables)', 'Citation audit (APA/Vancouver)', 'Keyword verification', 'Abstract adjustment', 'Technical report'],
      },
      {
        name: 'Advanced', price: '350 USD', priceNote: 'adapted to the word-count norms of your chosen journal', highlight: true, badge: 'Most popular',
        tagline: 'Ideal for researchers who want to maximise their acceptance rate.',
        features: ['Everything in Basic', 'Personalised pedagogical report', '1 live session', 'In-depth IMRaD review', 'Abstract coherence audit', 'Visual optimisation of figures'],
      },
      {
        name: 'Premium Mentoring', price: '500 USD', priceNote: 'adapted to the word-count norms of your chosen journal', highlight: false,
        tagline: 'Full coverage: support until the final acceptance of your manuscript.',
        features: ['Everything in Advanced', 'Two 1:1 sessions (60 min)', 'Restructuring mentoring: university format → journal format', 'Real peer-review simulation', 'Co-drafting of responses to the editorial committee', 'Full coverage until final acceptance'],
      },
    ],
    addon: {
      name: 'Scientific Co-creation Mentoring', price: '600 USD',
      priceNote: 'adapted to the word-count norms of your chosen journal',
      label: 'RECOMMENDED FOR TEACHERS AND RESEARCHERS',
      desc: 'Ideal for education and social science professionals who need to publish under tight deadlines or face writing blocks. We guide co-structuring, refine the writing and provide methodological coaching under Scopus or Latindex international standards.',
      features: ['Methodological audit adapted to the impact factor', 'Comprehensive guidance on writing the IMRaD structure', 'Co-drafting and technical optimisation of the Abstract and title', 'Complete audit and structuring of references', '1:1 sessions to guarantee your active learning and methodological ownership'],
    },
  },
];

function TierCard({ tier, solicitar }: { tier: Tier; solicitar: string }) {
  return (
    <div className={`relative flex flex-col rounded-sm transition-transform duration-300 hover:-translate-y-1 ${tier.highlight ? 'bg-gold shadow-[0_8px_40px_rgba(201,168,76,0.35)] border border-gold-light' : 'glass-navy border border-white/10 hover:border-gold/30'}`}>
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-navy text-gold text-[10px] tracking-[0.15em] font-medium px-3 py-1 rounded-full border border-gold/40 whitespace-nowrap">{tier.badge}</span>
        </div>
      )}
      <div className={`p-6 border-b ${tier.highlight ? 'border-navy/20' : 'border-white/8'}`}>
        <p className={`text-xs tracking-[0.25em] uppercase mb-2 ${tier.highlight ? 'text-navy/70' : 'text-gold/70'}`}>{tier.name}</p>
        <p className={`font-serif text-2xl font-semibold leading-tight ${tier.highlight ? 'text-navy' : 'text-white'}`}>{tier.price}</p>
        <p className={`text-xs mt-1 ${tier.highlight ? 'text-navy/60' : 'text-white/40'}`}>{tier.priceNote}</p>
      </div>
      <ul className="p-6 flex flex-col gap-3 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-snug">
            <Check size={14} strokeWidth={2.5} className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-navy' : 'text-gold'}`} />
            <span className={tier.highlight ? 'text-navy/80' : 'text-white/65'}>{f}</span>
          </li>
        ))}
      </ul>
      {tier.tagline && (
        <p className={`px-6 pb-4 text-xs italic leading-relaxed ${tier.highlight ? 'text-navy/60' : 'text-white/40'}`}>{tier.tagline}</p>
      )}
      <div className="px-6 pb-6">
        <a href="#contacto" className={`block text-center text-xs tracking-[0.15em] py-3 rounded-sm transition-all duration-200 ${tier.highlight ? 'bg-navy text-gold hover:bg-navy-light' : 'border border-gold/40 text-gold hover:bg-gold/10'}`}>
          {solicitar}
        </a>
      </div>
    </div>
  );
}

function AddonCard({ addon, solicitar }: { addon: AddonTier; solicitar: string }) {
  return (
    <div className="mt-8 glass-navy border border-gold/25 rounded-sm hover:border-gold/50 transition-colors duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-72 flex-shrink-0 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
          <div>
            <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold border border-gold/50 bg-gold/10 px-2.5 py-1 rounded-full mb-3">{addon.label}</span>
            <p className="font-serif text-xl font-light text-white leading-snug">{addon.name}</p>
            {addon.desc && <p className="text-xs text-white/45 leading-relaxed mt-3 italic">{addon.desc}</p>}
          </div>
          <div className="mt-6">
            <p className="font-serif text-3xl font-semibold text-gold">{addon.price}</p>
            <p className="text-xs text-white/35 mt-1">{addon.priceNote}</p>
            <a href="#contacto" className="mt-4 block text-center text-xs tracking-[0.15em] py-2.5 rounded-sm border border-gold/40 text-gold hover:bg-gold/10 transition-all duration-200">{solicitar}</a>
          </div>
        </div>
        <ul className="flex-1 p-6 grid sm:grid-cols-2 gap-x-8 gap-y-3 content-start">
          {addon.features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-snug">
              <Check size={13} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-gold" />
              <span className="text-white/65">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Services() {
  const { lang, t } = useLang();
  const s = t.services;
  const services = lang === 'es' ? servicesEs : servicesEn;
  const [activeTab, setActiveTab] = useState(0);
  const active = services[activeTab];

  return (
    <section id="servicios" className="section-navy py-28 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[400px] h-[400px] top-0 right-0 opacity-10" />
      <div className="orb orb-navy w-[300px] h-[300px] bottom-0 left-0 opacity-20" style={{ animationDelay: '4s' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-14 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{s.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-white leading-tight">
            {s.title1} <em className="not-italic text-gold">{s.title2}</em>
          </h2>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" /></svg>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12 reveal">
          <div className="inline-flex rounded-sm border border-white/10 overflow-hidden">
            {services.map((service, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`relative px-8 py-4 text-sm tracking-[0.1em] transition-all duration-300 ${
                  activeTab === i
                    ? 'bg-gold text-navy font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {i > 0 && <span className="absolute left-0 top-1/4 h-1/2 w-px bg-white/10" />}
                <span className="font-serif text-base">{service.title}</span>
                <p className={`text-[10px] tracking-wide mt-0.5 font-sans font-normal ${activeTab === i ? 'text-navy/60' : 'text-white/35'}`}>
                  {service.subtitle}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Active service content */}
        <div className="reveal">
          {/* Tier cards */}
          <div className="grid md:grid-cols-3 gap-6 stagger">
            {active.tiers.map((tier, i) => (
              <TierCard key={i} tier={tier} solicitar={s.solicitar} />
            ))}
          </div>

          {/* Addon */}
          {active.addon && <AddonCard addon={active.addon} solicitar={s.solicitar} />}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mt-20 mb-14">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
          <svg width="8" height="8" viewBox="0 0 8 8"><rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="rgba(201,168,76,0.4)" /></svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Oratoria */}
        <div className="reveal">
          <div className="glass-navy border border-gold/30 rounded-sm overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-80 flex-shrink-0 p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between bg-gold/5">
                <div>
                  <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold border border-gold/50 px-2.5 py-1 rounded-full mb-4">
                    {lang === 'es' ? 'EL PASO FINAL HACIA TU TÍTULO' : 'THE FINAL STEP TO YOUR DEGREE'}
                  </span>
                  <h3 className="font-serif text-2xl font-light text-white leading-snug mb-2">
                    {lang === 'es' ? 'Mentoría de Oratoria Académica y Defensa Oral' : 'Academic Oral Defence Mentoring'}
                  </h3>
                  <p className="text-xs text-white/45 italic leading-relaxed mb-4">
                    {lang === 'es'
                      ? 'Co-elaboración de tu presentación y discurso ante el tribunal'
                      : 'Co-development of your presentation and speech before the panel'}
                  </p>
                  <p className="text-xs text-white/55 leading-relaxed">
                    {lang === 'es'
                      ? 'Un excelente documento no sirve de nada si te bloqueas ante los jurados. Te guiamos en la co-elaboración de tu material visual y entrenamos tu discurso para que defiendas tu investigación con total elocuencia y domines las preguntas del tribunal.'
                      : "An excellent document means nothing if you freeze before the panel. We guide you in co-developing your visual material and train your delivery so you defend your research with full eloquence and master the panel's questions."}
                  </p>
                </div>
                <div className="mt-6">
                  <p className="font-serif text-4xl font-semibold text-gold">50 USD</p>
                  <p className="text-xs text-white/35 mt-1">
                    {lang === 'es'
                      ? 'Válido para examen complexivo o proyectos de titulación'
                      : 'Valid for comprehensive exam or graduation projects'}
                  </p>
                  <a href="#contacto" className="mt-4 block text-center text-xs tracking-[0.15em] py-3 rounded-sm bg-gold text-navy font-semibold hover:bg-gold-light transition-all duration-200">
                    {lang === 'es' ? 'ASEGURAR MI DEFENSA ORAL' : 'SECURE MY ORAL DEFENCE'}
                  </a>
                </div>
              </div>
              <ul className="flex-1 p-8 grid sm:grid-cols-2 gap-x-8 gap-y-4 content-start">
                {(lang === 'es' ? [
                  'Estructuración estratégica del guion y discurso de apertura.',
                  'Guía y optimización visual de diapositivas bajo estándares universitarios.',
                  'Entrenamiento de control de nervios, lenguaje corporal y voz.',
                  'Banco simulado de preguntas difíciles según tu universidad.',
                  'Mentoría en vivo 1-a-1 de simulación real con correcciones inmediatas.',
                ] : [
                  'Strategic structuring of the script and opening speech.',
                  'Visual guidance and optimisation of slides to university standards.',
                  'Training in nerves control, body language and voice projection.',
                  'Simulated bank of difficult questions specific to your university.',
                  'Live 1-to-1 real-simulation mentoring with immediate corrections.',
                ]).map((f, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-snug">
                    <Check size={14} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-gold" />
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Comparison */}
        <div className="mt-20 reveal">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">{s.compLabel}</p>
            <h3 className="font-serif text-3xl md:text-4xl font-light text-white">
              {s.compTitle1} <em className="not-italic text-gold">{s.compTitle2}</em>{s.compTitle3}
            </h3>
          </div>
          <div className="rounded-sm overflow-hidden border border-white/10">
            <div className="grid grid-cols-2">
              <div className="px-6 py-4 bg-white/5 border-b border-r border-white/10">
                <p className="text-xs tracking-[0.2em] text-white/40 uppercase">{s.compHeader1}</p>
              </div>
              <div className="px-6 py-4 bg-gold/10 border-b border-white/10">
                <p className="text-xs tracking-[0.2em] text-gold uppercase">{s.compHeader2}</p>
              </div>
            </div>
            {s.comparison.map((row, i) => (
              <div key={i} className={`grid grid-cols-2 ${i < s.comparison.length - 1 ? 'border-b border-white/8' : ''}`}>
                <div className="px-6 py-5 border-r border-white/8 flex items-start gap-3">
                  <span className="text-white/25 text-lg leading-none mt-0.5 flex-shrink-0">✗</span>
                  <p className="text-sm text-white/45 leading-relaxed">{row.traditional}</p>
                </div>
                <div className="px-6 py-5 bg-gold/5 flex items-start gap-3">
                  <Check size={15} className="text-gold mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <p className="text-sm text-white/80 leading-relaxed">{row.textum}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div className="text-center mt-16 reveal">
          <p className="text-white/50 text-sm mb-6">{s.compCta}</p>
          <a href="#contacto" className="btn-primary inline-block px-10 py-4 text-xs tracking-[0.15em] rounded-sm">
            <span>{s.compCtaBtn}</span>
          </a>
        </div>

      </div>
    </section>
  );
}
