// AdminPage.tsx
import { useState, useEffect, useRef } from 'react';
import { supabase, Post } from '../lib/supabase';
import { LogOut, Plus, Trash2, Eye, EyeOff, Save, X, Upload, ImageOff, Loader2, ShieldCheck, Users, Download, Search } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import RichTextEditor from '../components/RichTextEditor';
import AdminDistribute from '../components/AdminDistribute';
import { optimizeImage } from '../lib/imageOptimization';
import { sanitizeHtml } from '../lib/sanitize';

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
  keywords_es: '',
  keywords_en: '',
  content_es: '',
  content_en: '',
  author: '',
  cover_url: '',
  cover_alt: '',
  published: false,
  reading_time: 1,
  category: null,
  collection_type: null,
};

// ─── Login form (con soporte 2FA) ──────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [needsMfa, setNeedsMfa] = useState(false);
  const [needsMfaSetup, setNeedsMfaSetup] = useState(false);
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

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factors } = await supabase.auth.mfa.listFactors();
    const verifiedFactor = factors?.totp?.find((factor: { status: string }) => factor.status === 'verified');

    if (aal?.currentLevel === 'aal2') {
      onLogin();
    } else if (verifiedFactor) {
      setFactorId(verifiedFactor.id);
      setNeedsMfa(true);
      setLoading(false);
      return;
    } else {
      setNeedsMfaSetup(true);
      setLoading(false);
      return;
    }
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

  if (needsMfaSetup) {
    return (
      <MfaSetup
        onClose={() => { setNeedsMfaSetup(false); supabase.auth.signOut(); }}
        onEnabled={() => { setNeedsMfaSetup(false); onLogin(); }}
      />
    );
  }

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

    const allowed = ['image/webp', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErr('Formato no permitido. Sube únicamente imágenes .webp o .png.');
      e.target.value = '';
      return;
    }
    if (file.size > 300 * 1024) {
      setErr(`El archivo pesa ${(file.size / 1024).toFixed(0)} KB. El máximo recomendado es 300 KB. Comprímelo antes de subir.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setErr('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo.');
      const optimizedFile = await optimizeImage(file);
      const formData = new FormData();
      formData.append('file', optimizedFile, optimizedFile.name);
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || `Error ${response.status}`);
      onChange(data.url);
    } catch (error) {
      setErr('No se pudo subir la imagen: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setUploading(false);
    }
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
type EditablePost = Omit<Post, 'id' | 'created_at'>;

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

  const [form, setForm] = useState<EditablePost>(() => {
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
  const [draftTooLarge, setDraftTooLarge] = useState(false);
  const [draftSizeKB, setDraftSizeKB] = useState<number | null>(null);

  // 🆕 Estados para traducción automática
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState('');
  const [lastTranslated, setLastTranslated] = useState<string | null>(null);

  // ─── ✨ NUEVO: Guardado de draft con límite de 400 KB y compresión ──────
  useEffect(() => {
    try {
      const serialized = JSON.stringify(form);
      const sizeKB = Math.round(serialized.length / 1024);
      setDraftSizeKB(sizeKB);

      // Límite de 400 KB para evitar saturar localStorage (5 MB total)
      const MAX_DRAFT_BYTES = 400_000; // 400 KB

      if (serialized.length > MAX_DRAFT_BYTES) {
        // El draft es demasiado grande — intentamos comprimirlo
        console.warn(
          `[TEXTUM] Draft demasiado grande (${sizeKB} KB), ` +
          `intentando comprimir...`
        );

        // Estrategia de compresión: eliminar espacios en blanco del HTML
        // y acortar campos opcionales si es posible
        const compressedForm = { ...form };
        
        // Comprimir contenido HTML eliminando espacios innecesarios
        if (compressedForm.content_es) {
          compressedForm.content_es = compressedForm.content_es
            .replace(/\s{2,}/g, ' ') // múltiples espacios a uno
            .replace(/>\s+</g, '><') // espacios entre etiquetas
            .trim();
        }
        if (compressedForm.content_en) {
          compressedForm.content_en = compressedForm.content_en
            .replace(/\s{2,}/g, ' ')
            .replace(/>\s+</g, '><')
            .trim();
        }

        const compressedSerialized = JSON.stringify(compressedForm);
        const compressedSizeKB = Math.round(compressedSerialized.length / 1024);

        if (compressedSerialized.length <= MAX_DRAFT_BYTES) {
          // La compresión funcionó
          localStorage.setItem(draftKey, compressedSerialized);
          setHasDraft(true);
          setDraftTooLarge(false);
          console.log(
            `[TEXTUM] Draft comprimido de ${sizeKB} KB a ${compressedSizeKB} KB ✅`
          );
        } else {
          // Incluso comprimido es demasiado grande
          setDraftTooLarge(true);
          console.warn(
            `[TEXTUM] Draft demasiado grande incluso comprimido (${compressedSizeKB} KB). ` +
            `El usuario debe guardar manualmente.`
          );
          // No guardamos en localStorage
        }
        return;
      }

      // Draft de tamaño normal — guardar normalmente
      localStorage.setItem(draftKey, serialized);
      setHasDraft(true);
      setDraftTooLarge(false);
    } catch (error) {
      // localStorage lleno o no disponible
      console.warn('[TEXTUM] No se pudo guardar el draft:', error);
      setDraftTooLarge(true);
    }
  }, [form, draftKey]);

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
    setHasDraft(false);
    setDraftTooLarge(false);
  };

  const set = (k: keyof typeof EMPTY, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTitleEs = (v: string) => {
    set('title_es', v);
    if (!initial.id) set('slug', slugify(v));
  };

  // 🆕 Función para traducir al inglés con IA
  const handleTranslate = async () => {
    if (!form.title_es || !form.content_es) {
      setTranslateError('Escribe el título y el contenido en español antes de traducir.');
      return;
    }
    setTranslating(true);
    setTranslateError('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Tu sesión ha caducado. Inicia sesión de nuevo.');
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title_es:    form.title_es,
          excerpt_es:  form.excerpt_es,
          content_es:  form.content_es,
          keywords_es: form.keywords_es,
          }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      set('title_en',    data.title_en);
      set('excerpt_en',  data.excerpt_en);
      set('content_en',  data.content_en);
      set('keywords_en', data.keywords_en ?? '');
      setLastTranslated(new Date().toLocaleTimeString('es-ES'));
      // Cambiar a la pestaña EN para que el usuario revise
      setTab('en');
    } catch (err) {
      setTranslateError(err instanceof Error ? err.message : 'Error al traducir.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');

    if (!form.slug) { setErr('El slug (URL) no puede estar vacío.'); setSaving(false); return; }
    if (!form.title_es) { setErr('El título en español es obligatorio.'); setSaving(false); return; }

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
          {/* ── Banner: Borrador autoguardado ── */}
          {hasDraft && !draftTooLarge && (
            <div className="bg-gold/10 border-b border-gold/30 px-8 py-2.5 flex items-center justify-between">
              <p className="text-xs text-navy/60">
                📝 Borrador autoguardado en este navegador. Tus cambios se guardan automáticamente mientras escribes.
                {draftSizeKB !== null && (
                  <span className="ml-2 text-navy/40 text-[10px]">
                    ({draftSizeKB} KB)
                  </span>
                )}
              </p>
              <button
                onClick={() => {
                  if (window.confirm('¿Descartar el borrador guardado?')) {
                    clearDraft();
                    setForm({ ...EMPTY, ...initial });
                  }
                }}
                className="text-xs text-navy/40 hover:text-red-500 transition-colors underline flex-shrink-0 ml-4"
              >
                Descartar borrador
              </button>
            </div>
          )}

          {/* ── ✨ NUEVO: Banner de advertencia por draft demasiado grande ── */}
          {draftTooLarge && (
            <div className="bg-amber-50 border-b border-amber-300 px-8 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-amber-600 text-lg">⚠️</span>
                <p className="text-xs text-amber-700">
                  <strong>El borrador es demasiado grande</strong> para autoguardarse 
                  {draftSizeKB !== null && ` (${draftSizeKB} KB)`}.
                  <br className="sm:hidden" />
                  <span className="text-amber-600">
                    Guarda manualmente usando el botón GUARDAR para no perder tus cambios.
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('¿Descartar el borrador guardado?')) {
                    clearDraft();
                    setForm({ ...EMPTY, ...initial });
                  }
                }}
                className="text-xs text-amber-500 hover:text-red-600 transition-colors underline flex-shrink-0 ml-4"
              >
                Descartar
              </button>
            </div>
          )}

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
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(tab === 'es' ? form.content_es : form.content_en) }}
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
  <label className={labelCls}>Tipo de Colección</label>
  <select
    className={inputCls}
    value={form.collection_type ?? ''}
    onChange={e => set('collection_type', e.target.value || null as unknown as string)}
  >
    <option value="">Blog — artículo normal</option>
    <option value="principio">PT — Principios TEXTUM</option>
    <option value="categoria">CM — Categorías Metodológicas</option>
    <option value="herramienta">HT — Herramientas TEXTUM</option>
    <option value="eii">EII — Enfoque Investigativo Integral</option>
  </select>
  <p className="text-xs text-navy/40 mt-1.5">
    Si seleccionas un tipo de Colección, la pieza no aparecerá en el Blog.
  </p>
</div>

            <div>
              <label className={labelCls}>Imagen de portada</label>
              <p className="text-xs text-navy/40 mb-2">Formatos permitidos: .webp o .png optimizado · Peso máximo recomendado: 300 KB</p>
              <CoverImagePicker value={form.cover_url} onChange={(url) => set('cover_url', url)} />
            </div>

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
  <label className={labelCls}>Resumen ejecutivo (ES)</label>
  <textarea className={inputCls} rows={3} value={form.excerpt_es} onChange={e => set('excerpt_es', e.target.value)}
    placeholder="2-3 frases de gancho que aparecen en la tarjeta del blog. Sin palabras clave aquí." />
</div>
<div>
  <label className={labelCls}>Palabras clave SEO (ES)</label>
  <input
    className={inputCls}
    value={form.keywords_es}
    onChange={e => set('keywords_es', e.target.value)}
    placeholder="Ej: mentoría académica, tesis doctoral, APA 7, escritura científica"
  />
  <p className="text-xs text-navy/40 mt-1.5 font-light">
    Separadas por comas. Se usan en la etiqueta <code>&lt;meta name="keywords"&gt;</code> del artículo publicado.
  </p>
</div>
                    <div>
                      <label className={labelCls}>Contenido (ES)</label>
                      <RichTextEditor content={form.content_es} onChange={(html) => set('content_es', html)} placeholder="Escribe el artículo en español..." />
                    </div>

                    {/* 🆕 Botón de traducción automática */}
                    <div className="mt-4 flex items-center justify-between gap-4 p-4 rounded-sm bg-navy/3 border border-navy/8">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-navy/70">
                          Traducción automática al inglés
                        </p>
                        <p className="text-[11px] text-navy/40 mt-0.5 leading-relaxed">
                          Traduce título, resumen y contenido usando IA (Groq · Llama 3.3).
                          Revisa siempre el resultado en la pestaña EN antes de publicar.
                        </p>
                        {translateError && (
                          <p className="text-[11px] text-red-500 mt-1">{translateError}</p>
                        )}
                        {lastTranslated && !translating && (
                          <p className="text-[11px] text-emerald-600 mt-1">
                            ✓ Traducido a las {lastTranslated} — revisa la pestaña EN
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleTranslate}
                        disabled={translating || !form.title_es || !form.content_es}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-wide rounded-sm bg-navy text-gold border border-gold/30 hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 whitespace-nowrap"
                      >
                        {translating ? (
                          <>
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3"/>
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                            Traduciendo…
                          </>
                        ) : (
                          <>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"/>
                            </svg>
                            Traducir al inglés
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 🆕 Banner de aviso para contenido traducido automáticamente */}
                    {lastTranslated && (
                      <div className="flex items-start gap-3 px-4 py-3 rounded-sm bg-amber-50 border border-amber-200 text-xs text-amber-800 mb-4">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        <span>
                          Contenido generado automáticamente a las {lastTranslated}.{' '}
                          <strong>Revisa y edita</strong> antes de publicar — especialmente los
                          términos técnicos, los encabezados y el tono académico.
                        </span>
                      </div>
                    )}
                    <div>
                      <label className={labelCls}>Article Title (English translation)</label>
                      <input className={inputCls} value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder='E.g. "How to structure the methodology of your thesis..."' />
                    </div>
                    <div>
  <label className={labelCls}>Abstract (English)</label>
  <textarea className={inputCls} rows={3} value={form.excerpt_en} onChange={e => set('excerpt_en', e.target.value)}
    placeholder="2-3 hook sentences for the blog card. No keywords here." />
</div>
<div>
  <label className={labelCls}>SEO Keywords (EN)</label>
  <input
    className={inputCls}
    value={form.keywords_en}
    onChange={e => set('keywords_en', e.target.value)}
    placeholder="E.g. academic mentoring, doctoral thesis, APA 7, scientific writing"
  />
  <p className="text-xs text-navy/40 mt-1.5 font-light">
    Comma-separated. Used in the <code>&lt;meta name="keywords"&gt;</code> tag of the published article.
  </p>
</div>
                    <div>
                      <label className={labelCls}>Content (EN)</label>
                      <RichTextEditor content={form.content_en} onChange={(html) => set('content_en', html)} placeholder="Write the article in English..." />
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={form.published}
                aria-label={form.published ? 'Artículo publicado — pulsa para pasar a borrador' : 'Artículo en borrador — pulsa para publicar'}
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

// ─── MFA setup modal ────────────────────────────────────────────────────────
function MfaSetup({ onClose, onEnabled }: { onClose: () => void; onEnabled: () => void }) {
  const [step, setStep] = useState<'loading' | 'scan' | 'done'>('loading');
  const [qr, setQr] = useState('');
  const [factorId, setFactorId] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.filter((f: { status: string }) => f.status === 'verified') ?? [];
      if (verified.length > 0) {
        setStep('done');
        return;
      }

      const unverified = factors?.totp?.filter((f: { status: string }) => f.status !== 'verified') ?? [];
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
              <p className="text-xs text-navy/45">
                La MFA es obligatoria para acceder a las operaciones administrativas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Modal para distribuir ────────────────────────────────────────────────────
function DistributeModal({
  post,
  onClose,
  onPublishSuccess,
}: {
  post: Post;
  onClose: () => void;
  onPublishSuccess: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="max-w-3xl mx-auto my-8 px-4">
        <div className="bg-navy/95 border border-gold/20 rounded-sm shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gold/20">
            <h2 className="font-serif text-xl text-white">Publicar y distribuir</h2>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">
            <AdminDistribute post={post} onPublishSuccess={onPublishSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Leads panel ────────────────────────────────────────────────────────────
type Lead = {
  id: string;
  name: string;
  email: string;
  institution: string | null;
  country: string | null;
  role: string | null;
  resource_slug: string | null;
  resource_type: string | null;
  resource_title: string | null;
  lang: string | null;
  source: string | null;
  status: string | null;
  utm_source?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  created_at: string;
  email_sent?: boolean | null;
  downloaded_at?: string | null;
  unsubscribed_at?: string | null;
};

const LEAD_STATUSES = ['nuevo', 'contactado', 'diagnostico', 'propuesta', 'cliente', 'perdido'] as const;
const STATUS_STYLE: Record<string, string> = {
  nuevo:       'border-navy/20 text-navy/60 bg-white',
  contactado:  'border-blue-200 text-blue-700 bg-blue-50',
  diagnostico: 'border-amber-200 text-amber-700 bg-amber-50',
  propuesta:   'border-violet-200 text-violet-700 bg-violet-50',
  cliente:     'border-green-200 text-green-700 bg-green-50',
  perdido:     'border-red-200 text-red-600 bg-red-50',
};

function LeadsPanel() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [filterResource, setFilterResource] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    setErr('');
    const { data, error } = await supabase
      .from('leads')
      .select('id,name,email,institution,country,role,resource_slug,resource_type,resource_title,lang,source,status,utm_source,utm_campaign,referrer,created_at,email_sent,downloaded_at,unsubscribed_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) {
      setErr(error.message + ' — ¿Tienes política SELECT para authenticated en la tabla leads?');
      setLeads([]);
    } else {
      setLeads((data as Lead[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setSavingId(id);
    const prev = leads;
    setLeads(curr => curr.map(l => (l.id === id ? { ...l, status } : l)));
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) {
      setErr(`No se pudo guardar el estado: ${error.message}`);
      setLeads(prev);
    }
    setSavingId(null);
  };

  const resources = Array.from(new Set(leads.map(l => l.resource_slug).filter(Boolean))) as string[];

  const filtered = leads.filter(l => {
    if (filterResource && l.resource_slug !== filterResource) return false;
    if (filterStatus && (l.status || 'nuevo') !== filterStatus) return false;
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      l.name?.toLowerCase().includes(s) ||
      l.email?.toLowerCase().includes(s) ||
      l.country?.toLowerCase().includes(s) ||
      l.institution?.toLowerCase().includes(s) ||
      l.resource_slug?.toLowerCase().includes(s) ||
      l.resource_title?.toLowerCase().includes(s)
    );
  });

  const activeCount = leads.filter(l => !l.unsubscribed_at).length;
  const unsubCount = leads.filter(l => !!l.unsubscribed_at).length;
  const clientCount = leads.filter(l => l.status === 'cliente').length;

  const exportCsv = () => {
    const header = ['fecha', 'nombre', 'email', 'institucion', 'pais', 'rol', 'recurso', 'tipo', 'idioma', 'estado', 'utm_source', 'utm_campaign', 'referrer', 'baja'];
    const rows = filtered.map(l => [
      new Date(l.created_at).toISOString(),
      JSON.stringify(l.name ?? ''),
      JSON.stringify(l.email ?? ''),
      JSON.stringify(l.institution ?? ''),
      JSON.stringify(l.country ?? ''),
      JSON.stringify(l.role ?? ''),
      JSON.stringify(l.resource_slug ?? ''),
      JSON.stringify(l.resource_type ?? ''),
      JSON.stringify(l.lang ?? ''),
      JSON.stringify(l.status ?? 'nuevo'),
      JSON.stringify(l.utm_source ?? ''),
      JSON.stringify(l.utm_campaign ?? ''),
      JSON.stringify(l.referrer ?? ''),
      l.unsubscribed_at ? 'si' : 'no',
    ].join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textum-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-navy">Leads</h1>
          <p className="text-sm text-navy/50 mt-1">
            {leads.length} registros · {activeCount} activos · {clientCount} clientes · {unsubCount} dados de baja
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeads}
            className="px-4 py-2 text-xs tracking-widest border border-navy/15 rounded-sm text-navy/60 hover:border-gold/40 hover:text-navy transition-colors"
          >
            ACTUALIZAR
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs tracking-widest rounded-sm disabled:opacity-50"
          >
            <Download size={14} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar nombre, email, país, recurso…"
            className="w-full bg-white border border-navy/15 rounded-sm pl-9 pr-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/60"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="bg-white border border-navy/15 rounded-sm px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/60"
        >
          <option value="">Todos los estados</option>
          {LEAD_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterResource}
          onChange={e => setFilterResource(e.target.value)}
          className="bg-white border border-navy/15 rounded-sm px-4 py-2.5 text-sm text-navy focus:outline-none focus:border-gold/60"
        >
          <option value="">Todos los recursos</option>
          {resources.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {err && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-sm">
          {err}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={28} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-navy/15 rounded-sm">
          <p className="text-navy/40 font-serif italic text-lg">No hay leads todavía.</p>
          <p className="text-xs text-navy/30 mt-2">Aparecerán cuando alguien descargue un PDF de colecciones.</p>
        </div>
      ) : (
        <div className="bg-white border border-navy/8 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 bg-navy/[0.03] text-left text-[10px] tracking-widest uppercase text-navy/45">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Nombre</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">País</th>
                  <th className="px-4 py-3 font-medium">Origen</th>
                  <th className="px-4 py-3 font-medium">Pipeline</th>
                  <th className="px-4 py-3 font-medium">Suscripción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className="border-b border-navy/5 hover:bg-gold/[0.04] transition-colors">
                    <td className="px-4 py-3 text-navy/50 whitespace-nowrap text-xs">
                      {new Date(l.created_at).toLocaleString('es-ES', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-navy font-medium">
                      {l.name}
                      {l.institution && (
                        <span className="block text-[11px] text-navy/40 font-normal truncate max-w-[160px]">
                          {l.institution}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${l.email}`} className="text-navy/70 hover:text-gold text-xs break-all">
                        {l.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-navy/60 text-xs whitespace-nowrap">
                      {l.country || '—'}
                      {l.role && <span className="text-navy/35"> · {l.role}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] tracking-widest px-2 py-0.5 rounded-full border border-gold/30 text-gold bg-gold/5">
                        {(l.resource_slug || l.source || '—').toUpperCase()}
                      </span>
                      {(l.utm_source || l.referrer) && (
                        <span className="block text-[10px] text-navy/40 mt-1 truncate max-w-[140px]">
                          {l.utm_campaign || l.utm_source || l.referrer}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={l.status || 'nuevo'}
                        disabled={savingId === l.id}
                        onChange={e => updateStatus(l.id, e.target.value)}
                        className={`text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border focus:outline-none focus:border-gold/60 disabled:opacity-50 ${STATUS_STYLE[l.status || 'nuevo'] ?? STATUS_STYLE.nuevo}`}
                      >
                        {LEAD_STATUSES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {l.unsubscribed_at ? (
                        <span className="text-[10px] tracking-widest px-2 py-0.5 rounded-full border border-red-200 text-red-600 bg-red-50">
                          BAJA
                        </span>
                      ) : (
                        <span className="text-[10px] tracking-widest px-2 py-0.5 rounded-full border border-green-200 text-green-700 bg-green-50">
                          ACTIVO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
  const [distributingPost, setDistributingPost] = useState<Post | null>(null);
  const [tab, setTab] = useState<'posts' | 'leads'>('posts');

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
        {/* Tabs */}
        <div className="flex items-center gap-1 mb-8 border-b border-navy/10">
          <button
            onClick={() => setTab('posts')}
            className={`px-5 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === 'posts'
                ? 'border-gold text-navy font-medium'
                : 'border-transparent text-navy/40 hover:text-navy'
            }`}
          >
            Artículos
          </button>
          <button
            onClick={() => setTab('leads')}
            className={`flex items-center gap-2 px-5 py-3 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px ${
              tab === 'leads'
                ? 'border-gold text-navy font-medium'
                : 'border-transparent text-navy/40 hover:text-navy'
            }`}
          >
            <Users size={13} />
            Leads
          </button>
        </div>

        {tab === 'leads' ? (
          <LeadsPanel />
        ) : (
        <>
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
                  <img src={post.cover_url} alt={post.cover_alt || post.title_es} className="w-14 h-14 object-cover rounded-sm flex-shrink-0" />
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
                    aria-label={post.published ? `Despublicar «${post.title_es}»` : `Publicar «${post.title_es}»`}
                    className="p-2 text-navy/40 hover:text-navy transition-colors">
                    {post.published ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => setEditing(post)}
                    className="px-3 py-1.5 text-xs border border-navy/15 rounded-sm text-navy/60 hover:border-gold/40 hover:text-navy transition-colors">
                    Editar
                  </button>
                  <button
                    onClick={() => setDistributingPost(post)}
                    className="px-3 py-1.5 text-xs border border-gold/30 rounded-sm text-gold hover:bg-gold hover:text-navy transition-colors"
                  >
                    📤 DISTRIBUIR
                  </button>
                  <button onClick={() => handleDelete(post.id)}
                    aria-label={`Eliminar «${post.title_es}»`}
                    className="p-2 text-red-400/60 hover:text-red-500 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </>
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

      {distributingPost && (
        <DistributeModal
          post={distributingPost}
          onClose={() => setDistributingPost(null)}
          onPublishSuccess={fetchPosts}
        />
      )}
    </div>
  );
}