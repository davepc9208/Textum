import { useState, useEffect, useRef } from 'react';
import { supabase, Post } from '../lib/supabase';
import { LogOut, Plus, Trash2, Eye, EyeOff, Save, X, Upload, ImageOff, Loader2, ShieldCheck } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import RichTextEditor from '../components/RichTextEditor';

// ─── helpers ────────────────────────────────────────────────────────────────
function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function readingTime(html: string) {
  const words = html.replace(/<[^>]+>/g, '').split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── empty post template ────────────────────────────────────────────────────
const EMPTY: Omit<Post, 'id' | 'created_at'> = {
  slug: '',
  title_es: '',
  title_en: '',
  excerpt_es: '',
  excerpt_en: '',
  content_es: '',
  content_en: '',
  author: '',
  cover_url: '',
  published: false,
  reading_time: 1,
  category: null,
};

// ─── Login form (con soporte 2FA) ──────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [needsMfa, setNeedsMfa] = useState(false);
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');

    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setErr(error.message);
      setLoading(false);
      return;
    }

    // ¿La cuenta tiene 2FA activado? Si sí, el nivel de sesión actual (aal1)
    // no es suficiente todavía y hay que pedir el código de la app autenticadora.
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setNeedsMfa(true);
        setLoading(false);
        return;
      }
    }

    onLogin();
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setErr(chErr.message); setLoading(false); return; }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verErr) { setErr('Código incorrecto. Inténtalo de nuevo.'); setLoading(false); return; }
    onLogin();
    setLoading(false);
  };

  if (needsMfa) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="glass-navy rounded-sm p-10 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <span className="font-serif text-3xl tracking-[0.2em] text-white">TEXTUM</span>
            <p className="text-gold/60 text-xs tracking-widest mt-1 uppercase">Verificación en dos pasos</p>
          </div>
          <form onSubmit={handleVerifyCode} className="space-y-5">
            <div>
              <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Código de tu app autenticadora</label>
              <input
                type="text" inputMode="numeric" autoFocus value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required maxLength={6}
                className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-center text-2xl tracking-[0.3em] placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all"
                placeholder="000000"
              />
            </div>
            {err && <p className="text-red-400 text-xs">{err}</p>}
            <button type="submit" disabled={loading || code.length !== 6}
              className="btn-primary w-full py-3 text-xs tracking-[0.15em] rounded-sm disabled:opacity-50">
              <span>{loading ? 'VERIFICANDO...' : 'VERIFICAR'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <div className="glass-navy rounded-sm p-10 w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <span className="font-serif text-3xl tracking-[0.2em] text-white">TEXTUM</span>
          <p className="text-gold/60 text-xs tracking-widest mt-1 uppercase">Panel de administración</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all"
              placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all"
              placeholder="••••••••" />
          </div>
          {err && <p className="text-red-400 text-xs">{err}</p>}
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-xs tracking-[0.15em] rounded-sm disabled:opacity-70">
            <span>{loading ? 'ENTRANDO...' : 'ENTRAR'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Cover image picker (subida desde el computador) ───────────────────────
function CoverImagePicker({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');

  const handlePick = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de formato
    const allowed = ['image/webp', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErr('Formato no permitido. Sube únicamente imágenes .webp o .png.');
      e.target.value = '';
      return;
    }
    // Validación de peso (300 KB)
    if (file.size > 300 * 1024) {
      setErr(`El archivo pesa ${(file.size / 1024).toFixed(0)} KB. El máximo recomendado es 300 KB. Comprímelo antes de subir.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setErr('');
    const ext = file.name.split('.').pop();
    const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('blog-images').upload(path, file);
    if (error) {
      setErr('No se pudo subir la imagen: ' + error.message);
    } else {
      const { data } = supabase.storage.from('blog-images').getPublicUrl(path);
      onChange(data.publicUrl);
    }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept="image/webp,image/png" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="relative group rounded-sm overflow-hidden border border-navy/15">
          <img src={value} alt="Portada" className="w-full h-44 object-cover" />
          <div className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button type="button" onClick={handlePick}
              className="px-4 py-2 bg-white text-navy text-xs tracking-widest rounded-sm hover:bg-gold transition-colors">
              CAMBIAR
            </button>
            <button type="button" onClick={() => onChange('')}
              className="px-4 py-2 bg-white/90 text-red-600 text-xs tracking-widest rounded-sm hover:bg-white transition-colors">
              QUITAR
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          className="w-full h-44 border-2 border-dashed border-navy/20 rounded-sm flex flex-col items-center justify-center gap-2 text-navy/40 hover:border-gold/50 hover:text-gold transition-colors disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span className="text-xs tracking-widest">SUBIENDO...</span>
            </>
          ) : (
            <>
              <Upload size={24} />
              <span className="text-xs tracking-widest">SUBIR IMAGEN DE PORTADA</span>
            </>
          )}
        </button>
      )}
      {err && <p className="text-red-500 text-xs mt-2 flex items-center gap-1.5"><ImageOff size={12} />{err}</p>}
    </div>
  );
}

// ─── Post editor ─────────────────────────────────────────────────────────────
function PostEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Post>;
  onSave: () => void;
  onCancel: () => void;
}) {
  const draftKey = `textum_draft_${initial.id ?? 'new'}`;

  const [form, setForm] = useState(() => {
    // Intenta restaurar un borrador guardado en este navegador
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...EMPTY, ...initial, ...parsed };
      }
    } catch {
      // ignorar errores de parseo
    }
    return { ...EMPTY, ...initial };
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'es' | 'en'>('es');
  const [preview, setPreview] = useState(false);
  const [hasDraft, setHasDraft] = useState(() => !!localStorage.getItem(draftKey));

  // Autoguardado: cada vez que cambia el formulario, lo guarda en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(form));
      setHasDraft(true);
    } catch {
      // localStorage lleno o no disponible — ignorar silenciosamente
    }
  }, [form, draftKey]);

  // Avisa antes de cerrar/recargar la pestaña si hay cambios sin guardar
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const clearDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignorar
    }
  };

  const set = (k: keyof typeof EMPTY, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTitleEs = (v: string) => {
    set('title_es', v);
    if (!initial.id) set('slug', slugify(v));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');

    // Validaciones básicas
    if (!form.slug) { setErr('El slug (URL) no puede estar vacío.'); setSaving(false); return; }
    if (!form.title_es) { setErr('El título en español es obligatorio.'); setSaving(false); return; }

    // Comprobar slug duplicado
    const { data: existing } = await supabase
      .from('posts')
      .select('id')
      .eq('slug', form.slug)
      .single();

    if (existing && existing.id !== initial.id) {
      setErr(`El slug "${form.slug}" ya está en uso por otro artículo. Elige uno diferente.`);
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      reading_time: readingTime(form.content_es + form.content_en),
    };
    let error;
    if (initial.id) {
      ({ error } = await supabase.from('posts').update(payload).eq('id', initial.id));
    } else {
      ({ error } = await supabase.from('posts').insert(payload));
    }
    if (error) setErr(error.message);
    else {
      clearDraft();
      onSave();
    }
    setSaving(false);
  };

  const inputCls = 'w-full bg-white border border-navy/15 rounded-sm px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-gold/60 transition-all';
  const labelCls = 'block text-navy/50 text-xs tracking-widest mb-1.5 uppercase';

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto my-8 px-4">
        <div className="bg-cream rounded-sm shadow-2xl overflow-hidden">
          {hasDraft && (
            <div className="bg-gold/10 border-b border-gold/30 px-8 py-2.5 flex items-center justify-between">
              <p className="text-xs text-navy/60">
                📝 Borrador autoguardado en este navegador. Tus cambios se guardan automáticamente mientras escribes.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('¿Descartar el borrador guardado?')) {
                    clearDraft();
                    setForm({ ...EMPTY, ...initial });
                    setHasDraft(false);
                  }
                }}
                className="text-xs text-navy/40 hover:text-red-500 transition-colors underline flex-shrink-0 ml-4"
              >
                Descartar borrador
              </button>
            </div>
          )}
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-navy/10 bg-white">
            <h2 className="font-serif text-2xl text-navy">{initial.id ? 'Editar artículo' : 'Nuevo artículo'}</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPreview(!preview)}
                className={`flex items-center gap-2 px-4 py-2 text-xs tracking-widest rounded-sm border transition-colors ${
                  preview
                    ? 'bg-navy text-gold border-navy'
                    : 'border-navy/20 text-navy/60 hover:border-gold/40 hover:text-navy'
                }`}
              >
                <Eye size={14} />
                {preview ? 'EDITAR' : 'VISTA PREVIA'}
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Salir sin guardar? Tu borrador quedará guardado en este navegador y podrás continuarlo después.')) {
                    onCancel();
                  }
                }}
                className="text-navy/40 hover:text-navy transition-colors"
              ><X size={20} /></button>
            </div>
          </div>

          {/* Preview panel */}
          {preview ? (
            <div className="p-8 bg-cream min-h-[400px]">
              {form.cover_url && (
                <img src={form.cover_url} alt="" className="w-full h-56 object-cover rounded-sm mb-6" />
              )}
              <p className="text-xs tracking-widest text-gold uppercase mb-2">{form.author}</p>
              <h1 className="font-serif text-3xl font-light text-navy mb-4">
                {tab === 'es' ? form.title_es : form.title_en}
              </h1>
              <p className="text-sm text-navy/60 italic mb-6 border-l-2 border-gold/40 pl-4">
                {tab === 'es' ? form.excerpt_es : form.excerpt_en}
              </p>
              <div
                className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-navy prose-p:text-navy/80 prose-a:text-gold prose-strong:text-navy prose-blockquote:border-gold"
                dangerouslySetInnerHTML={{ __html: tab === 'es' ? form.content_es : form.content_en }}
              />
              <div className="mt-6 pt-4 border-t border-navy/10 flex items-center gap-2 text-xs text-navy/40">
                <span className={`px-2 py-0.5 rounded-full border text-[10px] tracking-widest ${form.published ? 'text-green-700 border-green-200 bg-green-50' : 'text-navy/40 border-navy/15'}`}>
                  {form.published ? 'PUBLICADO' : 'BORRADOR'}
                </span>
                <span>· {form.reading_time} min · {form.slug}</span>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-6">
            {/* Shared fields */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Autora</label>
                <input className={inputCls} value={form.author} onChange={e => set('author', e.target.value)} placeholder="Nombre completo" />
              </div>
              <div>
                <label className={labelCls}>Slug (URL)</label>
                <input className={inputCls} value={form.slug} onChange={e => set('slug', slugify(e.target.value))} placeholder="mi-articulo" />
              </div>
            </div>

            {/* Category selector */}
            <div>
              <label className={labelCls}>Categoría</label>
              <select
                className={inputCls}
                value={form.category ?? ''}
                onChange={e => set('category', e.target.value || null as unknown as string)}
              >
                <option value="">Sin categoría</option>
                <option value="filosofia-metodo">Filosofía y Método TEXTUM</option>
                <option value="rigor-escritura">Rigor y Escritura Científica</option>
                <option value="sustentacion-defensa">Sustentación y Defensa Oral</option>
              </select>
              <p className="text-xs text-navy/40 mt-1.5">Define en qué sección del blog aparecerá este artículo.</p>
            </div>

            <div>
              <label className={labelCls}>Imagen de portada</label>
              <p className="text-xs text-navy/40 mb-2">Formatos permitidos: .webp o .png optimizado · Peso máximo recomendado: 300 KB</p>
              <CoverImagePicker value={form.cover_url} onChange={(url) => set('cover_url', url)} />
            </div>

            {/* Language tabs */}
            <div className="border border-navy/10 rounded-sm overflow-hidden">
              <div className="flex border-b border-navy/10">
                {(['es', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setTab(l)}
                    className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${tab === l ? 'bg-navy text-gold' : 'bg-white text-navy/50 hover:bg-navy/5'}`}>
                    {l === 'es' ? 'ES — Español' : 'EN — English'}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-white space-y-4">
                {tab === 'es' ? (
                  <>
                    <div>
                      <label className={labelCls}>Título del Artículo o Guía Académica (ES)</label>
                      <input className={inputCls} value={form.title_es} onChange={e => handleTitleEs(e.target.value)} placeholder='Ej: "Cómo estructurar la metodología de tu tesis..."' />
                    </div>
                    <div>
                      <label className={labelCls}>Resumen y Palabras Clave / Keywords (ES)</label>
                      <textarea className={inputCls} rows={3} value={form.excerpt_es} onChange={e => set('excerpt_es', e.target.value)}
                        placeholder="Escribe el resumen ejecutivo del artículo (2-3 frases) que servirá de gancho en la tarjeta y añade abajo de 3 a 5 palabras clave científicas separadas por comas." />
                    </div>
                    <div>
                      <label className={labelCls}>Contenido (ES)</label>
                      <RichTextEditor content={form.content_es} onChange={(html) => set('content_es', html)} placeholder="Escribe el artículo en español..." />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>Article Title (English translation)</label>
                      <input className={inputCls} value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder='E.g. "How to structure the methodology of your thesis..."' />
                    </div>
                    <div>
                      <label className={labelCls}>Abstract and Keywords (English)</label>
                      <textarea className={`${inputCls}`} rows={3} value={form.excerpt_en} onChange={e => set('excerpt_en', e.target.value)}
                        placeholder="Coloca aquí la traducción técnica del resumen y las palabras clave en inglés para mejorar la indización bilingüe de la plataforma." />
                    </div>
                    <div>
                      <label className={labelCls}>Content (EN)</label>
                      <RichTextEditor content={form.content_en} onChange={(html) => set('content_en', html)} placeholder="Write the article in English..." />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Published toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => set('published', !form.published)}
                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${form.published ? 'bg-gold' : 'bg-navy/20'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${form.published ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-navy/70">{form.published ? 'Publicado' : 'Borrador'}</span>
            </div>

            {err && <p className="text-red-500 text-sm">{err}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-xs tracking-widest rounded-sm disabled:opacity-70">
                <Save size={14} />
                <span>{saving ? 'GUARDANDO...' : 'GUARDAR'}</span>
              </button>
              <button onClick={onCancel}
                className="px-8 py-3 text-xs tracking-widest rounded-sm border border-navy/20 text-navy/60 hover:border-navy/40 transition-colors">
                CANCELAR
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MFA setup modal (activar verificación en dos pasos) ───────────────────
function MfaSetup({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<'loading' | 'scan' | 'done'>('loading');
  const [qr, setQr] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [existingFactors, setExistingFactors] = useState<{ id: string; status: string }[]>([]);

  useEffect(() => {
    (async () => {
      // Si ya hay un factor TOTP verificado, no hace falta enrolar de nuevo
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.filter(f => f.status === 'verified') ?? [];
      setExistingFactors(verified);
      if (verified.length > 0) {
        setStep('done');
        return;
      }

      // Limpia cualquier factor TOTP a medio enrolar de un intento anterior
      // (si no, Supabase rechaza el nuevo intento por nombre duplicado)
      const unverified = factors?.totp?.filter(f => f.status !== 'verified') ?? [];
      for (const f of unverified) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) {
        setErr(error.message);
        return;
      }
      setQr(data.totp.qr_code);
      setFactorId(data.id);
      setStep('scan');
    })();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setErr('');
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr) { setErr(chErr.message); setVerifying(false); return; }
    const { error: verErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verErr) { setErr('Código incorrecto. Verifica la hora de tu teléfono e inténtalo de nuevo.'); setVerifying(false); return; }
    setVerifying(false);
    onEnabled();
  };

  const handleUnenroll = async () => {
    if (!confirm('¿Desactivar la verificación en dos pasos? Esto reduce la seguridad de tu cuenta.')) return;
    for (const f of existingFactors) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    onEnabled();
  };

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-sm shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy/10">
          <h2 className="font-serif text-xl text-navy">Verificación en dos pasos</h2>
          <button onClick={onClose} className="text-navy/40 hover:text-navy"><X size={18} /></button>
        </div>

        <div className="p-6">
          {step === 'loading' && (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-gold" size={28} />
            </div>
          )}

          {step === 'scan' && (
            <div className="space-y-5">
              <p className="text-sm text-navy/60 leading-relaxed">
                Escanea este código QR con Google Authenticator, Authy, o tu app autenticadora preferida.
              </p>
              <div className="flex justify-center bg-cream rounded-sm p-4">
                <img src={qr} alt="Código QR para verificación en dos pasos" className="w-48 h-48" />
              </div>
              <form onSubmit={handleVerify} className="space-y-3">
                <label className="block text-navy/50 text-xs tracking-widest uppercase">Código de 6 dígitos</label>
                <input
                  type="text" inputMode="numeric" autoFocus value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required maxLength={6}
                  className="w-full border border-navy/15 rounded-sm px-4 py-3 text-navy text-center text-2xl tracking-[0.3em] focus:outline-none focus:border-gold/60"
                  placeholder="000000"
                />
                {err && <p className="text-red-500 text-xs">{err}</p>}
                <button type="submit" disabled={verifying || code.length !== 6}
                  className="btn-primary w-full py-3 text-xs tracking-[0.15em] rounded-sm disabled:opacity-50">
                  <span>{verifying ? 'VERIFICANDO...' : 'ACTIVAR'}</span>
                </button>
              </form>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-green-50 flex items-center justify-center">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <p className="text-navy/70 text-sm">La verificación en dos pasos ya está activa para tu cuenta.</p>
              <button onClick={handleUnenroll}
                className="text-red-500 text-xs tracking-widest hover:underline">
                DESACTIVAR VERIFICACIÓN EN DOS PASOS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main admin panel ─────────────────────────────────────────────────────────
export default function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMfaSetup, setShowMfaSetup] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    setPosts(data ?? []);
    setLoading(false);
  };

  useEffect(() => { if (session) fetchPosts(); }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo permanentemente?')) return;
    await supabase.from('posts').delete().eq('id', id);
    fetchPosts();
  };

  const togglePublished = async (post: Post) => {
    await supabase.from('posts').update({ published: !post.published }).eq('id', post.id);
    fetchPosts();
  };

  if (!session) return <LoginForm onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="glass-navy border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl tracking-[0.2em] text-white">TEXTUM <span className="text-gold/60 text-sm font-sans font-light tracking-widest">ADMIN</span></span>
        <div className="flex items-center gap-5">
          <button onClick={() => setShowMfaSetup(true)}
            className="flex items-center gap-2 text-white/50 hover:text-gold text-xs tracking-widest transition-colors">
            <ShieldCheck size={14} /> SEGURIDAD
          </button>
          <button onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-2 text-white/50 hover:text-white text-xs tracking-widest transition-colors">
            <LogOut size={14} /> SALIR
          </button>
        </div>
      </div>


      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <h1 className="font-serif text-3xl text-navy">Artículos del blog</h1>
          <button onClick={() => setEditing(EMPTY)}
            className="btn-primary flex items-center gap-2 px-6 py-3 text-xs tracking-widest rounded-sm">
            <Plus size={14} />
            <span>NUEVO ARTÍCULO</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <svg className="animate-spin w-6 h-6 text-gold" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-navy/15 rounded-sm">
            <p className="text-navy/40 font-serif italic text-lg">No hay artículos todavía.</p>
            <button onClick={() => setEditing(EMPTY)} className="mt-4 text-gold text-sm hover:underline">Crea el primero →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id}
                className="bg-white border border-navy/8 rounded-sm px-6 py-4 flex items-center gap-4 hover:border-gold/20 transition-colors">
                {post.cover_url && (
                  <img src={post.cover_url} alt="" className="w-14 h-14 object-cover rounded-sm flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-navy truncate">{post.title_es}</p>
                  <p className="text-xs text-navy/40 mt-0.5">{post.author} · {new Date(post.created_at).toLocaleDateString('es-ES')} · {post.reading_time} min{post.category ? ` · ${post.category}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] tracking-widest px-2 py-0.5 rounded-full border ${post.published ? 'text-green-700 border-green-200 bg-green-50' : 'text-navy/40 border-navy/15 bg-navy/5'}`}>
                    {post.published ? 'PUBLICADO' : 'BORRADOR'}
                  </span>
                  <button onClick={() => togglePublished(post)} title="Cambiar estado"
                    className="p-2 text-navy/40 hover:text-navy transition-colors">
                    {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => setEditing(post)}
                    className="px-3 py-1.5 text-xs border border-navy/15 rounded-sm text-navy/60 hover:border-gold/40 hover:text-navy transition-colors">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(post.id)}
                    className="p-2 text-red-400/60 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing !== null && (
        <PostEditor
          initial={editing}
          onSave={() => { setEditing(null); fetchPosts(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      {showMfaSetup && (
        <MfaSetup
          onClose={() => setShowMfaSetup(false)}
          onEnabled={() => setShowMfaSetup(false)}
        />
      )}
    </div>
  );
}
