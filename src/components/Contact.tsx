// src/components/Contact.tsx
// Formulario enriquecido — 6 campos + nota legal + microcopy
// Según TEXTUM_NEW_PROPUESTA.docx

import { useState } from 'react';
import { Mail, Globe, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

export default function Contact() {
  const { t } = useLang();
  const c = t.contact;
  const f = c.form;

  const [form, setForm] = useState({
    name: '', email: '', country: '',
    academicLevel: '', projectType: '', manuscriptStage: '',
    service: '', message: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar.');
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

            {/* Imagen con cita */}
            <div className="relative rounded-sm overflow-hidden aspect-[4/3]">
              <img
                src="https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Escritorio académico"
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
            <div className="glass-navy rounded-sm p-8 md:p-10 shadow-2xl">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <CheckCircle size={56} className="text-gold" strokeWidth={1} />
                  <h3 className="font-serif text-3xl text-white">{f.successTitle}</h3>
                  <p className="text-white/60 text-sm max-w-xs font-light">{f.successDesc}</p>
                  <button
                    onClick={() => {
                      setSent(false);
                      setForm({ name: '', email: '', country: '', academicLevel: '', projectType: '', manuscriptStage: '', service: '', message: '' });
                    }}
                    className="text-gold/60 text-xs tracking-widest hover:text-gold transition-colors mt-4"
                  >
                    {f.another}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">

                  {/* Honeypot */}
                  <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                    <input type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="off" tabIndex={-1} />
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

                  {/* Error */}
                  {error && (
                    <div className="flex items-center gap-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-3">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Nota legal */}
                  <p className="text-white/35 text-[10px] leading-relaxed font-light">{f.legalNote}</p>

                  {/* Submit */}
                  <button
                    type="submit" disabled={loading}
                    className="btn-primary w-full py-4 text-xs tracking-[0.18em] rounded-sm flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
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
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
