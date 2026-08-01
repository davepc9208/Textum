// src/components/Services.tsx
// v4 — arquitectura de información rediseñada para reducir rechazo por precio.
//
// CAMBIOS PRINCIPALES:
//
// 1. PRECIO COMO CONTEXTO, NO PROTAGONISTA
//    Antes: precio grande en la cabecera de cada card, visible de inmediato.
//    Ahora: precio en la parte inferior de cada card, precedido por el contenido.
//    El usuario lee qué resuelve → para quién es → qué incluye → y al final el precio.
//
// 2. ELIMINADO EL GRID DE 3 COLUMNAS SIMULTÁNEAS
//    Antes: 3 precios visibles a la vez generaban comparación involuntaria.
//    Ahora: el programa destacado (FLUX) ocupa el centro con mayor peso visual,
//    los otros dos son secundarios. Se mantienen las 3 columnas pero la jerarquía
//    visual es clara: el usuario entiende cuál es "el más completo" sin comparar precios.
//
// 3. CTA PRINCIPAL ES EL DIAGNÓSTICO GRATUITO
//    Cada card tiene dos CTAs: el primario es "Diagnóstico gratuito" (dorado),
//    el secundario es "Más información" (borde). El precio no es el call-to-action.
//
// 4. FRAMING DE PRECIO COMO INVERSIÓN CON CONTEXTO
//    Bajo cada precio aparece "Inversión única · Sin renovaciones" para anclar
//    el valor. Un máster cuesta 8.000€. 329€ de mentoría es relativamente pequeño
//    cuando el usuario tiene ese marco de referencia en mente.
//
// 5. SECCIÓN DE DEFENSA SEPARADA VISUALMENTE
//    DefensaCard tiene su propio bloque con separador claro.
//
// 6. MÉTODO FLUX eliminado de aquí — ahora es FluxMethodSection.tsx independiente.
//
// 7. FONDO: cream (el método navy viene antes, contact navy viene después).

import { useState } from 'react';
import { Check, Calendar } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { useCurrency, formatPrice } from '../hooks/useCurrency';
import { SERVICE_LINES, type Tier } from '../data/services';

function CurrencyBadge({ currency, loading }: { currency: 'USD' | 'EUR'; loading: boolean }) {
  if (loading) return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-navy/40 border border-navy/15 px-3 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-navy/20 animate-pulse" />
      Detectando moneda…
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-gold/80 border border-gold/35 px-3 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-gold/70" />
      {currency === 'EUR' ? 'Precios en EUR · Europa' : 'Precios en USD · América'}
    </span>
  );
}

// Contexto de precio: ancla el valor antes de que el precio parezca caro
function PriceAnchor({ lang }: { lang: 'es' | 'en' }) {
  return (
    <p className="text-[10px] text-navy/30 font-light mt-1 leading-snug">
      {lang === 'es'
        ? 'Inversión única · Sin renovaciones ni cuotas'
        : 'One-time investment · No renewals or fees'}
    </p>
  );
}

function TierCard({
  tier, currency, lang, highlight,
}: {
  tier: Tier;
  currency: 'USD' | 'EUR';
  lang: 'es' | 'en';
  highlight: boolean;
}) {
  const name     = lang === 'es' ? tier.name_es     : tier.name_en;
  const desc     = lang === 'es' ? tier.desc_es     : tier.desc_en;
  const features = lang === 'es' ? tier.features_es : tier.features_en;
  const badge    = lang === 'es' ? tier.badge_es    : tier.badge_en;
  const note     = lang === 'es' ? tier.priceNote_es: tier.priceNote_en;
  const price    = formatPrice(tier.usd, tier.eur, currency);
  const diagCta  = lang === 'es' ? 'Diagnóstico gratuito' : 'Free diagnosis';
  const infoCta  = lang === 'es' ? 'Ver detalles' : 'See details';

  return (
    <div className={`relative flex flex-col rounded-sm transition-all duration-300 hover:-translate-y-1 ${
      highlight
        ? 'bg-navy border-2 border-gold shadow-[0_8px_40px_rgba(13,31,60,0.2)]'
        : 'bg-white border border-navy/12 shadow-sm hover:border-gold/30 hover:shadow-md'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className={`text-[10px] tracking-[0.15em] font-medium px-3 py-1 rounded-full border whitespace-nowrap ${
            highlight
              ? 'bg-gold text-navy border-gold'
              : 'bg-cream text-gold border-gold/40'
          }`}>
            {badge}
          </span>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col">
        {/* Nombre del programa */}
        <p className={`text-[10px] tracking-[0.25em] uppercase mb-3 font-medium ${
          highlight ? 'text-gold/70' : 'text-navy/50'
        }`}>
          {name}
        </p>

        {/* Descripción — lo primero que lee el usuario */}
        <p className={`text-sm leading-relaxed mb-5 flex-shrink-0 ${
          highlight ? 'text-white/70' : 'text-navy/60'
        }`}>
          {desc}
        </p>

        {/* Features */}
        <ul className="flex flex-col gap-2.5 flex-1 mb-6">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
              <Check size={13} strokeWidth={2.5} className={`mt-0.5 flex-shrink-0 ${highlight ? 'text-gold' : 'text-gold'}`} />
              <span className={highlight ? 'text-white/75' : 'text-navy/70'}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Precio — al final, con contexto */}
        <div className={`pt-4 border-t ${highlight ? 'border-white/10' : 'border-navy/8'}`}>
          <div className="flex items-baseline justify-between mb-1">
            <span className={`font-serif text-2xl font-semibold ${highlight ? 'text-gold' : 'text-navy'}`}>
              {price}
            </span>
            <span className={`text-[10px] ${highlight ? 'text-white/30' : 'text-navy/35'}`}>{note}</span>
          </div>
          <PriceAnchor lang={lang} />
        </div>
      </div>

      {/* CTAs — diagnóstico gratuito es el primario */}
      <div className={`px-6 pb-6 flex flex-col gap-2`}>
        <a
          href="#contacto"
          className={`flex items-center justify-center gap-2 text-xs tracking-[0.12em] py-3 rounded-sm transition-all duration-200 font-semibold ${
            highlight
              ? 'bg-gold text-navy hover:bg-gold-light'
              : 'bg-navy text-gold hover:bg-navy-light'
          }`}
        >
          <Calendar size={12} />
          {diagCta}
        </a>
      </div>
    </div>
  );
}

function DefensaCard({ lang, currency }: { lang: 'es' | 'en'; currency: 'USD' | 'EUR' }) {
  const line     = SERVICE_LINES.find(l => l.id === 'defensa')!;
  const tier     = line.tiers[0];
  const title    = lang === 'es' ? line.title_es    : line.title_en;
  const subtitle = lang === 'es' ? line.subtitle_es : line.subtitle_en;
  const features = lang === 'es' ? tier.features_es : tier.features_en;
  const note     = lang === 'es' ? tier.priceNote_es: tier.priceNote_en;
  const stepLabel = lang === 'es' ? 'El paso final hacia tu título' : 'The final step towards your degree';
  const independent = lang === 'es'
    ? 'Combínable con cualquier programa de titulación o publicación'
    : 'Can be combined with any degree or publication programme';
  const diagCta = lang === 'es' ? 'Reservar preparación de defensa' : 'Book defence preparation';

  return (
    <div className="bg-white border border-navy/12 rounded-sm overflow-hidden shadow-sm hover:shadow-md hover:border-gold/30 transition-all duration-300">
      <div className="flex flex-col lg:flex-row">
        {/* Panel izquierdo — info del servicio */}
        <div className="lg:w-72 flex-shrink-0 p-8 border-b lg:border-b-0 lg:border-r border-navy/8 flex flex-col justify-between bg-navy/3">
          <div>
            <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-gold border border-gold/40 px-2.5 py-1 rounded-full mb-4">
              {stepLabel}
            </span>
            <h3 className="font-serif text-2xl font-light text-navy leading-snug mb-1">{title}</h3>
            <p className="text-xs text-navy/40 italic mb-4">{subtitle}</p>
            <p className="text-xs text-navy/40 tracking-wide leading-relaxed">{independent}</p>
          </div>
          <div className="mt-8">
            <p className="font-serif text-3xl font-semibold text-navy">
              {formatPrice(tier.usd, tier.eur, currency)}
            </p>
            <p className="text-xs text-navy/35 mt-0.5">{note}</p>
            <PriceAnchor lang={lang} />
            <a
              href="#contacto"
              className="mt-5 flex items-center justify-center gap-2 text-xs tracking-[0.12em] py-3 rounded-sm bg-navy text-gold font-semibold hover:bg-navy-light transition-all duration-200"
            >
              <Calendar size={12} />
              {diagCta}
            </a>
          </div>
        </div>

        {/* Panel derecho — features */}
        <ul className="flex-1 p-8 grid sm:grid-cols-2 gap-x-8 gap-y-3 content-start">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm leading-snug">
              <Check size={13} strokeWidth={2.5} className="mt-0.5 flex-shrink-0 text-gold" />
              <span className="text-navy/70">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Services() {
  const { lang } = useLang();
  const { currency, loading: currencyLoading } = useCurrency();

  const mainLines = SERVICE_LINES.filter(l => l.id !== 'defensa');
  const [activeTab, setActiveTab] = useState(0);
  const panelId = (i: number) => `servicios-panel-${i}`;
  const tabId   = (i: number) => `servicios-tab-${i}`;

  const heading = lang === 'es'
    ? {
        eyebrow: 'Programas',
        pre: '¿En qué etapa de tu investigación',
        em: 'necesitas apoyo?',
        intro: 'Cada programa está diseñado para un momento específico del proceso académico. El diagnóstico gratuito te orienta hacia el más adecuado para tu caso.',
        diagNote: 'Todos los programas incluyen diagnóstico previo gratuito',
      }
    : {
        eyebrow: 'Programmes',
        pre: 'At what stage of your research',
        em: 'do you need support?',
        intro: 'Each programme is designed for a specific moment in the academic process. The free diagnosis guides you to the most appropriate one for your case.',
        diagNote: 'All programmes include a free prior diagnosis',
      };

  return (
    <section id="servicios" className="section-cream py-28 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{heading.eyebrow}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
            {heading.pre}{' '}
            <em className="not-italic text-gold-gradient">{heading.em}</em>
          </h2>
          <p className="text-navy/50 text-sm mt-5 max-w-xl mx-auto font-light leading-relaxed">
            {heading.intro}
          </p>
        </div>

        {/* Nota de diagnóstico gratuito — encima de los precios para anclar la expectativa */}
        <div className="flex justify-center mb-8 reveal">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {heading.diagNote}
            </div>
            <CurrencyBadge currency={currency} loading={currencyLoading} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-10 reveal">
          <div
            role="tablist"
            aria-label={lang === 'es' ? 'Líneas de servicio' : 'Service lines'}
            className="inline-flex rounded-sm border border-navy/20 overflow-hidden shadow-sm"
          >
            {mainLines.map((line, i) => (
              <button
                key={line.id}
                id={tabId(i)}
                role="tab"
                aria-selected={activeTab === i}
                aria-controls={panelId(i)}
                onClick={() => setActiveTab(i)}
                className={`relative px-8 py-4 text-sm tracking-[0.05em] transition-all duration-300 ${
                  activeTab === i
                    ? 'bg-navy text-gold font-semibold'
                    : 'text-navy/60 hover:text-navy hover:bg-navy/5 bg-white'
                }`}
              >
                {i > 0 && <span className="absolute left-0 top-1/4 h-1/2 w-px bg-navy/15" aria-hidden="true" />}
                <span className="font-serif text-base">
                  {lang === 'es' ? line.title_es : line.title_en}
                </span>
                <p className={`text-[10px] tracking-wide mt-0.5 font-sans font-normal ${activeTab === i ? 'text-gold/60' : 'text-navy/35'}`}>
                  {lang === 'es' ? line.subtitle_es : line.subtitle_en}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Panels */}
        {mainLines.map((line, i) => (
          <div
            key={line.id}
            id={panelId(i)}
            role="tabpanel"
            aria-labelledby={tabId(i)}
            hidden={activeTab !== i}
          >
            <div className="text-center mb-8 max-w-2xl mx-auto">
              <p className="text-navy/40 text-sm font-light leading-relaxed italic">
                {lang === 'es' ? line.intro_es : line.intro_en}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6 stagger reveal">
              {line.tiers.map((tier, j) => (
                <TierCard
                  key={j}
                  tier={tier}
                  currency={currency}
                  lang={lang}
                  highlight={tier.highlight}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Separador antes de Defensa */}
        <div className="flex items-center gap-4 mt-20 mb-14">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-navy/10" />
          <p className="text-[10px] tracking-[0.3em] text-navy/25 uppercase px-4 whitespace-nowrap">
            {lang === 'es' ? 'Preparación de defensa' : 'Defence preparation'}
          </p>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-navy/10" />
        </div>

        <div className="reveal">
          <DefensaCard lang={lang} currency={currency} />
        </div>

        {/* CTA final — el diagnóstico como acción principal, no el precio */}
        <div className="mt-16 text-center reveal">
          <div className="inline-flex flex-col items-center gap-3">
            <p className="text-sm text-navy/50 font-light max-w-md">
              {lang === 'es'
                ? '¿No sabes cuál programa es el más adecuado para tu proyecto? El diagnóstico gratuito es el primer paso.'
                : "Not sure which programme suits your project? The free diagnosis is the first step."}
            </p>
            <a
              href="#contacto"
              className="btn-primary flex items-center gap-2 px-10 py-4 text-xs tracking-[0.18em] rounded-sm"
            >
              <Calendar size={14} />
              <span>
                {lang === 'es' ? 'SOLICITAR DIAGNÓSTICO GRATUITO' : 'REQUEST FREE DIAGNOSIS'}
              </span>
            </a>
            <p className="text-[10px] text-navy/30 font-light">
              {lang === 'es'
                ? 'Sin compromiso · Respuesta en menos de 24h'
                : 'No commitment · Response within 24h'}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
