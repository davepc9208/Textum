// src/components/AdminDistribute.tsx
// Fix Step 1: ahora actualiza published=true en Supabase antes de continuar.
// El slug se usa como identificador porque post.id puede no estar disponible
// dependiendo de cómo se pase el prop desde AdminPage.

import { useState, useCallback } from 'react';
// Fix: importar el singleton en lugar de crear un segundo cliente.
// Dos instancias de createClient pueden causar conflictos de caché de auth.
import { supabase } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id?: string;
  title?: string;
  content?: string;
  title_es?: string;
  title_en?: string;
  content_es?: string;
  content_en?: string;
  slug: string;
  excerpt?: string;
  excerpt_es?: string;
  excerpt_en?: string;
  category?: string | null;
  tags?: string[];
}

interface RepublishItem {
  date: string;
  platform: string;
  content: string;
}

interface InternalLink {
  text: string;
  url: string;
  description: string;
}

interface CarouselSlide {
  slide: number;
  title: string;
  text: string;
  image_prompt: string;
}

interface DistributeResult {
  success: boolean;
  generated_at: string;
  linkedin: { post: string };
  facebook: { post: string };
  instagram: { caption: string };
  pinterest: { title: string; description: string };
  twitter: { thread: string[] };
  tiktok_reels: { script: string; hooks: string[] };
  internal_links: InternalLink[];
  republishing: { schedule: RepublishItem[] };
  visual_assets: {
    instagram_carousel: CarouselSlide[];
    pinterest_pin: { title: string; description: string; image_prompt: string };
    youtube_thumbnail?: { text: string; image_prompt: string };
  };
  seo: { meta_title: string; meta_description: string; keywords: string[] };
  copy_ready: {
    linkedin: string;
    facebook: string;
    instagram: string;
    pinterest: string;
    twitter_thread: string;
    tiktok_script: string;
  };
}

type StepId = 'publish' | 'ai' | 'content' | 'schedule';
type StepState = 'idle' | 'running' | 'done' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handle = useCallback(async () => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded border border-gold/40 text-gold hover:bg-gold/10 transition-all flex-shrink-0"
    >
      {copied ? (
        <><CheckIcon size={11} /> Copiado</>
      ) : (
        <><CopyIcon size={11} /> Copiar</>
      )}
    </button>
  );
}

function ContentCard({
  label,
  text,
  mono = false,
}: {
  label: string;
  text: string;
  mono?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 220;
  return (
    <div className="bg-white/5 border border-white/10 rounded-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-gold/80 tracking-wide uppercase">{label}</span>
        <CopyBtn text={text} />
      </div>
      <p
        className={`text-xs leading-relaxed whitespace-pre-wrap ${
          mono ? 'font-mono text-white/60' : 'text-white/70'
        } ${!expanded && long ? 'line-clamp-4' : ''}`}
      >
        {text}
      </p>
      {long && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-gold/50 hover:text-gold mt-1.5 transition-colors"
        >
          {expanded ? 'Ver menos' : 'Ver más'}
        </button>
      )}
    </div>
  );
}

function StepRow({
  label,
  desc,
  state,
  children,
}: {
  label: string;
  desc: string;
  state: StepState;
  children?: React.ReactNode;
}) {
  const border =
    state === 'running' ? 'border-gold/50'
    : state === 'done'  ? 'border-emerald-500/40'
    : state === 'error' ? 'border-red-500/40'
    : 'border-white/10';

  const iconBg =
    state === 'running' ? 'bg-gold/15 border-gold/40'
    : state === 'done'  ? 'bg-emerald-500/15 border-emerald-500/30'
    : state === 'error' ? 'bg-red-500/15 border-red-400/30'
    : 'bg-white/5 border-white/15';

  const badgeClass =
    state === 'running' ? 'bg-gold/15 text-gold'
    : state === 'done'  ? 'bg-emerald-500/15 text-emerald-400'
    : state === 'error' ? 'bg-red-500/15 text-red-400'
    : 'bg-white/5 text-white/30';

  const badgeText =
    state === 'running' ? 'Ejecutando…'
    : state === 'done'  ? 'Completado'
    : state === 'error' ? 'Error'
    : 'Pendiente';

  return (
    <div className={`rounded-sm border ${border} transition-colors duration-300`}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${iconBg} transition-all`}>
          {state === 'running' && <SpinIcon />}
          {state === 'done'    && <CheckIcon size={14} className="text-emerald-400" />}
          {state === 'error'   && <ErrorIcon />}
          {state === 'idle'    && <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="text-xs text-white/40 mt-0.5">{desc}</p>
        </div>
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${badgeClass}`}>
          {badgeText}
        </span>
      </div>
      {children && (state === 'running' || state === 'done' || state === 'error') && (
        <div className="px-4 pb-4 border-t border-white/8 pt-4">{children}</div>
      )}
    </div>
  );
}

// ─── Tiny inline icons ────────────────────────────────────────────────────────

function SpinIcon() {
  return (
    <svg className="animate-spin w-4 h-4 text-gold" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon({ size = 16, className = 'text-white' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ErrorIcon() {
  return (
    <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
function CopyIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  post: Post;
  onPublishSuccess?: () => void;
}

export default function AdminDistribute({ post, onPublishSuccess }: Props) {
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState('');
  const [result, setResult]     = useState<DistributeResult | null>(null);
  const [steps, setSteps]       = useState<Record<StepId, StepState>>({
    publish: 'idle', ai: 'idle', content: 'idle', schedule: 'idle',
  });
  const [activeTab, setActiveTab] = useState<'redes' | 'carousel' | 'seo' | 'schedule'>('redes');

  function setStep(id: StepId, state: StepState) {
    setSteps((p) => ({ ...p, [id]: state }));
  }

  async function handleRun() {
    if (running) return;
    setRunning(true);
    setDone(false);
    setError('');
    setResult(null);
    setSteps({ publish: 'idle', ai: 'idle', content: 'idle', schedule: 'idle' });

    // ── Step 1: publicar en Supabase (real) ──────────────────────────────────
    setStep('publish', 'running');
    try {
      // Intentamos por id primero, luego por slug como fallback
      const filter = post.id
        ? supabase.from('posts').update({ published: true }).eq('id', post.id)
        : supabase.from('posts').update({ published: true }).eq('slug', post.slug);

      const { error: supabaseError } = await filter;
      if (supabaseError) throw new Error(supabaseError.message);

      setStep('publish', 'done');
      onPublishSuccess?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error al publicar en Supabase';
      setError(`Error al publicar: ${msg}`);
      setStep('publish', 'error');
      setRunning(false);
      return;
    }

    // ── Step 2: Groq — generar contenido ─────────────────────────────────────
    setStep('ai', 'running');
    let data: DistributeResult;
    try {
      const title   = post.title_es || post.title_en || post.title || 'Sin título';
      const content = post.content_es || post.content_en || post.content || '';
      const excerpt = post.excerpt_es || post.excerpt_en || post.excerpt || '';

      const res = await fetch('/api/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          slug: post.slug,
          excerpt,
          category: post.category ?? '',
          tags: post.tags ?? [],
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      data = await res.json();
      if (!data.success) throw new Error('El Worker no devolvió success:true');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      setError(msg);
      setStep('ai', 'error');
      setRunning(false);
      return;
    }

    setResult(data);
    setStep('ai', 'done');
    await delay(150);

    // ── Step 3 & 4: contenido y schedule listos ───────────────────────────────
    setStep('content', 'done');
    await delay(150);
    setStep('schedule', 'done');

    setDone(true);
    setRunning(false);
  }

  const r = result;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="font-serif text-xl text-white">Publicar y distribuir</h3>
          <p className="text-xs text-white/40 mt-0.5 max-w-xs truncate">
            {done ? `Completado · ${new Date(r!.generated_at).toLocaleTimeString('es-ES')}` : (post.title_es || post.title || post.slug)}
          </p>
        </div>
        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold text-navy text-xs font-semibold tracking-wide rounded-sm hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {running ? (
            <><SpinIcon /> Generando…</>
          ) : done ? (
            <><CheckIcon size={13} className="text-navy" /> Volver a generar</>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
              Publicar y distribuir
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-400">
          <ErrorIcon /> {error}
        </div>
      )}

      {/* Steps */}
      <StepRow label="Publicar artículo" desc="Activa la URL pública en Supabase" state={steps.publish}>
        {steps.publish === 'done' && (
          <p className="text-xs text-emerald-400 flex items-center gap-2">
            <CheckIcon size={12} className="text-emerald-400" />
            <a href={`https://mentoriatextum.com/blog/${post.slug}`} target="_blank" rel="noreferrer"
              className="underline underline-offset-2 text-gold/80 hover:text-gold truncate">
              mentoriatextum.com/blog/{post.slug}
            </a>
          </p>
        )}
      </StepRow>

      <StepRow label="Generar contenido con IA" desc="Groq · Llama 3.3 70B genera textos para todas las redes" state={steps.ai}>
        {steps.ai === 'running' && (
          <p className="text-xs text-white/40 animate-pulse">Procesando artículo…</p>
        )}
        {steps.ai === 'done' && r && (
          <p className="text-xs text-emerald-400 flex items-center gap-2">
            <CheckIcon size={12} className="text-emerald-400" />
            6 formatos generados · LinkedIn · Facebook · Instagram · Pinterest · X · TikTok
          </p>
        )}
      </StepRow>

      <StepRow label="Textos listos para copiar" desc="Un clic por red social" state={steps.content}>
        {steps.content === 'done' && r && (
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 flex-wrap">
              {(['redes', 'carousel', 'seo', 'schedule'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                    activeTab === tab
                      ? 'bg-gold/20 border-gold/50 text-gold'
                      : 'border-white/15 text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab === 'redes' ? 'Redes sociales'
                    : tab === 'carousel' ? 'Carrusel Instagram'
                    : tab === 'seo' ? 'SEO'
                    : 'Republicaciones'}
                </button>
              ))}
            </div>

            {/* Redes */}
            {activeTab === 'redes' && (
              <div className="space-y-3">
                <ContentCard label="LinkedIn"            text={r.copy_ready.linkedin} />
                <ContentCard label="Facebook"            text={r.copy_ready.facebook} />
                <ContentCard label="Instagram"           text={r.copy_ready.instagram} />
                <ContentCard label="Pinterest"           text={r.copy_ready.pinterest} />
                <ContentCard label="X / Twitter · Hilo" text={r.copy_ready.twitter_thread} mono />
                <ContentCard label="Guion TikTok / Reels" text={r.copy_ready.tiktok_script} mono />
                {r.tiktok_reels?.hooks?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                    <p className="text-[11px] font-medium text-gold/80 tracking-wide uppercase mb-2">Hooks alternativos</p>
                    <ul className="space-y-1.5">
                      {r.tiktok_reels.hooks.map((h, i) => (
                        <li key={i} className="flex items-start justify-between gap-3">
                          <span className="text-xs text-white/60">{i + 1}. {h}</span>
                          <CopyBtn text={h} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Carrusel */}
            {activeTab === 'carousel' && r.visual_assets?.instagram_carousel && (
              <div className="space-y-2">
                {r.visual_assets.instagram_carousel.map((slide) => (
                  <div key={slide.slide} className="bg-white/5 border border-white/10 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-gold/80">Slide {slide.slide} · {slide.title}</span>
                      <CopyBtn text={`${slide.title}\n${slide.text}`} />
                    </div>
                    <p className="text-xs text-white/60 mb-2">{slide.text}</p>
                    <p className="text-[10px] text-white/30 italic">🎨 {slide.image_prompt}</p>
                  </div>
                ))}
              </div>
            )}

            {/* SEO — ahora incluye youtube_thumbnail si existe */}
            {activeTab === 'seo' && r.seo && (
              <div className="space-y-3">
                <ContentCard label="Meta título"      text={r.seo.meta_title} />
                <ContentCard label="Meta description" text={r.seo.meta_description} />
                <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-medium text-gold/80 tracking-wide uppercase">Keywords</span>
                    <CopyBtn text={r.seo.keywords.join(', ')} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.seo.keywords.map((k) => (
                      <span key={k} className="text-[11px] bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-white/60">{k}</span>
                    ))}
                  </div>
                </div>
                {/* YouTube thumbnail — ahora visible */}
                {r.visual_assets?.youtube_thumbnail && (
                  <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-medium text-gold/80 tracking-wide uppercase">YouTube Thumbnail</span>
                      <CopyBtn text={`${r.visual_assets.youtube_thumbnail.text}\n\n${r.visual_assets.youtube_thumbnail.image_prompt}`} />
                    </div>
                    <p className="text-xs text-white/70 font-medium mb-1">{r.visual_assets.youtube_thumbnail.text}</p>
                    <p className="text-[10px] text-white/30 italic">🎨 {r.visual_assets.youtube_thumbnail.image_prompt}</p>
                  </div>
                )}
                {r.internal_links?.length > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-sm p-4">
                    <p className="text-[11px] font-medium text-gold/80 tracking-wide uppercase mb-2">Enlaces internos sugeridos</p>
                    <ul className="space-y-2">
                      {r.internal_links.map((l, i) => (
                        <li key={i} className="text-xs text-white/60">
                          → <span className="text-gold/70">{l.text}</span>
                          <span className="text-white/30"> · {l.url}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Schedule */}
            {activeTab === 'schedule' && r.republishing?.schedule && (
              <div className="space-y-2">
                {r.republishing.schedule.map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-white/35">{item.date}</span>
                        <span className="text-[11px] font-medium text-gold/70 border border-gold/30 px-2 py-0.5 rounded-full">{item.platform}</span>
                      </div>
                      <CopyBtn text={item.content} />
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed line-clamp-2">{item.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </StepRow>

      <StepRow label="Cola de republicaciones" desc="6 publicaciones programadas en las próximas 3 semanas" state={steps.schedule}>
        {steps.schedule === 'done' && r?.republishing?.schedule && (
          <p className="text-xs text-emerald-400 flex items-center gap-2">
            <CheckIcon size={12} className="text-emerald-400" />
            {r.republishing.schedule.length} republicaciones generadas · ve a la pestaña Republicaciones para copiarlas
          </p>
        )}
      </StepRow>
    </div>
  );
}
