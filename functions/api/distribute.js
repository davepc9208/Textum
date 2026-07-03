// functions/api/distribute.js — Cloudflare Pages Function

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

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

async function generateSocialContent(apiKey, { title, excerpt, contentSnippet, slug }) {
  const articleUrl = `https://mentoriatextum.com/blog/${slug}`;

  const prompt = `Eres un experto en marketing de contenidos academicos para Latinoamerica.
Generas textos para "Mentoria TEXTUM", servicio de mentoria academica especializado en articulos cientificos y trabajos universitarios (Ecuador y Peru).
Tono: profesional, cercano, orientado a estudiantes universitarios y de posgrado.

ARTICULO:
Titulo: ${title}
Extracto: ${excerpt}
Contenido: ${contentSnippet}
URL: ${articleUrl}

Responde UNICAMENTE con JSON valido. Sin texto antes ni despues. Sin bloques de codigo markdown.

{"linkedin":"post profesional 280-350 palabras con hashtags","instagram":"caption 150-200 palabras con emojis y hashtags","twitter":"hilo 6 tweets numerados 1/ a 6/","pinterest":"descripcion SEO 150-200 palabras","tiktok_script":"guion 25 segundos con marcas de tiempo"}`;

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) throw new Error('Gemini devolvio respuesta vacia.');

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

async function pingSitemap() {
  try {
    const r = await fetch(
      `https://www.google.com/ping?sitemap=${encodeURIComponent('https://mentoriatextum.com/sitemap.xml')}`
    );
    return { ok: r.ok, status: r.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function onRequest(context) {
  // Global safety net — catches anything that escapes inner try/catch blocks
  try {
    const { request, env } = context;

    // CORS preflight
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

    // --- Diagnostic mode ---
    // Send {"diagnose": true} to check config without calling Gemini
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body invalido. Se esperaba JSON.' }, 400);
    }

    if (body.diagnose === true) {
      return json({
        ok: true,
        gemini_key_present: !!env.GEMINI_API_KEY,
        gemini_key_prefix: env.GEMINI_API_KEY ? env.GEMINI_API_KEY.slice(0, 6) + '...' : null,
      });
    }

    // --- Normal flow ---
    const { title, content, slug, excerpt } = body;

    if (!title || !slug) {
      return json({ error: 'Faltan campos: title y slug son obligatorios.' }, 400);
    }

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      return json({ error: 'GEMINI_API_KEY no configurada en Cloudflare.' }, 500);
    }

    const contentSnippet = truncate(stripHtml(content ?? ''), 1500);
    const results = { sitemap: null, social: null, errors: [] };

    // Sitemap ping
    results.sitemap = await pingSitemap();

    // Gemini
    try {
      results.social = await generateSocialContent(apiKey, {
        title,
        excerpt: excerpt ?? '',
        contentSnippet,
        slug,
      });
    } catch (e) {
      return json({ error: 'Error con Gemini.', detail: String(e) }, 502);
    }

    return json(results);

  } catch (e) {
    // Last resort — should never reach here
    return new Response(
      JSON.stringify({ error: 'Error inesperado.', detail: String(e) }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}