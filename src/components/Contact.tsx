import { useState } from 'react';
import { Mail, Globe,Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', service: '', message: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No se pudo enviar el mensaje.');
      }

      setSent(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo enviar el mensaje. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contacto" className="section-navy py-20 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
      <div className="orb orb-gold w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] top-[-100px] left-[-100px] opacity-10" />
      <div className="orb orb-gold w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bottom-0 right-0 opacity-8" style={{ animationDelay: '2s' }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Conectemos</p>
          <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white leading-tight">
            Inicia tu <em className="not-italic text-gold">transformación</em>
          </h2>
          <p className="text-white/50 text-sm mt-4 max-w-md mx-auto font-light">
            Cuéntanos tu proyecto y diseñaremos juntos el plan de mentoría ideal para ti.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10 sm:gap-12 items-start">
          {/* Contact info */}
          <div className="lg:col-span-2 reveal-left space-y-8">
            <div>
              <h3 className="font-serif text-2xl text-white mb-6">Contacto directo</h3>
              <div className="space-y-4">
                {[
                  { icon: Mail, label: 'Email', value: 'revedit917@gmail.com', href: 'mailto:revedit917@gmail.com' },
                  { icon: Globe, label: 'Web', value: 'https://textumm.netlify.app/', href: '#' },
                  
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <a
                      key={c.label}
                      href={c.href}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-10 h-10 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center flex-shrink-0 group-hover:bg-gold/20 group-hover:border-gold/40 transition-all">
                        <Icon size={18} className="text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white/40 text-xs tracking-widest uppercase">{c.label}</p>
                        <p className="text-white/80 text-sm group-hover:text-gold transition-colors break-words">{c.value}</p>
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Image */}
            <div className="relative rounded-sm overflow-hidden aspect-[4/3] mt-8">
              <img
                src="https://images.pexels.com/photos/590493/pexels-photo-590493.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Escritorio académico"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="font-serif italic text-white/90 text-base">"Cada texto es una oportunidad de aprender"</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3 reveal-right">
            <div className="glass-navy rounded-sm p-6 sm:p-8 md:p-10 shadow-2xl">
              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                  <CheckCircle size={56} className="text-gold" strokeWidth={1} />
                  <h3 className="font-serif text-3xl text-white">Mensaje enviado</h3>
                  <p className="text-white/60 text-sm max-w-xs font-light">
                    Gracias por contactar. Nos pondremos en contacto contigo en menos de 24 horas.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', service: '', message: '' }); }}
                    className="text-gold/60 text-xs tracking-widest hover:text-gold transition-colors mt-4"
                  >
                    ENVIAR OTRO MENSAJE
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre completo"
                        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 focus:bg-white/8 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="tu@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 focus:bg-white/8 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Servicio de interés</label>
                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50 transition-all appearance-none cursor-pointer"
                      style={{ background: 'rgba(13,31,60,0.8)' }}
                    >
                      <option value="" className="bg-navy">Selecciona un servicio...</option>
                      <option value="examen" className="bg-navy">Examen Complexivo</option>
                      <option value="articulo" className="bg-navy">Artículo Científico</option>
                      <option value="feedback" className="bg-navy">Sesiones de Feedback</option>
                      <option value="plan" className="bg-navy">Plan de Mejora Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Mensaje</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      placeholder="Cuéntanos sobre tu proyecto, necesidades o dudas..."
                      className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-sm px-4 py-3">
                      <AlertCircle size={16} className="flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-4 text-xs tracking-[0.18em] rounded-sm flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <span>ENVIANDO...</span>
                      </span>
                    ) : (
                      <>
                        <Send size={14} className="relative z-10" />
                        <span>ENVIAR MENSAJE</span>
                      </>
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
