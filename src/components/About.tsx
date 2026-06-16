export default function About() {
  return (
    <section id="sobre-mi" className="section-cream py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d1f3c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto">
        {/* Main two-column block */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="reveal-left relative">
            <div className="relative rounded-sm overflow-hidden aspect-[4/5] shadow-2xl">
              <img
                src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Redacción y mentoría académica"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
            </div>

            <div className="absolute -bottom-6 -right-6 glass-cream rounded-sm p-5 shadow-xl max-w-[200px]">
              <p className="font-serif text-4xl font-semibold text-navy leading-none">+40</p>
              <p className="text-xs tracking-widest text-navy/60 mt-1 uppercase">Años de experiencia</p>
            </div>

            <div className="absolute -top-3 -left-3 w-24 h-24 border-t-2 border-l-2 border-gold/60 rounded-tl-sm" />
          </div>

          {/* Content */}
          <div className="reveal space-y-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">Sobre nosotros</p>
              <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
                Acompañamiento<br />
                <em className="not-italic text-gold-gradient">personalizado</em>
              </h2>
            </div>

            <div className="gold-divider text-gold/50 text-sm">◆</div>

            <p className="text-base text-navy/70 leading-relaxed font-light">
              Somos mentores académicos con más de una década de experiencia ayudando a estudiantes universitarios y de posgrado a transformar sus trabajos escritos en instrumentos reales de aprendizaje.
            </p>
            <p className="text-base text-navy/70 leading-relaxed font-light">
              Nuestro método no se limita a corregir: analizamos tus errores, entendemos tu proceso y diseñamos un plan de mejora que desarrolla tus capacidades de forma duradera.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              {[
                { n: '10+', label: 'Años de trayectoria' },
                { n: '98%', label: 'Tasa de satisfacción' },
                { n: '2', label: 'Idiomas de trabajo' },
                { n: '100%', label: 'Sesiones online' },
              ].map((s) => (
                <div key={s.label} className="border border-navy/10 p-4 rounded-sm bg-white/60 hover:border-gold/30 transition-colors">
                  <p className="font-serif text-3xl font-semibold text-navy">{s.n}</p>
                  <p className="text-xs text-navy/50 tracking-wide mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <a href="#contacto" className="inline-block btn-primary px-8 py-3.5 text-xs tracking-[0.15em] rounded-sm mt-2">
              <span>CONOCER MÁS</span>
            </a>
          </div>
        </div>

        {/* Team members */}
        <div className="mt-24 reveal">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <p className="text-xs tracking-[0.3em] text-gold uppercase">Nuestro equipo</p>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>

          <div className="space-y-10">
            {/* Team member: Vilma María Pérez Viñas */}
            <div className="border border-navy/10 rounded-sm bg-white/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row">
                {/* Photo */}
                <div className="relative md:w-64 flex-shrink-0">
                  <div className="relative h-72 md:h-full overflow-hidden">
                    <img
                      src="/WhatsApp_Image_2026-06-15_at_11.19.28.jpeg"
                      alt="Vilma María Pérez Viñas"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/20 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 md:hidden" />
                  </div>
                  {/* Gold corner accent */}
                  <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-gold/70" />
                  <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-gold/40" />
                </div>

                {/* Bio */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <div className="mb-5">
                    <h3 className="font-serif text-2xl md:text-3xl font-light text-navy leading-snug">
                      Vilma María Pérez Viñas
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href="https://orcid.org/0000-0003-3041-096X"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs tracking-wide text-white bg-[#A6CE39] hover:bg-[#8fb82e] transition-colors px-2.5 py-1 rounded-full"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 3.872-2.862 3.872-3.722 0-2.016-1.284-3.722-3.862-3.722h-2.307z"/>
                        </svg>
                        0000-0003-3041-096X
                      </a>
                    </div>
                  </div>

                  <div className="w-10 h-px bg-gold/50 mb-5" />

                  <p className="text-base text-navy/70 leading-relaxed font-light">
                    Doctora en Ciencias Pedagógicas. Máster en Didáctica de la Lengua Inglesa y Licenciada en Educación, especialidad Lengua Inglesa. Más de 40 años de experiencia en docencia universitaria, investigación, redacción académica, edición y traducción, en Cuba, Perú, Ecuador y España.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {['Docencia universitaria', 'Investigación', 'Redacción académica', 'Edición', 'Traducción'].map((tag) => (
                      <span key={tag} className="text-[11px] tracking-wide text-navy/60 border border-navy/15 px-3 py-1 rounded-full bg-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Team member: Yadyra de la Caridad Piñera Concepción */}
            <div className="border border-navy/10 rounded-sm bg-white/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex flex-col md:flex-row-reverse">
                {/* Photo */}
                <div className="relative md:w-64 flex-shrink-0">
                  <div className="relative h-72 md:h-full overflow-hidden">
                    <img
                      src="/Yadyra_Pinera_Concepcion.png"
                      alt="Yadyra de la Caridad Piñera Concepción"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-white/20 hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/20 md:hidden" />
                  </div>
                  {/* Gold corner accent */}
                  <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-gold/70" />
                  <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-gold/40" />
                </div>

                {/* Bio */}
                <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                  <div className="mb-5">
                    <h3 className="font-serif text-2xl md:text-3xl font-light text-navy leading-snug">
                      Yadyra de la Caridad Piñera Concepción
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href="https://orcid.org/0000-0002-8947-1364"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs tracking-wide text-white bg-[#A6CE39] hover:bg-[#8fb82e] transition-colors px-2.5 py-1 rounded-full"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 3.872-2.862 3.872-3.722 0-2.016-1.284-3.722-3.862-3.722h-2.307z"/>
                        </svg>
                        0000-0002-8947-1364
                      </a>
                    </div>
                  </div>

                  <div className="w-10 h-px bg-gold/50 mb-5" />

                  <p className="text-base text-navy/70 leading-relaxed font-light">
                    Doctora en Ciencias Pedagógicas, Máster en Didáctica del Español y la Literatura y Licenciada en Educación, con experiencia en docencia universitaria, investigación y redacción académica en Cuba, Guatemala, Ecuador y El Salvador. Asesora de tesis y artículos científicos, coautora de libros y más de 80 publicaciones académicas. Premio Nacional de Investigación Científica, El Salvador, 2025.
                  </p>

                  <div className="flex flex-wrap gap-2 mt-6">
                    {['Docencia universitaria', 'Investigación', 'Redacción académica', 'Asesoría de tesis', 'Publicaciones académicas'].map((tag) => (
                      <span key={tag} className="text-[11px] tracking-wide text-navy/60 border border-navy/15 px-3 py-1 rounded-full bg-white/80">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
