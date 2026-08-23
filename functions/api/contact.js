// functions/api/contact.js
// Cloudflare Pages Function para el formulario de contacto.
import { enforceRateLimit, fetchWithRetry, getRequestId, jsonResponse, log, validateText, verifyTurnstile } from '../_shared/security.js';

const MAX_BODY_BYTES = 32 * 1024;

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);

  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) {
    return jsonResponse({ error: 'La solicitud supera el tamaño permitido.' }, 413, request, env, requestId);
  }
  if (!await enforceRateLimit(request, 'contact', 5, 600)) {
    return jsonResponse({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }, 429, request, env, requestId, { 'Retry-After': '600' });
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Body JSON inválido.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Body inválido.' }, 400, request, env, requestId);
    }

    const { name, email, service, message, turnstileToken, lang } = body;
    const english = lang === 'en';

    if (!validateText(name, { min: 2, max: 120 })
      || !validateText(email, { min: 3, max: 254 })
      || !validateText(message, { min: 5, max: 5000 })
      || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {return new Response(JSON.stringify({ error: english ? 'Required fields are missing.' : 'Faltan campos obligatorios.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const captcha = await verifyTurnstile(turnstileToken, request, env);
    if (!captcha.ok) {
      return jsonResponse({ error: english ? 'Complete the security check and try again.' : 'Completa la verificación de seguridad e inténtalo de nuevo.' }, 403, request, env, requestId);
    }

    if (!env.RESEND_API_KEY) {
      log('error', 'contact.configuration_missing', { requestId });
      return jsonResponse({ error: english ? 'Email service is not configured.' : 'Servicio de correo no configurado.' }, 503, request, env, requestId);
    }

    const res = await fetchWithRetry('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'TEXTUM Mentoría <contacto@mentoriatextum.com>',
        to: 'revedit917@gmail.com',
        reply_to: email,
        subject: `Nuevo mensaje de contacto: ${name}`,
        html: `
          <h2>Nuevo mensaje desde el formulario de contacto</h2>
          <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Servicio de interés:</strong> ${escapeHtml(service || 'No especificado')}</p>
          <p><strong>Mensaje:</strong></p>
          <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
        `,
      }),
    }, { retries: 0, timeoutMs: 8000 });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      log('error', 'contact.email_failed', { requestId, status: res.status, error });
      return new Response(
        JSON.stringify({ error: english ? 'The email could not be sent. Please try again.' : 'No se pudo enviar el correo. Inténtalo de nuevo.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId } }
    );

  } catch (err) {
    log('error', 'contact.failed', { requestId, message: err instanceof Error ? err.message : String(err) });
    return new Response(
      JSON.stringify({ error: english ? 'Server error. Please try again later.' : 'Error del servidor. Inténtalo de nuevo más tarde.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Responde a OPTIONS para CORS en desarrollo local
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
