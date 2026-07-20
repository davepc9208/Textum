// functions/api/distribute.js
// Fix: fechas de republicación ahora se generan dinámicamente desde new Date()
// en lugar de estar hardcodeadas en julio 2026.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const VERSION = "5.1.0-dynamic-dates";

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '...';
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Genera 6 fechas de republicación a partir de hoy, cada 3 días
function generateRepublishingDates() {
  const platforms = ['LinkedIn', 'Facebook', 'Instagram', 'Pinterest', 'LinkedIn', 'Facebook'];
  const today = new Date();
  return platforms.map((platform, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + (i + 1) * 3);
    return {
      date: d.toISOString().slice(0, 10),
      platform,
    };
  });
}

async function generateFullContent(article, env) {
  const { title, content, slug, excerpt, category, tags } = article;
  const contentSnippet = truncate(stripHtml(content ?? ''), 2000);
  const articleUrl = `https://mentoriatextum.com/blog/${slug}`;

  // Fechas dinámicas para el schedule — nunca quedan en el pasado
  const scheduleDates = generateRepublishingDates();
  const schedulePlaceholder = scheduleDates
    .map((s, i) => `{ "date": "${s.date}", "platform": "${s.platform}", "content": "Variación ${i + 1} del post para republicación" }`)
    .join(',\n      ');

  const prompt = `Eres un experto en marketing de contenido académico para "Mentoría TEXTUM" (Ecuador, Perú y España).

Genera contenido completo para todas las plataformas basado en este artículo:

TÍTULO: ${title}
CATEGORÍA: ${category || 'Académico'}
TAGS: ${tags?.join(', ') || ''}
EXTRACTO: ${excerpt || ''}
CONTENIDO: ${contentSnippet}
URL: ${articleUrl}

IMPORTANTE: Responde SOLO con JSON válido sin markdown. Sigue EXACTAMENTE esta estructura:

{
  "article": {
    "title": "${title}",
    "url": "${articleUrl}",
    "slug": "${slug}"
  },
  "linkedin": {
    "post": "Post profesional de 200-250 palabras. Empieza con una pregunta provocadora. Incluye 3-5 hashtags relevantes. Firma: - Mentoría TEXTUM"
  },
  "facebook": {
    "post": "Post conversacional de 150-200 palabras. Empieza con una frase que genere engagement. Incluye llamado a la acción."
  },
  "instagram": {
    "caption": "Caption de 150 palabras con emojis. Empieza con un gancho visual. Incluye 10-15 hashtags."
  },
  "pinterest": {
    "title": "Título SEO de 60-80 caracteres",
    "description": "Descripción de 150 palabras con keywords principales."
  },
  "twitter": {
    "thread": [
      "Tweet 1: Hook + introducción (máx 280 caracteres)",
      "Tweet 2: Punto clave 1",
      "Tweet 3: Punto clave 2",
      "Tweet 4: Punto clave 3",
      "Tweet 5: Punto clave 4",
      "Tweet 6: CTA + enlace + hashtags"
    ]
  },
  "tiktok_reels": {
    "script": "Guion de 25-30 segundos con marcas de tiempo. Formato: 0s-3s: texto, 4s-7s: texto, etc.",
    "hooks": ["Hook 1", "Hook 2", "Hook 3"]
  },
  "internal_links": [
    {"text": "Texto del enlace", "url": "/blog/articulo-relacionado", "description": "Descripción breve"}
  ],
  "republishing": {
    "schedule": [
      ${schedulePlaceholder}
    ]
  },
  "visual_assets": {
    "instagram_carousel": [
      { "slide": 1, "title": "Título slide 1", "text": "Texto (80-100 chars)", "image_prompt": "Prompt imagen 1" },
      { "slide": 2, "title": "Título slide 2", "text": "Texto (80-100 chars)", "image_prompt": "Prompt imagen 2" },
      { "slide": 3, "title": "Título slide 3", "text": "Texto (80-100 chars)", "image_prompt": "Prompt imagen 3" },
      { "slide": 4, "title": "Título slide 4", "text": "Texto (80-100 chars)", "image_prompt": "Prompt imagen 4" },
      { "slide": 5, "title": "Título slide 5", "text": "Texto (80-100 chars)", "image_prompt": "Prompt imagen 5" }
    ],
    "pinterest_pin": {
      "title": "Título del pin",
      "description": "Descripción para el pin",
      "image_prompt": "Prompt para generar imagen del pin"
    },
    "youtube_thumbnail": {
      "text": "Texto para miniatura (máx 5 palabras)",
      "image_prompt": "Prompt para generar imagen de miniatura"
    }
  },
  "seo": {
    "meta_title": "Título SEO (50-60 caracteres)",
    "meta_description": "Meta description (150-160 caracteres)",
    "keywords": ["keyword1", "keyword2", "keyword3"]
  }
}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en marketing de contenido académico para Latinoamérica y España. Siempre respondes con JSON válido y estructurado. Los textos deben ser profesionales, atractivos y adaptados al público académico.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    try {
      return JSON.parse(cleaned);
    } catch (parseError) {
      throw new Error(`Error parsing JSON: ${parseError.message}\nRaw text: ${cleaned.slice(0, 200)}`);
    }
  } catch (error) {
    throw new Error(`Error generando contenido: ${error.message}`);
  }
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
      return json({ error: 'Método no permitido.' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Body inválido.' }, 400);
    }

    const apiKey = env.GROQ_API_KEY;

    if (body.step === 'config') {
      return json({
        step: 'config',
        ok: true,
        key_present: !!apiKey,
        key_prefix: apiKey ? apiKey.slice(0, 8) + '...' : null,
        version: VERSION,
        mode: 'manual_generator',
      });
    }

    if (body.step === 'test_groq') {
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
            { role: 'system', content: 'Responde SOLO con JSON válido.' },
            { role: 'user', content: '{"test": "ok"}' },
          ],
          temperature: 0,
          max_tokens: 50,
        }),
      });
      const statusCode = res.status;
      const resText = await res.text();
      return json({ step: 'test_groq', http_status: statusCode, ok: statusCode === 200, raw: resText.slice(0, 500) });
    }

    if (!apiKey) return json({ error: 'GROQ_API_KEY no configurada.' }, 500);

    const { title, content, slug, excerpt, category, tags } = body;

    if (!title || !slug || !content) {
      return json({
        error: 'Faltan campos obligatorios',
        required: ['title', 'slug', 'content'],
        received: Object.keys(body),
      }, 400);
    }

    const generatedContent = await generateFullContent(
      { title, content, slug, excerpt, category, tags },
      env
    );

    return json({
      success: true,
      version: VERSION,
      generated_at: new Date().toISOString(),
      ...generatedContent,
      copy_ready: {
        linkedin: generatedContent.linkedin?.post || 'No generado',
        facebook: generatedContent.facebook?.post || 'No generado',
        instagram: generatedContent.instagram?.caption || 'No generado',
        pinterest: generatedContent.pinterest?.description || 'No generado',
        twitter_thread: generatedContent.twitter?.thread?.join('\n\n') || 'No generado',
        tiktok_script: generatedContent.tiktok_reels?.script || 'No generado',
      },
    });

  } catch (error) {
    return json({
      error: 'Error en el generador de contenido',
      detail: error.message,
      version: VERSION,
    }, 500);
  }
}
