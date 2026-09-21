import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/prospecting-reply.js';

test('outreach reply webhook requires its secret', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.com/api/prospecting-reply', { method: 'POST' }),
    env: { OUTREACH_WEBHOOK_SECRET: 'secret' },
  });
  assert.equal(response.status, 401);
});

test('outreach reply webhook validates event type', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.com/api/prospecting-reply', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'person@example.org', event_type: 'unknown' }),
    }),
    env: { OUTREACH_WEBHOOK_SECRET: 'secret' },
  });
  assert.equal(response.status, 400);
});
