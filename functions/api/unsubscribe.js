// functions/api/unsubscribe.js
// Baja de comunicaciones / newsletter (RGPD)
import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

async function makeToken(email, secret) {
  const data = new TextEncoder().encode(String(email).toLowerCase().trim() + '|' + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const token = String(body.token || '').trim();

    if (!email || !token) {
      return new Response(JSON.stringify({ error: 'Faltan email o token' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const secret = env.UNSUBSCRIBE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || 'textum-unsub';
    const expected = await makeToken(email, secret);

    if (token !== expected) {
      return new Response(JSON.stringify({ error: 'Enlace de baja no válido o caducado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      env.VITE_SUPABASE_URL || env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const now = new Date().toISOString();

    // Marca todos los leads de ese email como dados de baja
    const { error, count } = await supabase
      .from('leads')
      .update({ unsubscribed_at: now })
      .eq('email', email)
      .is('unsubscribed_at', null);

    if (error) {
      console.error('unsubscribe update error:', error);
      // Si la columna no existe aún, intentamos no romper del todo
      return new Response(
        JSON.stringify({
          error:
            'No se pudo registrar la baja en la base de datos. Contacta con contacto@mentoriatextum.com',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Te has dado de baja correctamente. No recibirás más comunicaciones comerciales de TEXTUM.',
        updated: count ?? undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('unsubscribe error:', err);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
