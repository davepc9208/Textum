// src/components/Hero.tsx
// v3 — texto actualizado con subSecondary y cta1Sub
// Fix Android: canvas desactivado en baja gama (sin cambios).

import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LangContext';
import { diagnosisHref, trackConversion } from '../lib/conversion';

function canRunCanvas(): boolean {
  if (typeof navigator === 'undefined') return true;
  if (typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (cores <= 2) return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (conn?.saveData) return false;
  if (conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') return false;
  return true;
}

export default function Hero() {
  const { t } = useLang();
  const h = t.hero;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCanvas] = useState(() => canRunCanvas());

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const ctx: CanvasRenderingContext2D = context;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight);

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = canvas.parentElement?.offsetHeight ?? window.innerHeight;
      initParticles();
    };
    window.addEventListener('resize', onResize);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; alpha: number };
    let particles: Particle[] = [];
    const isMobile = window.innerWidth < 768;
    const PARTICLE_COUNT = isMobile ? 20 : 55;
    const DRAW_LINES = !isMobile;

    function initParticles() {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.5 + 0.1,
      }));
    }
    initParticles();

    let raf: number;
    let paused = false;
    let offscreen = false;

    function draw() {
      if (paused || offscreen) return;
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
        ctx.fill();
      });
      if (DRAW_LINES) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(201,168,76,${0.07 * (1 - dist / 120)})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(draw);
    }

    const resume = () => {
      if (!paused && !offscreen) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }
    };
    const onVisibility = () => {
      paused = document.hidden;
      resume();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Pausa el bucle de partículas cuando el Hero sale de la pantalla:
    // no tiene sentido gastar CPU dibujando algo que no se ve mientras se lee.
    let io: IntersectionObserver | undefined;
    if (canvas.parentElement && 'IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => {
        offscreen = !entry.isIntersecting;
        if (offscreen) { cancelAnimationFrame(raf); } else { resume(); }
      }, { threshold: 0 });
      io.observe(canvas.parentElement);
    }

    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      io?.disconnect();
    };
  }, [showCanvas]);

  // Campos opcionales — optional chaining para no romper si no existen en translations
  const subSecondary = (h as typeof h & { subSecondary?: string }).subSecondary;
  const cta1Micro    = (h as typeof h & { cta1Micro?: string }).cta1Micro;
  const cta1Sub      = (h as typeof h & { cta1Sub?: string }).cta1Sub;

  return (
    <section
      id="inicio"
      className="relative min-h-[calc(100dvh-4rem)] flex flex-col items-center justify-center overflow-hidden gradient-bg"
      style={{ maxWidth: '100vw' }}
    >
      <div className="orb orb-gold w-[600px] h-[600px] top-[-100px] right-[-100px]" style={{ animationDelay: '0s' }} />
      <div className="orb orb-navy w-[500px] h-[500px] bottom-[-80px] left-[-80px]" style={{ animationDelay: '3s' }} />
      <div className="orb orb-gold w-[300px] h-[300px] top-[40%] left-[15%]" style={{ animationDelay: '1.5s', opacity: 0.1 }} />

      {showCanvas && (
        <canvas ref={canvasRef} className="particles absolute inset-0" />
      )}

      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-8 pb-8 max-w-5xl w-full">

        {/* Ornamento */}
        <div className="mb-5 flex flex-col items-center gap-2 animate-[fadeInDown_1s_ease_0.2s_both]">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-gold/60" />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L9 9H15L12 2Z" fill="#c9a84c" opacity="0.9" />
            <path d="M9 9L7 18H12H17L15 9H9Z" stroke="#c9a84c" strokeWidth="1" fill="none" />
            <path d="M10 18L12 22L14 18" stroke="#c9a84c" strokeWidth="1" />
          </svg>
          <div className="w-px h-4 bg-gradient-to-b from-gold/60 to-transparent" />
        </div>

        {/* Eyebrow */}
        <p className="text-[11px] tracking-[0.35em] text-gold/70 uppercase mb-4 animate-[fadeIn_1s_ease_0.3s_both]">
          {h.eyebrow}
        </p>

        {/* TEXTUM — protagonista visual */}
        <p
          aria-hidden="true"
          className="font-serif text-[clamp(3.5rem,12vw,10rem)] font-light tracking-[0.06em] sm:tracking-[0.12em] md:tracking-[0.2em] lg:tracking-[0.24em] text-white mb-0 leading-[0.85] animate-[fadeInUp_1s_ease_0.4s_both] w-full text-center whitespace-nowrap select-none"
        >
          TEXTUM
        </p>

        {/* Divisor */}
        <div className="flex items-center gap-4 my-5 w-full max-w-sm animate-[fadeIn_1s_ease_0.6s_both]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="5" y="0" width="7" height="7" transform="rotate(45 5 5)" fill="#c9a84c" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* H1 visible — titular principal (SEO + accesibilidad) */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-tight mb-4 max-w-3xl">
          {h.sub}
        </h1>

        {/* Subtítulo — metodología + IA */}
        {subSecondary && (
          <p className="text-sm md:text-base text-white/70 font-light leading-relaxed mb-3 animate-[fadeIn_1s_ease_0.8s_both] max-w-2xl">
            {subSecondary}
          </p>
        )}

        {/* Línea de servicios en cursiva */}
        {cta1Sub && (
          <p className="font-serif italic text-sm text-gold/60 font-light leading-relaxed mb-8 animate-[fadeIn_1s_ease_0.85s_both] max-w-xl tracking-wide">
            {cta1Sub}
          </p>
        )}

        {/* CTA */}
        <div className="flex flex-col items-center gap-2 animate-[fadeInUp_1s_ease_0.9s_both]">
          <a
            href={diagnosisHref()}
            onClick={() => trackConversion('diagnosis_cta_click', { placement: 'hero' })}
            className="btn-primary px-12 py-4 text-xs tracking-[0.18em] rounded-sm touch-manipulation"
          >
            <span>{h.cta1}</span>
          </a>
          {cta1Micro && (
            <p className="text-white/65 text-[10px] tracking-wide font-light max-w-[260px] text-center leading-snug mt-1">
              {cta1Micro}
            </p>
          )}
        </div>
      </div>

      {/* Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,96 C360,0 1080,96 1440,0 L1440,96 L0,96Z" fill="#faf7f2" />
        </svg>
      </div>

      <style>{`
        @keyframes fadeInDown { from{opacity:0;transform:translateY(-20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(25px);}to{opacity:1;transform:translateY(0);}}
        @keyframes fadeIn     { from{opacity:0;}to{opacity:1;}}
      `}</style>
    </section>
  );
}
