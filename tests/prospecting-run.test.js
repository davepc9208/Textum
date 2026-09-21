import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/prospecting-run.js';

test('prospecting runner requires the cron secret', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.com/api/prospecting-run', { method: 'POST' }),
    env: { CRON_SECRET: 'secret' },
  });
  assert.equal(response.status, 401);
});

test('prospecting runner is disabled until explicitly enabled', async () => {
  const response = await onRequestPost({
    request: new Request('https://example.com/api/prospecting-run', {
      method: 'POST',
      headers: { Authorization: 'Bearer secret' },
    }),
    env: { CRON_SECRET: 'secret' },
  });
  assert.equal(response.status, 409);
  const body = await response.json();
  assert.match(body.error, /OUTREACH_ENABLED/);
});
