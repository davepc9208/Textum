import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle, Mail, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useLang } from '../i18n/LangContext';
import { localizedPath } from '../lib/locale';
import { trackConversion } from '../lib/conversion';
import TurnstileWidget from './TurnstileWidget';
import { turnstileConfigured } from '../lib/turnstile';

type Role = 'user' | 'assistant';
type Need = 'defensa' | 'publicacion' | 'ajuste' | 'intensidad' | 'flux';
type Link = { label: string; url: string };
type Diagnostics = { source?: 'llm' | 'fallback'; llm_used?: boolean; web_used?: boolean; web_sources?: number; reason?: string };
type Message = { id: number; role: Role; content: string; need?: Need; links?: Link[]; followUp?: string; diagnostics?: Diagnostics };

type Copy = {
  title: string;
  subtitle: string;
  greeting: string;
  placeholder: string;
  send: string;
  close: string;
  open: string;
  quick: string;
  quickItems: string[];
  personal: string;
  personalIntro: string;
  name: string;
  email: string;
  country: string;
  privacy: string;
  submit: string;
  submitting: string;
  sent: string;
  sentDescription: string;
  back: string;
  privacyLink: string;
  security: string;
  unavailable: string;
  required: string;
  human: string;
  limitTitle: string;
  limitIntro: string;
  deadline: string;
  deadlineOptions: string[];
  dynamicCta: string;
  policyTitle: string;
  policyBack: string;
  policyIntro: string;
  policyYes: string;
  policyNo: string;
  policyFooter: string;
};

const COPY: Record<'es' | 'en', Copy> = {
  es: {
    title: 'Guía TEXTUM',
    subtitle: 'Acompañamiento académico inicial',
    greeting: 'Hola. soy la Guía TEXTUM. Puedo ayudarte a identificar el tipo de acompañamiento que necesita tu investigación.',
    placeholder: 'Cuéntame brevemente qué necesitas…',
    send: 'Enviar mensaje',
    close: 'Cerrar Guía TEXTUM',
    open: 'Abrir Guía TEXTUM',
    quick: 'Puedes empezar por aquí:',
    quickItems: ['No sé qué programa necesito', 'Tengo un problema metodológico', 'Quiero preparar una defensa'],
    personal: 'Quiero orientación personalizada',
    personalIntro: 'Déjanos tus datos y enviaremos al equipo un resumen breve de tu caso. No guardamos la transcripción de esta conversación.',
    name: 'Nombre y apellidos',
    email: 'Correo electrónico',
    country: 'País (opcional)',
    privacy: 'Acepto la política de privacidad y que TEXTUM use estos datos para responderme y orientarme sobre sus programas.',
    submit: 'Enviar mi solicitud',
    submitting: 'Enviando…',
    sent: 'Solicitud recibida',
    sentDescription: 'El equipo de TEXTUM revisará tu caso y te responderá en menos de 24 horas.',
    back: 'Volver a la conversación',
    privacyLink: 'política de privacidad',
    security: 'Conexión protegida. Tus mensajes no se guardan como transcripción.',
    unavailable: 'No puedo responder ahora. Puedes escribirnos directamente y te atenderemos.',
    required: 'Completa nombre, email y acepta la política de privacidad.',
    human: 'Hablar con el equipo',
    limitTitle: 'Hoy ya dimos muchas orientaciones automáticas',
    limitIntro: 'Para no perder calidad en la atención, seguimos disponibles directamente con el equipo de TEXTUM. Cuéntanos tu caso y te orientamos sin límites.',
    deadline: '¿Cuándo necesitas avanzar?',
    deadlineOptions: ['Menos de 2 semanas', 'Entre 2 y 6 semanas', 'Más de 6 semanas', 'Todavía no tengo fecha'],
    dynamicCta: 'Enviar mi caso al equipo',
    policyTitle: 'Uso ético de la IA',
    policyBack: 'Volver a la conversación',
    policyIntro: 'La IA asiste, el investigador crea, TEXTUM forma.',
    policyYes: 'TEXTUM sí utiliza IA para apoyo metodológico, detección de inconsistencias, optimización editorial y preparación de materiales, siempre con revisión humana.',
    policyNo: 'TEXTUM no genera tesis o artículos completos, no suplanta autoría, no fabrica resultados y no ayuda a ocultar plagio o uso indebido de IA.',
    policyFooter: 'La responsabilidad científica y la decisión final siempre pertenecen al investigador.',
  },
  en: {
    title: 'Guía TEXTUM',
    subtitle: 'Initial academic support',
    greeting: 'Hello. I am TEXTUM Guide. I can help you identify the type of support your research needs.',
    placeholder: 'Briefly tell me what you need…',
    send: 'Send message',
    close: 'Close TEXTUM Guide',
    open: 'Open TEXTUM Guide',
    quick: 'You can start here:',
    quickItems: ['I do not know which programme I need', 'I have a methodological problem', 'I want to prepare my defence'],
    personal: 'I want personalised guidance',
    personalIntro: 'Leave your details and we will send the team a brief summary of your case. We do not store the conversation transcript.',
    name: 'Full name',
    email: 'Email address',
    country: 'Country (optional)',
    privacy: 'I accept the privacy policy and agree that TEXTUM may use these data to reply and guide me about its programmes.',
    submit: 'Send my request',
    submitting: 'Sending…',
    sent: 'Request received',
    sentDescription: 'The TEXTUM team will review your case and reply within 24 hours.',
    back: 'Back to conversation',
    privacyLink: 'privacy policy',
    security: 'Protected connection. Your messages are not stored as a transcript.',
    unavailable: 'I cannot respond right now. You can contact us directly and we will help you.',
    required: 'Complete your name, email and accept the privacy policy.',
    human: 'Talk to the team',
    limitTitle: 'We have already given many automatic orientations today',
    limitIntro: 'To keep the quality of our support, we are still available directly with the TEXTUM team. Tell us about your case and we will guide you with no limits.',
    deadline: 'When do you need to move forward?',
    deadlineOptions: ['Less than 2 weeks', 'Between 2 and 6 weeks', 'More than 6 weeks', 'I do not have a date yet'],
    dynamicCta: 'Send my case to the team',
    policyTitle: 'Ethical AI use',
    policyBack: 'Back to conversation',
    policyIntro: 'AI assists, the researcher creates, TEXTUM teaches.',
    policyYes: 'TEXTUM uses AI for methodological support, inconsistency detection, editorial optimisation and preparation of materials, always with human review.',
    policyNo: 'TEXTUM does not generate complete theses or articles, replace authorship, fabricate results or help conceal plagiarism or improper AI use.',
    policyFooter: 'Scientific responsibility and the final decision always remain with the researcher.',
  },
};

const NEED_LABELS: Record<'es' | 'en', Record<Need, string>> = {
  es: {
    defensa: 'preparación de defensa académica',
    publicacion: 'publicación científica',
    ajuste: 'revisión de estilo y normas',
    intensidad: 'acompañamiento intensivo',
    flux: 'estructura y coherencia metodológica',
  },
  en: {
    defensa: 'academic defence preparation',
    publicacion: 'scientific publication',
    ajuste: 'style and standards review',
    intensidad: 'high-intensity support',
    flux: 'methodological structure and coherence',
  },
};

const PROGRAMS: Record<'es' | 'en', Record<Need, string>> = {
  es: {
    defensa: 'Alta Defensa y Oratoria Académica',
    publicacion: 'Pre-arbitraje Científico + FLUX',
    ajuste: 'Ajuste de Estilo y Norma',
    intensidad: 'Co-creación de Alta Intensidad',
    flux: 'Mentoría Avanzada FLUX',
  },
  en: {
    defensa: 'High Defence & Academic Oratory',
    publicacion: 'Scientific Pre-review + FLUX',
    ajuste: 'Style & Standards Adjustment',
    intensidad: 'High-Intensity Co-creation',
    flux: 'Advanced FLUX Mentoring',
  },
};

function localiseLink(url: string, lang: 'es' | 'en') {
  if (!url.startsWith('/')) return url;
  return localizedPath(url, lang);
}

function makeMessage(id: number, content: string, role: Role, extra: Partial<Message> = {}): Message {
  return { id, content, role, ...extra };
}

function makeSessionId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* crypto no disponible */ }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function AssistantWidget() {
  const { lang } = useLang();
  const c = COPY[lang];
  const sessionIdRef = useRef<string>('');
  if (!sessionIdRef.current) sessionIdRef.current = makeSessionId();
  const [open, setOpen] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(() => {
    try { return sessionStorage.getItem('textum_assistant_seen') !== '1'; } catch { return true; }
  });

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('textum-assistant-state', { detail: { open } }));
    return () => { window.dispatchEvent(new CustomEvent('textum-assistant-state', { detail: { open: false } })); };
  }, [open]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [leadError, setLeadError] = useState('');
  const [lead, setLead] = useState({ name: '', email: '', country: '', deadline: '', privacyAccepted: false });
  const [turnstileToken, setTurnstileToken] = useState('');
  const [chatToken, setChatToken] = useState('');
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [caseNote, setCaseNote] = useState('');
  const [lastNeed, setLastNeed] = useState<Need>('flux');
  const nextId = useRef(1);
  const pendingMessagesRef = useRef<Message[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Móvil: el lanzador se aparta mientras se hace scroll hacia abajo (lectura)
  // y reaparece al parar o al subir. En escritorio no aplica (clases sm:).
  const [hiddenByScroll, setHiddenByScroll] = useState(false);

  useEffect(() => {
    if (!open) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open, showLeadForm]);

  useEffect(() => {
    if (open) { setHiddenByScroll(false); return; }
    let lastY = window.scrollY;
    let idle: number | undefined;
    const onScroll = () => {
      const y = window.scrollY;
      setHiddenByScroll(y > lastY + 4 && y > 240);
      lastY = y;
      window.clearTimeout(idle);
      idle = window.setTimeout(() => setHiddenByScroll(false), 850);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.clearTimeout(idle); };
  }, [open]);

  useEffect(() => {
    setMessages([]);
    setShowLeadForm(false);
    setShowPolicy(false);
    setLeadSent(false);
    setLimitReached(false);
    setLeadError('');
    setCaptchaRequired(false);
    setChatToken('');
    pendingMessagesRef.current = null;
  }, [lang]);

  const openWidget = () => {
    setOpen(true);
    setInviteVisible(false);
    try { sessionStorage.setItem('textum_assistant_seen', '1'); } catch { /* storage unavailable */ }
    trackConversion('assistant_opened', { language: lang });
    if (!messages.length) {
      setMessages([makeMessage(nextId.current++, c.greeting, 'assistant')]);
    }
  };

  const closeWidget = () => setOpen(false);

  const receiveAnswer = async (nextMessages: Message[], token = chatToken) => {
    setLoading(true);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'chat',
          lang,
          session_id: sessionIdRef.current,
          turnstileToken: token,
          messages: nextMessages.slice(-10).map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) setLimitReached(true);
        if (response.status === 403 && data.captcha_required) {
          // Guardamos la conversación pendiente y mostramos la verificación.
          pendingMessagesRef.current = nextMessages;
          setChatToken('');
          setCaptchaRequired(true);
          setLoading(false);
          return;
        }
        throw new Error(data.error || c.unavailable);
      }
      setCaptchaRequired(false);
      pendingMessagesRef.current = null;
      if (data.limit_reached) setLimitReached(true);
      const need = (data.need || 'flux') as Need;
      setLastNeed(need);
      setMessages((current) => [...current, makeMessage(nextId.current++, data.answer, 'assistant', { need, links: data.links, followUp: data.follow_up, diagnostics: data.diagnostics })]);
    } catch {
      const fallback = localFallback(nextMessages[nextMessages.length - 1]?.content || '');
      setLastNeed(fallback.need);
      setMessages((current) => [...current, makeMessage(nextId.current++, fallback.answer, 'assistant', { need: fallback.need, links: fallback.links, followUp: lang === 'es' ? '¿En qué etapa está ahora tu proyecto?' : 'What stage is your project at now?', diagnostics: { source: 'fallback', llm_used: false, web_used: false, web_sources: 0, reason: 'frontend_backend_unavailable' } })]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatToken = (token: string) => {
    setChatToken(token);
    if (token && pendingMessagesRef.current) {
      const pending = pendingMessagesRef.current;
      pendingMessagesRef.current = null;
      setCaptchaRequired(false);
      void receiveAnswer(pending, token);
    }
  };

  const sendMessage = async (value = input) => {
    const content = value.trim();
    if (!content || loading || limitReached || (captchaRequired && !chatToken)) return;
    const userMessage = makeMessage(nextId.current++, content, 'user');
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setCaseNote(content.slice(0, 500));
    trackConversion('assistant_message_sent', { language: lang });
    await receiveAnswer(nextMessages);
  };

  const showForm = () => {
    setShowLeadForm(true);
    setLeadError('');
    trackConversion('assistant_lead_form_opened', { language: lang, need: lastNeed });
  };

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lead.name.trim() || !lead.email.trim() || !lead.privacyAccepted || (turnstileConfigured && !turnstileToken)) {
      setLeadError(c.required);
      return;
    }
    setLoading(true);
    setLeadError('');
    const program = PROGRAMS[lang][lastNeed];
    const priority = lead.deadline === c.deadlineOptions[0] ? 'high' : lead.deadline === c.deadlineOptions[1] ? 'medium' : 'normal';
    const summary = `${lang === 'en' ? 'Main need' : 'Necesidad principal'}: ${NEED_LABELS[lang][lastNeed]}. ${lang === 'en' ? 'Suggested programme' : 'Programa orientativo'}: ${program}. ${lang === 'en' ? 'Deadline' : 'Plazo'}: ${lead.deadline || (lang === 'en' ? 'Not provided' : 'No indicado')}. ${lang === 'en' ? 'Priority' : 'Prioridad'}: ${priority}. ${caseNote ? `${lang === 'en' ? 'Context provided' : 'Contexto aportado'}: ${caseNote}` : ''}`.slice(0, 1750);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'lead',
          lang,
          name: lead.name,
          email: lead.email,
          country: lead.country,
          need: lastNeed,
          program,
          deadline: lead.deadline,
          priority,
          summary,
          privacy_accepted: lead.privacyAccepted,
          turnstileToken,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || c.unavailable);
      setLeadSent(true);
      trackConversion('assistant_lead_submitted', { language: lang, need: lastNeed });
    } catch (error) {
      setLeadError(error instanceof Error ? error.message : c.unavailable);
    } finally {
      setLoading(false);
    }
  };

  const localFallback = (text: string): { answer: string; need: Need; links: Link[] } => {
    const value = text.toLowerCase();
    const need: Need = /defensa|tribunal|sustent|exposici|present/.test(value)
      ? 'defensa'
      : /public|revista|scopus|latindex|arbit|revisor/.test(value)
        ? 'publicacion'
        : /estilo|apa|referencia|norma|formato/.test(value)
          ? 'ajuste'
          : /bloque|plazo|urgente|complej/.test(value)
            ? 'intensidad'
            : 'flux';
    const answers: Record<'es' | 'en', Record<Need, string>> = {
      es: {
        defensa: 'Para una defensa académica, TEXTUM trabaja el guion, las diapositivas, la oratoria y la simulación de preguntas del tribunal. El programa orientativo es Alta Defensa y Oratoria Académica.',
        publicacion: 'Para preparar un artículo, podemos orientarte entre Adaptación Editorial, Pre-arbitraje Científico + FLUX y Acompañamiento Editorial Premium. La elección depende del nivel de revisión que necesite tu manuscrito.',
        ajuste: 'Si tu manuscrito está avanzado y necesita estilo, referencias o adecuación normativa, el programa orientativo es Ajuste de Estilo y Norma. Si también hay problemas de estructura, conviene valorar Mentoría Avanzada FLUX.',
        intensidad: 'Para un proyecto bloqueado, complejo o con plazo ajustado, la opción orientativa es Co-creación de Alta Intensidad. El diagnóstico gratuito permite confirmar el nivel adecuado.',
        flux: 'Si necesitas ordenar problema, objetivos, metodología y argumentación, la opción orientativa es Mentoría Avanzada FLUX. El diagnóstico gratuito ayuda a identificar las prioridades reales.',
      },
      en: {
        defensa: 'For an academic defence, TEXTUM works on the script, slides, delivery and simulated panel questions. The closest programme is High Defence & Academic Oratory.',
        publicacion: 'For an article, we can guide you between Editorial Adaptation, Scientific Pre-review + FLUX and Premium Editorial Mentoring. The right choice depends on the level of review your manuscript needs.',
        ajuste: 'If your manuscript is advanced and needs style, references or standards alignment, the closest programme is Style & Standards Adjustment. If structure is also an issue, consider Advanced FLUX Mentoring.',
        intensidad: 'For a blocked, complex or time-pressured project, High-Intensity Co-creation is the most relevant option. The free diagnosis can confirm the right level.',
        flux: 'If you need to align your problem, objectives, methodology and argumentation, Advanced FLUX Mentoring is the closest option. The free diagnosis helps identify the real priorities.',
      },
    };
    return { answer: answers[lang][need], need, links: [{ label: lang === 'es' ? 'Solicitar diagnóstico gratuito' : 'Request free diagnosis', url: '/#contacto' }] };
  };

  const whatsappText = encodeURIComponent(lang === 'en'
    ? 'Hello, I would like guidance about my academic research with TEXTUM.'
    : 'Hola, me gustaría recibir orientación sobre mi investigación académica con TEXTUM.');

  return (
    <>
      <div className={`fixed bottom-[5.75rem] right-4 sm:bottom-[6.25rem] sm:right-6 z-[70] transition-all duration-300 ${
        open
          ? 'pointer-events-none opacity-0 scale-95'
          : hiddenByScroll
            ? 'translate-y-24 opacity-0 pointer-events-none sm:translate-y-0 sm:opacity-100 sm:scale-100 sm:pointer-events-auto'
            : 'opacity-100 scale-100'
      }`}>
        {inviteVisible && !open && !hiddenByScroll && <div className="absolute right-0 bottom-full mb-3 w-[min(15rem,calc(100vw-2rem))] rounded-2xl bg-navy/95 backdrop-blur-xl border border-gold/40 px-4 py-3 text-white shadow-[0_12px_38px_rgba(13,31,60,0.35)]"><p className="text-sm leading-snug">{lang === 'es' ? '¿No sabes qué programa necesitas?' : 'Not sure which programme you need?'}</p><span className="block text-[10px] text-gold mt-1 tracking-wide">{lang === 'es' ? 'Te orientamos en 2 minutos' : 'Get guidance in 2 minutes'}</span></div>}
        {!open && inviteVisible && <span className="absolute -right-1 -top-1 z-10 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] font-bold text-white shadow-[0_0_0_3px_rgba(13,31,60,0.8)] animate-pulse">1</span>}
        <button
          type="button"
          onClick={openWidget}
          aria-label={c.open}
          className="group flex items-center justify-center gap-2.5 rounded-full bg-navy text-gold border border-gold/45 p-3.5 opacity-80 sm:opacity-100 sm:px-4 sm:py-3 shadow-[0_12px_36px_rgba(13,31,60,0.3)] hover:opacity-100 hover:bg-navy-light hover:border-gold focus-visible:opacity-100 active:opacity-100 transition-all touch-manipulation"
        >
          <Sparkles size={18} aria-hidden="true" className="drop-shadow-[0_0_8px_rgba(226,192,110,0.7)]" />
          <span className="hidden sm:inline text-[11px] tracking-[0.12em] font-semibold">{lang === 'es' ? '¿TE ORIENTAMOS?' : 'NEED GUIDANCE?'}</span>
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[75] pointer-events-none sm:inset-auto sm:bottom-5 sm:right-5 lg:bottom-6 lg:right-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="textum-assistant-title"
            className="pointer-events-auto absolute inset-0 sm:static sm:w-[min(420px,calc(100vw-2rem))] h-[100dvh] sm:h-[min(680px,calc(100dvh-2rem))] glass-navy shadow-[0_24px_90px_rgba(4,12,28,0.55)] sm:rounded-[18px] overflow-hidden border border-white/15 flex flex-col relative before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(circle_at_15%_0%,rgba(255,255,255,0.15),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%,rgba(201,168,76,0.06))]"
          >
            <header className="glass-navy text-white px-5 py-4 flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gold/25 border border-gold/60 flex items-center justify-center text-gold shadow-[0_0_24px_rgba(201,168,76,0.22)]">
                <Sparkles size={20} aria-hidden="true" className="drop-shadow-[0_0_10px_rgba(226,192,110,0.75)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="textum-assistant-title" className="font-serif text-xl text-gold leading-none">{c.title}</h2>
                <p className="text-[10px] text-white/55 tracking-[0.12em] uppercase mt-1">{c.subtitle} · {lang === 'es' ? 'IA supervisada' : 'supervised AI'}</p>
              </div>
              <button type="button" onClick={closeWidget} aria-label={c.close} className="text-white/60 hover:text-white p-2 touch-manipulation">
                <X size={19} />
              </button>
            </header>

            {showPolicy && !leadSent && (
              <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 text-white/85 bg-[linear-gradient(160deg,rgba(19,43,82,0.96),rgba(7,18,37,0.92))]">
                <button type="button" onClick={() => setShowPolicy(false)} className="text-xs text-white/55 hover:text-gold inline-flex items-center gap-1 mb-7"><ArrowRight size={12} className="rotate-180" /> {c.policyBack}</button>
                <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/35 flex items-center justify-center mb-5"><ShieldCheck size={22} className="text-gold" /></div>
                <h3 className="font-serif text-3xl text-gold mb-3">{c.policyTitle}</h3>
                <p className="font-serif italic text-lg text-white/90 mb-7">{c.policyIntro}</p>
                <div className="space-y-5 text-sm leading-relaxed">
                  <div className="rounded-xl bg-white/10 border border-white/15 p-4"><p className="text-gold text-[10px] uppercase tracking-[0.18em] mb-2">{lang === 'es' ? 'Qué sí hacemos' : 'What we do'}</p><p>{c.policyYes}</p></div>
                  <div className="rounded-xl bg-black/15 border border-white/10 p-4"><p className="text-gold text-[10px] uppercase tracking-[0.18em] mb-2">{lang === 'es' ? 'Qué no hacemos' : 'What we do not do'}</p><p>{c.policyNo}</p></div>
                  <p className="text-white/55 text-xs border-t border-white/10 pt-5">{c.policyFooter}</p>
                </div>
              </div>
            )}

            {limitReached && !showLeadForm && !showPolicy && !leadSent && (
              <div className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 bg-[linear-gradient(160deg,rgba(19,43,82,0.96),rgba(7,18,37,0.92))] text-white/85 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-full bg-gold/15 border border-gold/35 flex items-center justify-center mb-5"><ShieldCheck size={22} className="text-gold" /></div>
                <h3 className="font-serif text-2xl text-gold mb-3">{c.limitTitle}</h3>
                <p className="text-sm text-white/70 leading-relaxed mb-7">{c.limitIntro}</p>
                <div className="flex flex-col gap-2 w-full">
                  <a href={`https://wa.me/34614638406?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-sm text-xs font-semibold"><Sparkles size={14} /> WhatsApp</a>
                  <a href="mailto:contacto@mentoriatextum.com" className="flex items-center justify-center gap-2 border border-white/25 text-white py-3 rounded-xl text-xs hover:border-gold/60 transition-colors"><Mail size={14} /> {c.human}</a>
                </div>
                <p className="text-[10px] text-white/40 mt-6 text-center">{c.security}</p>
              </div>
            )}

            {!limitReached && !showLeadForm && !showPolicy && !leadSent && (
              <>
                <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[radial-gradient(circle_at_90%_12%,rgba(201,168,76,0.13),transparent_34%),linear-gradient(160deg,rgba(19,43,82,0.96),rgba(7,18,37,0.92))]" aria-live="polite">
                  {messages.length === 0 && <p className="text-sm text-white/75 text-center py-3">{c.greeting}</p>}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[88%] ${message.role === 'user' ? 'bg-gold text-navy rounded-2xl rounded-br-sm shadow-[0_8px_24px_rgba(201,168,76,0.18)]' : 'bg-white/[0.96] border border-white text-navy rounded-2xl rounded-bl-sm shadow-[0_8px_24px_rgba(0,0,0,0.16)]'} px-4 py-3`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{message.content}</p>{message.followUp && <p className="mt-3 pt-3 border-t border-navy/10 text-sm font-medium text-navy">{message.followUp}</p>}{message.diagnostics && <p className="mt-3 text-[10px] text-navy/45">{message.diagnostics.web_used ? `${lang === 'es' ? 'Fuentes web consultadas' : 'Web sources consulted'}: ${message.diagnostics.web_sources || 0}` : message.diagnostics.source === 'fallback' ? (lang === 'es' ? 'Orientación local' : 'Local guidance') : (lang === 'es' ? 'Respuesta de la Guía TEXTUM' : 'TEXTUM Guide response')}</p>}
                        {message.links && message.links.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-navy/10 flex flex-col gap-2">
                            {message.links.map((link) => (
                              <a key={link.url} href={localiseLink(link.url, lang)} target={link.url.startsWith('http') ? '_blank' : undefined} rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined} onClick={() => trackConversion('assistant_contextual_link_click', { destination: link.url })} className="inline-flex items-center gap-1.5 text-xs text-gold hover:text-navy font-medium transition-colors">
                                {link.label} <ArrowRight size={12} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {messages.length <= 1 && (
                    <div className="pt-1 rounded-2xl bg-black/15 border border-white/10 p-3.5">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-3 font-semibold">{c.quick}</p>
                      <div className="flex flex-col gap-2">
                        {c.quickItems.map((item) => (
                          <button key={item} type="button" onClick={() => sendMessage(item)} disabled={loading} className="group text-left text-sm text-white/85 bg-white/[0.13] backdrop-blur-md border border-white/25 rounded-xl px-4 py-3.5 hover:bg-gold/20 hover:border-gold/70 hover:text-white hover:translate-x-0.5 transition-all disabled:opacity-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {loading && <div className="flex items-center gap-2 text-xs text-white/60"><span className="w-2 h-2 rounded-full bg-gold animate-pulse" /> {lang === 'es' ? 'La Guía TEXTUM está pensando…' : 'TEXTUM Guide is thinking…'}</div>}
                  <div ref={messagesEndRef} />
                </div>

                <div className="relative z-10 border-t border-white/15 bg-navy/75 backdrop-blur-2xl p-3 sm:p-4 flex-shrink-0 shadow-[0_-14px_35px_rgba(3,10,25,0.22)]">
                  <button type="button" onClick={showForm} className="w-full flex items-center justify-between gap-3 text-sm text-white bg-gold/20 border border-gold/65 rounded-xl px-4 py-3 hover:bg-gold/35 hover:shadow-[0_0_22px_rgba(201,168,76,0.2)] transition-all mb-3">
                    <span className="flex items-center gap-2"><ShieldCheck size={14} className="text-gold" /> {c.dynamicCta}</span><ArrowRight size={13} />
                  </button>
                  {captchaRequired && turnstileConfigured && (
                    <div className="mb-3">
                      <p className="text-[11px] text-white/70 mb-2">
                        {lang === 'es'
                          ? 'Verificación rápida para seguir chateando (una sola vez).'
                          : 'Quick check to keep chatting (just once).'}
                      </p>
                      <TurnstileWidget onToken={handleChatToken} />
                    </div>
                  )}
                  <form onSubmit={(event) => { event.preventDefault(); void sendMessage(); }} className="flex items-center gap-2">
                    <label htmlFor="assistant-input" className="sr-only">{c.placeholder}</label>
                    <input id="assistant-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder={c.placeholder} maxLength={1400} className="min-w-0 flex-1 bg-white/95 border border-white/50 rounded-full px-4 py-3 text-sm text-navy placeholder-navy/45 focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30" />
                    <button type="submit" disabled={!input.trim() || loading || (captchaRequired && !chatToken)} aria-label={c.send} className="w-10 h-10 flex items-center justify-center rounded-full bg-navy text-gold hover:bg-navy-light disabled:opacity-40 transition-colors flex-shrink-0"><Send size={15} /></button>
                  </form>
                  <p className="text-[10px] text-navy/35 mt-2 text-center">{c.security}</p>
                </div>
              </>
            )}

            {showLeadForm && !leadSent && (
              <form onSubmit={handleLeadSubmit} className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 bg-[linear-gradient(160deg,rgba(19,43,82,0.96),rgba(7,18,37,0.92))] text-white/85" noValidate>
                <button type="button" onClick={() => setShowLeadForm(false)} className="text-xs text-white/55 hover:text-gold inline-flex items-center gap-1 mb-6"><ArrowRight size={12} className="rotate-180" /> {c.back}</button>
                <h3 className="font-serif text-2xl text-gold mb-2">{c.personal}</h3>
                <p className="text-sm text-white/65 leading-relaxed mb-6">{c.personalIntro}</p>
                <div className="space-y-4">
                  <div><label htmlFor="assistant-name" className="block text-[10px] tracking-[0.16em] uppercase text-gold/80 mb-1.5">{c.name}</label><input id="assistant-name" required value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} maxLength={120} className="w-full bg-white/95 text-navy border border-white/40 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" /></div>
                  <div><label htmlFor="assistant-email" className="block text-[10px] tracking-[0.16em] uppercase text-gold/80 mb-1.5">{c.email}</label><input id="assistant-email" type="email" required value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} maxLength={254} className="w-full bg-white/95 text-navy border border-white/40 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" /></div>
                  <div><label htmlFor="assistant-country" className="block text-[10px] tracking-[0.16em] uppercase text-gold/80 mb-1.5">{c.country}</label><input id="assistant-country" value={lead.country} onChange={(event) => setLead({ ...lead, country: event.target.value })} maxLength={80} className="w-full bg-white/95 text-navy border border-white/40 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" /></div>
                  <label className="flex items-start gap-2.5 text-xs text-white/70 leading-relaxed"><input type="checkbox" checked={lead.privacyAccepted} onChange={(event) => setLead({ ...lead, privacyAccepted: event.target.checked })} className="mt-0.5 accent-[#c9a84c]" /> <span>{c.privacy} <a href={localizedPath('/privacidad', lang)} target="_blank" rel="noopener noreferrer" className="text-gold underline underline-offset-2">{c.privacyLink}</a>.</span></label>
                  {turnstileConfigured && <TurnstileWidget onToken={setTurnstileToken} />}
                  <div className="grid grid-cols-2 gap-2 pt-1"><p className="col-span-2 text-[10px] tracking-[0.16em] uppercase text-gold/80">{c.deadline}</p>{c.deadlineOptions.map((option) => <button key={option} type="button" onClick={() => setLead({ ...lead, deadline: option })} className={`text-left text-xs rounded-xl px-3 py-2.5 border transition-all ${lead.deadline === option ? 'bg-gold text-navy border-gold font-semibold' : 'bg-white/10 text-white/75 border-white/20 hover:border-gold/60'}`}>{option}</button>)}</div>
                  {leadError && <p role="alert" className="text-xs text-red-100 bg-red-950/50 border border-red-300/30 rounded-xl p-3">{leadError}</p>}
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-xs tracking-[0.12em] rounded-sm flex items-center justify-center gap-2 disabled:opacity-60"><Send size={14} /> <span>{loading ? c.submitting : c.submit}</span></button>
                </div>
              </form>
            )}

            {leadSent && (
              <div className="relative z-10 flex-1 bg-[linear-gradient(160deg,rgba(19,43,82,0.96),rgba(7,18,37,0.92))] flex flex-col items-center justify-center text-center p-6 text-white">
                <CheckCircle size={48} className="text-gold mb-5" />
                <h3 className="font-serif text-2xl text-gold mb-3">{c.sent}</h3>
                <p className="text-sm text-white/70 leading-relaxed max-w-xs">{c.sentDescription}</p>
                <div className="flex flex-col gap-2 mt-7 w-full max-w-xs">
                  <a href={`https://wa.me/34614638406?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3 rounded-sm text-xs font-semibold"><Sparkles size={14} /> WhatsApp</a>
                  <a href="mailto:contacto@mentoriatextum.com" className="flex items-center justify-center gap-2 border border-white/25 text-white py-3 rounded-xl text-xs hover:border-gold/60 transition-colors"><Mail size={14} /> {c.human}</a>
                </div>
              </div>
            )}

            <footer className="relative z-10 bg-[#061326]/90 backdrop-blur-2xl border-t border-white/15 px-4 py-2.5 flex items-center justify-between gap-3 flex-shrink-0">
              <span className="text-[10px] text-white/45 flex items-center gap-1.5"><ShieldCheck size={11} className="text-gold/80" /> {lang === 'es' ? 'Uso ético de IA' : 'Ethical AI use'}</span>
              <button type="button" onClick={() => setShowPolicy(true)} className="text-[10px] text-gold/75 hover:text-gold inline-flex items-center gap-1">{lang === 'es' ? 'Política de IA' : 'AI policy'} <ArrowRight size={10} /></button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
