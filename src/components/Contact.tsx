// src/components/Contact.tsx
// Fix 1: honeypot name="website" → name="b_field" + autoComplete="new-password"
//         evita que gestores de contraseñas (Chrome, 1Password, Bitwarden)
//         rellenen el campo y silencien el formulario sin feedback.
// Fix 2: Experiencia premium al enviar:
//         - Botón cambia a "✓ Solicitud enviada" y se deshabilita
//         - Tarjeta de confirmación con animación
//         - Formulario se desvanece ligeramente
//         - Sensación similar a Stripe, Apple o Notion
// Fix 3: Fondo creamy para contrastar con Testimonios (navy)

import { useState, useEffect } from 'react';
import { Mail, Globe, Send, CheckCircle, AlertCircle, X } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

// ─── Toast (solo para errores) ──────────────────────────────────────────────
function Toast({
  type,
  message,
  onClose,
}: {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onClose, 5000);
    return () => clearTimeout(id);
  }, [onClose]);

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]
        flex items-center gap-3
        px-5 py-4 rounded-sm shadow-2xl
        border backdrop-blur-sm
        animate-[toastIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both]
        min-w-[300px] max-w-[90vw]
        ${type === 'success'
          ? 'bg-navy/95 border-gold/40 text-white'
          : 'bg-[#1a0a0a]/95 border-red-500/40 text-white'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {type === 'success' ? (
        <CheckCircle size={18} className="text-gold flex-shrink-0" />
      ) : (
        <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
      )}

      <p className="text-sm font-light leading-snug flex-1">{message}</p>

      <button
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="text-white/40 hover:text-white transition-colors flex-shrink-0 ml-1"
      >
        <X size={15} />
      </button>

      {/* Barra de progreso */}
      <span
        className={`
          absolute bottom-0 left-0 h-[2px] rounded-b-sm
          ${type === 'success' ? 'bg-gold/60' : 'bg-red-500/60'}
          animate-[toastProgress_5s_linear_both]
        `}
        style={{ width: '100%' }}
        aria-hidden="true"
      />
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
export default function Contact() {
  const { t } = useLang();
  const c = t.contact;
  const f = c.form;

  const EMPTY_FORM = {
    name: '', email: '', country: '',
    academicLevel: '', projectType: '', manuscriptStage: '',
    service: '', message: '',
  };

  const [form, setForm]       = useState(EMPTY_FORM);
  const [honeypot, setHoneypot] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // ← Premium: estado de éxito
  const [toast, setToast]     = useState<{ type: 'error'; message: string } | null>(null); // Solo errores

  const closeToast = () => setToast(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  // FIX: validación de email en cliente antes de llamar a la API.
  // type="email" del navegador acepta formatos como "a@b" sin TLD — esta regex lo rechaza.
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot: si está relleno es un bot — silencio total
    if (honeypot) return;

    // FIX: validar email antes de cualquier petición de red
    if (!isValidEmail(form.email)) {
      setToast({
        type: 'error',
        message: 'Por favor introduce un correo electrónico válido.',
      });
      return;
    }

    setLoading(true);
    setToast(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error desconocido');

      // ✅ Éxito premium: estado submitted = true
      setSubmitted(true);
      setForm(EMPTY_FORM);

    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : f.errorToast ?? 'Error al enviar. Inténtalo de nuevo.',
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-navy/5 border border-navy/10 rounded-sm px-4 py-3 text-navy text-sm placeholder-navy/25 focus:outline-none focus:border-gold/50 transition-all';
  const selectCls =
    'w-full border border-navy/10 rounded-sm px-4 py-3 text-navy text-sm focus:outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer';
  const labelCls =
    'block text-navy/60 text-[10px] tracking-[0.2em] mb-2 uppercase';

  return (
    <section id="contacto" className="bg-cream py-28 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-10" />
      <div className="orb orb-gold w-[300px] h-[300px] bottom-0 right-0 opacity-8" style={{ animationDelay: '2s' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
            {c.title1} <em className="not-italic text-gold">{c.title2}</em>
          </h2>
          <p className="text-navy/50 text-sm mt-4 max-w-md mx-auto font-light">{c.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 reveal-left space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-navy mb-6">{c.directTitle}</h3>
              <div className="space-y-4">
                {[
                  { icon: Mail,  label: c.emailLabel, value: 'contacto@mentoriatextum.com', href: 'mailto:contacto@mentoriatextum.com' },
                  ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.label} href={item.href} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                        <Icon size={18} className="text-gold" />
                      </div>
                      <div>
                        <p className="text-navy/40 text-xs tracking-widest uppercase">{item.label}</p>
                        <p className="text-navy/80 text-sm group-hover:text-gold transition-colors">{item.value}</p>
                      </div>
                    </a>
                  );
                })}
                {/* WhatsApp — canal directo */}
                <a
                  href="https://wa.me/34614638406?text=Hola%2C%20me%20gustar%C3%ADa%20solicitar%20un%20diagn%C3%B3stico%20acad%C3%A9mico%20gratuito%20con%20TEXTUM."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-sm bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/20 group-hover:border-[#25D366]/40 transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.121 1.533 5.847L.054 23.446a.75.75 0 0 0 .916.916l5.628-1.484A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.712 9.712 0 0 1-4.953-1.355l-.355-.21-3.685.97.985-3.6-.23-.37A9.712 9.712 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-navy/40 text-xs tracking-widest uppercase">WhatsApp</p>
                    <p className="text-navy/80 text-sm group-hover:text-[#25D366] transition-colors">+34 614 63 84 06</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="relative rounded-sm overflow-hidden aspect-[4/3]">
              <img
                src="https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Escritorio académico"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-serif italic text-navy/90 text-base">{c.imgQuote}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-3 reveal-right">
            <div className="bg-white/80 backdrop-blur-sm border border-gold/20 rounded-sm p-8 md:p-10 shadow-2xl relative overflow-hidden">
              
              {/* ✨ Overlay de éxito - aparece cuando submitted = true */}
              {submitted && (
                <div 
                  className="absolute inset-0 z-20 flex items-center justify-center bg-cream/90 backdrop-blur-sm animate-[fadeIn_0.6s_ease]"
                  style={{ animation: 'fadeIn 0.6s ease' }}
                >
                  <div className="text-center max-w-md mx-6 animate-[slideUp_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Check grande con animación */}
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                      <CheckCircle size={48} className="text-gold" />
                    </div>
                    
                    <h3 className="font-serif text-2xl text-navy mb-2">
                      ✓ Hemos recibido correctamente tu solicitud.
                    </h3>
                    
                    <p className="text-navy/60 text-sm leading-relaxed mt-4">
                      Uno de nuestros asesores contactará contigo en menos de 24 horas.
                    </p>
                    
                    <p className="text-navy/40 text-xs mt-6 font-light border-t border-navy/10 pt-6">
                      Mientras tanto puedes seguir explorando nuestros programas.
                    </p>

                    {/* Botón opcional para "cerrar" (reiniciar el formulario) */}
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm(EMPTY_FORM);
                      }}
                      className="mt-6 text-navy/40 hover:text-navy text-xs tracking-[0.15em] transition-colors border border-navy/10 hover:border-navy/30 px-5 py-2 rounded-sm"
                    >
                      ENVIAR OTRA SOLICITUD
                    </button>
                  </div>
                </div>
              )}

              {/* Contenedor del formulario - se desvanece cuando submitted */}
              <div 
                className={`transition-all duration-700 ${
                  submitted ? 'opacity-30 scale-[0.98] blur-[1px] pointer-events-none' : 'opacity-100 scale-100 blur-0'
                }`}
              >
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Honeypot */}
                  <div
                    aria-hidden="true"
                    style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}
                  >
                    <input
                      type="text"
                      name="b_field"
                      value={honeypot}
                      onChange={e => setHoneypot(e.target.value)}
                      autoComplete="new-password"
                      tabIndex={-1}
                    />
                  </div>

                  {/* Título del formulario */}
                  <div className="pb-2 border-b border-navy/8">
                    <h3 className="font-serif text-xl text-navy mb-1">{f.formTitle}</h3>
                    <p className="text-navy/50 text-xs font-light leading-relaxed">{f.formIntro}</p>
                  </div>

                  {/* Fila 1: Nombre + Email */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>{f.nameLabel}</label>
                      <input
                        type="text" name="name" value={form.name}
                        onChange={handleChange} required
                        placeholder={f.namePlaceholder}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>{f.emailLabel}</label>
                      <input
                        type="email" name="email" value={form.email}
                        onChange={handleChange} required
                        placeholder={f.emailPlaceholder}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Fila 2: País + Nivel académico */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className={labelCls}>{f.countryLabel}</label>
                      <input
                        type="text" name="country" value={form.country}
                        onChange={handleChange}
                        placeholder={f.countryPlaceholder}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="academicLevel-select" className={labelCls}>{f.academicLevelLabel}</label>
                      <select
                        id="academicLevel-select" name="academicLevel"
                        value={form.academicLevel} onChange={handleChange}
                        className={selectCls}
                        style={{ background: 'rgba(247, 242, 235, 0.85)' }}
                      >
                        <option value="" className="bg-cream">{f.academicLevelPlaceholder}</option>
                        {f.academicLevelOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-cream">{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Fila 3: Tipo de proyecto + Etapa del manuscrito */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="projectType-select" className={labelCls}>{f.projectTypeLabel}</label>
                      <select
                        id="projectType-select" name="projectType"
                        value={form.projectType} onChange={handleChange}
                        className={selectCls}
                        style={{ background: 'rgba(247, 242, 235, 0.85)' }}
                      >
                        <option value="" className="bg-cream">{f.projectTypePlaceholder}</option>
                        {f.projectTypeOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-cream">{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="manuscriptStage-select" className={labelCls}>{f.manuscriptStageLabel}</label>
                      <select
                        id="manuscriptStage-select" name="manuscriptStage"
                        value={form.manuscriptStage} onChange={handleChange}
                        className={selectCls}
                        style={{ background: 'rgba(247, 242, 235, 0.85)' }}
                      >
                        <option value="" className="bg-cream">{f.manuscriptStagePlaceholder}</option>
                        {f.manuscriptStageOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-cream">{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Programa de interés */}
                  <div>
                    <label htmlFor="service-select" className={labelCls}>{f.serviceLabel}</label>
                    <select
                      id="service-select" name="service"
                      value={form.service} onChange={handleChange}
                      className={selectCls}
                      style={{ background: 'rgba(247, 242, 235, 0.85)' }}
                    >
                      <option value="" className="bg-cream">{f.servicePlaceholder}</option>
                      {f.serviceOpts.map(o => (
                        <option key={o.value} value={o.value} className="bg-cream">{o.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Mensaje */}
                  <div>
                    <label className={labelCls}>{f.messageLabel}</label>
                    <textarea
                      name="message" value={form.message}
                      onChange={handleChange} required rows={4}
                      placeholder={f.messagePlaceholder}
                      className="w-full bg-navy/5 border border-navy/10 rounded-sm px-4 py-3 text-navy text-sm placeholder-navy/25 focus:outline-none focus:border-gold/50 transition-all resize-none"
                    />
                  </div>

                  {/* Nota legal */}
                  <p className="text-navy/35 text-[10px] leading-relaxed font-light">{f.legalNote}</p>

                  {/* ✨ Botón con estado premium */}
                  <button
                    type="submit"
                    disabled={loading || submitted}
                    className={`
                      w-full py-4 text-xs tracking-[0.18em] rounded-sm 
                      flex items-center justify-center gap-3 
                      transition-all duration-500
                      ${submitted 
                        ? 'bg-gold/10 border border-gold/30 text-gold cursor-default' 
                        : 'btn-primary hover:scale-[1.01]'
                      }
                      ${loading ? 'opacity-70' : ''}
                    `}
                  >
                    {submitted ? (
                      // ✅ Estado: Solicitud enviada
                      <span className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-gold" />
                        <span>✓ Solicitud enviada</span>
                      </span>
                    ) : loading ? (
                      // ⏳ Estado: Enviando
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>{f.sending}</span>
                      </span>
                    ) : (
                      // 📤 Estado: Normal
                      <><Send size={14} className="relative z-10" /><span>{f.send}</span></>
                    )}
                  </button>

                </form>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Toast de error (solo errores) */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={closeToast}
        />
      )}

      {/* Keyframes del toast + animaciones premium */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.5); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}