// =====================================================
// functions/api/distribute.js
// Mentoría TEXTUM
// Cloudflare Pages Function
// Groq Edition v4
// Compatible con frontend existente
// =====================================================

const GROQ_API_URL =
  "https://api.groq.com/openai/v1/chat/completions";

const MODEL =
  "llama-3.3-70b-versatile";

const VERSION = "4.0.0";

const TIMEOUT = 30000;

const RETRIES = 2;

const DEBUG = true;

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function onRequest(context) {
  try {
    const { request, env } = context;

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return json({ error: 'Metodo no permitido.' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body invalido.' }, 400);
    }

    const apiKey = env.GROQ_API_KEY;

    // --- Modo diagnóstico 1: solo comprueba config ---
    if (body.step === 'config') {
      return json({
        step: 'config',
        ok: true,
        key_present: !!apiKey,
        key_prefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
      });
    }

    // --- Modo diagnóstico 2: solo ping sitemap ---
    if (body.step === 'sitemap') {
      try {
        const r = await fetch(
          'https://www.google.com/ping?sitemap=https://mentoriatextum.com/sitemap.xml'
        );
        return json({ step: 'sitemap', ok: r.ok, status: r.status });
      } catch (e) {
        return json({ step: 'sitemap', ok: false, error: String(e) });
      }
    }

    // --- Modo diagnóstico 3: llama a Groq con texto mínimo ---
    if (body.step === 'groq_test') {
      if (!apiKey) return json({ error: 'Sin API key.' }, 500);

      const res = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'Responde SOLO con JSON valido.' },
            { role: 'user', content: '{"ok":true}' }
          ],
          temperature: 0,
          max_tokens: 20,
        }),
      });

      const statusCode = res.status;
      const resText = await res.text();
      return json({ step: 'groq_test', http_status: statusCode, raw: resText.slice(0, 500) });
    }

    // --- Flujo completo ---
    if (!apiKey) return json({ error: 'GROQ_API_KEY no configurada.' }, 500);

    const { title, content, slug, excerpt } = body;
    if (!title || !slug) return json({ error: 'Faltan title y slug.' }, 400);

    const contentSnippet = truncate(stripHtml(content ?? ''), 1500);

    // Sitemap ping (no bloqueante)
    let sitemap = null;
    try {
      const r = await fetch(
        `https://www.google.com/ping?sitemap=${encodeURIComponent('https://mentoriatextum.com/sitemap.xml')}`
      );
      sitemap = { ok: r.ok, status: r.status };
    } catch (e) {
      sitemap = { ok: false, error: String(e) };
    }

    // Groq
    const articleUrl = `https://mentoriatextum.com/blog/${slug}`;
    const prompt = `Eres experto en marketing academico latinoamericano para "Mentoria TEXTUM" (Ecuador y Peru).
Responde SOLO con JSON valido sin markdown.

ARTICULO:
Titulo: ${title}
Extracto: ${excerpt ?? ''}
Contenido: ${contentSnippet}
URL: ${articleUrl}

{"linkedin":"post 280 palabras con hashtags","instagram":"caption 150 palabras con emojis","twitter":"hilo 6 tweets numerados","pinterest":"descripcion SEO 150 palabras","tiktok_script":"guion 25 segundos con marcas de tiempo"}`;

    let groqRes;
    try {
      groqRes = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: 'Eres un asistente experto en marketing.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });
    } catch (e) {
      return json({ error: 'fetch a Groq fallo.', detail: String(e) }, 502);
    }

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return json({ error: 'Groq rechazo la peticion.', status: groqRes.status, detail: errText.slice(0, 300) }, 502);
    }

    let groqData;
    try {
      groqData = await groqRes.json();
    } catch (e) {
      return json({ error: 'Groq devolvio JSON invalido.', detail: String(e) }, 502);
    }

    const rawText = groqData.choices?.[0]?.message?.content ?? '';
    if (!rawText) return json({ error: 'Groq devolvio texto vacio.' }, 502);

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    let social;
    try {
      social = JSON.parse(cleaned);
    } catch (e) {
      return json({ error: 'No se pudo parsear JSON de Groq.', raw: cleaned.slice(0, 300) }, 502);
    }

    return json({ sitemap, social });

  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Error inesperado.', detail: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    );
  }
}