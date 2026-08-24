import { createClient } from '@supabase/supabase-js';
import { callGroqWithFallback } from '../_shared/groq.js';
import {
  corsHeaders,
  enforceRateLimit,
  fetchWithRetry,
  getRequestId,
  jsonResponse,
  log,
  validateText,
  verifyTurnstile,
} from '../_shared/security.js';

const MAX_BODY_BYTES = 24 * 1024;
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 1400;
const MAX_WEB_CONTEXT_CHARS = 3500;

const KNOWLEDGE = `
TEXTUM — Mentoría Académica Internacional opera online desde España en español e inglés.
Su propósito es acompañar al investigador para desarrollar rigor, claridad y autonomía; no es un servicio de ghostwriting.

SERVICIOS Y PRECIOS DE REFERENCIA:
- Titulación: Ajuste de Estilo y Norma (189 EUR / 199 USD), Mentoría Avanzada FLUX (329 EUR / 349 USD), Co-creación de Alta Intensidad (450 EUR / 499 USD).
- Publicación científica: Adaptación Editorial (279 EUR / 299 USD), Pre-arbitraje Científico + FLUX (450 EUR / 499 USD), Acompañamiento Editorial Premium (750 EUR / 799 USD).
- Defensa académica: Alta Defensa y Oratoria Académica (110 EUR / 120 USD).
Los precios pueden variar según extensión, complejidad, disciplina, plazo y etapa del manuscrito. Los programas incluyen diagnóstico previo gratuito.

ORIENTACIÓN:
- Manuscrito avanzado y necesita estilo, normas o referencias: Ajuste de Estilo y Norma.
- Problemas de estructura metodológica, argumentación o coherencia: Mentoría Avanzada FLUX.
- Proyecto bloqueado, complejo o con plazo ajustado: Co-creación de Alta Intensidad.
- Artículo terminado que necesita adecuación a una revista: Adaptación Editorial.
- Artículo que necesita revisión metodológica antes de enviarse: Pre-arbitraje Científico + FLUX.
- Necesita apoyo antes y después del envío o con revisores: Acompañamiento Editorial Premium.
- Preparación de tribunal, exposición, diapositivas y preguntas: Alta Defensa y Oratoria Académica.

INTEGRIDAD Y USO DE IA:
TEXTUM no escribe tesis o artículos completos para que otra persona los presente como propios, no fabrica resultados, no oculta plagio ni suplanta la autoría. La IA solo se utiliza como apoyo metodológico o editorial, con supervisión humana, trazabilidad y responsabilidad del investigador.

CONTACTO:
Diagnóstico: https://www.mentoriatextum.com/#contacto
WhatsApp: https://wa.me/34614638406
Email: contacto@mentoriatextum.com
Blog: https://www.mentoriatextum.com/blog
Colecciones: https://www.mentoriatextum.com/colecciones
Política de IA: https://www.mentoriatextum.com/ai-policy.md
Privacidad: https://www.mentoriatextum.com/privacidad
`;

const LINKS = {
  diagnosis: { label_es: 'Solicitar diagnóstico gratuito', label_en: 'Request free diagnosis', url: '/#contacto' },
  whatsapp: { label_es: 'Hablar por WhatsApp', label_en: 'Chat on WhatsApp', url: 'https://wa.me/34614638406' },
  email: { label_es: 'Escribir por email', label_en: 'Write by email', url: 'mailto:contacto@mentoriatextum.com' },
  blog: { label_es: 'Explorar el blog', label_en: 'Explore the blog', url: '/blog' },
  collections: { label_es: 'Ver colecciones', label_en: 'View collections', url: '/colecciones' },
};

function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function classifyNeed(text) {
  const value = String(text || '').toLowerCase();
  if (/defensa|tribunal|sustent|exposici|presentaci|oratoria/.test(value)) return 'defensa';
  if (/public|revista|scopus|latindex|arbit|revisor|manuscrito/.test(value)) return 'publicacion';
  if (/estilo|apa|referencia|norma|formato|ortograf/.test(value)) return 'ajuste';
  if (/bloque|plazo|urgente|complej|atrasad/.test(value)) return 'intensidad';
  return 'flux';
}

function linksForNeed(need, lang) {
  const keys = need === 'defensa'
    ? ['diagnosis', 'whatsapp']
    : need === 'publicacion'
      ? ['diagnosis', 'blog']
      : ['diagnosis', 'whatsapp'];
  return keys.map((key) => ({ label: LINKS[key][lang === 'en' ? 'label_en' : 'label_es'], url: LINKS[key].url }));
}

function fallbackAnswer(text, lang, reason = 'fallback') {
  const need = classifyNeed(text);
  const answers = {
    es: {
      defensa: 'Para preparar una defensa, TEXTUM trabaja el guion, las diapositivas, la oratoria y la simulación de preguntas del tribunal. El programa adecuado es Alta Defensa y Oratoria Académica, desde 110 EUR / 120 USD.',
      publicacion: 'Si estás preparando un artículo para una revista, podemos orientarte entre Adaptación Editorial, Pre-arbitraje Científico + FLUX y Acompañamiento Editorial Premium. La diferencia depende del nivel de revisión y del apoyo durante el proceso editorial.',
      ajuste: 'Si tu manuscrito está avanzado y necesita estilo académico, referencias o adecuación normativa, el programa más cercano es Ajuste de Estilo y Norma. Si también hay problemas de estructura o coherencia, conviene valorar Mentoría Avanzada FLUX.',
      intensidad: 'Para un proyecto bloqueado, complejo o con un plazo ajustado, la opción orientativa es Co-creación de Alta Intensidad. El diagnóstico gratuito permite confirmar si ese nivel es el adecuado.',
      flux: 'Cuando necesitas ordenar problema, objetivos, metodología y argumentación, la opción orientativa es Mentoría Avanzada FLUX. El diagnóstico gratuito ayuda a identificar las prioridades reales de tu proyecto.',
    },
    en: {
      defensa: 'For an academic defence, TEXTUM works on the script, slides, delivery and simulated panel questions. The closest programme is High Defence & Academic Oratory, from 110 EUR / 120 USD.',
      publicacion: 'If you are preparing an article for a journal, we can guide you between Editorial Adaptation, Scientific Pre-review + FLUX and Premium Editorial Mentoring. The right option depends on the depth of review and editorial support required.',
      ajuste: 'If your manuscript is advanced and needs academic style, references or standards alignment, Style & Standards Adjustment is the closest option. If structure or coherence is also an issue, Advanced FLUX Mentoring may be more suitable.',
      intensidad: 'For a blocked, complex or time-pressured project, High-Intensity Co-creation is the most relevant starting point. The free diagnosis can confirm whether that level is appropriate.',
      flux: 'When you need to align your problem, objectives, methodology and argumentation, Advanced FLUX Mentoring is the most relevant starting point. The free diagnosis helps identify your project’s real priorities.',
    },
  };
  return { answer: answers[lang][need], need, follow_up: lang === 'en' ? 'What stage is your project at now?' : '¿En qué etapa está ahora tu proyecto?', links: linksForNeed(need, lang), diagnostics: { source: 'fallback', llm_used: false, web_used: false, web_sources: 0, reason } };
}

function parseModelResponse(raw, lang, sourceText) {
  const cleaned = String(raw || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    const answer = clean(parsed.answer, 1800);
    if (!answer) throw new Error('Empty assistant answer');
    const need = ['defensa', 'publicacion', 'ajuste', 'intensidad', 'flux'].includes(parsed.need)
      ? parsed.need
      : classifyNeed(sourceText);
    const followUp = clean(parsed.follow_up, 260);
    const cta = ['diagnosis', 'whatsapp', 'blog', 'collections', 'none'].includes(parsed.cta) ? parsed.cta : 'diagnosis';
    const links = cta === 'none' ? [] : cta === 'diagnosis' ? linksForNeed(need, lang) : [LINKS[cta] && { label: LINKS[cta][lang === 'en' ? 'label_en' : 'label_es'], url: LINKS[cta].url }].filter(Boolean);
    return { answer, need, follow_up: followUp, links, diagnostics: { source: 'llm', llm_used: true, web_used: false, web_sources: 0, reason: 'ok' } };

  } catch {
    return fallbackAnswer(sourceText, lang, 'llm_invalid_json');
  }
}

function systemPrompt(lang, webContext = '') {
  return `Eres la Guía TEXTUM, una orientadora académica con criterio humano, no un bot de respuestas prefabricadas. Responde en ${lang === 'en' ? 'inglés' : 'español'} con tono cálido, inteligente, concreto y variable. Lee toda la conversación: reconoce lo que la persona acaba de contar, no repitas la misma introducción y formula una sola pregunta de seguimiento cuando falten datos. Personaliza usando tipo de proyecto, disciplina, etapa, bloqueo y plazo si aparecen. Explica por qué recomiendas algo y ofrece una acción concreta. No inventes datos, resultados, credenciales ni políticas universitarias. No redactes tesis, artículos o trabajos completos. Si piden ghostwriting, marca el límite y redirige a acompañamiento ético. No des asesoría legal o clínica. Si la consulta requiere información actual de una universidad, revista, convocatoria, normativa o fecha, utiliza el contexto web solo como referencia y aclara que debe verificarse en la fuente oficial. Responde SOLO JSON válido con esta forma: {"answer":"respuesta natural de máximo 1200 caracteres","need":"defensa|publicacion|ajuste|intensidad|flux","follow_up":"una pregunta breve o cadena vacía","cta":"diagnosis|whatsapp|blog|collections|none"}.\n\nBASE DE CONOCIMIENTO:\n${KNOWLEDGE}${webContext ? `\n\nCONTEXTO WEB RECIENTE (no lo trates como verdad absoluta):\n${webContext}` : ''}`;
}

function shouldSearchWeb(text) {
  return /universidad|revista|scopus|latindex|normativa|reglamento|convocatoria|fecha|plazo|actual|hoy|202[4-9]|apa ?7|doi/i.test(text);
}

async function searchWeb(query, env) {
  const apiKey = env.SERPER_API_KEY;
  if (!apiKey || !shouldSearchWeb(query)) return { context: '', sources: 0, reason: apiKey ? 'not_needed' : 'SERPER_API_KEY_missing' };
  try {
    const response = await fetchWithRetry('https://google.serper.dev/search', {
      method: 'POST',
      headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: 4 }),
    }, { retries: 0, timeoutMs: 5000 });
    if (!response.ok) return { context: '', sources: 0, reason: `serper_http_${response.status}` };
    const data = await response.json();
    const organic = (data.organic || []).slice(0, 4);
    return { context: organic.map((item) => `${item.title}: ${item.snippet} (${item.link})`).join('\\n').slice(0, MAX_WEB_CONTEXT_CHARS), sources: organic.length, reason: 'ok' };
  } catch (error) {
    log('warn', 'assistant.web_search_failed', { message: error instanceof Error ? error.message : String(error) });
    return { context: '', sources: 0, reason: 'serper_request_failed' };
  }
}

async function answerChat(messages, lang, env) {
  const latest = messages[messages.length - 1]?.content || '';
  if (!env.GROQ_API_KEY) return fallbackAnswer(latest, lang, 'GROQ_API_KEY_missing');
  const webResult = await searchWeb(messages.map((message) => message.content).join('\\n'), env);
  const webContext = webResult.context;

  try {
    const result = await callGroqWithFallback({
      apiKey: env.GROQ_API_KEY,
      messages: [
        { role: 'system', content: systemPrompt(lang, webContext) },
        ...messages.map((message) => ({ role: message.role, content: message.content })),
      ],
      temperature: 0.45,
      maxTokens: 700,
      fetchWithRetry,
      onModelError: (model, error) => log('warn', 'assistant.model_failed', { model, message: error instanceof Error ? error.message : String(error) }),
    });
    const parsed = parseModelResponse(result.content, lang, latest);
    return { ...parsed, diagnostics: { source: 'llm', llm_used: true, web_used: webResult.sources > 0, web_sources: webResult.sources, model: result.model, reason: webResult.reason } };
  } catch (error) {
    log('warn', 'assistant.groq_failed', { message: error instanceof Error ? error.message : String(error) });
    return fallbackAnswer(latest, lang, 'groq_request_failed');
  }
}

async function saveLead(body, request, env, requestId) {
  const { name, email, country, need, program, deadline, priority, summary, lang, turnstileToken } = body;
  if (!validateText(name, { min: 2, max: 120 })
    || !validateText(email, { min: 3, max: 254 })
    || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    || !['es', 'en'].includes(lang)
    || !validateText(summary, { min: 10, max: 1800 })
    || !validateText(deadline, { min: 1, max: 80 })
    || !['high', 'medium', 'normal'].includes(priority)
    || !validateText(need, { min: 1, max: 30 })
    || !validateText(program, { min: 1, max: 140 })
    || (country != null && !validateText(country, { max: 80 }))
    || body.privacy_accepted !== true) {
    return jsonResponse({ error: lang === 'en' ? 'Please complete the required fields and accept the privacy policy.' : 'Completa los campos obligatorios y acepta la política de privacidad.' }, 400, request, env, requestId);
  }

  const captcha = await verifyTurnstile(turnstileToken, request, env);
  if (!captcha.ok) {
    return jsonResponse({ error: lang === 'en' ? 'Complete the security check and try again.' : 'Completa la verificación de seguridad e inténtalo de nuevo.' }, 403, request, env, requestId);
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !env.RESEND_API_KEY) {
    log('error', 'assistant.configuration_missing', { requestId });
    return jsonResponse({ error: lang === 'en' ? 'The contact service is temporarily unavailable.' : 'El servicio de contacto no está disponible temporalmente.' }, 503, request, env, requestId);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const cleanEmail = email.trim().toLowerCase();
  const { error: insertError } = await supabase.from('leads').insert({
    name: name.trim(),
    email: cleanEmail,
    country: country?.trim() || null,
    role: 'assistant-lead',
    lang,
    source: 'assistant-widget',
    privacy_accepted: true,
    assistant_need: need,
    assistant_program: program,
    assistant_summary: summary.trim(),
    assistant_deadline: deadline.trim(),
    assistant_priority: priority,
    assistant_consent_at: new Date().toISOString(),
  });

  if (insertError) {
    log('error', 'assistant.lead_save_failed', { requestId, message: insertError.message });
    return jsonResponse({ error: lang === 'en' ? 'We could not save your request. Please try again.' : 'No pudimos guardar tu solicitud. Inténtalo de nuevo.' }, 500, request, env, requestId);
  }

  const isEnglish = lang === 'en';
  const subject = isEnglish ? `New TEXTUM Orienta lead: ${name.trim()}` : `Nuevo lead de TEXTUM Orienta: ${name.trim()}`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:640px;color:#172033">
    <h2>${isEnglish ? 'New lead from TEXTUM Orienta' : 'Nuevo lead desde TEXTUM Orienta'}</h2>
    <p><strong>${isEnglish ? 'Name' : 'Nombre'}:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
    <p><strong>${isEnglish ? 'Country' : 'País'}:</strong> ${escapeHtml(country || (isEnglish ? 'Not provided' : 'No indicado'))}</p>
    <p><strong>${isEnglish ? 'Need' : 'Necesidad'}:</strong> ${escapeHtml(need)}</p>
    <p><strong>${isEnglish ? 'Suggested programme' : 'Programa orientativo'}:</strong> ${escapeHtml(program)}</p>
    <p><strong>${isEnglish ? 'Deadline' : 'Plazo'}:</strong> ${escapeHtml(deadline)} · <strong>${isEnglish ? 'Priority' : 'Prioridad'}:</strong> ${escapeHtml(priority)}</p>
    <p><strong>${isEnglish ? 'Conversation summary' : 'Resumen de conversación'}:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(summary)}</p>
    <hr><p style="font-size:12px;color:#667">${isEnglish ? 'The visitor accepted the privacy policy. The conversation transcript was not stored.' : 'La persona aceptó la política de privacidad. No se guardó la transcripción de la conversación.'}</p>
  </div>`;

  const emailResponse = await fetchWithRetry('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'TEXTUM Orienta <contacto@mentoriatextum.com>',
      to: 'revedit917@gmail.com',
      reply_to: cleanEmail,
      subject,
      html,
    }),
  }, { retries: 0, timeoutMs: 8000 });

  if (!emailResponse.ok) {
    log('error', 'assistant.lead_email_failed', { requestId, status: emailResponse.status });
  }

  return jsonResponse({ success: true }, 200, request, env, requestId);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, { headers: corsHeaders(request, env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'La solicitud supera el tamaño permitido.' }, 413, request, env, requestId);
  }

  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Body inválido.' }, 400, request, env, requestId);
    }
    const lang = body.lang === 'en' ? 'en' : 'es';
    if (!await enforceRateLimit(request, body.mode === 'lead' ? 'assistant-lead' : 'assistant-chat', body.mode === 'lead' ? 4 : 24, 600)) {
      return jsonResponse({ error: lang === 'en' ? 'Too many requests. Please try again later.' : 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }, 429, request, env, requestId, { 'Retry-After': '600' });
    }

    if (body.mode === 'lead') return saveLead({ ...body, lang }, request, env, requestId);
    if (body.mode !== 'chat' || !Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > MAX_MESSAGES) {
      return jsonResponse({ error: 'Solicitud de conversación inválida.' }, 400, request, env, requestId);
    }

    const messages = body.messages.map((message) => ({
      role: message?.role === 'assistant' ? 'assistant' : 'user',
      content: clean(message?.content, MAX_MESSAGE_CHARS),
    })).filter((message) => message.content);
    if (!messages.length || messages.some((message) => !validateText(message.content, { min: 1, max: MAX_MESSAGE_CHARS }))) {
      return jsonResponse({ error: 'El mensaje no es válido.' }, 400, request, env, requestId);
    }
    return jsonResponse(await answerChat(messages, lang, env), 200, request, env, requestId);
  } catch (error) {
    log('error', 'assistant.failed', { requestId, message: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: lang === 'en' ? 'The assistant is temporarily unavailable.' : 'El asistente no está disponible temporalmente.' }, 500, request, env, requestId);
  }
}
