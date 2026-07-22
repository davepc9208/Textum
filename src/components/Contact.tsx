// src/components/Contact.tsx
// Fix 1: honeypot name="website" → name="b_field" + autoComplete="new-password"
//         evita que gestores de contraseñas (Chrome, 1Password, Bitwarden)
//         rellenen el campo y silencien el formulario sin feedback.
// Fix 2: Experiencia premium al enviar:
//         - Botón cambia a "✓ Solicitud enviada" y se deshabilita
//         - Tarjeta de confirmación con animación
//         - Formulario se desvanece ligeramente
//         - Sensación similar a Stripe, Apple o Notion

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
    'w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all';
  const selectCls =
    'w-full border border-white/10 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer';
  const labelCls =
    'block text-white/60 text-[10px] tracking-[0.2em] mb-2 uppercase';

  return (
    <section id="contacto" className="section-navy py-28 px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[500px] h-[500px] top-[-100px] left-[-100px] opacity-10" />
      <div className="orb orb-gold w-[300px] h-[300px] bottom-0 right-0 opacity-8" style={{ animationDelay: '2s' }} />

      <div className="max-w-6xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{c.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-white leading-tight">
            {c.title1} <em className="not-italic text-gold">{c.title2}</em>
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-md mx-auto font-light">{c.subtitle}</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Columna izquierda */}
          <div className="lg:col-span-2 reveal-left space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-white mb-6">{c.directTitle}</h3>
              <div className="space-y-4">
                {[
                  { icon: Mail,  label: c.emailLabel, value: 'contacto@mentoriatextum.com', href: 'mailto:contacto@mentoriatextum.com' },
                  { icon: Globe, label: c.webLabel,   value: 'mentoriatextum.com',          href: 'https://mentoriatextum.com/' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <a key={item.label} href={item.href} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                        <Icon size={18} className="text-gold" />
                      </div>
                      <div>
                        <p className="text-white/40 text-xs tracking-widest uppercase">{item.label}</p>
                        <p className="text-white/80 text-sm group-hover:text-gold transition-colors">{item.value}</p>
                      </div>
                    </a>
                  );
                })}
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
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-serif italic text-white/90 text-base">{c.imgQuote}</p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <div className="lg:col-span-3 reveal-right">
            <div className="glass-navy rounded-sm p-8 md:p-10 shadow-2xl relative overflow-hidden">
              
              {/* ✨ Overlay de éxito - aparece cuando submitted = true */}
              {submitted && (
                <div 
                  className="absolute inset-0 z-20 flex items-center justify-center bg-navy/60 backdrop-blur-sm animate-[fadeIn_0.6s_ease]"
                  style={{ animation: 'fadeIn 0.6s ease' }}
                >
                  <div className="text-center max-w-md mx-6 animate-[slideUp_0.7s_cubic-bezier(0.34,1.56,0.64,1)]">
                    {/* Check grande con animación */}
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gold/10 border-2 border-gold/40 flex items-center justify-center animate-[scaleIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both]">
                      <CheckCircle size={48} className="text-gold" />
                    </div>
                    
                    <h3 className="font-serif text-2xl text-white mb-2">
                      ✓ Hemos recibido correctamente tu solicitud.
                    </h3>
                    
                    <p className="text-white/60 text-sm leading-relaxed mt-4">
                      Uno de nuestros asesores contactará contigo en menos de 24 horas.
                    </p>
                    
                    <p className="text-white/40 text-xs mt-6 font-light border-t border-white/10 pt-6">
                      Mientras tanto puedes seguir explorando nuestros programas.
                    </p>

                    {/* Botón opcional para "cerrar" (reiniciar el formulario) */}
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm(EMPTY_FORM);
                      }}
                      className="mt-6 text-white/40 hover:text-white text-xs tracking-[0.15em] transition-colors border border-white/10 hover:border-white/30 px-5 py-2 rounded-sm"
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
                  <div className="pb-2 border-b border-white/8">
                    <h3 className="font-serif text-xl text-white mb-1">{f.formTitle}</h3>
                    <p className="text-white/50 text-xs font-light leading-relaxed">{f.formIntro}</p>
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
                        style={{ background: 'rgba(13,31,60,0.85)' }}
                      >
                        <option value="" className="bg-navy">{f.academicLevelPlaceholder}</option>
                        {f.academicLevelOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-navy">{o.label}</option>
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
                        style={{ background: 'rgba(13,31,60,0.85)' }}
                      >
                        <option value="" className="bg-navy">{f.projectTypePlaceholder}</option>
                        {f.projectTypeOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-navy">{o.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="manuscriptStage-select" className={labelCls}>{f.manuscriptStageLabel}</label>
                      <select
                        id="manuscriptStage-select" name="manuscriptStage"
                        value={form.manuscriptStage} onChange={handleChange}
                        className={selectCls}
                        style={{ background: 'rgba(13,31,60,0.85)' }}
                      >
                        <option value="" className="bg-navy">{f.manuscriptStagePlaceholder}</option>
                        {f.manuscriptStageOpts.map(o => (
                          <option key={o.value} value={o.value} className="bg-navy">{o.label}</option>
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
                      style={{ background: 'rgba(13,31,60,0.85)' }}
                    >
                      <option value="" className="bg-navy">{f.servicePlaceholder}</option>
                      {f.serviceOpts.map(o => (
                        <option key={o.value} value={o.value} className="bg-navy">{o.label}</option>
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
                      className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all resize-none"
                    />
                  </div>

                  {/* Nota legal */}
                  <p className="text-white/35 text-[10px] leading-relaxed font-light">{f.legalNote}</p>

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