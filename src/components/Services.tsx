import { Check } from 'lucide-react';

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

const services: Service[] = [
  {
    title: 'Examen Complexivo',
    subtitle: 'Tu titulación, con acompañamiento real',
    tiers: [
      {
        name: 'Básico',
        price: '150 USD',
        priceNote: 'ensayo de 25 páginas',
        highlight: false,
        features: [
          'Corrección ortográfica y gramatical',
          'Corrección de formato APA 7',
          'Revisión de citas y referencias',
          'Verificación de coherencia (diagnóstico → propuesta)',
          'Informe breve de errores frecuentes',
        ],
      },
      {
        name: 'Avanzado',
        price: '200 USD',
        priceNote: 'ensayo de 25 páginas',
        highlight: true,
        badge: 'Más elegido',
        features: [
          'Todo lo del Básico',
          'Informe pedagógico personalizado (explicación de cada error: por qué está mal, cómo corregirlo y cómo evitarlo)',
          'Mini sesión de mentoría (20–30 min por videollamada para resolver dudas)',
          'Revisión de estructura completa (Introducción, Teórico, Diagnóstico, Propuesta, Conclusiones)',
          'Sugerencias para mejorar argumentación',
        ],
      },
      {
        name: 'Mentoría Premium',
        price: '250 USD',
        priceNote: 'ensayo de 25 páginas',
        highlight: false,
        features: [
          'Todo lo del Avanzado',
          'Simulación de preguntas del tribunal (documento con posibles preguntas tipo y respuestas modelo)',
          'Dos sesiones de mentoría 1:1 (60 min cada una: borrador + defensa oral)',
          'Acompañamiento hasta la defensa (correo/WhatsApp para resolver dudas)',
          'Garantía de satisfacción (revisamos hasta que quedes conforme)',
        ],
      },
    ],
    addon: {
      name: 'Redacción completa del Examen Complexivo (desde cero)',
      price: '300 USD',
      priceNote: 'ensayo de 25 páginas',
      label: 'Servicio adicional',
      features: [
        'Creación completa del contenido desde cero',
        'Desde la idea inicial hasta el ensayo final (25 páginas)',
        'Investigación profunda, redacción y estructuración integral',
        'Estructura académica: Introducción, Marco Teórico, Diagnóstico, Propuesta, Conclusiones',
        'Citas y referencias completas en formato APA 7',
        'Nivel premium comparable o superior a Mentoría Premium — implica crear el contenido, no solo corregirlo',
      ],
    },
    independent: {
      name: 'Presentación con diapos + guion oral',
      price: '60 USD',
    },
  },
  {
    title: 'Artículo Científico',
    subtitle: 'Tu puerta a la publicación indexada',
    tiers: [
      {
        name: 'Básico',
        price: '250 USD',
        priceNote: 'artículo de 3.000–5.000 palabras',
        highlight: false,
        features: [
          'Corrección ortográfica y gramatical',
          'Corrección de formato (APA 7 / Vancouver / estilo revista)',
          'Revisión de citas y referencias',
          'Verificación de coherencia (resumen ↔ introducción ↔ conclusiones)',
          'Informe breve de errores frecuentes',
        ],
      },
      {
        name: 'Avanzado',
        price: '350 USD',
        priceNote: 'artículo de 3.000–5.000 palabras',
        highlight: true,
        badge: 'Más elegido',
        features: [
          'Todo lo del Básico',
          'Informe pedagógico personalizado (explicación de errores gramaticales, de estilo o de formato, con ejemplos)',
          'Mini sesión de retroalimentación (20–30 min por videollamada)',
          'Revisión de estructura IMRyD (Introducción, Métodos, Resultados, Discusión)',
          'Sugerencias para mejorar impacto y claridad (título, palabras clave, gráficos)',
        ],
      },
      {
        name: 'Mentoría Premium',
        price: '500 USD',
        priceNote: 'artículo de 3.000–5.000 palabras',
        highlight: false,
        features: [
          'Todo lo del Avanzado',
          'Dos sesiones de mentoría 1:1 (60 min cada una: estructura y respuesta a revisores)',
          'Acompañamiento en respuesta a revisores (interpretación de comentarios y redacción de respuestas)',
          'Simulación de revisión por pares (informe simulando comentarios de un revisor)',
          'Seguimiento hasta la aceptación (resolución de dudas en envío y revisiones)',
        ],
      },
    ],
    addon: {
      name: 'Redacción completa (desde cero)',
      price: '600 USD',
      priceNote: 'artículo completo',
      label: 'Servicio adicional',
      features: [
        'Investigación y redacción completa del artículo desde cero',
        'Estructura IMRyD (Introducción, Métodos, Resultados, Discusión)',
        'Abstract y título optimizados para indexación',
        'Referencias completas en formato APA 7',
        'Citas APA correctas en todo el texto',
        'Una sesión de mentoría incluida',
      ],
    },
    independent: {
      name: 'Presentación con diapositivas + guion oral',
      price: '60 USD',
    },
  },
];

const comparison = [
  {
    traditional: 'Corrigen y devuelven. No sabes por qué.',
    textum: 'Te explicamos cada cambio. Aprendes a evitar errores en el futuro.',
  },
  {
    traditional: 'Solo revisan ortografía y gramática.',
    textum: 'Revisamos la lógica argumentativa. Cuestionamos, sugerimos y mejoramos la estructura.',
  },
  {
    traditional: 'No te preparan para defensa o revisores.',
    textum: 'Simulamos el tribunal o los pares académicos. Llegas preparado.',
  },
  {
    traditional: 'No hay seguimiento.',
    textum: 'Te acompañamos hasta la defensa o aceptación. Resolvemos dudas en el camino.',
  },
];

function AddonCard({ addon }: { addon: AddonTier }) {
  return (
    <div className="mt-6 glass-navy border border-gold/25 rounded-sm hover:border-gold/50 transition-colors duration-300">
      <div className="flex flex-col md:flex-row">
        {/* Left: label + name + price */}
        <div className="md:w-72 flex-shrink-0 p-6 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
          <div>
            <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold/70 border border-gold/30 px-2.5 py-1 rounded-full mb-3">
              {addon.label}
            </span>
            <p className="font-serif text-xl font-light text-white leading-snug">{addon.name}</p>
          </div>
          <div className="mt-6">
            <p className="font-serif text-3xl font-semibold text-gold">{addon.price}</p>
            <p className="text-xs text-white/35 mt-1">{addon.priceNote}</p>
            <a
              href="#contacto"
              className="mt-4 block text-center text-xs tracking-[0.15em] py-2.5 rounded-sm border border-gold/40 text-gold hover:bg-gold/10 transition-all duration-200"
            >
              SOLICITAR
            </a>
          </div>
        </div>
        {/* Right: features */}
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

function IndependentServiceRow({ service }: { service: { name: string; price: string } }) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 px-5 py-4 rounded-sm bg-gold border border-gold-light shadow-[0_8px_40px_rgba(201,168,76,0.35)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
        <span className="text-[10px] tracking-[0.2em] uppercase text-navy/70 border border-navy/30 px-2 py-0.5 rounded-full whitespace-nowrap w-fit">
          Servicio independiente
        </span>
        <p className="text-sm text-navy/80 break-words">{service.name}</p>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <p className="font-serif text-lg font-semibold text-navy whitespace-nowrap">{service.price}</p>
        <a
          href="#contacto"
          className="text-xs tracking-[0.12em] px-4 py-2 rounded-sm bg-navy text-gold hover:bg-navy-light transition-all duration-200 whitespace-nowrap"
        >
          SOLICITAR
        </a>
      </div>
    </div>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={`relative flex flex-col rounded-sm transition-transform duration-300 hover:-translate-y-1 ${
        tier.highlight
          ? 'bg-gold shadow-[0_8px_40px_rgba(201,168,76,0.35)] border border-gold-light'
          : 'glass-navy border border-white/10 hover:border-gold/30'
      }`}
    >
      {tier.badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-navy text-gold text-[10px] tracking-[0.15em] font-medium px-3 py-1 rounded-full border border-gold/40 whitespace-nowrap">
            {tier.badge}
          </span>
        </div>
      )}

      {/* Header */}
      <div className={`p-6 border-b ${tier.highlight ? 'border-navy/20' : 'border-white/8'}`}>
        <p className={`text-xs tracking-[0.25em] uppercase mb-2 ${tier.highlight ? 'text-navy/70' : 'text-gold/70'}`}>
          {tier.name}
        </p>
        <p className={`font-serif text-2xl font-semibold leading-tight ${tier.highlight ? 'text-navy' : 'text-white'}`}>
          {tier.price}
        </p>
        <p className={`text-xs mt-1 ${tier.highlight ? 'text-navy/60' : 'text-white/40'}`}>
          {tier.priceNote}
        </p>
      </div>

      {/* Features */}
      <ul className="p-6 flex flex-col gap-3 flex-1">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-snug">
            <Check
              size={14}
              strokeWidth={2.5}
              className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-navy' : 'text-gold'}`}
            />
            <span className={tier.highlight ? 'text-navy/80' : 'text-white/65'}>
              {f}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="px-6 pb-6">
        <a
          href="#contacto"
          className={`block text-center text-xs tracking-[0.15em] py-3 rounded-sm transition-all duration-200 ${
            tier.highlight
              ? 'bg-navy text-gold hover:bg-navy-light'
              : 'border border-gold/40 text-gold hover:bg-gold/10'
          }`}
        >
          SOLICITAR
        </a>
      </div>
    </div>
  );
}

export default function Services() {
  return (
    <section id="servicios" className="section-navy py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[260px] h-[260px] sm:w-[400px] sm:h-[400px] top-0 right-0 opacity-10" />
      <div className="orb orb-navy w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bottom-0 left-0 opacity-20" style={{ animationDelay: '4s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-14 sm:mb-20 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Qué ofrecemos</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white leading-tight">
            Servicios de <em className="not-italic text-gold">excelencia</em>
          </h2>
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <svg width="8" height="8" viewBox="0 0 8 8">
              <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
            </svg>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </div>

        {/* Service blocks */}
        <div className="space-y-16 sm:space-y-20">
          {services.map((service) => (
            <div key={service.title} className="reveal">
              {/* Service title */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-light text-white">{service.title}</h3>
                  <p className="text-sm text-gold/70 tracking-wide mt-0.5">{service.subtitle}</p>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-gold/30 to-transparent ml-4 hidden md:block" />
              </div>

              {/* Tier cards */}
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 stagger">
                {service.tiers.map((tier) => (
                  <TierCard key={tier.name} tier={tier} />
                ))}
              </div>

              {/* Addon service */}
              {service.addon && <AddonCard addon={service.addon} />}

              {/* Independent service */}
              {service.independent && <IndependentServiceRow service={service.independent} />}
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="mt-20 sm:mt-24 reveal">
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">Nuestra diferencia</p>
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-light text-white">
              ¿Qué significa{' '}
              <em className="not-italic text-gold">"De la corrección al aprendizaje"</em>?
            </h3>
          </div>

          <div className="rounded-sm overflow-hidden border border-white/10">
            {/* Table header */}
            <div className="grid grid-cols-1 sm:grid-cols-2">
              <div className="px-6 py-4 bg-white/5 border-b sm:border-r border-white/10">
                <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Servicio tradicional</p>
              </div>
              <div className="px-6 py-4 bg-gold/10 border-b border-white/10">
                <p className="text-xs tracking-[0.2em] text-gold uppercase">TEXTUM (con mentoría)</p>
              </div>
            </div>

            {/* Rows */}
            {comparison.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-1 sm:grid-cols-2 ${i < comparison.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                <div className="px-6 py-5 sm:border-r border-b sm:border-b-0 border-white/8 flex items-start gap-3">
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

        {/* CTA */}
        <div className="text-center mt-14 sm:mt-16 reveal">
          <p className="text-white/50 text-sm mb-6">¿Tienes dudas sobre qué nivel es el ideal para ti? Escríbenos.</p>
          <a href="#contacto" className="btn-primary inline-block px-10 py-4 text-xs tracking-[0.15em] rounded-sm">
            <span>SOLICITAR INFORMACIÓN</span>
          </a>
        </div>
      </div>
    </section>
  );
}
