// functions/api/translate.js
// Cloudflare Pages Function — traduce artículo ES → EN usando Groq
//
// Cambios v2:
// - max_tokens aumentado a 8000
// - Contenido largo se divide en chunks para evitar cortes
// - Mejor manejo de errores con detalle del fallo real
// - StarterKit link fix: ver RichTextEditor.tsx

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL        = "llama-3.3-70b-versatile";
// Límite conservador — el contexto del modelo es mayor pero Groq tiene rate limits
const MAX_CONTENT_CHARS = 12_000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

const SYSTEM_TEXT = `
Eres un traductor académico especializado en mentoría universitaria, investigación
científica y redacción académica para el contexto de América Latina y Europa.

REGLAS:
1. Traduce del español al inglés académico formal (variante internacional).
2. Mantén el tono profesional, sereno y riguroso del original.
3. NO traduzcas estos términos: TFG, TFM, APA 7, IMRaD, Scopus, Latindex, ANECA, Bologna, FLUX, TEXTUM.
4. Responde ÚNICAMENTE con la traducción, sin explicaciones ni comentarios.
`.trim();

const SYSTEM_HTML = `
Eres un traductor académico especializado en mentoría universitaria e investigación científica.

REGLAS ESTRICTAS:
1. Traduce del español al inglés académico formal el TEXTO dentro de las etiquetas HTML.
2. NO modifiques, muevas ni elimines ninguna etiqueta HTML ni sus atributos.
3. Preserva exactamente la estructura y el orden del HTML original.
4. NO traduzcas: TFG, TFM, APA 7, IMRaD, Scopus, Latindex, ANECA, Bologna, FLUX, TEXTUM.
5. Responde ÚNICAMENTE con el HTML traducido, sin markdown ni explicaciones.
`.trim();

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
      temperature: 0.2,
      max_tokens:  8000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = await res.json();
  const result = data.choices?.[0]?.message?.content?.trim();

  if (!result) throw new Error("Groq devolvió respuesta vacía");

  // Detectar si Groq cortó la respuesta por límite de tokens
  const finishReason = data.choices?.[0]?.finish_reason;
  if (finishReason === "length") {
    console.warn("[translate] Respuesta cortada por límite de tokens — considera dividir el contenido");
  }

  return result;
}

// Divide HTML largo en chunks respetando etiquetas de bloque
function splitHtmlIntoChunks(html, maxChars) {
  if (html.length <= maxChars) return [html];

  const chunks = [];
  // Dividir por párrafos/bloques principales
  const blockRegex = /(<(?:p|h[1-6]|ul|ol|li|blockquote|pre|table|div)[^>]*>[\s\S]*?<\/(?:p|h[1-6]|ul|ol|li|blockquote|pre|table|div)>)/gi;
  const parts = html.split(blockRegex).filter(Boolean);

  let current = "";
  for (const part of parts) {
    if ((current + part).length > maxChars && current.length > 0) {
      chunks.push(current);
      current = part;
    } else {
      current += part;
    }
  }
  if (current) chunks.push(current);

  return chunks.length > 0 ? chunks : [html];
}

async function translateHtmlContent(apiKey, content_es) {
  if (!content_es) return "";

  // Si el contenido es corto, traducir de una vez
  if (content_es.length <= MAX_CONTENT_CHARS) {
    return callGroq(
      apiKey,
      SYSTEM_HTML,
      `Traduce al inglés el texto dentro de este HTML. Devuelve SOLO el HTML:\n\n${content_es}`
    );
  }

  // Contenido largo: dividir en chunks y traducir por partes
  console.log(`[translate] Contenido largo (${content_es.length} chars) — dividiendo en chunks`);
  const chunks = splitHtmlIntoChunks(content_es, MAX_CONTENT_CHARS);
  const translatedChunks = await Promise.all(
    chunks.map((chunk, i) =>
      callGroq(
        apiKey,
        SYSTEM_HTML,
        `Traduce al inglés el texto dentro de este HTML (parte ${i + 1} de ${chunks.length}). Devuelve SOLO el HTML:\n\n${chunk}`
      )
    )
  );
  return translatedChunks.join("\n");
}

export async function onRequest(context) {
  const { request, env } = context;

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
    return json({ error: "GROQ_API_KEY no configurada en Cloudflare Pages → Settings → Environment Variables." }, 500);
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
      error: "Faltan campos: title_es y content_es son obligatorios.",
      received: Object.keys(body),
    }, 400);
  }

  try {
    // Título y excerpt en paralelo (son cortos) + contenido (puede ser largo)
    const [title_en, excerpt_en, content_en] = await Promise.all([
      callGroq(apiKey, SYSTEM_TEXT, `Traduce este título académico al inglés:\n\n${title_es}`),
      excerpt_es
        ? callGroq(apiKey, SYSTEM_TEXT, `Traduce este resumen académico al inglés:\n\n${excerpt_es}`)
        : Promise.resolve(""),
      translateHtmlContent(apiKey, content_es),
    ]);

    return json({ success: true, title_en, excerpt_en, content_en });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[translate] Error:", message);

    // Dar un mensaje de error útil según el tipo de fallo
    let userMessage = "Error al traducir con Groq.";
    if (message.includes("401")) userMessage = "GROQ_API_KEY inválida o expirada.";
    else if (message.includes("429")) userMessage = "Límite de velocidad de Groq alcanzado — espera unos segundos e inténtalo de nuevo.";
    else if (message.includes("413") || message.includes("too large")) userMessage = "El artículo es demasiado largo para traducir de una vez — divide el contenido en secciones más pequeñas.";
    else if (message.includes("503") || message.includes("unavailable")) userMessage = "El servicio de Groq no está disponible temporalmente — inténtalo en unos minutos.";

    return json({ error: userMessage, detail: message }, 500);
  }
}
