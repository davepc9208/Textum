// src/components/ArticleQuestion.tsx
// Cajón de preguntas al final de cada artículo del blog.
// Pide nombre, email y pregunta, y guarda el lead en Supabase vía
// /api/question. La pregunta no se publica: se responde por email.

import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Send } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import TurnstileWidget from './TurnstileWidget';
import { turnstileConfigured } from '../lib/turnstile';
import { getAttribution } from '../lib/attribution';
import { localizedPath } from '../lib/locale';

interface Props {
  postSlug: string;
  postTitle: string;
}

const COPY = {
  es: {
    label: 'Preguntas',
    title: '¿Tienes una duda sobre este artículo?',
    intro: 'Escríbela aquí y te respondo por email. No se publica.',
    name: 'Nombre',
    namePlaceholder: 'Cómo te llamas',
    email: 'Email',
    emailPlaceholder: 'tu@email.com',
    question: 'Tu pregunta',
    questionPlaceholder: '¿Qué te ha quedado en el aire?',
    consent: 'Acepto la ',
    consentLink: 'política de privacidad',
    consentTail: ' y que me respondas a este email.',
    send: 'Enviar pregunta',
    sending: 'Enviando…',
    successTitle: 'Pregunta recibida',
    successBody: 'Te responderé a tu email en uno o dos días laborables.',
    errorName: 'Escribe tu nombre.',
    errorEmail: 'Introduce un email válido.',
    errorQuestion: 'Cuéntame la pregunta con un poco más de detalle.',
    errorConsent: 'Necesito tu consentimiento para poder responderte.',
    errorCaptcha: 'Completa la verificación de seguridad.',
    errorSend: 'No se pudo enviar la pregunta. Inténtalo de nuevo.',
  },
  en: {
    label: 'Questions',
    title: 'Do you have a question about this article?',
    intro: 'Write it here and I will reply by email. It is not published.',
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    question: 'Your question',
    questionPlaceholder: 'What is still unclear?',
    consent: 'I accept the ',
    consentLink: 'privacy policy',
    consentTail: ' and that you reply to this email.',
    send: 'Send question',
    sending: 'Sending…',
    successTitle: 'Question received',
    successBody: 'I will reply to your email within one or two working days.',
    errorName: 'Please enter your name.',
    errorEmail: 'Please enter a valid email.',
    errorQuestion: 'Please describe your question in a little more detail.',
    errorConsent: 'I need your consent to reply.',
    errorCaptcha: 'Please complete the security check.',
    errorSend: 'The question could not be sent. Please try again.',
  },
} as const;

const INPUT =
  'w-full rounded-sm border border-navy/15 bg-white px-4 py-3 text-sm text-navy placeholder-navy/30 shadow-sm transition-all focus:border-gold/60 focus:outline-none';
const LABEL = 'mb-2 block text-[10px] uppercase tracking-[0.2em] text-navy/50';

export default function ArticleQuestion({ postSlug, postTitle }: Props) {
  const { lang } = useLang();
  const c = COPY[lang === 'en' ? 'en' : 'es'];

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const onToken = useCallback((value: string) => setToken(value), []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (honeypot) return;
    setError('');

    if (name.trim().length < 2) { setError(c.errorName); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) { setError(c.errorEmail); return; }
    if (question.trim().length < 10) { setError(c.errorQuestion); return; }
    if (!accepted) { setError(c.errorConsent); return; }
    if (turnstileConfigured && !token) { setError(c.errorCaptcha); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          question: question.trim(),
          post_slug: postSlug,
          post_title: postTitle,
          lang,
          privacy_accepted: accepted,
          turnstileToken: token,
          attribution: getAttribution(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || c.errorSend);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.errorSend);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="mt-12 border-t border-navy/10 pt-8">
        <div className="flex items-start gap-3">
          <CheckCircle size={18} className="mt-0.5 flex-shrink-0 text-gold" aria-hidden="true" />
          <div>
            <p className="font-serif text-xl font-light text-navy">{c.successTitle}</p>
            <p className="mt-1 text-sm font-light text-navy/55">{c.successBody}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-12 border-t border-navy/10 pt-8">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold">{c.label}</p>
      <h2 className="mt-2 font-serif text-2xl font-light text-navy sm:text-3xl">{c.title}</h2>
      <p className="mt-2 text-sm font-light text-navy/55">{c.intro}</p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="hidden" aria-hidden="true">
          <input type="text" name="b_field" value={honeypot} onChange={e => setHoneypot(e.target.value)} autoComplete="new-password" tabIndex={-1} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="aq-name" className={LABEL}>{c.name}</label>
            <input id="aq-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={c.namePlaceholder} className={INPUT} />
          </div>
          <div>
            <label htmlFor="aq-email" className={LABEL}>{c.email}</label>
            <input id="aq-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={c.emailPlaceholder} className={INPUT} />
          </div>
        </div>

        <div>
          <label htmlFor="aq-question" className={LABEL}>{c.question}</label>
          <textarea id="aq-question" rows={4} value={question} onChange={e => setQuestion(e.target.value)} required placeholder={c.questionPlaceholder}
            className={`${INPUT} resize-none`} />
        </div>

        <label className="flex items-start gap-2.5 text-xs font-light text-navy/55">
          <input type="checkbox" checked={accepted} onChange={e => setAccepted(e.target.checked)} className="mt-0.5 accent-gold" />
          <span>
            {c.consent}
            <Link to={localizedPath('/privacidad', lang)} className="text-gold underline-offset-2 hover:underline">{c.consentLink}</Link>
            {c.consentTail}
          </span>
        </label>

        <TurnstileWidget onToken={onToken} />

        {error && <p className="text-xs text-red-600" role="alert">{error}</p>}

        <button type="submit" disabled={loading}
          className="btn-primary flex items-center justify-center gap-2 rounded-sm px-6 py-3 text-xs tracking-[0.18em] disabled:opacity-60">
          <Send size={14} aria-hidden="true" />
          {loading ? c.sending : c.send}
        </button>
      </form>
    </section>
  );
}
