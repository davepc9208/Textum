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
