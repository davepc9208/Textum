import { useState, useEffect } from 'react';
import { supabase, Post } from '../lib/supabase';
import { LogOut, Plus, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

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
};

// ─── Login form ─────────────────────────────────────────────────────────────
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      onLogin();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setErr(msg);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

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
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-white/50 text-xs tracking-widest mb-2 uppercase">Contraseña</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} required disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-gold/50 transition-all disabled:opacity-50" />
          </div>
          {err && <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-sm text-red-200 text-xs">{err}</div>}
          <button type="submit" disabled={loading}
            className="btn-primary w-full py-3 text-xs tracking-[0.15em] rounded-sm disabled:opacity-70">
            <span>{loading ? 'ENTRANDO...' : 'ENTRAR'}</span>
          </button>
        </form>
      </div>
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
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [tab, setTab] = useState<'es' | 'en'>('es');

  const set = (k: keyof typeof EMPTY, v: string | boolean | number) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleTitleEs = (v: string) => {
    set('title_es', v);
    if (!initial.id) set('slug', slugify(v));
  };

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
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
      if (error) throw error;
      onSave();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar';
      setErr(msg);
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-white border border-navy/15 rounded-sm px-4 py-2.5 text-navy text-sm focus:outline-none focus:border-gold/60 transition-all';
  const labelCls = 'block text-navy/50 text-xs tracking-widest mb-1.5 uppercase';

  return (
    <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto my-8 px-4">
        <div className="bg-cream rounded-sm shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-navy/10 bg-white">
            <h2 className="font-serif text-2xl text-navy">{initial.id ? 'Editar artículo' : 'Nuevo artículo'}</h2>
            <button onClick={onCancel} className="text-navy/40 hover:text-navy transition-colors"><X size={20} /></button>
          </div>

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
            <div>
              <label className={labelCls}>URL de imagen de portada</label>
              <input className={inputCls} value={form.cover_url} onChange={e => set('cover_url', e.target.value)} placeholder="https://..." />
            </div>

            {/* Language tabs */}
            <div className="border border-navy/10 rounded-sm overflow-hidden">
              <div className="flex border-b border-navy/10">
                {(['es', 'en'] as const).map(l => (
                  <button key={l} onClick={() => setTab(l)}
                    className={`flex-1 py-3 text-xs tracking-widest uppercase transition-colors ${tab === l ? 'bg-navy text-gold' : 'bg-white text-navy/50 hover:bg-navy/5'}`}>
                    {l === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                  </button>
                ))}
              </div>
              <div className="p-6 bg-white space-y-4">
                {tab === 'es' ? (
                  <>
                    <div>
                      <label className={labelCls}>Título (ES)</label>
                      <input className={inputCls} value={form.title_es} onChange={e => handleTitleEs(e.target.value)} placeholder="Título del artículo" />
                    </div>
                    <div>
                      <label className={labelCls}>Extracto (ES)</label>
                      <textarea className={inputCls} rows={2} value={form.excerpt_es} onChange={e => set('excerpt_es', e.target.value)} placeholder="Breve descripción (2-3 frases)" />
                    </div>
                    <div>
                      <label className={labelCls}>Contenido HTML (ES)</label>
                      <textarea className={`${inputCls} font-mono text-xs`} rows={12} value={form.content_es} onChange={e => set('content_es', e.target.value)} placeholder="<p>Escribe el contenido en HTML...</p>" />
                      <p className="text-xs text-navy/35 mt-1">Puedes usar etiquetas HTML: &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;blockquote&gt;</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={labelCls}>Title (EN)</label>
                      <input className={inputCls} value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder="Article title" />
                    </div>
                    <div>
                      <label className={labelCls}>Excerpt (EN)</label>
                      <textarea className={`${inputCls}`} rows={2} value={form.excerpt_en} onChange={e => set('excerpt_en', e.target.value)} placeholder="Brief description (2-3 sentences)" />
                    </div>
                    <div>
                      <label className={labelCls}>HTML Content (EN)</label>
                      <textarea className={`${inputCls} font-mono text-xs`} rows={12} value={form.content_en} onChange={e => set('content_en', e.target.value)} placeholder="<p>Write content in HTML...</p>" />
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

            {err && <p className="text-red-500 text-sm bg-red-50 border border-red-200 p-3 rounded-sm">{err}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving}
                className="btn-primary flex items-center gap-2 px-8 py-3 text-xs tracking-widest rounded-sm disabled:opacity-70">
                <Save size={14} />
                <span>{saving ? 'GUARDANDO...' : 'GUARDAR'}</span>
              </button>
              <button onClick={onCancel} disabled={saving}
                className="px-8 py-3 text-xs tracking-widest rounded-sm border border-navy/20 text-navy/60 hover:border-navy/40 transition-colors disabled:opacity-50">
                CANCELAR
              </button>
            </div>
          </div>
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
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data, error: err } = await supabase.auth.getSession();
        if (err) throw err;
        setSession(data.session);
      } catch (err) {
        console.error('Session init error:', err);
        setSession(null);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setPosts([]);
        setLoading(true);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchPosts = async () => {
    try {
      setError('');
      setLoading(true);
      const { data, error: err } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (err) throw err;
      setPosts(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar artículos';
      setError(msg);
      console.error('Fetch posts error:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (session) fetchPosts(); }, [session]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo permanentemente?')) return;
    try {
      setError('');
      const { error: err } = await supabase.from('posts').delete().eq('id', id);
      if (err) throw err;
      await fetchPosts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar artículo';
      setError(msg);
      console.error('Delete error:', err);
    }
  };

  const togglePublished = async (post: Post) => {
    try {
      setError('');
      const { error: err } = await supabase
        .from('posts')
        .update({ published: !post.published })
        .eq('id', post.id);
      if (err) throw err;
      await fetchPosts();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar estado';
      setError(msg);
      console.error('Toggle published error:', err);
    }
  };

  if (!session) return <LoginForm onLogin={() => supabase.auth.getSession().then(({ data }) => setSession(data.session))} />;

  return (
    <div className="min-h-screen bg-cream">
      {/* Top bar */}
      <div className="glass-navy border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <span className="font-serif text-xl tracking-[0.2em] text-white">TEXTUM <span className="text-gold/60 text-sm font-sans font-light tracking-widest">ADMIN</span></span>
        <button onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-white/50 hover:text-white text-xs tracking-widest transition-colors">
          <LogOut size={14} /> SALIR
        </button>
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

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
            {error}
          </div>
        )}

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
                  <p className="text-xs text-navy/40 mt-0.5">{post.author} · {new Date(post.created_at).toLocaleDateString('es-ES')} · {post.reading_time} min</p>
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
    </div>
  );
}
