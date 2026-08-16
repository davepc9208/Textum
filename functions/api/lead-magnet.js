// functions/api/lead-magnet.js
import { createClient } from '@supabase/supabase-js';

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

  try {
    const body = await request.json();
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
    } = body;

    if (!name?.trim() || !email?.trim() || !resource_slug || !resource_type) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Email no válido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      env.VITE_SUPABASE_URL || env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

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
    const filePath = `${resource_slug}.pdf`;
    const { data: signed, error: signError } = await supabase.storage
      .from('colecciones-pdf')
      .createSignedUrl(filePath, 60 * 15);

    if (signError || !signed?.signedUrl) {
      console.error('Signed URL error:', signError);
      return new Response(JSON.stringify({ error: 'No se pudo generar el enlace de descarga' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Token de baja + email
    const secret = env.UNSUBSCRIBE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || 'textum-unsub';
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
    console.error('lead-magnet error:', err);
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
        <p>Hola ${name},</p>
        <p>Aquí tienes tu documento <strong>${resourceTitle}</strong> de la colección <em>Pensar metodológicamente la investigación científica</em>.</p>
        <p style="margin: 28px 0;">
          <a href="${downloadUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Descargar PDF ahora
          </a>
        </p>
        <p style="font-size:14px;color:#555;">El enlace caduca en 15 minutos por seguridad. Si necesitas otro, vuelve a la página de descarga.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;">
        <p style="font-size:15px;">¿Quieres que revisemos juntos la coherencia metodológica de tu investigación?</p>
        <p>
          <a href="https://mentoriatextum.com/#diagnostico" style="color:#0f766e;font-weight:600;">
            Solicita tu diagnóstico gratuito →
          </a>
        </p>
        <p style="font-size:13px;color:#888;margin-top:40px;">
          TEXTUM · Mentoría Académica<br>
          <a href="https://mentoriatextum.com" style="color:#888;">mentoriatextum.com</a>
        </p>
        ${unsubBlockEs}
      </div>
    `
    : `
      <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p>Hello ${name},</p>
        <p>Here is your document <strong>${resourceTitle}</strong> from the collection <em>Thinking Methodologically about Scientific Research</em>.</p>
        <p style="margin: 28px 0;">
          <a href="${downloadUrl}" style="background:#0f766e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Download PDF now
          </a>
        </p>
        <p style="font-size:14px;color:#555;">The link expires in 15 minutes for security. If you need another one, return to the download page.</p>
        <hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;">
        <p style="font-size:15px;">Would you like us to review the methodological coherence of your research together?</p>
        <p>
          <a href="https://mentoriatextum.com/#diagnostico" style="color:#0f766e;font-weight:600;">
            Request your free diagnosis →
          </a>
        </p>
        <p style="font-size:13px;color:#888;margin-top:40px;">
          TEXTUM · Academic Mentoring<br>
          <a href="https://mentoriatextum.com" style="color:#888;">mentoriatextum.com</a>
        </p>
        ${unsubBlockEn}
      </div>
    `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
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
    });

    return res.ok;
  } catch (e) {
    console.error('Resend error:', e);
    return false;
  }
}
