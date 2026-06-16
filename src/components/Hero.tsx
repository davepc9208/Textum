import { useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    function initParticles() {
      particles = Array.from({ length: 80 }, () => ({
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
    function draw() {
      ctx.clearRect(0, 0, W, H);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.alpha})`;
        ctx.fill();
      });

      // Draw connecting lines
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

      raf = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden gradient-bg"
    >
      {/* Floating orbs */}
      <div className="orb orb-gold w-[600px] h-[600px] top-[-100px] right-[-100px]" style={{ animationDelay: '0s' }} />
      <div className="orb orb-navy w-[500px] h-[500px] bottom-[-80px] left-[-80px]" style={{ animationDelay: '3s' }} />
      <div className="orb orb-gold w-[300px] h-[300px] top-[40%] left-[15%]" style={{ animationDelay: '1.5s', opacity: 0.1 }} />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="particles absolute inset-0" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl">
        {/* Pen icon ornament */}
        <div className="mb-6 flex flex-col items-center gap-2 animate-[fadeInDown_1s_ease_0.2s_both]">
          <div className="w-px h-8 bg-gradient-to-b from-transparent to-gold/60" />
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L9 9H15L12 2Z" fill="#c9a84c" opacity="0.9" />
            <path d="M9 9L7 18H12H17L15 9H9Z" stroke="#c9a84c" strokeWidth="1" fill="none" />
            <path d="M10 18L12 22L14 18" stroke="#c9a84c" strokeWidth="1" />
          </svg>
          <div className="w-px h-4 bg-gradient-to-b from-gold/60 to-transparent" />
        </div>

        {/* Brand name */}
        <h1
          className="font-serif text-8xl md:text-[9rem] lg:text-[11rem] font-light tracking-[0.25em] text-white mb-0 leading-none animate-[fadeInUp_1s_ease_0.4s_both]"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          TEXTUM
        </h1>

        {/* Gold rule */}
        <div className="flex items-center gap-4 my-5 w-full max-w-sm animate-[fadeIn_1s_ease_0.8s_both]">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
          <svg width="10" height="10" viewBox="0 0 10 10">
            <rect x="5" y="0" width="7" height="7" transform="rotate(45 5 5)" fill="#c9a84c" />
          </svg>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        </div>

        {/* Tagline */}
        <p
          className="font-serif italic text-2xl md:text-3xl font-light text-white/85 tracking-wide mb-3 animate-[fadeInUp_1s_ease_0.9s_both]"
        >
          De la corrección al aprendizaje
        </p>
        <p className="text-xs md:text-sm tracking-[0.3em] text-gold/80 font-light uppercase mb-12 animate-[fadeIn_1s_ease_1s_both]">
          Mentoría Académica
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 animate-[fadeInUp_1s_ease_1.1s_both]">
          <a href="#servicios" className="btn-primary px-10 py-4 text-sm tracking-[0.15em] rounded-sm">
            <span>DESCUBRIR SERVICIOS</span>
          </a>
          <a
            href="#contacto"
            className="px-10 py-4 text-sm tracking-[0.15em] text-white border border-white/30 rounded-sm hover:border-gold/60 hover:text-gold transition-all duration-300 backdrop-blur-sm bg-white/5"
          >
            RESERVAR SESIÓN
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2 scroll-indicator">
        <span className="text-white/40 text-xs tracking-[0.2em] uppercase">Explorar</span>
        <ChevronDown size={18} className="text-gold/60" />
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <svg viewBox="0 0 1440 96" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,96 C360,0 1080,96 1440,0 L1440,96 L0,96Z"
            fill="#faf7f2"
          />
        </svg>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(25px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
