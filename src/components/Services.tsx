import { Check } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

type Tier = {
  name: string;
  price: string;
  priceNote: string;
  highlight: boolean;
  badge?: string;
  features: string[];
};

type AddonTier = {
  name: string;
  price: string;
  priceNote: string;
  label: string;
  features: string[];
};

type Service = {
  title: string;
  subtitle: string;
  tiers: Tier[];
  addon?: AddonTier;
  independent?: { name: string; price: string };
};

const servicesEs: Service[] = [
  {
    title: 'Examen Complexivo',
    subtitle: 'Tu titulación, con acompañamiento real',
    tiers: [
      { name: 'Básico', price: '150 USD', priceNote: 'ensayo de 25 páginas', highlight: false, features: ['Corrección ortográfica y gramatical','Corrección de formato APA 7','Revisión de citas y referencias','Verificación de coherencia (diagnóstico → propuesta)','Informe breve de errores frecuentes'] },
      { name: 'Avanzado', price: '200 USD', priceNote: 'ensayo de 25 páginas', highlight: true, badge: 'Más elegido', features: ['Todo lo del Básico','Informe pedagógico personalizado (explicación de cada error: por qué está mal, cómo corregirlo y cómo evitarlo)','Mini sesión de mentoría (20–30 min por videollamada para resolver dudas)','Revisión de estructura completa (Introducción, Teórico, Diagnóstico, Propuesta, Conclusiones)','Sugerencias para mejorar argumentación'] },
      { name: 'Mentoría Premium', price: '250 USD', priceNote: 'ensayo de 25 páginas', highlight: false, features: ['Todo lo del Avanzado','Simulación de preguntas del tribunal (documento con posibles preguntas tipo y respuestas modelo)','Dos sesiones de mentoría 1:1 (60 min cada una: borrador + defensa oral)','Acompañamiento hasta la defensa (correo/WhatsApp para resolver dudas)','Garantía de satisfacción (revisamos hasta que quedes conforme)'] },
    ],
    addon: { name: 'Redacción completa del Examen Complexivo (desde cero)', price: '300 USD', priceNote: 'ensayo de 25 páginas', label: 'Servicio adicional', features: ['Creación completa del contenido desde cero','Desde la idea inicial hasta el ensayo final (25 páginas)','Investigación profunda, redacción y estructuración integral','Estructura académica: Introducción, Marco Teórico, Diagnóstico, Propuesta, Conclusiones','Citas y referencias completas en formato APA 7','Nivel premium comparable o superior a Mentoría Premium'] },
    independent: { name: 'Presentación con diapos + guion oral', price: '60 USD' },
  },
  {
    title: 'Artículo Científico',
    subtitle: 'Tu puerta a la publicación indexada',
    tiers: [
      { name: 'Básico', price: '250 USD', priceNote: 'artículo de 3.000–5.000 palabras', highlight: false, features: ['Corrección ortográfica y gramatical','Corrección de formato (APA 7 / Vancouver / estilo revista)','Revisión de citas y referencias','Verificación de coherencia (resumen ↔ introducción ↔ conclusiones)','Informe breve de errores frecuentes'] },
      { name: 'Avanzado', price: '350 USD', priceNote: 'artículo de 3.000–5.000 palabras', highlight: true, badge: 'Más elegido', features: ['Todo lo del Básico','Informe pedagógico personalizado (explicación de errores gramaticales, de estilo o de formato, con ejemplos)','Mini sesión de retroalimentación (20–30 min por videollamada)','Revisión de estructura IMRyD (Introducción, Métodos, Resultados, Discusión)','Sugerencias para mejorar impacto y claridad (título, palabras clave, gráficos)'] },
      { name: 'Mentoría Premium', price: '500 USD', priceNote: 'artículo de 3.000–5.000 palabras', highlight: false, features: ['Todo lo del Avanzado','Dos sesiones de mentoría 1:1 (60 min cada una: estructura y respuesta a revisores)','Acompañamiento en respuesta a revisores (interpretación de comentarios y redacción de respuestas)','Simulación de revisión por pares (informe simulando comentarios de un revisor)','Seguimiento hasta la aceptación (resolución de dudas en envío y revisiones)'] },
    ],
    addon: { name: 'Redacción completa (desde cero)', price: '600 USD', priceNote: 'artículo completo', label: 'Servicio adicional', features: ['Investigación y redacción completa del artículo desde cero','Estructura IMRyD (Introducción, Métodos, Resultados, Discusión)','Abstract y título optimizados para indexación','Referencias completas en formato APA 7','Citas APA correctas en todo el texto','Una sesión de mentoría incluida'] },
    independent: { name: 'Presentación con diapositivas + guion oral', price: '60 USD' },
  },
];

const servicesEn: Service[] = [
  {
    title: 'Comprehensive Exam',
    subtitle: 'Your graduation, with real support',
    tiers: [
      { name: 'Basic', price: '150 USD', priceNote: '25-page essay', highlight: false, features: ['Spelling and grammar correction','APA 7 format correction','Citation and reference review','Coherence check (diagnosis → proposal)','Brief report of frequent errors'] },
      { name: 'Advanced', price: '200 USD', priceNote: '25-page essay', highlight: true, badge: 'Most popular', features: ['Everything in Basic','Personalised pedagogical report (explanation of each error: why it is wrong, how to fix it and how to avoid it)','Mini mentoring session (20–30 min video call)','Full structure review (Introduction, Theory, Diagnosis, Proposal, Conclusions)','Suggestions to improve argumentation'] },
      { name: 'Premium Mentoring', price: '250 USD', priceNote: '25-page essay', highlight: false, features: ['Everything in Advanced','Panel question simulation (document with sample questions and model answers)','Two 1:1 mentoring sessions (60 min each: draft + oral defence)','Support until defence (email/WhatsApp for questions)','Satisfaction guarantee (we review until you are satisfied)'] },
    ],
    addon: { name: 'Full writing of the Comprehensive Exam (from scratch)', price: '300 USD', priceNote: '25-page essay', label: 'Add-on service', features: ['Complete content creation from scratch','From initial idea to final essay (25 pages)','In-depth research, writing and full structuring','Academic structure: Introduction, Theoretical Framework, Diagnosis, Proposal, Conclusions','Complete references in APA 7 format','Premium level comparable to or above Premium Mentoring'] },
    independent: { name: 'Presentation slides + oral script', price: '60 USD' },
  },
  {
    title: 'Scientific Article',
    subtitle: 'Your gateway to indexed publication',
    tiers: [
      { name: 'Basic', price: '250 USD', priceNote: '3,000–5,000 word article', highlight: false, features: ['Spelling and grammar correction','Format correction (APA 7 / Vancouver / journal style)','Citation and reference review','Coherence check (abstract ↔ intro ↔ conclusions)','Brief report of frequent errors'] },
      { name: 'Advanced', price: '350 USD', priceNote: '3,000–5,000 word article', highlight: true, badge: 'Most popular', features: ['Everything in Basic','Personalised pedagogical report (explanation of grammar, style or format errors with examples)','Mini feedback session (20–30 min video call)','IMRaD structure review (Introduction, Methods, Results, Discussion)','Suggestions to improve impact and clarity (title, keywords, figures)'] },
      { name: 'Premium Mentoring', price: '500 USD', priceNote: '3,000–5,000 word article', highlight: false, features: ['Everything in Advanced','Two 1:1 mentoring sessions (60 min each: structure and response to reviewers)','Support in responding to reviewers (interpreting comments and drafting responses)','Peer review simulation (report simulating reviewer comments)','Follow-up until acceptance (queries about submission and revisions)'] },
    ],
    addon: { name: 'Full writing (from scratch)', price: '600 USD', priceNote: 'complete article', label: 'Add-on service', features: ['Full research and writing of the article from scratch','IMRaD structure (Introduction, Methods, Results, Discussion)','Abstract and title optimised for indexing','Complete references in APA 7 format','Correct APA citations throughout','One mentoring session included'] },
    independent: { name: 'Presentation slides + oral script', price: '60 USD' },
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
    <div className="mt-6 glass-navy border border-gold/25 rounded-sm hover:border-gold/50 transition-colors duration-300">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-72 flex-shrink-0 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
          <div>
            <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold/70 border border-gold/30 px-2.5 py-1 rounded-full mb-3">{addon.label}</span>
            <p className="font-serif text-xl font-light text-white leading-snug">{addon.name}</p>
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

  return (
    <section id="servicios" className="section-navy py-28 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[400px] h-[400px] top-0 right-0 opacity-10" />
      <div className="orb orb-navy w-[300px] h-[300px] bottom-0 left-0 opacity-20" style={{ animationDelay: '4s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20 reveal">
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

        <div className="space-y-20">
          {services.map((service) => (
            <div key={service.title} className="reveal">
              <div className="flex items-center gap-4 mb-8">
                <div>
                  <h3 className="font-serif text-3xl font-light text-white">{service.title}</h3>
                  <p className="text-sm text-gold/70 tracking-wide mt-0.5">{service.subtitle}</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent ml-4 hidden md:block" />
              </div>
              <div className="grid md:grid-cols-3 gap-6 stagger">
                {service.tiers.map((tier) => (
                  <TierCard key={tier.name} tier={tier} solicitar={s.solicitar} />
                ))}
              </div>
              {service.addon && <AddonCard addon={service.addon} solicitar={s.solicitar} />}
              {service.independent && (
                <div className="mt-4 flex items-center justify-between gap-6 px-5 py-4 rounded-sm border border-white/8 bg-white/3 hover:border-gold/25 transition-colors duration-300">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] tracking-[0.2em] uppercase text-white/35 border border-white/15 px-2 py-0.5 rounded-full whitespace-nowrap">{s.independentLabel}</span>
                    <p className="text-sm text-white/70">{service.independent.name}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <p className="font-serif text-lg font-semibold text-gold">{service.independent.price}</p>
                    <a href="#contacto" className="text-xs tracking-[0.12em] px-4 py-2 rounded-sm border border-gold/30 text-gold hover:bg-gold/10 transition-all duration-200">{s.solicitar}</a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comparison */}
        <div className="mt-24 reveal">
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

        <div className="text-center mt-16 reveal">
          <p className="text-white/50 text-sm mb-6">{s.compCta}</p>
          <a href="#contacto" className="btn-primary inline-block px-10 py-4 text-xs tracking-[0.15em] rounded-sm">
            <span>{s.solicitarInfo}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
