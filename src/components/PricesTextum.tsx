// src/components/PricesTextum.tsx
// Tabla de precios resumen con toggle USD/EUR y nota legal
// Ubicación en App.tsx: entre Services y WhyTextum

import { useLang } from '../i18n/LangContext';
import { useCurrency } from '../hooks/useCurrency';
import { PRICE_TABLE, PRICE_LEGAL } from '../data/services';
import { diagnosisHref, trackConversion } from '../lib/conversion';

export default function PricesTextum() {
  const { lang } = useLang();
  const { currency, loading } = useCurrency();

  const heading = {
    es: { eyebrow: 'Inversión', title1: 'Tabla de', title2: 'precios de referencia' },
    en: { eyebrow: 'Investment', title1: 'Reference', title2: 'price table' },
  }[lang];

  // Agrupar por línea
  const groups = PRICE_TABLE.reduce<Record<string, typeof PRICE_TABLE>>((acc, row) => {
    const key = lang === 'es' ? row.line_es : row.line_en;
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});

  return (
    <section id="precios" className="section-navy py-24 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[400px] h-[400px] bottom-0 right-0 opacity-8" style={{ animationDelay: '2s' }} />

      <div className="max-w-4xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-10 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">{heading.eyebrow}</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light text-white leading-tight">
            {heading.title1} <em className="not-italic text-gold">{heading.title2}</em>
          </h2>
        </div>

        {/* Currency indicator */}
        <div className="flex justify-center mb-8 reveal">
          {loading ? (
            <span className="text-[10px] tracking-[0.2em] text-white/30 border border-white/10 px-3 py-1 rounded-full">
              Detectando moneda…
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] text-gold/70 border border-gold/25 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60" />
              {currency === 'EUR' ? 'Mostrando precios en EUR' : 'Showing prices in USD'}
            </span>
          )}
        </div>

        {/* Tabla por grupos */}
        <div className="space-y-6 reveal">
          {Object.entries(groups).map(([groupName, rows]) => (
            <div key={groupName} className="rounded-sm overflow-hidden border border-white/10">
              {/* Cabecera de grupo */}
              <div className="bg-gold/10 border-b border-white/10 px-6 py-3">
                <p className="text-xs tracking-[0.2em] text-gold uppercase font-medium">{groupName}</p>
              </div>
              {/* Filas */}
              {rows.map((row, i) => {
                const program = lang === 'es' ? row.program_es : row.program_en;
                const price   = currency === 'EUR' ? `${row.eur} €` : `${row.usd} USD`;
                const isLast  = i === rows.length - 1;
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between px-6 py-4 bg-white/3 hover:bg-white/6 transition-colors duration-150 ${!isLast ? 'border-b border-white/8' : ''}`}
                  >
                    <p className="text-sm text-white/75 font-light">{program}</p>
                    <p className="font-serif text-lg text-gold font-semibold flex-shrink-0 ml-4">
                      {price}
                    </p>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Nota legal */}
        <p className="text-white/25 text-[11px] text-center mt-6 leading-relaxed font-light reveal">
          * {PRICE_LEGAL[lang]}
        </p>

        {/* CTA */}
        <div className="text-center mt-10 reveal">
          <a
            href={diagnosisHref()}
            onClick={() => trackConversion('diagnosis_cta_click', { placement: 'prices' })}
            className="btn-primary inline-block px-10 py-4 text-xs tracking-[0.18em] rounded-sm"
          >
            <span>
              {lang === 'es' ? 'AGENDAR DIAGNÓSTICO ACADÉMICO' : 'BOOK AN ACADEMIC DIAGNOSIS'}
            </span>
          </a>
        </div>

      </div>
    </section>
  );
}
