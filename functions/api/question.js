// functions/api/question.js
// Cajón de preguntas del blog: nombre, email y pregunta.
//
// Guarda el lead en `leads` (source = 'pregunta-articulo') y avisa por email.
// El lead NO entra en la secuencia de nurture: responder es una conversación
// personal, no una comunicación comercial, y para eso hace falta otro
// consentimiento que el formulario no pide.
import { createClient } from '@supabase/supabase-js';
import {
  corsHeaders,
  enforceRateLimit,
  fetchWithRetry,
  getRequestId,
  jsonResponse,
  log,
  RateLimitUnavailableError,
  validateText,
  verifyTurnstile,
} from '../_shared/security.js';
import { attributionForInsert, attributionSummaryHtml } from '../_shared/attribution.js';

const MAX_BODY_BYTES = 16 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NOTIFY_TO = 'revedit917@gmail.com';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isOptionalText(value, max) {
  return value == null || (typeof value === 'string' && value.length <= max);
}

export async function onRequestOptions({ request, env }) {
  return new Response(null, { headers: corsHeaders(request, env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);
  let english = false;

  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'La solicitud supera el tamaño permitido.' }, 413, request, env, requestId);
  }

  try {
    if (!await enforceRateLimit(request, 'question', 6, 600, env)) {
      return jsonResponse({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }, 429, request, env, requestId, { 'Retry-After': '600' });
    }
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) throw error;
    log('error', 'question.rate_limit_unavailable', { requestId });
    return jsonResponse({ error: 'Servicio temporalmente no disponible. Inténtalo de nuevo más tarde.' }, 503, request, env, requestId, { 'Retry-After': '60' });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'Body JSON inválido.' }, 400, request, env, requestId);
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Body inválido.' }, 400, request, env, requestId);
    }

    const {
      name,
      email,
      question,
      post_slug = null,
      post_title = null,
      lang = 'es',
      privacy_accepted = false,
      turnstileToken = '',
      attribution = null,
    } = body;
    english = lang === 'en';

    if (!validateText(name, { min: 2, max: 120 })
      || !validateText(email, { min: 3, max: 254 })
      || !validateText(question, { min: 10, max: 2000 })
      || !isOptionalText(post_slug, 160)
      || !isOptionalText(post_title, 240)
      || !['es', 'en'].includes(lang)
      || privacy_accepted !== true
      || !EMAIL_RE.test(email.trim())) {
      return jsonResponse(
        { error: english ? 'Please fill in your name, a valid email and your question.' : 'Escribe tu nombre, un email válido y tu pregunta.' },
        400, request, env, requestId,
      );
    }

    const captcha = await verifyTurnstile(turnstileToken, request, env);
    if (!captcha.ok) {
      return jsonResponse(
        { error: english ? 'Complete the security check and try again.' : 'Completa la verificación de seguridad e inténtalo de nuevo.' },
        403, request, env, requestId,
      );
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      log('error', 'question.configuration_missing', { requestId });
      return jsonResponse(
        { error: english ? 'The question could not be saved right now.' : 'No se pudo guardar la pregunta en este momento.' },
        503, request, env, requestId,
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const cleanName = name.trim().slice(0, 120);
    const cleanEmail = email.trim().toLowerCase();
    const cleanQuestion = question.trim();

    const { error } = await supabase.from('leads').insert({
      name: cleanName,
      email: cleanEmail,
      lang,
      source: 'pregunta-articulo',
      resource_slug: post_slug,
      resource_title: post_title,
      question: cleanQuestion,
      privacy_accepted: true,
      status: 'nuevo',
      // Fuera del nurture: la respuesta es personal y no hay consentimiento
      // para comunicaciones comerciales.
      sequence_paused: true,
      sequence_step: 0,
      ...attributionForInsert(attribution),
    });

    if (error) {
      log('error', 'question.insert_failed', { requestId, message: error.message, code: error.code });
      return jsonResponse(
        { error: english ? 'The question could not be saved. Please try again.' : 'No se pudo guardar la pregunta. Inténtalo de nuevo.' },
        502, request, env, requestId,
      );
    }

    // El aviso por email es best-effort: la pregunta ya está guardada.
    if (env.RESEND_API_KEY) {
      try {
        const res = await fetchWithRetry('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'TEXTUM Mentoría <contacto@mentoriatextum.com>',
            to: NOTIFY_TO,
            reply_to: cleanEmail,
            subject: `Pregunta en el blog: ${cleanName}`,
            html: `
              <h2>Nueva pregunta desde el blog</h2>
              <p><strong>Nombre:</strong> ${escapeHtml(cleanName)}</p>
              <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
              <p><strong>Artículo:</strong> ${escapeHtml(post_title || post_slug || '—')}</p>
              <p><strong>Pregunta:</strong></p>
              <p>${escapeHtml(cleanQuestion).replace(/\n/g, '<br/>')}</p>
              ${attributionSummaryHtml(attribution, escapeHtml)}
            `,
          }),
        }, { retries: 0, timeoutMs: 8000 });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({}));
          log('error', 'question.notify_failed', { requestId, status: res.status, detail });
        }
      } catch (err) {
        log('error', 'question.notify_failed', { requestId, message: err instanceof Error ? err.message : String(err) });
      }
    }

    return jsonResponse({ success: true }, 200, request, env, requestId);
  } catch (err) {
    log('error', 'question.failed', { requestId, message: err instanceof Error ? err.message : String(err) });
    return jsonResponse(
      { error: english ? 'Server error. Please try again later.' : 'Error del servidor. Inténtalo de nuevo más tarde.' },
      500, request, env, requestId,
    );
  }
}
