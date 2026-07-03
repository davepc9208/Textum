// functions/api/distribute.js — Cloudflare Pages Function

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '…';
}

async function generateSocialContent(apiKey, { title, excerpt, contentSnippet, slug }) {
  const articleUrl = `https://mentoriatextum.com/blog/${slug}`;

  const prompt = `Eres un experto en marketing de contenidos académicos para Latinoamérica.
Generas textos para "Mentoría TEXTUM", servicio de mentoría académica especializado en artículos científicos y trabajos universitarios (Ecuador y Perú).
Tono: profesional, cercano, orientado a estudiantes universitarios y de posgrado.

ARTÍCULO:
Título: ${title}
Extracto: ${excerpt}
Contenido: ${contentSnippet}
URL: ${articleUrl}

Responde ÚNICAMENTE con JSON válido. Sin texto antes ni después. Sin bloques de código markdown.

{
  "linkedin": "post profesional 280-350 palabras, saltos de línea naturales, propuesta de valor clara, 5-6 hashtags al final",
  "instagram": "caption 150-200 palabras, empieza con emoji, lenguaje cercano, termina con Link en bio y 10-12 hashtags",
  "twitter": "hilo 6 tweets numerados 1/ a 6/, máximo 270 caracteres cada uno, el último incluye la URL",
  "pinterest": "descripción SEO 150-200 palabras orientada a búsqueda, menciona mentoriatextum.com al final, sin hashtags",
  "tiktok_script": "guion 25 segundos: [0s-3s] gancho, [3s-8s] problema, [8s-20s] solución en 3 puntos, [20s-25s] CTA con @mentoriatextum"
}`;

  const response = await fetch(
    `${GEMINI_API_URL}?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2000 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  if (!rawText) throw new Error('Gemini no devolvió contenido.');

  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned);
}

async function pingSitemap() {
  const sitemapUrl = 'https://mentoriatextum.com/sitemap.xml';
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  try {
    const r = await fetch(pingUrl);
    return { ok: r.ok, status: r.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Cloudflare Pages Function — onRequest handles all HTTP methods
export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

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
    return new Response(
      JSON.stringify({ error: 'Método no permitido.' }),
      { status: 405, headers: corsHeaders }
    );
  }

  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY no configurada en Cloudflare.' }),
      { status: 500, headers: corsHeaders }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body inválido. Se esperaba JSON.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const { title, content, slug, excerpt } = body;

  if (!title || !slug) {
    return new Response(
      JSON.stringify({ error: 'Faltan campos: title y slug son obligatorios.' }),
      { status: 400, headers: corsHeaders }
    );
  }

  const contentSnippet = truncate(stripHtml(content ?? ''), 1500);
  const results = { sitemap: null, social: null, errors: [] };

  try {
    results.sitemap = await pingSitemap();
  } catch (e) {
    results.sitemap = { ok: false, status: 0 };
    results.errors.push(`Sitemap: ${e.message}`);
  }

  try {
    results.social = await generateSocialContent(apiKey, {
      title,
      excerpt: excerpt ?? '',
      contentSnippet,
      slug,
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'Error generando contenido con Gemini.', detail: e.message }),
      { status: 502, headers: corsHeaders }
    );
  }

  return new Response(JSON.stringify(results), { status: 200, headers: corsHeaders });
}