const testimonials = [
  {
    quote: 'Gracias a TEXTUM pasé de suspender la redacción a escribir con confianza. Mi TFG fue valorado con matrícula de honor.',
    name: 'Laura M.',
    role: 'Estudiante de Derecho, UCM',
    img: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    quote: 'El feedback detallado y la paciencia infinita de la mentora transformaron mi manera de entender la escritura académica.',
    name: 'Carlos R.',
    role: 'Doctorando en Historia, UAM',
    img: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
  {
    quote: 'Mi tesis doctoral salió adelante gracias al acompañamiento de TEXTUM. Un servicio sin igual en rigor y calidad humana.',
    name: 'Ana P.',
    role: 'Doctora en Lingüística, UB',
    img: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
  },
];

export default function Testimonials() {
  return (
    <section className="section-cream py-28 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Testimonios</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
            Lo que dicen mis <em className="not-italic text-gold-gradient">estudiantes</em>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 stagger">
          {testimonials.map((t) => (
            <div key={t.name} className="reveal glass-cream rounded-sm p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gold/10">
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} width="12" height="12" viewBox="0 0 12 12" fill="#c9a84c">
                    <path d="M6 1L7.5 4.5H11L8 6.5L9 10L6 8L3 10L4 6.5L1 4.5H4.5L6 1Z" />
                  </svg>
                ))}
              </div>

              <p className="font-serif italic text-base text-navy/80 leading-relaxed mb-6">
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-gold/15">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-navy">{t.name}</p>
                  <p className="text-xs text-navy/50">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
