export const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Orden recomendado: modelo grande para calidad y modelos alternativos del catálogo actual.
export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3-32b',
  'qwen/qwen3-6.2-27b',
];

export async function callGroqWithFallback({ apiKey, messages, temperature = 0.2, maxTokens = 500, fetchWithRetry, onModelError }) {
  if (!apiKey) throw new Error('GROQ_API_KEY_missing');
  let lastError;
  for (const model of GROQ_MODELS) {
    try {
      const response = await fetchWithRetry(GROQ_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      }, { retries: 1, timeoutMs: 12000 });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq API ${response.status}: ${text.slice(0, 400)}`);
      }
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('Groq empty response');
      return { content, model };
    } catch (error) {
      lastError = error;
      onModelError?.(model, error);
    }
  }
  throw lastError || new Error('All Groq models failed');
}
