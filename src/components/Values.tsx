import { Shield, Star, Heart } from 'lucide-react';
import { useLang } from '../i18n/LangContext';

const icons = [GraduationCapSVG, ShieldIcon, StarIcon, HeartIcon];

function GraduationCapSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  );
}
function ShieldIcon() { return <Shield size={28} className="text-gold" strokeWidth={1.5} />; }
function StarIcon() { return <Star size={28} className="text-gold" strokeWidth={1.5} />; }
function HeartIcon() { return <Heart size={28} className="text-gold" strokeWidth={1.5} />; }

export default function Values() {
  const { t } = useLang();
  const v = t.values;

  return (
    <section id="valores" className="section-cream py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.025]" aria-hidden>
        <span className="font-serif text-[40vw] font-bold text-navy leading-none">T</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16 reveal">
          <p className="text-xs tracking-[0.3em] text-gold uppercase mb-4">{v.label}</p>
          <h2 className="font-serif text-5xl md:text-6xl font-light text-navy leading-tight">
            {v.title1} <em className="not-italic text-gold-gradient">{v.title2}</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-navy/10 rounded-sm overflow-hidden stagger">
          {v.items.map((item, idx) => {
            const Icon = icons[idx];
            return (
              <div
                key={idx}
                className="reveal bg-cream p-10 flex flex-col items-center text-center group hover:bg-navy transition-colors duration-500"
              >
                <div className="mb-5 group-hover:[&_svg]:stroke-gold transition-all">
                  <Icon />
                </div>
                <div className="w-8 h-px bg-gold/40 mb-4 group-hover:w-12 transition-all duration-300" />
                <h3 className="font-serif text-lg tracking-widest text-navy group-hover:text-white transition-colors duration-300 mb-3 uppercase">
                  {item.label}
                </h3>
                <p className="text-xs leading-relaxed text-navy/55 group-hover:text-white/60 transition-colors duration-300 font-light">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 reveal text-center max-w-2xl mx-auto">
          <div className="glass-cream rounded-sm p-10 shadow-xl border border-gold/10">
            <svg className="mx-auto mb-4 text-gold/40" width="32" height="24" viewBox="0 0 32 24" fill="currentColor">
              <path d="M0 24V14.4C0 6.4 5.2 1.6 15.6 0l1.6 3.2C11.2 4.4 8 7.2 7.2 12H12V24H0zm20 0V14.4C20 6.4 25.2 1.6 35.6 0L37.2 3.2C31.2 4.4 28 7.2 27.2 12H32V24H20z"/>
            </svg>
            <p className="font-serif italic text-2xl text-navy/80 leading-relaxed font-light">{v.quote}</p>
            <div className="w-12 h-px bg-gold/40 mx-auto mt-6 mb-3" />
            <p className="text-xs tracking-[0.2em] text-gold uppercase">TEXTUM</p>
          </div>
        </div>
      </div>
    </section>
  );
}
