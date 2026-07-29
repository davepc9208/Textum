// src/components/About.tsx
// Fix rendimiento: imagen de Pexels ajustada al tamaño real que ocupa.
//
// PROBLEMA detectado por Lighthouse:
// "Este archivo de imagen es más grande de lo necesario (700x875) para las
// dimensiones mostradas (364x455). Ahorro estimado de 33,7 KiB."
//
// CAUSA: el srcSet incluía una variante de 700px como opción máxima pero
// en mobile el contenedor mide 364px, y el navegador elegía 700px porque
// el sizes no era lo suficientemente específico.
//
// SOLUCIÓN:
// 1. Ajustar el tamaño máximo del srcSet a 500px (cubre hasta desktop 2x).
// 2. Hacer el sizes más preciso usando container queries reales:
//    - mobile (<768px): 100vw → la imagen ocupa todo el ancho
//    - tablet (768px-1024px): 50vw → columna derecha del grid
//    - desktop (>1024px): 400px → el contenedor tiene max-w-6xl/2 ≈ 400px
// 3. width/height actualizados para reflejar el aspecto real (4/5).

import { useLang } from '../i18n/LangContext';

const memberImages = [
  {
    src: '/WhatsApp_Image_2026-06-15_at_11.19.28.jpeg',
    srcWebp: '/WhatsApp_Image_2026-06-15_at_11.19.28.webp',
    alt: 'Vilma María Pérez Viñas',
    orcid: 'https://orcid.org/0000-0003-3041-096X',
    orcidId: '0000-0003-3041-096X',
  },
  {
    src: '/Yadyra_Pinera_Concepcion.png',
    srcWebp: '/Yadyra_Pinera_Concepcion.webp',
    alt: 'Yadyra de la Caridad Piñera Concepción',
    orcid: 'https://orcid.org/0000-0002-8947-1364',
    orcidId: '0000-0002-8947-1364',
  },
];

const memberStandards = [
  [
    { code: 'APA 7',    cls: 'bg-navy/8 text-navy/55 border-navy/15' },
    { code: 'Latindex', cls: 'bg-navy/8 text-navy/55 border-navy/15' },
    { code: 'Bologna',  cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  ],
  [
    { code: 'Scopus',   cls: 'bg-navy/8 text-navy/55 border-navy/15' },
    { code: 'ANECA',    cls: 'bg-blue-50 text-blue-600 border-blue-200' },
    { code: 'IMRyD',    cls: 'bg-navy/8 text-navy/55 border-navy/15' },
  ],
];

const OrcidSVG = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.016-5.325 5.016h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 3.872-2.862 3.872-3.722 0-2.016-1.284-3.722-3.862-3.722h-2.307z"/>
  </svg>
);

function AwardIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6"/>
      <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12"/>
    </svg>
  );
}

export default function About() {
  const { t } = useLang();
  const ab = t.about;

  return (
    <section id="sobre-mi" className="section-cream py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230d1f3c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Image — FIX: srcSet y sizes ajustados al tamaño real del contenedor */}
          <div className="reveal-left relative">
            <div className="relative rounded-sm overflow-hidden aspect-[4/5] shadow-2xl">
              <img
                src="https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop"
                srcSet="
                  https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=300&h=375&fit=crop 300w,
                  https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=400&h=500&fit=crop 400w,
                  https://images.pexels.com/photos/4050315/pexels-photo-4050315.jpeg?auto=compress&cs=tinysrgb&w=500&h=625&fit=crop 500w
                "
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
                alt="Redacción y mentoría académica"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={400}
                height={500}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -right-6 glass-cream rounded-sm p-5 shadow-xl max-w-[200px]">
              <p className="font-serif text-4xl font-semibold text-navy leading-none">+40</p>
              <p className="text-xs tracking-widest text-navy/60 mt-1 uppercase">{ab.stats[0].label}</p>
            </div>
            <div className="absolute -top-3 -left-3 w-24 h-24 border-t-2 border-l-2 border-gold/60 rounded-tl-sm" />
          </div>

          {/* Content */}
          <div className="reveal space-y-6">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-3">{ab.label}</p>
              <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
                {ab.title1}<br />
                <em className="not-italic text-gold-gradient">{ab.title2}</em>
              </h2>
            </div>
            <div className="gold-divider text-gold/50 text-sm">{ab.divider}</div>
            <p className="text-base text-navy/70 leading-relaxed font-light">{ab.p1}</p>
            <p className="text-base text-navy/70 leading-relaxed font-light">{ab.p2}</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
              {ab.stats.map((s, i) => (
                <div key={i} className="border border-navy/10 p-4 rounded-sm bg-white/60 hover:border-gold/30 transition-colors">
                  <p className="font-serif text-3xl font-semibold text-navy">{s.n}</p>
                  <p className="text-xs text-navy/50 tracking-wide mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <a href="#contacto" className="inline-block btn-primary px-8 py-3.5 text-xs tracking-[0.15em] rounded-sm mt-2">
              <span>{ab.cta}</span>
            </a>
          </div>
        </div>

        {/* Team members */}
        <div className="mt-24 reveal">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/60" />
            <p className="text-xs tracking-[0.3em] text-gold uppercase">{ab.teamLabel}</p>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gold/60" />
          </div>
          <p className="text-base text-navy/70 leading-relaxed font-light mb-10 max-w-2xl">{ab.teamBridge}</p>

          <div className="space-y-10">
            {ab.members.map((member, idx) => {
              const img = memberImages[idx];
              const standards = memberStandards[idx];
              const isEven = idx % 2 === 0;
              return (
                <div
                  key={idx}
                  className="border border-navy/10 rounded-sm bg-white/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                    <div className="relative md:w-64 flex-shrink-0">
                      <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-full min-h-[320px] overflow-hidden">
                        <picture>
                          <source srcSet={img.srcWebp} type="image/webp" />
                          <img
                            src={img.src}
                            alt={img.alt}
                            loading="lazy"
                            decoding="async"
                            className="absolute inset-0 w-full h-full object-cover object-top"
                          />
                        </picture>
                        <div className={`absolute inset-0 ${isEven ? 'bg-gradient-to-r' : 'bg-gradient-to-l'} from-transparent via-transparent to-white/10 hidden md:block`} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10 md:hidden" />
                      </div>
                      {isEven ? (
                        <>
                          <div className="absolute top-3 left-3 w-10 h-10 border-t-2 border-l-2 border-gold/70" />
                          <div className="absolute bottom-3 right-3 w-10 h-10 border-b-2 border-r-2 border-gold/40" />
                        </>
                      ) : (
                        <>
                          <div className="absolute top-3 right-3 w-10 h-10 border-t-2 border-r-2 border-gold/70" />
                          <div className="absolute bottom-3 left-3 w-10 h-10 border-b-2 border-l-2 border-gold/40" />
                        </>
                      )}
                    </div>

                    <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                      <div className="mb-5">
                        <h3 className="font-serif text-2xl md:text-3xl font-light text-navy leading-snug">
                          {member.name}
                        </h3>
                        {member.role && (
                          <p className="text-xs tracking-[0.2em] text-gold uppercase mt-1">{member.role}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <a
                            href={img.orcid}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs tracking-wide text-white bg-[#A6CE39] hover:bg-[#8fb82e] transition-colors px-2.5 py-1 rounded-full"
                          >
                            <OrcidSVG />
                            {img.orcidId}
                          </a>
                          {standards.map((std) => (
                            <span
                              key={std.code}
                              className={`inline-flex items-center text-[10px] tracking-[0.12em] font-medium px-2 py-0.5 rounded-full border ${std.cls}`}
                            >
                              {std.code}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="w-10 h-px bg-gold/50 mb-5" />

                      {member.intro && (
                        <p className="text-base text-navy font-medium leading-relaxed mb-4">{member.intro}</p>
                      )}

                      {member.bullets && member.bullets.length > 0 && (
                        <ul className="space-y-2 mb-4">
                          {member.bullets.map((bullet, bi) => (
                            <li key={bi} className="flex items-start gap-2.5">
                              <svg width="16" height="16" viewBox="0 0 16 16" className="flex-shrink-0 mt-0.5" fill="none">
                                <circle cx="8" cy="8" r="7.5" stroke="#c9a84c" strokeOpacity="0.4" />
                                <path d="M5 8l2 2 4-4" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span className="text-sm text-navy/70 leading-snug">{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="text-sm text-navy/50 leading-relaxed font-light italic">{member.bio}</p>

                      <div className="flex flex-wrap gap-2 mt-6">
                        {member.tags.map((tag) => (
                          <span key={tag} className="text-[11px] tracking-wide text-navy/60 border border-navy/15 px-3 py-1 rounded-full bg-white/80">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {idx === 1 && (
                        <div className="mt-5 inline-flex items-center gap-2 px-3 py-2 rounded-sm bg-gold/10 border border-gold/30 self-start">
                          <AwardIcon />
                          <span className="text-[11px] text-gold/80 font-medium tracking-wide">
                            Premio Nacional de Investigación Científica · El Salvador 2025
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
