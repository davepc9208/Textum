import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/assistant.js';

const origin = 'https://www.mentoriatextum.com';

// Caché en memoria mínima que imita caches.default (match/put) de Cloudflare.
function installFakeCache() {
  const store = new Map();
  globalThis.caches = {
    default: {
      async match(key) {
        const cached = store.get(key.url);
        if (!cached) return undefined;
        return new Response(cached.body, { status: 200, headers: cached.headers });
      },
      async put(key, response) {
        const body = await response.clone().text();
        const headers = {};
        response.headers.forEach((value, name) => { headers[name] = value; });
        store.set(key.url, { body, headers });
      },
    },
  };
  return () => { delete globalThis.caches; };
}

function chatBody(messages, sessionId = 'test-session-1') {
  return new Request(`${origin}/api/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'chat', lang: 'es', session_id: sessionId, messages }),
  });
}

// IP alta en los tests de sesión para que el límite que se evalúa sea el de
// conversación y no el de IP (que en producción es 12/10 min).
const SESSION_TEST_ENV = { ASSISTANT_IP_CHAT_LIMIT: '100' };

test('assistant rejects a conversation that exceeds the per-session message limit with a friendly 429', async () => {
  const restoreCache = installFakeCache();
  try {
    // 15 mensajes permitidos por sesión: el 16º debe rechazarse con 429.
    for (let i = 1; i <= 15; i += 1) {
      const ok = await onRequestPost({ request: chatBody([{ role: 'user', content: `mensaje ${i}` }]), env: SESSION_TEST_ENV });
      assert.equal(ok.status, 200, `mensaje ${i} debería pasar`);
    }
    const blocked = await onRequestPost({ request: chatBody([{ role: 'user', content: 'mensaje 16' }]), env: SESSION_TEST_ENV });
    assert.equal(blocked.status, 429);
    const data = await blocked.json();
    assert.equal(data.limit_reached, true);
    assert.match(data.error, /límite de esta conversación/i);
  } finally {
    restoreCache();
  }
});

test('assistant allows a fresh conversation (different session) after the first one is capped', async () => {
  const restoreCache = installFakeCache();
  try {
    for (let i = 1; i <= 15; i += 1) {
      await onRequestPost({ request: chatBody([{ role: 'user', content: `a-${i}` }], 'sesion-a'), env: SESSION_TEST_ENV });
    }
    const blocked = await onRequestPost({ request: chatBody([{ role: 'user', content: 'a-16' }], 'sesion-a'), env: SESSION_TEST_ENV });
    assert.equal(blocked.status, 429);

    // Otra pestaña/sesión (mismo IP) puede seguir conversando.
    const fresh = await onRequestPost({ request: chatBody([{ role: 'user', content: 'b-1' }], 'sesion-b'), env: SESSION_TEST_ENV });
    assert.equal(fresh.status, 200);
  } finally {
    restoreCache();
  }
});

test('assistant asks for Turnstile from the 3rd turn when a secret is configured', async () => {
  const restoreCache = installFakeCache();
  try {
    const convo = [
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'hola, cuéntame' },
      { role: 'user', content: 'tengo una tesis' },
      { role: 'assistant', content: 'entiendo' },
      { role: 'user', content: 'necesito ayuda con la metodología' },
    ];
    const env = { ASSISTANT_IP_CHAT_LIMIT: '100', TURNSTILE_SECRET_KEY: 'secret' };
    const blocked = await onRequestPost({ request: chatBody(convo, 'captcha-1'), env });
    assert.equal(blocked.status, 403);
    const data = await blocked.json();
    assert.equal(data.captcha_required, true);
  } finally {
    restoreCache();
  }
});

test('assistant lets the first two turns through without Turnstile', async () => {
  const restoreCache = installFakeCache();
  try {
    const env = { ASSISTANT_IP_CHAT_LIMIT: '100', TURNSTILE_SECRET_KEY: 'secret' };
    const first = await onRequestPost({
      request: chatBody([
        { role: 'user', content: 'hola' },
        { role: 'assistant', content: 'hola' },
        { role: 'user', content: 'segunda pregunta' },
      ], 'captcha-2'),
      env,
    });
    assert.equal(first.status, 200);
  } finally {
    restoreCache();
  }
});

test('assistant accepts the conversation once Turnstile verifies', async () => {
  const restoreCache = installFakeCache();
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.includes('turnstile/v0/siteverify')) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }
    throw new Error(`unexpected fetch: ${url}`);
  };
  try {
    const convo = [
      { role: 'user', content: 'hola' },
      { role: 'assistant', content: 'hola' },
      { role: 'user', content: 'tercera' },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'cuarta pregunta más larga' },
    ];
    const env = { ASSISTANT_IP_CHAT_LIMIT: '100', TURNSTILE_SECRET_KEY: 'secret' };
    const request = new Request(`${origin}/api/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'chat', lang: 'es', session_id: 'captcha-3', turnstileToken: 'tok-abcdefghij', messages: convo }),
    });
    const ok = await onRequestPost({ request, env });
    assert.equal(ok.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
    restoreCache();
  }
});

test('assistant enforces the per-IP 10-minute window limit', async () => {
  const restoreCache = installFakeCache();
  try {
    // 12 mensajes por IP en 10 minutos (límite IP_CHAT_LIMIT).
    for (let i = 1; i <= 12; i += 1) {
      const ok = await onRequestPost({ request: chatBody([{ role: 'user', content: `ip-${i}` }], `s-${i}`), env: {} });
      assert.equal(ok.status, 200, `request ${i} debería pasar`);
    }
    const blocked = await onRequestPost({ request: chatBody([{ role: 'user', content: 'ip-13' }], 'otra-sesion'), env: {} });
    assert.equal(blocked.status, 429);
  } finally {
    restoreCache();
  }
});
