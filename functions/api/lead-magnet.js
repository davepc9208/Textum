// functions/api/lead-magnet.js
import { createClient } from '@supabase/supabase-js';
import { fetchWithRetry, getRequestId, jsonResponse, log, validateText, verifyTurnstile } from '../_shared/security.js';


/** Rate limit simple vía Cache API (por IP). 8 req / 10 min */
async function enforceRateLimit(request, max = 8, windowSec = 600) {
  try {
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown';
    const cache = caches.default;
    const key = new Request(`https://textum.internal/rate/lead-magnet/${ip}`);
    const hit = await cache.match(key);
    let count = 0;
    if (hit) {
      count = parseInt(await hit.text(), 10) || 0;
    }
    if (count >= max) {
      return false;
    }
    const res = new Response(String(count + 1), {
      headers: { 'Cache-Control': `max-age=${windowSec}`, 'Content-Type': 'text/plain' },
    });
    await cache.put(key, res);
    return true;
  } catch {
    return true; // no bloquear si Cache API falla
  }
}

const ALLOWED_RESOURCES = new Set([
  'principio:pt-01',
  'categoria:cm-01',
  'herramienta:ht-01',
  'herramienta:ht-02',
]);

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

async function makeUnsubToken(email, secret) {
  const data = new TextEncoder().encode(String(email).toLowerCase().trim() + '|' + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);

  if (Number(request.headers.get('Content-Length') || 0) > 32 * 1024) {
    return jsonResponse({ error: 'La solicitud supera el tamaño permitido.' }, 413, request, env, requestId);
  }

  // Rate limit por IP
  const allowed = await enforceRateLimit(request);
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Too many requests. Try again later.' }), {
      status: 429,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '600' },
    });
  }


  try {
    const body = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ error: 'Body inválido.' }, 400, request, env, requestId);
    }
    const {
      name,
      email,
      institution = null,
      country = null,
      role = null,
      resource_slug,
      resource_type,
      resource_title = null,
      lang = 'es',
      source = 'coleccion',
      utm_source = null,
      utm_medium = null,
      utm_campaign = null,
      privacy_accepted = true,
      turnstileToken = '',
    } = body;

    if (!validateText(name, { min: 2, max: 120 })
      || !validateText(email, { min: 3, max: 254 })
      || !validateText(resource_slug, { min: 1, max: 80 })
      || !validateText(resource_type, { min: 1, max: 30 })) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Email no válido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_RESOURCES.has(`${resource_type}:${resource_slug}`)) {
      return jsonResponse({ error: 'Recurso no válido.' }, 400, request, env, requestId);
    }

    const captcha = await verifyTurnstile(turnstileToken, request, env);
    if (!captcha.ok) {
      return jsonResponse({ error: 'Completa la verificación de seguridad e inténtalo de nuevo.' }, 403, request, env, requestId);
    }

    const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey || !env.RESEND_API_KEY) {
      log('error', 'lead_magnet.configuration_missing', { requestId });
      return jsonResponse({ error: 'Servicio de descarga no configurado.' }, 503, request, env, requestId);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const cleanEmail = email.trim().toLowerCase();

    // 1. Guardar lead
    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert({
        name: name.trim(),
        email: cleanEmail,
        institution: institution?.trim() || null,
        country: country?.trim() || null,
        role,
        resource_slug,
        resource_type,
        resource_title,
        lang,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        privacy_accepted: !!privacy_accepted,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Error al guardar el lead' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Signed URL del PDF (15 min)
    // Inglés: {slug}-en.pdf ; si no existe, fallback al PDF en español
    const isEn = String(lang).toLowerCase() === 'en';
    const primaryPath = isEn ? `${resource_slug}-en.pdf` : `${resource_slug}.pdf`;
    const fallbackPath = `${resource_slug}.pdf`;

    let signed = null;
    let signError = null;

    {
      const res = await supabase.storage
        .from('colecciones-pdf')
        .createSignedUrl(primaryPath, 60 * 15);
      signed = res.data;
      signError = res.error;
    }

    if ((signError || !signed?.signedUrl) && isEn && primaryPath !== fallbackPath) {
      console.warn('EN PDF missing, fallback to ES:', primaryPath, signError);
      const res = await supabase.storage
        .from('colecciones-pdf')
        .createSignedUrl(fallbackPath, 60 * 15);
      signed = res.data;
      signError = res.error;
    }

    if (signError || !signed?.signedUrl) {
      console.error('Signed URL error:', signError);
      return new Response(JSON.stringify({ error: 'No se pudo generar el enlace de descarga' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Token de baja + email
    const secret = env.UNSUBSCRIBE_SECRET || serviceRoleKey;
    const unsubToken = await makeUnsubToken(cleanEmail, secret);
    const unsubscribeUrl = `https://www.mentoriatextum.com/baja?email=${encodeURIComponent(cleanEmail)}&token=${unsubToken}`;

    const emailSent = await sendDownloadEmail({
      to: cleanEmail,
      name,
      resourceTitle: resource_title || resource_slug,
      downloadUrl: signed.signedUrl,
      unsubscribeUrl,
      lang,
      resendApiKey: env.RESEND_API_KEY,
    });

    if (emailSent) {
      await supabase
        .from('leads')
        .update({ email_sent: true, downloaded_at: new Date().toISOString() })
        .eq('id', lead.id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        downloadUrl: signed.signedUrl,
        expiresIn: 900,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    log('error', 'lead_magnet.failed', { requestId, message: err instanceof Error ? err.message : String(err) });
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function sendDownloadEmail({
  to,
  name,
  resourceTitle,
  downloadUrl,
  unsubscribeUrl,
  lang,
  resendApiKey,
}) {
  const isEs = lang !== 'en';

  const subject = isEs
    ? `Tu documento TEXTUM listo: ${resourceTitle}`
    : `Your TEXTUM document is ready: ${resourceTitle}`;

  const unsubBlockEs = `
        <p style="font-size:12px;color:#999;margin-top:32px;line-height:1.5;">
          Recibes este correo porque descargaste un recurso de TEXTUM.
          Si no deseas recibir más comunicaciones, puedes
          <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">darte de baja aquí</a>.
        </p>`;

  const unsubBlockEn = `
        <p style="font-size:12px;color:#999;margin-top:32px;line-height:1.5;">
          You received this email because you downloaded a TEXTUM resource.
          If you no longer wish to receive communications, you can
          <a href="${unsubscribeUrl}" style="color:#888;text-decoration:underline;">unsubscribe here</a>.
        </p>`;

  const html = isEs
    ? `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p>Hola ${escapeHtml(name)},</p>
        <p>Aquí tienes tu documento <strong>${escapeHtml(resourceTitle)}</strong> de la colección <em>Pensar metodológicamente la investigación científica</em>.</p>
        <p style="margin: 28px 0;">
          <a href="${downloadUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Descargar PDF ahora
          </a>
        </p>
        <p style="font-size:14px;color:#555;">El enlace caduca en 15 minutos por seguridad. Si necesitas otro, vuelve a la página de descarga.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;">
        <p style="font-size:15px;">¿Quieres que revisemos juntos la coherencia metodológica de tu investigación?</p>
        <p>
          <a href="https://www.mentoriatextum.com/#diagnostico" style="color:#0f766e;font-weight:600;">
            Solicita tu diagnóstico gratuito →
          </a>
        </p>
        <p style="font-size:13px;color:#888;margin-top:40px;">
          TEXTUM · Mentoría Académica<br>
          <a href="https://www.mentoriatextum.com" style="color:#888;">mentoriatextum.com</a>
        </p>
        ${unsubBlockEs}
      </div>
    `
    : `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p>Hello ${escapeHtml(name)},</p>
        <p>Here is your document <strong>${escapeHtml(resourceTitle)}</strong> from the collection <em>Thinking Methodologically about Scientific Research</em>.</p>
        <p style="margin: 28px 0;">
          <a href="${downloadUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Download PDF now
          </a>
        </p>
        <p style="font-size:14px;color:#555;">The link expires in 15 minutes for security. If you need another one, return to the download page.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;">
        <p style="font-size:15px;">Would you like us to review the methodological coherence of your research together?</p>
        <p>
          <a href="https://www.mentoriatextum.com/#diagnostico" style="color:#0f766e;font-weight:600;">
            Request your free diagnosis →
          </a>
        </p>
        <p style="font-size:13px;color:#888;margin-top:40px;">
          TEXTUM · Academic Mentoring<br>
          <a href="https://www.mentoriatextum.com" style="color:#888;">mentoriatextum.com</a>
        </p>
        ${unsubBlockEn}
      </div>
    `;

  try {
    const res = await fetchWithRetry('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'TEXTUM <contacto@mentoriatextum.com>',
        to: [to],
        subject,
        html,
        headers: {
          // Cabecera estándar de baja (algunos clientes de correo la usan)
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }),
    }, { retries: 0, timeoutMs: 8000 });

    return res.ok;
  } catch (e) {
    console.error('Resend error:', e);
    return false;
  }
}
