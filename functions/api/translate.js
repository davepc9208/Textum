// functions/api/translate.js
// Cloudflare Pages Function — traduce un artículo de ES a EN usando Groq.
//
// Recibe: { title_es, excerpt_es, content_es }
// Devuelve: { title_en, excerpt_en, content_en }
//
// Estrategia de traducción:
// - Título y excerpt: traducción directa de texto plano.
// - Contenido: el HTML de Tiptap se envía tal cual. El modelo tiene instrucción
//   explícita de NO tocar las etiquetas HTML — solo traducir el texto interior.
//   Esto preserva toda la estructura, estilos y clases del editor.

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function callGroq(apiKey, systemPrompt, userPrompt) {
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userPrompt },
      ],
      temperature: 0.2,   // baja temperatura = más fiel al original
      max_tokens: 6000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return json({ error: "Método no permitido." }, 405);
  }

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: "GROQ_API_KEY no configurada en Cloudflare." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  const { title_es, excerpt_es, content_es } = body;

  if (!title_es || !content_es) {
    return json({
      error: "Faltan campos obligatorios: title_es y content_es son requeridos.",
    }, 400);
  }

  // ── Sistema de prompts ────────────────────────────────────────────────────

  const SYSTEM_TEXT = `
Eres un traductor académico especializado en mentoría universitaria, investigación
científica y redacción académica para el contexto de América Latina y Europa.

REGLAS ESTRICTAS:
1. Traduce del español al inglés académico formal (variante internacional, no US slang).
2. Mantén el tono profesional, sereno y riguroso del texto original.
3. Preserva términos técnicos clave como: TFG, TFM, APA 7, IMRaD, Scopus, Latindex,
   ANECA, Bologna, FLUX, TEXTUM. No los traduzcas — déjalos tal cual.
4. Responde ÚNICAMENTE con la traducción solicitada, sin explicaciones ni comentarios.
`.trim();

  const SYSTEM_HTML = `
Eres un traductor académico especializado en mentoría universitaria e investigación científica.

REGLAS ESTRICTAS:
1. Traduce del español al inglés académico formal el TEXTO que está DENTRO de las etiquetas HTML.
2. NO modifiques, muevas, añadas ni elimines ninguna etiqueta HTML (<p>, <strong>, <h2>, <ul>, <li>, <a>, <img>, <blockquote>, etc.).
3. NO modifiques los atributos de las etiquetas (class, href, src, alt, etc.).
4. Preserva exactamente la estructura, el espaciado y el orden del HTML original.
5. Preserva sin traducir: TFG, TFM, APA 7, IMRaD, Scopus, Latindex, ANECA, Bologna, FLUX, TEXTUM.
6. Responde ÚNICAMENTE con el HTML traducido, sin markdown, sin explicaciones, sin bloques de código.
`.trim();

  try {
    // Las tres traducciones en paralelo — reduce el tiempo total a ~1/3
    const [title_en, excerpt_en, content_en] = await Promise.all([
      callGroq(
        apiKey,
        SYSTEM_TEXT,
        `Traduce este título de artículo académico al inglés:\n\n${title_es}`
      ),
      excerpt_es
        ? callGroq(
            apiKey,
            SYSTEM_TEXT,
            `Traduce este resumen / excerpt académico al inglés:\n\n${excerpt_es}`
          )
        : Promise.resolve(""),
      callGroq(
        apiKey,
        SYSTEM_HTML,
        `Traduce al inglés el texto dentro de este HTML académico. Devuelve SOLO el HTML:\n\n${content_es}`
      ),
    ]);

    return json({
      success: true,
      title_en,
      excerpt_en,
      content_en,
    });

  } catch (err) {
    console.error("[translate] Error:", err.message);
    return json({
      error: "Error al traducir con Groq.",
      detail: err.message,
    }, 500);
  }
}
