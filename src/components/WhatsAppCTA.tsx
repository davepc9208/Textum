// src/components/WhatsAppCTA.tsx
// Bloque CTA de WhatsApp para el final de artículos del blog y piezas de Colecciones.
// Se coloca justo antes del ShareCard / botón de volver.

import { useLang } from '../i18n/LangContext';

const WA_URL = "https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM.";

const I18N = {
  es: {
    heading: '¿Tienes dudas sobre tu investigación?',
    body:    'Nuestras doctoras pueden orientarte. Escríbenos directamente por WhatsApp y te responderemos en menos de 24 horas.',
    cta:     'Escribir por WhatsApp',
  },
  en: {
    heading: 'Do you have questions about your research?',
    body:    'Our doctors can guide you. Write to us directly on WhatsApp and we will get back to you within 24 hours.',
    cta:     'Write on WhatsApp',
  },
};

export default function WhatsAppCTA() {
  const { lang } = useLang();
  const s = I18N[lang];

  return (
    <div className="mt-16 rounded-sm border border-[#25D366]/20 bg-[#25D366]/5 px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
      {/* Icono */}
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#25D366]/15 border border-[#25D366]/30 flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="font-serif text-lg text-navy font-light mb-1">{s.heading}</p>
        <p className="text-sm text-navy/55 font-light leading-relaxed">{s.body}</p>
      </div>

      {/* Botón */}
      <a
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-shrink-0 inline-flex items-center gap-2.5 px-6 py-3 rounded-sm text-xs tracking-[0.15em] font-semibold text-white transition-all duration-200 touch-manipulation"
        style={{ backgroundColor: '#25D366' }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1da851')}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
        </svg>
        {s.cta}
      </a>
    </div>
  );
}
