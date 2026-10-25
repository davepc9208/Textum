// functions/api/unsubscribe.js
// Baja: enlace firmado enviado por TEXTUM o confirmación por correo.
import { createClient } from '@supabase/supabase-js';
import { corsHeaders, enforceRateLimit, fetchWithRetry, getRequestId, jsonResponse, log, makeUnsubscribeToken, verifyUnsubscribeToken } from '../_shared/security.js';

const SITE_URL = 'https://www.mentoriatextum.com';
const CONFIRMATION_TTL_SEC = 15 * 60;

export async function onRequestOptions({ request, env }) {
  return new Response(null, { headers: corsHeaders(request, env) });
}

function validateEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

function serviceConfig(env) {
  return {
    url: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

function createSupabase(url, key) {
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function readPayload(request) {
  const contentType = request.headers.get('Content-Type') || '';
  if (contentType.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(await request.text()));
  }
  if (contentType.includes('application/json')) return request.json();
  return {};
}

async function updateUnsubscribe(supabase, email, now) {
  const { error } = await supabase.rpc('unsubscribe_communications', {
    p_email: email,
    p_unsubscribed_at: now,
  });
  if (error) throw new Error(`Unsubscribe transaction failed: ${error.message}`);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);
  try {
    if (!await (context.enforceRateLimit || enforceRateLimit)(request, 'unsubscribe', 10, 600, env)) {
      return jsonResponse({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' }, 429, request, env, requestId, { 'Retry-After': '600' });
    }
  } catch (error) {
    if (error?.name !== 'RateLimitUnavailableError') throw error;
    log('error', 'unsubscribe.rate_limit_unavailable', { requestId });
    return jsonResponse({ error: 'Servicio temporalmente no disponible. Inténtalo de nuevo más tarde.' }, 503, request, env, requestId, { 'Retry-After': '60' });
  }

  try {
    const requestUrl = new URL(request.url);
    const body = await readPayload(request);
    const email = validateEmail(body?.email || requestUrl.searchParams.get('email'));
    const token = typeof body?.token === 'string' ? body.token.trim() : String(requestUrl.searchParams.get('token') || '').trim();
    const isOneClick = body?.['List-Unsubscribe'] === 'One-Click';
    if (request.headers.get('Content-Type')?.includes('application/x-www-form-urlencoded') && !isOneClick) {
      return jsonResponse({ error: 'Solicitud de baja no válida.' }, 400, request, env, requestId);
    }
    if (!email) return jsonResponse({ error: 'Indica un correo electrónico válido.' }, 400, request, env, requestId);

    const { url: supabaseUrl, key } = serviceConfig(env);
    if ((!supabaseUrl || !key) && !context.supabaseClient) return jsonResponse({ error: 'Servicio de baja no configurado.' }, 503, request, env, requestId);
    const supabase = context.supabaseClient || createSupabase(supabaseUrl, key);

    if (token) {
      const tokenSecret = env.UNSUBSCRIBE_SECRET || key || '';
      if (!await verifyUnsubscribeToken(email, token, tokenSecret)) {
        return jsonResponse({ error: 'Enlace de baja no válido o caducado.' }, 403, request, env, requestId);
      }

      if (body?.token && body.token !== token) return jsonResponse({ error: 'Enlace de baja no válido o caducado.' }, 403, request, env, requestId);
      await updateUnsubscribe(supabase, email, new Date().toISOString());
      return jsonResponse({
        success: true,
        message: 'Te has dado de baja correctamente. No recibirás más comunicaciones comerciales de TEXTUM.',
      }, 200, request, env, requestId);
    }

    // Never unsubscribe by email alone. Send a one-time confirmation link and
    // return the same response whether the address exists or not.
    if (!supabaseUrl || !key) return jsonResponse({ error: 'Servicio de baja no configurado.' }, 503, request, env, requestId);
    const resendKey = env.RESEND_API_KEY;
    if (!resendKey) return jsonResponse({ error: 'Servicio de confirmación no configurado.' }, 503, request, env, requestId);

    const { data: leads, error: leadError } = await supabase.from('leads').select('id').eq('email', email).limit(1);
    const { data: prospects, error: prospectError } = await supabase.from('prospects').select('id').eq('email', email).limit(1);
    if (leadError || prospectError) {
      log('error', 'unsubscribe.lookup_failed', { requestId, leads: leadError?.message, prospects: prospectError?.message });
      return jsonResponse({ error: 'No se pudo procesar la solicitud. Inténtalo más tarde.' }, 500, request, env, requestId);
    }

    if (leads?.length || prospects?.length) {
      const confirmToken = await makeUnsubscribeToken(email, env.UNSUBSCRIBE_SECRET || key, Date.now(), CONFIRMATION_TTL_SEC);
      const confirmUrl = `${SITE_URL}/baja?email=${encodeURIComponent(email)}&token=${encodeURIComponent(confirmToken)}`;
      const sent = await fetchWithRetry('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TEXTUM <contacto@mentoriatextum.com>',
          to: [email],
          subject: 'Confirma tu baja de las comunicaciones de TEXTUM',
          html: `<p>Recibimos una solicitud de baja para este correo.</p><p><a href="${confirmUrl}">Confirmar baja</a>. Este enlace vence en 15 minutos.</p><p>Si no solicitaste esta baja, ignora este mensaje.</p>`,
        }),
      }, { retries: 0, timeoutMs: 8000 });
      if (!sent.ok) {
        log('error', 'unsubscribe.confirmation_send_failed', { requestId, status: sent.status });
        return jsonResponse({ error: 'No se pudo enviar el correo de confirmación. Inténtalo más tarde.' }, 503, request, env, requestId);
      }
    }

    return jsonResponse({
      success: true,
      message: 'Si el correo está registrado, recibirás un enlace para confirmar la baja. La solicitud caduca en 15 minutos.',
    }, 200, request, env, requestId);
  } catch (error) {
    log('error', 'unsubscribe.failed', { requestId, message: error instanceof Error ? error.message : String(error) });
    return jsonResponse({ error: 'No se pudo registrar la baja. Inténtalo más tarde.' }, 500, request, env, requestId);
  }
}
