// functions/api/translate.js
// Cloudflare Pages Function — traduce un artículo de ES a EN usando Groq.
// CON MANEJO DE CONTENIDO LARGO Y MEJOR LOGGING

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";
const MAX_CONTENT_LENGTH = 4000; // Caracteres por chunk
const MAX_TOKENS = 4096; // Límite seguro para Llama 3

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

async function callGroq(apiKey, systemPrompt, userPrompt, maxTokens = MAX_TOKENS) {
  const startTime = Date.now();
  
  // Log en Cloudflare
  console.log(`[translate] Groq call - prompt length: ${userPrompt.length}, maxTokens: ${maxTokens}`);
  
  try {
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
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });

    const elapsed = Date.now() - startTime;
    console.log(`[translate] Groq response in ${elapsed}ms, status: ${res.status}`);

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[translate] Groq error ${res.status}:`, errText.slice(0, 500));
      
      // Si es error de rate limit o timeout, lanzamos con mensaje específico
      if (res.status === 429) {
        throw new Error("Límite de peticiones a Groq excedido. Espera unos segundos.");
      }
      if (res.status === 401) {
        throw new Error("API Key de Groq inválida o no configurada.");
      }
      
      throw new Error(`Groq ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    
    console.log(`[translate] Groq success - tokens: ${data.usage?.total_tokens || 'unknown'}`);
    
    return content;

  } catch (err) {
    console.error(`[translate] Groq call exception:`, err.message);
    throw err;
  }
}

// ── Divide el contenido en chunks si es muy largo ──
function splitContentIntoChunks(content, maxLength = MAX_CONTENT_LENGTH) {
  if (content.length <= maxLength) return [content];
  
  const chunks = [];
  // Dividir por párrafos para preservar estructura
  const paragraphs = content.split(/(<\/p>|<\/h[1-6]>|<\/div>|<\/ul>|<\/ol>|<\/blockquote>)/i);
  
  let currentChunk = '';
  let currentTag = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const part = paragraphs[i];
    
    // Si es una etiqueta de cierre, la añadimos al chunk actual
    if (part.match(/^<\/(p|h[1-6]|div|ul|ol|blockquote)>$/i)) {
      currentChunk += part;
      currentTag = part;
      continue;
    }
    
    // Si añadir este párrafo excede el límite, guardamos el chunk actual
    if (currentChunk.length + part.length > maxLength && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = '';
    }
    
    currentChunk += part;
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  console.log(`[translate] Content split into ${chunks.length} chunks`);
  return chunks;
}

// ── Traduce contenido largo por partes ──
async function translateLongContent(apiKey, content) {
  const chunks = splitContentIntoChunks(content);
  
  if (chunks.length === 1) {
    const SYSTEM = `
Eres un traductor académico especializado en mentoría universitaria e investigación científica.

REGLAS ESTRICTAS:
1. Traduce del español al inglés académico formal el TEXTO que está DENTRO de las etiquetas HTML.
2. NO modifiques, muevas, añadas ni elimines ninguna etiqueta HTML.
3. NO modifiques los atributos de las etiquetas (class, href, src, alt, etc.).
4. Preserva exactamente la estructura del HTML original.
5. Preserva sin traducir: TFG, TFM, APA 7, IMRaD, Scopus, Latindex, ANECA, Bologna, FLUX, TEXTUM.
6. Responde ÚNICAMENTE con el HTML traducido, sin markdown, sin explicaciones.
`.trim();

    return await callGroq(apiKey, SYSTEM, 
      `Traduce al inglés el texto dentro de este HTML académico. Devuelve SOLO el HTML:\n\n${content}`
    );
  }
  
  // Traducir chunk por chunk
  console.log(`[translate] Translating ${chunks.length} chunks...`);
  
  const SYSTEM_CHUNK = `
Eres un traductor académico. Traduce el siguiente fragmento de HTML del español al inglés académico.

REGLAS:
1. Traduce SOLO el texto dentro de las etiquetas HTML
2. NO modifies las etiquetas ni sus atributos
3. Preserva: TFG, TFM, APA 7, IMRaD, Scopus, Latindex, ANECA, Bologna, FLUX, TEXTUM
4. Responde SOLO con el HTML traducido, sin explicaciones
`.trim();

  const translatedChunks = [];
  
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[translate] Translating chunk ${i + 1}/${chunks.length}`);
    
    const translated = await callGroq(
      apiKey,
      SYSTEM_CHUNK,
      `Fragmento ${i + 1} de ${chunks.length}:\n\n${chunks[i]}`
    );
    
    translatedChunks.push(translated);
  }
  
  return translatedChunks.join('');
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
    console.error("[translate] GROQ_API_KEY not configured");
    return json({ error: "GROQ_API_KEY no configurada en Cloudflare." }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body JSON inválido." }, 400);
  }

  const { title_es, excerpt_es, content_es } = body;
  
  console.log(`[translate] Request received - title length: ${title_es?.length || 0}, content length: ${content_es?.length || 0}`);

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

  try {
    // Traducir título
    console.log("[translate] Translating title...");
    const title_en = await callGroq(
      apiKey,
      SYSTEM_TEXT,
      `Traduce este título de artículo académico al inglés:\n\n${title_es}`
    );
    console.log(`[translate] Title translated: ${title_en.length} chars`);

    // Traducir excerpt (si existe)
    let excerpt_en = "";
    if (excerpt_es && excerpt_es.trim()) {
      console.log("[translate] Translating excerpt...");
      excerpt_en = await callGroq(
        apiKey,
        SYSTEM_TEXT,
        `Traduce este resumen / excerpt académico al inglés:\n\n${excerpt_es}`
      );
      console.log(`[translate] Excerpt translated: ${excerpt_en.length} chars`);
    }

    // Traducir contenido (maneja contenido largo)
    console.log("[translate] Translating content...");
    const content_en = await translateLongContent(apiKey, content_es);
    console.log(`[translate] Content translated: ${content_en.length} chars`);

    return json({
      success: true,
      title_en,
      excerpt_en,
      content_en,
    });

  } catch (err) {
    console.error("[translate] Error:", err.message);
    return json({
      success: false,
      error: "Error al traducir con Groq.",
      detail: err.message,
    }, 500);
  }
}