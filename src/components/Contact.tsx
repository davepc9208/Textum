// src/components/Contact.tsx
// v2 — fondo cream para contrastar con Testimonios (navy) que viene antes.
// Adaptaciones de color: todos los elementos oscuros sobre fondo claro.

import { useState, useEffect, useCallback } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import TurnstileWidget from './TurnstileWidget';
import { turnstileConfigured } from '../lib/turnstile';
import { trackConversion } from '../lib/conversion';

function Toast({ type, message, onClose }: { type: 'success' | 'error'; message: string; onClose: () => void }) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-4 rounded-sm shadow-2xl border backdrop-blur-sm animate-[toastIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both] min-w-[300px] max-w-[90vw] ${
        type === 'success' ? 'bg-navy/95 border-gold/40 text-white' : 'bg-[#1a0a0a]/95 border-red-500/40 text-white'
      }`}
      role="status" aria-live="polite"
    >
      {type === 'success'
        ? <CheckCircle size={18} className="text-gold flex-shrink-0" />
        : <AlertCircle size={18} className="text-red-400 flex-shrink-0" />}
      <p className="text-sm font-light leading-snug flex-1">{message}</p>
      <button onClick={onClose} aria-label="Cerrar notificación" className="text-white/40 hover:text-white transition-colors flex-shrink-0 ml-1">
        <X size={15} />
      </button>
      <span
        className={`absolute bottom-0 left-0 h-[2px] rounded-b-sm ${type === 'success' ? 'bg-gold/60' : 'bg-red-500/60'} animate-[toastProgress_5s_linear_both]`}
        style={{ width: '100%' }} aria-hidden="true"
      />
    </div>
  );
}

export default function Contact() {
  const { t } = useLang();
  const c = t.contact;
  const f = c.form;

  const EMPTY_FORM = {
    name: '', email: '', country: '',
    academicLevel: '', projectType: '', manuscriptStage: '',
    service: '', message: '',
  };

  const [form, setForm]         = useState(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast]       = useState<{ type: 'error'; message: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const closeToast = () => setToast(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    if (!isValidEmail(form.email)) {
      setToast({ type: 'error', message: 'Por favor introduce un correo electrónico válido.' });
      return;
    }
    if (turnstileConfigured && !turnstileToken) {
      setToast({ type: 'error', message: 'Completa la verificación de seguridad.' });
      return;
    }
    setLoading(true);
    setToast(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error desconocido');
      setSubmitted(true);
      setForm(EMPTY_FORM);
      trackConversion('diagnosis_request_submitted', { source: 'contact-form' });
    } catch (err) {
      setToast({ type: 'error', message: err instanceof Error ? err.message : f.errorToast ?? 'Error al enviar.' });
    } finally {
      setLoading(false);
    }
  };

  // Clases adaptadas a fondo cream
  const inputCls = 'w-full bg-white border border-navy/15 rounded-sm px-4 py-3 text-navy text-sm placeholder-navy/30 focus:outline-none focus:border-gold/60 transition-all shadow-sm';
  const selectCls = 'w-full bg-white border border-navy/15 rounded-sm px-4 py-3 text-navy text-sm focus:outline-none focus:border-gold/60 transition-all appearance-none cursor-pointer shadow-sm';
  const labelCls = 'block text-navy/50 text-[10px] tracking-[0.2em] mb-2 uppercase';

  return (
    <section id="contacto" className="section-cream py-28 px-6 relative overflow-hidden">
      {/* Ornamentos sutiles sobre cream */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d1f3c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
            {c.title1} <em className="not-italic text-gold-gradient">{c.title2}</em>
          </h2>
          <p className="text-navy/50 text-sm mt-4 max-w-md mx-auto font-light">{c.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 reveal-left space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-navy mb-6">{c.directTitle}</h3>
              <div className="space-y-0">
                <a href="mailto:contacto@mentoriatextum.com"
                  className="flex items-center gap-4 group py-2.5">
                  <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 transition-all">
                    <Mail size={18} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-navy/40 text-xs tracking-widest uppercase">{c.emailLabel}</p>
                    <p className="text-navy/70 text-sm group-hover:text-gold transition-colors">contacto@mentoriatextum.com</p>
                  </div>
                </a>

                <a href="https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM."
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 group py-2.5">
                  <div className="w-10 h-10 rounded-sm bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/20 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-navy/40 text-xs tracking-widest uppercase">WhatsApp</p>
                    <p className="text-navy/70 text-sm group-hover:text-[#25D366] transition-colors">+34 614 63 84 06</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="relative rounded-sm overflow-hidden aspect-[4/3]">
              <img
                src="https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Escritorio académico" loading="lazy" decoding="async"
                className="w-full h-full object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-serif italic text-white/90 text-base">{c.imgQuote}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-3 reveal-right">
            {/* Card del formulario — blanco sobre cream para diferenciarlo */}
            <div className="bg-white border border-navy/10 rounded-sm p-8 md:p-10 shadow-lg relative overflow-hidden">

              {/* Overlay de éxito */}
              {submitted && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm animate-[fadeIn_0.6s_ease]">
                  <div className="text-center max-w-md mx-6">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                      <CheckCircle size={48} className="text-gold" />
                    </div>
                    <h3 className="font-serif text-2xl text-navy mb-2">✓ Hemos recibido correctamente tu solicitud.</h3>
                    <p className="text-navy/55 text-sm leading-relaxed mt-4">
                      Uno de nuestros asesores contactará contigo en menos de 24 horas.
                    </p>
                    <p className="text-navy/30 text-xs mt-6 font-light border-t border-navy/10 pt-6">
                      Mientras tanto puedes seguir explorando nuestros programas.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setForm(EMPTY_FORM); }}
                      className="mt-6 text-navy/40 hover:text-navy text-xs tracking-[0.15em] transition-colors border border-navy/15 hover:border-navy/30 px-5 py-2 rounded-sm"
                    >
                      ENVIAR OTRA SOLICITUD
                    </button>
                  </div>
                </div>
              )}

              <div className={`transition-all duration-700 ${submitted ? 'opacity-20 scale-[0.98] blur-[1px] pointer-events-none' : ''}`}>
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Honeypot */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                    <input type="text" name="b_field" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="new-password" tabIndex={-1} />
                  </div>

                  <div className="pb-2 border-b border-navy/8">
                    <h3 className="font-serif text-xl text-navy mb-1">{f.formTitle}</h3>
                    <p className="text-navy/45 text-xs font-light leading-relaxed">{f.formIntro}</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className={labelCls}>{f.nameLabel}</label>
                      <input id="contact-name" type="text" name="name" value={form.name} onChange={handleChange} required placeholder={f.namePlaceholder} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className={labelCls}>{f.emailLabel}</label>
                      <input id="contact-email" type="email" name="email" value={form.email} onChange={handleChange} required placeholder={f.emailPlaceholder} className={inputCls} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-country" className={labelCls}>{f.countryLabel}</label>
                      <input id="contact-country" type="text" name="country" value={form.country} onChange={handleChange} placeholder={f.countryPlaceholder} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="academicLevel-select" className={labelCls}>{f.academicLevelLabel}</label>
                      <select id="academicLevel-select" name="academicLevel" value={form.academicLevel} onChange={handleChange} className={selectCls}>
                        <option value="">{f.academicLevelPlaceholder}</option>
                        {f.academicLevelOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="projectType-select" className={labelCls}>{f.projectTypeLabel}</label>
                      <select id="projectType-select" name="projectType" value={form.projectType} onChange={handleChange} className={selectCls}>
                        <option value="">{f.projectTypePlaceholder}</option>
                        {f.projectTypeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="manuscriptStage-select" className={labelCls}>{f.manuscriptStageLabel}</label>
                      <select id="manuscriptStage-select" name="manuscriptStage" value={form.manuscriptStage} onChange={handleChange} className={selectCls}>
                        <option value="">{f.manuscriptStagePlaceholder}</option>
                        {f.manuscriptStageOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service-select" className={labelCls}>{f.serviceLabel}</label>
                    <select id="service-select" name="service" value={form.service} onChange={handleChange} className={selectCls}>
                      <option value="">{f.servicePlaceholder}</option>
                      {f.serviceOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className={labelCls}>{f.messageLabel}</label>
                    <textarea id="contact-message" name="message" value={form.message} onChange={handleChange} required rows={4}
                      placeholder={f.messagePlaceholder}
                      className="w-full bg-white border border-navy/15 rounded-sm px-4 py-3 text-navy text-sm placeholder-navy/30 focus:outline-none focus:border-gold/60 transition-all resize-none shadow-sm" />
                  </div>

                  <TurnstileWidget onToken={onTurnstileToken} />

                  <p className="text-navy/30 text-[10px] leading-relaxed font-light">{f.legalNote}</p>

                  <button type="submit" disabled={loading || submitted}
                    className={`w-full py-4 text-xs tracking-[0.18em] rounded-sm flex items-center justify-center gap-3 transition-all duration-500 ${
                      submitted ? 'bg-gold/10 border border-gold/30 text-gold cursor-default'
                      : 'btn-primary hover:scale-[1.01]'
                    } ${loading ? 'opacity-70' : ''}`}>
                    {submitted ? (
                      <span className="flex items-center gap-3"><CheckCircle size={16} className="text-gold" />✓ Solicitud enviada</span>
                    ) : loading ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{f.sending}</span>
                      </span>
                    ) : (
                      <><Send size={14} className="relative z-10" /><span>{f.send}</span></>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast type={toast.type} message={toast.message} onClose={closeToast} />}

      <style>{`
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(20px);}to{opacity:1;transform:translateX(-50%) translateY(0);} }
        @keyframes toastProgress { from{width:100%;}to{width:0%;} }
        @keyframes fadeIn { from{opacity:0;}to{opacity:1;} }
        @keyframes scaleIn { from{opacity:0;transform:scale(0.5);}to{opacity:1;transform:scale(1);} }
      `}</style>
    </section>
  );
}
