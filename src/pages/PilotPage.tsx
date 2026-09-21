import { Check, ArrowRight, Calendar, ShieldCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';
import { trackConversion } from '../lib/conversion';

const PILOT_CTA = '/?source=piloto-doctorado&utm_campaign=piloto-institucional#contacto';

export default function PilotPage() {
  useSEO({
    title: 'Piloto metodológico para programas de doctorado — TEXTUM',
    description: 'Un piloto TEXTUM para detectar incoherencias metodológicas en proyectos doctorales antes de que lleguen a la defensa.',
    canonical: '/piloto-doctorado',
    lang: 'es',
  });

  return (
    <div className="min-h-screen bg-cream text-navy">
      <Navbar />
      <main>
        <header className="gradient-bg pt-40 pb-24 px-6">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-end">
            <div>
              <p className="text-xs tracking-[0.3em] text-gold uppercase mb-5">Piloto institucional TEXTUM</p>
              <h1 className="font-serif text-5xl md:text-7xl text-white font-light leading-[0.98]">
                Más coherencia metodológica antes de que llegue el tribunal.
              </h1>
              <p className="text-white/65 text-lg leading-relaxed mt-7 max-w-2xl">
                Seleccionamos programas de doctorado que quieran probar una revisión metodológica inicial de dos proyectos y obtener una lectura externa, rigurosa y accionable.
              </p>
              <div className="flex flex-wrap gap-3 mt-9">
                <a href={PILOT_CTA} onClick={() => trackConversion('pilot_cta_click', { placement: 'hero' })} className="btn-primary inline-flex items-center gap-2 px-7 py-4 text-xs tracking-[0.15em] rounded-sm">SOLICITAR EL PILOTO <ArrowRight size={15} /></a>
                <a href="#como-funciona" className="inline-flex items-center px-7 py-4 text-xs tracking-[0.15em] border border-white/25 text-white rounded-sm hover:border-gold/70">CÓMO FUNCIONA</a>
              </div>
            </div>
            <div className="border border-gold/25 bg-white/[0.07] p-7 rounded-sm">
              <p className="text-gold text-xs tracking-[0.2em] uppercase">Para quién</p>
              <ul className="mt-5 space-y-4 text-white/75 text-sm">
                {['Coordinaciones de doctorado', 'Direcciones de tesis', 'Escuelas doctorales', 'Centros de escritura académica'].map(item => <li key={item} className="flex gap-3"><Check size={16} className="text-gold flex-shrink-0" />{item}</li>)}
              </ul>
              <p className="text-white/40 text-xs leading-relaxed mt-7">Primera convocatoria limitada a España y Latinoamérica.</p>
            </div>
          </div>
        </header>

        <section id="como-funciona" className="max-w-6xl mx-auto px-6 py-24">
          <div className="max-w-2xl mb-12">
            <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Una intervención concreta</p>
            <h2 className="font-serif text-4xl md:text-5xl font-light">No es otra charla sobre metodología.</h2>
            <p className="text-navy/60 leading-relaxed mt-5">Es una revisión aplicada sobre proyectos reales para detectar dónde se rompe la relación entre problema, objetivos, método y argumentación.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              ['01', 'Seleccionamos', 'El programa propone dos proyectos en una etapa adecuada para recibir revisión.'],
              ['02', 'Revisamos', 'Analizamos la arquitectura metodológica con criterios TEXTUM y una mirada externa.'],
              ['03', 'Devolvemos', 'Entregamos una orientación breve con prioridades de mejora y próximos pasos.'],
            ].map(([number, title, text]) => <article key={number} className="bg-white border border-navy/10 p-7 rounded-sm"><span className="font-serif text-3xl text-gold/60">{number}</span><h3 className="font-serif text-2xl mt-6">{title}</h3><p className="text-sm text-navy/60 leading-relaxed mt-3">{text}</p></article>)}
          </div>
        </section>

        <section className="bg-navy px-6 py-24 text-white">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-14 items-start">
            <div><p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">Qué recibe el programa</p><h2 className="font-serif text-4xl font-light">Una prueba pequeña para decidir con evidencia.</h2></div>
            <ul className="space-y-5 text-white/70 text-sm leading-relaxed">{['Revisión de dos proyectos doctorales.', 'Identificación de incoherencias metodológicas prioritarias.', 'Orientación escrita para cada proyecto.', 'Conversación de devolución con la coordinación.', 'Propuesta de continuidad solo si aporta valor.'].map(item => <li key={item} className="flex gap-3"><Check size={17} className="text-gold flex-shrink-0 mt-0.5" />{item}</li>)}</ul>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-24 text-center">
          <ShieldCheck size={30} className="text-gold mx-auto mb-5" />
          <h2 className="font-serif text-4xl font-light">Rigor, confidencialidad y autoría intacta.</h2>
          <p className="text-navy/60 leading-relaxed max-w-2xl mx-auto mt-5">TEXTUM no escribe tesis ni sustituye al investigador. El piloto está diseñado para mejorar la capacidad de supervisión y la coherencia del proyecto, con revisión humana y uso ético de la IA.</p>
          <a href={PILOT_CTA} onClick={() => trackConversion('pilot_cta_click', { placement: 'final' })} className="btn-primary inline-flex items-center gap-2 mt-8 px-8 py-4 text-xs tracking-[0.15em] rounded-sm"><Calendar size={15} /> SOLICITAR CONVERSACIÓN</a>
          <p className="text-xs text-navy/40 mt-4">Respuesta inicial en menos de 24 horas.</p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
