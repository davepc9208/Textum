// functions/api/nurture-run.js
// Motor de la secuencia de nurture por email. Lo dispara un cron externo
// (GitHub Actions → .github/workflows/nurture.yml) una vez al día con:
//   POST /api/nurture-run   Authorization: Bearer <CRON_SECRET>
//
// Recorre los leads con un paso de secuencia vencido, envía el email por Resend
// y avanza el contador. Respeta baja (unsubscribed_at), pausa y consentimiento.
import { createClient } from '@supabase/supabase-js';
import { fetchWithRetry, getRequestId, log } from '../_shared/security.js';

const BATCH = 40;
const SITE_URL = 'https://www.mentoriatextum.com';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

async function makeUnsubToken(email, secret) {
  const data = new TextEncoder().encode(String(email).toLowerCase().trim() + '|' + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

const CTA_ES = `<p style="margin:28px 0"><a href="${SITE_URL}/#contacto" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Solicitar diagnóstico gratuito</a></p>`;
const CTA_EN = `<p style="margin:28px 0"><a href="${SITE_URL}/?lang=en#contacto" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Request a free diagnosis</a></p>`;

// delayDays = días hasta el SIGUIENTE paso tras enviar este.
const STEPS = [
  {
    delayDays: 3,
    subject: { es: 'Cómo aprovechar el material que descargaste', en: 'How to get the most out of your download' },
    body: {
      es: (n) => `<p>Hola ${n},</p><p>El recurso que descargaste funciona mejor si lo usas como lista de verificación mientras revisas tu propio texto, no como lectura de una sola vez. Marca cada punto sobre tu manuscrito y anota dónde flaquea la coherencia.</p><p>En el blog tienes artículos que amplían cada bloque: <a href="${SITE_URL}/blog">mentoriatextum.com/blog</a>.</p>`,
      en: (n) => `<p>Hello ${n},</p><p>The resource you downloaded works best as a checklist you run against your own draft, not as a one-off read. Tick each point on your manuscript and note where coherence breaks down.</p><p>The blog expands on every section: <a href="${SITE_URL}/blog?lang=en">mentoriatextum.com/blog</a>.</p>`,
    },
  },
  {
    delayDays: 4,
    subject: { es: 'El fallo más común en el marco teórico', en: 'The most common flaw in a theoretical framework' },
    body: {
      es: (n) => `<p>Hola ${n},</p><p>El marco teórico no es un resumen de autores: es el andamiaje que justifica cada decisión metodológica posterior. Cuando solo "acumula" citas sin conectarlas con tus objetivos, el tribunal lo detecta enseguida.</p><p>Si no estás segura de que el tuyo sostiene tu investigación, en un diagnóstico gratuito lo revisamos contigo.</p>${CTA_ES}`,
      en: (n) => `<p>Hello ${n},</p><p>A theoretical framework is not a summary of authors: it is the scaffolding that justifies every methodological decision that follows. When it just "stacks" citations without tying them to your objectives, a committee spots it immediately.</p><p>If you are not sure yours holds up your research, we review it with you in a free diagnosis.</p>${CTA_EN}`,
    },
  },
  {
    delayDays: 7,
    subject: { es: 'Qué cambia cuando trabajas la coherencia metodológica', en: 'What changes when you work on methodological coherence' },
    body: {
      es: (n) => `<p>Hola ${n},</p><p>Investigadores que llegaron bloqueados con la metodología terminaron defendiendo con criterio propio cada elección de su diseño. La diferencia no fue escribir más, sino ordenar problema, objetivos, método y argumentación hasta que encajaran.</p><p>Ese es el trabajo del diagnóstico: identificar qué falta y en qué orden abordarlo.</p>${CTA_ES}`,
      en: (n) => `<p>Hello ${n},</p><p>Researchers who arrived stuck on methodology ended up defending every design choice on their own terms. The difference was not writing more, but aligning problem, objectives, method and argumentation until they fit together.</p><p>That is what the diagnosis is for: spotting what is missing and in what order to tackle it.</p>${CTA_EN}`,
    },
  },
  {
    delayDays: null,
    subject: { es: 'TEXTUM no escribe tu tesis — hace algo más útil', en: 'TEXTUM does not write your thesis — it does something more useful' },
    body: {
      es: (n) => `<p>Hola ${n},</p><p>No hacemos ghostwriting ni fabricamos resultados. Acompañamos para que seas tú quien construya y defienda cada parte de tu investigación, con trazabilidad y rigor. Si eso es lo que buscas, hablemos.</p>${CTA_ES}<p style="font-size:13px;color:#888">Este es el último correo de esta serie. Seguiremos publicando en el blog.</p>`,
      en: (n) => `<p>Hello ${n},</p><p>We do not ghostwrite and we do not fabricate results. We mentor so that you build and defend every part of your research yourself, with traceability and rigour. If that is what you are after, let's talk.</p>${CTA_EN}<p style="font-size:13px;color:#888">This is the last email in this series. We keep publishing on the blog.</p>`,
    },
  },
];

function wrap(inner, unsubscribeUrl, lang) {
  const foot = lang === 'en'
    ? `You received this because you engaged with TEXTUM. <a href="${unsubscribeUrl}">Unsubscribe</a>.`
    : `Recibes este correo porque contactaste con TEXTUM. <a href="${unsubscribeUrl}">Darte de baja</a>.`;
  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    ${inner}
    <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0">
    <p style="font-size:12px;color:#999">${foot}</p>
    <p style="font-size:12px;color:#999">TEXTUM · <a href="${SITE_URL}" style="color:#999">mentoriatextum.com</a></p>
  </div>`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);

  const secret = env.CRON_SECRET;
  if (!secret) return json({ error: 'CRON_SECRET no configurado.' }, 503);
  const auth = request.headers.get('Authorization') || '';
  if (auth !== `Bearer ${secret}`) return json({ error: 'No autorizado.' }, 401);

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey || !env.RESEND_API_KEY) {
    log('error', 'nurture.configuration_missing', { requestId });
    return json({ error: 'Servicio no configurado.' }, 503);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const unsubSecret = env.UNSUBSCRIBE_SECRET || serviceRoleKey;
  const nowIso = new Date().toISOString();

  const { data: due, error } = await supabase
    .from('leads')
    .select('id,name,email,lang,sequence_step')
    .is('unsubscribed_at', null)
    .eq('sequence_paused', false)
    .eq('privacy_accepted', true)
    .lt('sequence_step', STEPS.length)
    .not('sequence_next_at', 'is', null)
    .lte('sequence_next_at', nowIso)
    .order('sequence_next_at', { ascending: true })
    .limit(BATCH);

  if (error) {
    log('error', 'nurture.query_failed', { requestId, message: error.message });
    return json({ error: 'No se pudo leer la cola.' }, 500);
  }

  let sent = 0;
  let failed = 0;

  for (const lead of due || []) {
    const step = Number(lead.sequence_step) || 0;
    const config = STEPS[step];
    if (!config) continue;
    const lang = lead.lang === 'en' ? 'en' : 'es';
    const name = escapeHtml((lead.name || '').split(' ')[0] || (lang === 'en' ? 'there' : 'hola'));
    const email = String(lead.email).trim().toLowerCase();
    const token = await makeUnsubToken(email, unsubSecret);
    const unsubscribeUrl = `${SITE_URL}/baja?email=${encodeURIComponent(email)}&token=${token}`;

    try {
      const res = await fetchWithRetry('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
        body: JSON.stringify({
          from: 'TEXTUM <contacto@mentoriatextum.com>',
          to: [email],
          subject: config.subject[lang],
          html: wrap(config.body[lang](name), unsubscribeUrl, lang),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      }, { retries: 1, timeoutMs: 8000 });

      if (!res.ok) { failed += 1; log('warn', 'nurture.send_failed', { requestId, id: lead.id, status: res.status }); continue; }

      const nextStep = step + 1;
      const nextAt = config.delayDays != null
        ? new Date(Date.now() + config.delayDays * 86400 * 1000).toISOString()
        : null;
      await supabase.from('leads').update({
        sequence_step: nextStep,
        sequence_next_at: nextAt,
        last_nurture_at: nowIso,
      }).eq('id', lead.id);
      sent += 1;
    } catch (err) {
      failed += 1;
      log('warn', 'nurture.send_error', { requestId, id: lead.id, message: err instanceof Error ? err.message : String(err) });
    }
  }

  log('info', 'nurture.run_complete', { requestId, due: (due || []).length, sent, failed });
  return json({ ok: true, due: (due || []).length, sent, failed }, 200);
}

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
