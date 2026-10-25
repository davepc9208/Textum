import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestPost } from '../functions/api/unsubscribe.js';
import { makeUnsubscribeToken, verifyUnsubscribeToken } from '../functions/_shared/security.js';

const origin = 'https://www.mentoriatextum.com';
const secret = 'test-unsubscribe-signing-secret';
const validEnv = { SUPABASE_URL: 'https://db.example', SUPABASE_SERVICE_ROLE_KEY: 'service-key', UNSUBSCRIBE_SECRET: secret };

function request(body) {
  return new Request(`${origin}/api/unsubscribe`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeDatabase({ leads = [], prospects = [], rpcError = null } = {}) {
  const updates = [];
  const db = {
    from(table) {
      return {
        select() {
          const query = {
            eq() { return query; },
            limit: async () => ({ data: table === 'leads' ? leads : prospects, error: null }),
          };
          return query;
        },
      };
    },
    async rpc(name, args) {
      updates.push({ name, args });
      return { data: null, error: rpcError };
    },
  };
  return { db, updates };
}

test('signed unsubscribe tokens are email-bound, expiring and reject tampering', async () => {
  const now = Date.UTC(2026, 0, 1);
  const token = await makeUnsubscribeToken('Person@Example.com', secret, now);
  assert.equal(await verifyUnsubscribeToken('person@example.com', token, secret, now + 60_000), true);
  assert.equal(await verifyUnsubscribeToken('other@example.com', token, secret, now + 60_000), false);
  assert.equal(await verifyUnsubscribeToken('person@example.com', `${token}x`, secret, now + 60_000), false);
  assert.equal(await verifyUnsubscribeToken('person@example.com', token, secret, now + (91 * 24 * 60 * 60 * 1000)), false);
  const shortToken = await makeUnsubscribeToken('person@example.com', secret, now, 900);
  assert.equal(await verifyUnsubscribeToken('person@example.com', shortToken, secret, now + 901_000), false);
});

test('email-only request sends a confirmation email and does not update records', async () => {
  const originalFetch = globalThis.fetch;
  const { db, updates } = makeDatabase({ leads: [{ id: 'lead-1' }] });
  let sentEmail;
  globalThis.fetch = async (_url, init) => {
    sentEmail = JSON.parse(init.body);
    return new Response('{}', { status: 200 });
  };
  try {
    const response = await onRequestPost({
      request: request({ email: 'person@example.com' }),
      env: { ...validEnv, RESEND_API_KEY: 'resend-key' },
      supabaseClient: db,
      enforceRateLimit: async () => true,
    });
    assert.equal(response.status, 200);
    assert.equal(updates.length, 0);
    assert.match(sentEmail.html, /Confirmar baja/);
    assert.match(sentEmail.html, /token=/);
    assert.match((await response.json()).message, /Si el correo está registrado/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('signed link performs transactional unsubscription and reports database failure', async () => {
  const now = Date.now();
  const token = await makeUnsubscribeToken('person@example.com', secret, now);
  const { db, updates } = makeDatabase({ leads: [{ id: 'lead-1' }], prospects: [{ id: 'prospect-1' }] });
  const rateOk = async () => true;
  const response = await onRequestPost({ request: request({ email: 'person@example.com', token }), env: validEnv, supabaseClient: db, enforceRateLimit: rateOk });
  assert.equal(response.status, 200);
  assert.equal(updates[0].name, 'unsubscribe_communications');
  assert.equal(updates[0].args.p_email, 'person@example.com');

  const failing = makeDatabase({ rpcError: { message: 'write denied' } });
  const failed = await onRequestPost({ request: request({ email: 'person@example.com', token }), env: validEnv, supabaseClient: failing.db, enforceRateLimit: rateOk });
  assert.equal(failed.status, 500);
  assert.equal((await failed.json()).success, undefined);
});

test('rate-limit storage failures return 503 instead of allowing unsubscribe requests', async () => {
  const response = await onRequestPost({
    request: request({ email: 'person@example.com' }),
    env: validEnv,
    enforceRateLimit: async () => { throw Object.assign(new Error('cache unavailable'), { name: 'RateLimitUnavailableError' }); },
  });
  assert.equal(response.status, 503);
});
