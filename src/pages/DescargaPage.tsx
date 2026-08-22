// src/pages/DescargaPage.tsx
import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, Download, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TurnstileWidget from '../components/TurnstileWidget';
import { turnstileConfigured } from '../lib/turnstile';
import { diagnosisHref, trackConversion } from '../lib/conversion';

const RESOURCES: Record<string, { title_es: string; title_en: string; type: string }> = {
  'pt-01': {
    title_es: 'PT-01 · El problema científico orienta toda la investigación',
    title_en: 'PT-01 · The scientific problem guides the entire research',
    type: 'principio',
  },
  'cm-01': {
    title_es: 'CM-01 · Marco Teórico Referencial',
    title_en: 'CM-01 · Theoretical Referential Framework',
    type: 'categoria',
  },
  'ht-01': {
    title_es: 'HT-01 · 20 preguntas para comprobar la coherencia metodológica',
    title_en: 'HT-01 · 20 questions to check methodological coherence',
    type: 'herramienta',
  },
  'ht-02': {
    title_es: 'HT-02 · 20 preguntas para comprobar la coherencia del MTR',
    title_en: 'HT-02 · 20 questions to check MTR coherence',
    type: 'herramienta',
  },
};

export default function DescargaPage() {
  const { tipo, slug } = useParams<{ tipo: string; slug: string }>();
  const { lang } = useLang();
  const resource = slug ? RESOURCES[slug] : null;

  const [form, setForm] = useState({
    name: '',
    email: '',
    institution: '',
    country: '',
    role: '',
    privacy: false,
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const onTurnstileToken = useCallback((token: string) => setTurnstileToken(token), []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resource || !slug) return;

    if (!form.privacy) {
      setErrorMsg(lang === 'es' ? 'Debes aceptar la política de privacidad.' : 'You must accept the privacy policy.');
      return;
    }
    if (turnstileConfigured && !turnstileToken) {
      setErrorMsg(lang === 'es' ? 'Completa la verificación de seguridad.' : 'Complete the security check.');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/lead-magnet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
  name: form.name,
  email: form.email,
  institution: form.institution || null,
  country: form.country || null,
  role: form.role || null,
  resource_slug: slug,
  resource_type: resource.type,
  resource_title: lang === 'es' ? resource.title_es : resource.title_en,
  lang,                    // ← ya lo tenías
  source: 'coleccion',
  privacy_accepted: true,
  turnstileToken,
}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (lang === 'es' ? 'Error al procesar la solicitud' : 'Error processing request'));
      }

      setDownloadUrl(data.downloadUrl);
      setStatus('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setErrorMsg(message || (lang === 'es' ? 'Error inesperado' : 'Unexpected error'));
      setStatus('error');
    }
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <p className="font-serif text-2xl text-navy/40 mb-4">
              {lang === 'es' ? 'Recurso no encontrado' : 'Resource not found'}
            </p>
            <Link to="/colecciones" className="text-gold text-sm hover:underline">
              {lang === 'es' ? 'Volver a Colecciones' : 'Back to Collections'}
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const title = lang === 'es' ? resource.title_es : resource.title_en;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Navbar />

      <div className="flex-1 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <Link
            to={`/colecciones/${tipo}/${slug}`}
            className="inline-flex items-center gap-2 text-sm text-navy/50 hover:text-gold mb-10 transition-colors"
          >
            <ArrowLeft size={14} />
            {lang === 'es' ? 'Volver al documento' : 'Back to document'}
          </Link>

          <div className="bg-white rounded-2xl border border-navy/10 shadow-sm p-8">
            {status === 'success' && downloadUrl ? (
              <div className="text-center space-y-6">
                <CheckCircle2 className="w-14 h-14 text-gold mx-auto" />
                <div>
                  <h1 className="font-serif text-2xl text-navy mb-2">
                    {lang === 'es' ? '¡Listo!' : 'Ready!'}
                  </h1>
                  <p className="text-navy/65 text-sm">
                    {lang === 'es'
                      ? 'Te hemos enviado el enlace también por correo. Puedes descargarlo ahora:'
                      : 'We also sent the link by email. You can download it now:'}
                  </p>
                </div>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-navy hover:bg-navy/90 text-cream font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  <Download size={18} />
                  {lang === 'es' ? 'Descargar PDF' : 'Download PDF'}
                </a>
                <p className="text-xs text-navy/40">
                  {lang === 'es' ? 'El enlace caduca en 15 minutos.' : 'The link expires in 15 minutes.'}
                </p>
                <div className="pt-6 border-t border-navy/10">
                  <p className="text-sm text-navy/65 mb-3">
                    {lang === 'es'
                      ? '¿Quieres que revisemos la coherencia de tu investigación?'
                      : 'Would you like us to review the coherence of your research?'}
                  </p>
                  <a
                    href={diagnosisHref()}
                    onClick={() => trackConversion('diagnosis_cta_click', { placement: 'download-success' })}
                    className="text-gold font-medium hover:underline text-sm"
                  >
                    {lang === 'es' ? 'Solicita tu diagnóstico gratuito →' : 'Request your free diagnosis →'}
                  </a>
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-xl text-navy mb-1">
                  {lang === 'es' ? 'Descargar PDF profesional' : 'Download professional PDF'}
                </h1>
                <p className="text-navy/55 text-sm mb-7 leading-relaxed">{title}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-navy/80 mb-1.5">
                      {lang === 'es' ? 'Nombre completo *' : 'Full name *'}
                    </label>
                    <input
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-navy/15 bg-cream/40 px-3.5 py-2.5 text-sm text-navy focus:ring-2 focus:ring-gold/40 focus:border-gold outline-none transition"
                      placeholder={lang === 'es' ? 'Tu nombre' : 'Your name'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy/80 mb-1.5">
                      Email *
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-navy/15 bg-cream/40 px-3.5 py-2.5 text-sm text-navy focus:ring-2 focus:ring-gold/40 focus:border-gold outline-none transition"
                      placeholder={lang === 'es' ? 'tu@email.com' : 'you@email.com'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-navy/80 mb-1.5">
                      {lang === 'es' ? 'Institución / Universidad' : 'Institution / University'}
                    </label>
                    <input
                      name="institution"
                      value={form.institution}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-navy/15 bg-cream/40 px-3.5 py-2.5 text-sm text-navy focus:ring-2 focus:ring-gold/40 focus:border-gold outline-none transition"
                      placeholder={lang === 'es' ? 'Opcional' : 'Optional'}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-navy/80 mb-1.5">
                        {lang === 'es' ? 'País' : 'Country'}
                      </label>
                      <input
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-navy/15 bg-cream/40 px-3.5 py-2.5 text-sm text-navy focus:ring-2 focus:ring-gold/40 focus:border-gold outline-none transition"
                        placeholder={lang === 'es' ? 'España, México...' : 'Spain, Mexico...'}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-navy/80 mb-1.5">
                        {lang === 'es' ? 'Rol' : 'Role'}
                      </label>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="w-full rounded-xl border border-navy/15 bg-cream/40 px-3.5 py-2.5 text-sm text-navy focus:ring-2 focus:ring-gold/40 focus:border-gold outline-none transition"
                      >
                        <option value="">{lang === 'es' ? 'Seleccionar' : 'Select'}</option>
                        <option value="doctorando">{lang === 'es' ? 'Doctorando/a' : 'PhD candidate'}</option>
                        <option value="director">{lang === 'es' ? 'Director/a de tesis' : 'Thesis supervisor'}</option>
                        <option value="investigador">{lang === 'es' ? 'Investigador/a' : 'Researcher'}</option>
                        <option value="otro">{lang === 'es' ? 'Otro' : 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      name="privacy"
                      id="privacy"
                      checked={form.privacy}
                      onChange={handleChange}
                      className="mt-1 rounded border-navy/25 text-gold focus:ring-gold/40"
                    />
                    <label htmlFor="privacy" className="text-xs text-navy/55 leading-relaxed">
                      {lang === 'es'
                        ? 'Acepto recibir el documento y comunicaciones de TEXTUM. Puedo darme de baja en cualquier momento. *'
                        : 'I agree to receive the document and communications from TEXTUM. I can unsubscribe at any time. *'}
                    </label>
                  </div>

                  <TurnstileWidget onToken={onTurnstileToken} />

                  {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="w-full flex items-center justify-center gap-2 bg-navy hover:bg-navy/90 disabled:opacity-50 text-cream font-medium py-3 rounded-xl transition-colors"
                  >
                    {status === 'loading' ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        {lang === 'es' ? 'Generando enlace...' : 'Generating link...'}
                      </>
                    ) : (
                      <>
                        <Download size={18} />
                        {lang === 'es' ? 'Descargar PDF' : 'Download PDF'}
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}