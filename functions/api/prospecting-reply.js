// Webhook interno para detener campañas cuando llega una respuesta o rebote.
// Configura OUTREACH_WEBHOOK_SECRET en Cloudflare y úsalo desde el proveedor.
import { createClient } from '@supabase/supabase-js';

function json(data, status) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

export async function onRequestPost({ request, env }) {
  const expected = env.OUTREACH_WEBHOOK_SECRET;
  if (!expected || request.headers.get('Authorization') !== `Bearer ${expected}`) return json({ error: 'No autorizado.' }, 401);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido.' }, 400); }
  const email = String(body?.email || '').trim().toLowerCase();
  const eventType = String(body?.event_type || 'replied');
  const allowed = new Set(['replied', 'bounced', 'meeting', 'proposal', 'client', 'unsubscribed']);
  if (!email || !allowed.has(eventType)) return json({ error: 'email o event_type inválido.' }, 400);

  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json({ error: 'Servicio no configurado.' }, 503);
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const status = eventType === 'replied' ? 'respondio'
    : eventType === 'bounced' ? 'no_interesado'
      : eventType === 'meeting' ? 'reunion'
        : eventType === 'proposal' ? 'propuesta'
          : eventType === 'client' ? 'cliente' : 'baja';
  const doNotContact = eventType === 'unsubscribed' || eventType === 'bounced';
  const { data: prospects, error: prospectError } = await db.from('prospects').select('id').eq('email', email).limit(1);
  if (prospectError) return json({ error: 'No se pudo consultar el prospecto.' }, 500);
  const prospect = prospects?.[0];
  if (!prospect) return json({ ok: true, matched: false }, 200);

  await db.from('prospects').update({ status, do_not_contact: doNotContact || undefined, updated_at: new Date().toISOString() }).eq('id', prospect.id);
  const { data: enrollments } = await db.from('outreach_enrollments').select('id,campaign_id').eq('prospect_id', prospect.id).eq('completed', false);
  if (enrollments?.length) {
    await db.from('outreach_enrollments').update({ paused: true, replied: eventType === 'replied', updated_at: new Date().toISOString() }).eq('prospect_id', prospect.id).eq('completed', false);
    await db.from('outreach_events').insert(enrollments.map(item => ({ campaign_id: item.campaign_id, prospect_id: prospect.id, enrollment_id: item.id, event_type: eventType, metadata: body?.metadata || {} })));
  }
  return json({ ok: true, matched: true, paused: Boolean(enrollments?.length) }, 200);
}
