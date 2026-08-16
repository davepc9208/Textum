// functions/api/unsubscribe.js
// Baja: con token (email) o solo con email (formulario web)
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

    if (!email) {
      return new Response(JSON.stringify({ error: 'Indica tu correo electrónico' }), {
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

    if (token) {
      const secret = env.UNSUBSCRIBE_SECRET || env.SUPABASE_SERVICE_ROLE_KEY || 'textum-unsub';
      const expected = await makeToken(email, secret);
      if (token !== expected) {
        return new Response(JSON.stringify({ error: 'Enlace de baja no válido o caducado' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(
      env.VITE_SUPABASE_URL || env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    const now = new Date().toISOString();

    const { data: existing, error: findError } = await supabase
      .from('leads')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (findError) {
      console.error('unsubscribe find error:', findError);
      return new Response(
        JSON.stringify({
          error: 'No se pudo consultar la base de datos. Contacta con contacto@mentoriatextum.com',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!existing || existing.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message:
            'Si ese correo estaba en nuestra lista, ya no recibirá más comunicaciones comerciales de TEXTUM.',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('leads')
      .update({ unsubscribed_at: now })
      .eq('email', email)
      .is('unsubscribed_at', null);

    if (error) {
      console.error('unsubscribe update error:', error);
      return new Response(
        JSON.stringify({
          error: 'No se pudo registrar la baja. Contacta con contacto@mentoriatextum.com',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Te has dado de baja correctamente. No recibirás más comunicaciones comerciales de TEXTUM.',
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
