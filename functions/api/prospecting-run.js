// Motor de campañas de prospección institucional.
// Se ejecuta manualmente o desde un cron con POST /api/prospecting-run.
// Está desactivado hasta configurar OUTREACH_ENABLED=true explícitamente.
import { createClient } from '@supabase/supabase-js';
import { fetchWithRetry, getRequestId, log } from '../_shared/security.js';

const SITE_URL = 'https://www.mentoriatextum.com';
const BATCH_LIMIT = 50;

function json(data, status, requestId) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(requestId ? { 'X-Request-ID': requestId } : {}),
    },
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function interpolate(template, prospect) {
  const firstName = String(prospect.name || '').trim().split(/\s+/)[0] || 'Hola';
  return String(template || '')
    .replaceAll('{{nombre}}', escapeHtml(firstName))
    .replaceAll('{{institucion}}', escapeHtml(prospect.institution || ''))
    .replaceAll('{{departamento}}', escapeHtml(prospect.department || ''))
    .replaceAll('{{programa}}', escapeHtml(prospect.programme || ''))
    .replaceAll('{{pais}}', escapeHtml(prospect.country || ''));
}

function wrap(body, unsubscribeUrl, campaignName) {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:600px;margin:0 auto;color:#17243b;line-height:1.65">
    ${body}
    <hr style="border:0;border-top:1px solid #e5e7eb;margin:32px 0">
    <p style="font-size:12px;color:#7b8492">Te escribimos por el interés profesional de esta comunicación para programas de investigación. Campaña: ${escapeHtml(campaignName)}.</p>
    <p style="font-size:12px;color:#7b8492"><a href="${unsubscribeUrl}" style="color:#68758a">No deseo recibir más comunicaciones</a> · TEXTUM</p>
  </div>`;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);
  const secret = env.CRON_SECRET;
  const auth = request.headers.get('Authorization') || '';
  if (!secret || auth !== `Bearer ${secret}`) return json({ error: 'No autorizado.' }, 401, requestId);
  if (String(env.OUTREACH_ENABLED).toLowerCase() !== 'true') {
    return json({ error: 'Prospección desactivada. Configura OUTREACH_ENABLED=true cuando el dominio y proveedor estén verificados.' }, 409, requestId);
  }

  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey = env.OUTREACH_RESEND_API_KEY || env.RESEND_API_KEY;
  const from = env.OUTREACH_FROM_EMAIL;
  if (!supabaseUrl || !serviceRoleKey || !resendKey || !from) return json({ error: 'Falta configuración de prospección.' }, 503, requestId);

  const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const now = new Date();
  const { data: campaigns, error: campaignError } = await db
    .from('outreach_campaigns')
    .select('id,name,daily_limit,send_hour,from_email')
    .eq('status', 'activa');
  if (campaignError) return json({ error: 'No se pudieron leer las campañas.' }, 500, requestId);

  let sent = 0;
  let failed = 0;
  let skipped = 0;
  const details = [];

  for (const campaign of campaigns || []) {
    // `send_hour` se interpreta en UTC; evita que un cron manual envíe antes de la ventana.
    if (now.getUTCHours() < Number(campaign.send_hour ?? 10)) continue;
    const since = new Date(now);
    since.setHours(0, 0, 0, 0);
    const { count } = await db.from('outreach_events')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaign.id)
      .eq('event_type', 'sent')
      .gte('created_at', since.toISOString());
    const remaining = Math.max(0, Number(campaign.daily_limit || 15) - Number(count || 0));
    if (!remaining) continue;

    const { data: enrollments, error: queueError } = await db
      .from('outreach_enrollments')
      .select('id,campaign_id,prospect_id,step_number,next_at,prospect:prospects(id,name,email,institution,department,programme,country,language,contact_basis,approved,do_not_contact,status)')
      .eq('campaign_id', campaign.id)
      .eq('paused', false)
      .eq('completed', false)
      .eq('replied', false)
      .lte('next_at', now.toISOString())
      .order('next_at', { ascending: true })
      .limit(Math.min(remaining, BATCH_LIMIT));
    if (queueError) { log('warn', 'outreach.queue_failed', { requestId, campaign: campaign.id, message: queueError.message }); continue; }

    for (const enrollment of enrollments || []) {
      const prospect = enrollment.prospect;
      if (!prospect || !prospect.approved || !prospect.contact_basis || prospect.do_not_contact || ['baja', 'no_interesado', 'cliente'].includes(prospect.status)) {
        skipped += 1;
        await db.from('outreach_enrollments').update({ paused: true, last_error: 'Prospecto no elegible para envío.' }).eq('id', enrollment.id);
        continue;
      }
      const { data: step, error: stepError } = await db.from('outreach_steps')
        .select('step_number,delay_days,subject,body')
        .eq('campaign_id', campaign.id)
        .eq('step_number', enrollment.step_number)
        .maybeSingle();
      if (stepError || !step) { failed += 1; continue; }

      const email = String(prospect.email).trim().toLowerCase();
      const unsubscribeUrl = `${SITE_URL}/baja?email=${encodeURIComponent(email)}`;
      const subject = interpolate(step.subject, prospect);
      const html = wrap(interpolate(step.body, prospect), unsubscribeUrl, campaign.name);
      try {
        const response = await fetchWithRetry('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: campaign.from_email || from,
            to: [email],
            subject,
            html,
            headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
          }),
        }, { retries: 0, timeoutMs: 8000 });
        if (!response.ok) {
          failed += 1;
          const errorText = await response.text().catch(() => 'provider error');
          await db.from('outreach_enrollments').update({ last_error: errorText.slice(0, 500) }).eq('id', enrollment.id);
          continue;
        }

        const nextStep = Number(enrollment.step_number) + 1;
        const { data: following } = await db.from('outreach_steps').select('step_number,delay_days').eq('campaign_id', campaign.id).eq('step_number', nextStep).maybeSingle();
        const nextAt = following
          ? new Date(Date.now() + Number(following.delay_days || 0) * 86400000).toISOString()
          : null;
        await db.from('outreach_enrollments').update({
          step_number: nextStep,
          next_at: nextAt,
          completed: !following,
          updated_at: new Date().toISOString(),
          last_error: null,
        }).eq('id', enrollment.id);
        await db.from('prospects').update({ status: 'contactado', last_contact_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', prospect.id);
        await db.from('outreach_events').insert({ campaign_id: campaign.id, prospect_id: prospect.id, enrollment_id: enrollment.id, event_type: 'sent', step_number: enrollment.step_number, metadata: { subject } });
        sent += 1;
        details.push({ campaign: campaign.name, email, step: enrollment.step_number });
      } catch (error) {
        failed += 1;
        log('warn', 'outreach.send_error', { requestId, email, message: error instanceof Error ? error.message : String(error) });
      }
    }
  }

  log('info', 'outreach.run_complete', { requestId, sent, failed, skipped });
  return json({ ok: true, sent, failed, skipped, details }, 200, requestId);
}
