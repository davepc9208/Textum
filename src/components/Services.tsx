// src/components/Services.tsx
// Reescrito para consumir el nuevo services.ts
// Estructura: Intro → Tabs → Tiers → Defensa → FluxMethod

import { useState } from 'react';
import { Check } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { useCurrency, formatPrice } from '../hooks/useCurrency';
import {
  SERVICE_LINES,
  FLUX_METHOD,
  type Tier,
  type ServiceLine,
} from '../data/services';

// ─── Currency badge ───────────────────────────────────────────────────────────
function CurrencyBadge({ currency, loading }: { currency: 'USD' | 'EUR'; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-white/30 border border-white/10 px-3 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse" />
        {' '}Detectando moneda…
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-gold/70 border border-gold/25 px-3 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
      {currency === 'EUR' ? 'Precios en EUR · Europa' : 'Precios en USD · América'}
    </span>
  );
}

// ─── Tier card ────────────────────────────────────────────────────────────────
function TierCard({
  tier, currency, lang, solicitar, solicitarDiag,
}: {
  tier: Tier;
  currency: 'USD' | 'EUR';
  lang: 'es' | 'en';
  solicitar: string;
  solicitarDiag: string;
}) {
  const name     = lang === 'es' ? tier.name_es     : tier.name_en;
  const desc     = lang === 'es' ? tier.desc_es     : tier.desc_en;
  const features = lang === 'es' ? tier.features_es : tier.features_en;
  const badge    = lang === 'es' ? tier.badge_es    : tier.badge_en;
  const note     = lang === 'es' ? tier.priceNote_es: tier.priceNote_en;
  const cta      = lang === 'es' ? tier.cta_es      : tier.cta_en;
  const price    = formatPrice(tier.usd, tier.eur, currency);

  // CTA distinto si es "diagnóstico" vs "postular"
  const isDiag = cta.toLowerCase().includes('diagnós') || cta.toLowerCase().includes('diagnosis');

  return (
    <div className={`relative flex flex-col rounded-sm transition-transform duration-300 hover:-translate-y-1 ${
      tier.highlight
        ? 'bg-gold shadow-[0_8px_40px_rgba(201,168,76,0.35)] border border-gold-light'
        : 'glass-navy border border-white/10 hover:border-gold/30'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-navy text-gold text-[10px] tracking-[0.15em] font-medium px-3 py-1 rounded-full border border-gold/40 whitespace-nowrap">
            {badge}
          </span>
        </div>
      )}

      {/* Precio */}
      <div className={`p-6 border-b ${tier.highlight ? 'border-navy/20' : 'border-white/8'}`}>
        <p className={`text-xs tracking-[0.25em] uppercase mb-2 ${tier.highlight ? 'text-navy/70' : 'text-gold/70'}`}>
          {name}
        </p>
        <p className={`font-serif text-2xl font-semibold leading-tight ${tier.highlight ? 'text-navy' : 'text-white'}`}>
          {price}
        </p>
        <p className={`text-xs mt-1 ${tier.highlight ? 'text-navy/60' : 'text-white/40'}`}>{note}</p>
      </div>

      {/* Descripción */}
      <div className="px-6 pt-5 pb-2">
        <p className={`text-xs leading-relaxed italic ${tier.highlight ? 'text-navy/65' : 'text-white/45'}`}>
          {desc}
        </p>
      </div>

      {/* Features */}
      <ul className="px-6 pb-4 flex flex-col gap-3 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3 text-sm leading-snug">
            <Check size={14} strokeWidth={2.5} className={`mt-0.5 flex-shrink-0 ${tier.highlight ? 'text-navy' : 'text-gold'}`} />
            <span className={tier.highlight ? 'text-navy/80' : 'text-white/65'}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="px-6 pb-6">
        <a
          href="#contacto"
          className={`block text-center text-xs tracking-[0.15em] py-3 rounded-sm transition-all duration-200 ${
            tier.highlight
              ? isDiag
                ? 'bg-white text-navy hover:bg-cream'
                : 'bg-navy text-gold hover:bg-navy-light'
              : isDiag
                ? 'bg-gold/15 border border-gold/50 text-gold hover:bg-gold/25'
                : 'border border-gold/40 text-gold hover:bg-gold/10'
          }`}
        >
          {cta}
        </a>
      </div>
    </div>
  );
}

// ─── Defensa card (sección independiente) ────────────────────────────────────
function DefensaCard({ lang, currency }: { lang: 'es' | 'en'; currency: 'USD' | 'EUR' }) {
  const line = SERVICE_LINES.find(l => l.id === 'defensa')!;
  const tier = line.tiers[0];
  const title    = lang === 'es' ? line.title_es    : line.title_en;
  const subtitle = lang === 'es' ? line.subtitle_es : line.subtitle_en;
  const intro    = lang === 'es' ? line.intro_es    : line.intro_en;
  const desc     = lang === 'es' ? tier.desc_es     : tier.desc_en;
  const features = lang === 'es' ? tier.features_es : tier.features_en;
  const cta      = lang === 'es' ? tier.cta_es      : tier.cta_en;
  const note     = lang === 'es' ? tier.priceNote_es: tier.priceNote_en;
  const stepLabel = lang === 'es' ? 'EL PASO FINAL HACIA TU TÍTULO' : 'THE FINAL STEP TOWARDS YOUR DEGREE';
  const independent = lang === 'es'
    ? 'Servicio independiente — combínable con cualquier programa'
    : 'Independent service — can be combined with any programme';

  return (
    <div className="glass-navy border border-gold/30 rounded-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="lg:w-80 flex-shrink-0 p-8 border-b lg:border-b-0 lg:border-r border-white/10 flex flex-col justify-between bg-gold/5">
          <div>
            <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold border border-gold/50 px-2.5 py-1 rounded-full mb-4">
              {stepLabel}
            </span>
            <h3 className="font-serif text-2xl font-light text-white leading-snug mb-2">{title}</h3>
            <p className="text-xs text-white/40 italic mb-3">{subtitle}</p>
            <p className="text-xs text-white/55 leading-relaxed mb-4">{intro}</p>
            <p className="text-xs text-white/35 italic leading-relaxed">{desc}</p>
            <p className="text-[10px] text-gold/40 tracking-wide mt-3">{independent}</p>
          </div>
          <div className="mt-6">
            <p className="font-serif text-4xl font-semibold text-gold">
              {formatPrice(tier.usd, tier.eur, currency)}
            </p>
            <p className="text-xs text-white/35 mt-1">{note}</p>
            <a
              href="#contacto"
              className="mt-4 block text-center text-xs tracking-[0.15em] py-3 rounded-sm bg-gold text-navy font-semibold hover:bg-gold-light transition-all duration-200"
            >
              {cta}
            </a>
          </div>
        </div>
        <ul className="flex-1 p-8 grid sm:grid-cols-2 gap-x-8 gap-y-4 content-start">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-3 text-sm leading-snug">
              <Check size={14} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-gold" />
              <span className="text-white/70">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Flux Method ──────────────────────────────────────────────────────────────
function FluxMethod({ lang }: { lang: 'es' | 'en' }) {
  const m = FLUX_METHOD[lang];
  return (
    <div id="metodo" className="mt-24 reveal scroll-mt-24">
      <div className="text-center mb-10">
        <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">{m.eyebrow}</p>
        <h3 className="font-serif text-3xl md:text-4xl font-light text-white mb-4">
          {m.title}
        </h3>
        <p className="text-white/50 text-sm font-light max-w-2xl mx-auto leading-relaxed">
          {m.intro}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/8 rounded-sm overflow-hidden">
        {m.steps.map((step) => (
          <div
            key={step.n}
            className="bg-navy p-8 flex flex-col gap-4 group hover:bg-gold/5 transition-colors duration-300"
          >
            <span className="font-serif text-4xl font-light text-gold/30 group-hover:text-gold/60 transition-colors leading-none">
              {step.n}
            </span>
            <div className="w-8 h-px bg-gold/30 group-hover:w-12 transition-all duration-300" />
            <h4 className="font-serif text-lg text-white font-light">{step.title}</h4>
            <p className="text-xs text-white/45 leading-relaxed font-light">{step.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 px-6 py-5 glass-navy border border-white/8 rounded-sm max-w-3xl mx-auto">
        <p className="text-xs text-white/40 font-light italic text-center leading-relaxed">
          {m.closing}
        </p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Services() {
  const { lang } = useLang();
  const { currency, loading: currencyLoading } = useCurrency();
  const s = lang === 'es'
    ? { label: 'Qué ofrecemos', title1: '¿En qué etapa de tu investigación', title2: 'necesitas apoyo?', intro: 'Hemos organizado nuestra oferta en tres líneas internacionales para que encuentres el nivel de acompañamiento más adecuado según tu objetivo académico o científico.' }
    : { label: 'What we offer', title1: 'At what stage of your research', title2: 'do you need support?', intro: 'We have organised our offer into three international lines so you can find the most appropriate level of support according to your academic or scientific objective.' };

  const mainLines = SERVICE_LINES.filter(l => l.id !== 'defensa');
  const [activeTab, setActiveTab] = useState(0);
  const active = mainLines[activeTab];

  return (
    <section id="servicios" className="section-navy py-28 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[400px] h-[400px] top-0 right-0 opacity-10" />
      <div className="orb orb-navy w-[300px] h-[300px] bottom-0 left-0 opacity-20" style={{ animationDelay: '4s' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-6 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{s.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-white leading-tight">
            {s.title1} <em className="not-italic text-gold">{s.title2}</em>
          </h2>
          <p className="text-white/45 text-sm mt-6 max-w-2xl mx-auto font-light leading-relaxed">
            {s.intro}
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <svg width="8" height="8" viewBox="0 0 8 8">
              <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="#c9a84c" />
            </svg>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>
        </div>

        {/* Currency badge */}
        <div className="flex justify-center mb-10 reveal">
          <CurrencyBadge currency={currency} loading={currencyLoading} />
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12 reveal">
          <div className="inline-flex rounded-sm border border-white/10 overflow-hidden">
            {mainLines.map((line, i) => (
              <button
                key={line.id}
                onClick={() => setActiveTab(i)}
                className={`relative px-8 py-4 text-sm tracking-[0.05em] transition-all duration-300 ${
                  activeTab === i
                    ? 'bg-gold text-navy font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {i > 0 && <span className="absolute left-0 top-1/4 h-1/2 w-px bg-white/10" />}
                <span className="font-serif text-base">
                  {lang === 'es' ? line.title_es : line.title_en}
                </span>
                <p className={`text-[10px] tracking-wide mt-0.5 font-sans font-normal ${activeTab === i ? 'text-navy/60' : 'text-white/35'}`}>
                  {lang === 'es' ? line.subtitle_es : line.subtitle_en}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Intro de línea activa */}
        <div className="text-center mb-8 reveal max-w-2xl mx-auto">
          <p className="text-white/45 text-sm font-light leading-relaxed italic">
            {lang === 'es' ? active.intro_es : active.intro_en}
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid md:grid-cols-3 gap-6 stagger reveal">
          {active.tiers.map((tier, i) => (
            <TierCard
              key={i}
              tier={tier}
              currency={currency}
              lang={lang}
              solicitar={lang === 'es' ? 'Postular al programa' : 'Apply to the programme'}
              solicitarDiag={lang === 'es' ? 'Agendar diagnóstico académico' : 'Book an academic diagnosis'}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mt-20 mb-14">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
          <svg width="8" height="8" viewBox="0 0 8 8">
            <rect x="4" y="0" width="6" height="6" transform="rotate(45 4 4)" fill="rgba(201,168,76,0.4)" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Defensa — sección independiente */}
        <div className="reveal">
          <DefensaCard lang={lang} currency={currency} />
        </div>

        {/* Método FLUX */}
        <FluxMethod lang={lang} />

      </div>
    </section>
  );
}
