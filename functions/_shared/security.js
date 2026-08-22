const DEFAULT_ORIGIN = 'https://www.mentoriatextum.com';

export function getRequestId(request) {
  const supplied = request.headers.get('X-Request-ID');
  return supplied && /^[A-Za-z0-9._-]{8,80}$/.test(supplied)
    ? supplied
    : crypto.randomUUID();
}

export function log(level, event, fields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    service: 'textum-pages-function',
    level,
    event,
    ...fields,
  };
  const output = JSON.stringify(entry);
  if (level === 'error') console.error(output);
  else if (level === 'warn') console.warn(output);
  else console.log(output);
}

export function getAllowedOrigin(request, env = {}) {
  const origin = request.headers.get('Origin');
  const configured = (env.APP_ORIGIN || DEFAULT_ORIGIN).replace(/\/$/, '');
  if (origin && origin.replace(/\/$/, '') === configured) return origin;
  return configured;
}

export function corsHeaders(request, env = {}) {
  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(request, env),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-ID',
    Vary: 'Origin',
  };
}

export function jsonResponse(data, status, request, env = {}, requestId = getRequestId(request), extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Request-ID': requestId,
      ...extraHeaders,
    },
  });
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
  } catch {
    return null;
  }
}

function bearerToken(request) {
  const value = request.headers.get('Authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export async function fetchWithRetry(input, init = {}, options = {}) {
  const {
    timeoutMs = 8000,
    retries = 2,
    retryStatuses = [408, 425, 429, 500, 502, 503, 504],
    retryNetworkErrors = true,
  } = options;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(input, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (attempt < retries && retryStatuses.includes(response.status)) {
        await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
        continue;
      }
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (!retryNetworkErrors || attempt >= retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (2 ** attempt)));
    }
  }
  throw lastError || new Error('Request failed');
}

export async function requireAdmin(request, env, options = {}) {
  const requestId = getRequestId(request);
  const requireMfa = options.requireMfa !== false;
  const token = bearerToken(request);
  const supabaseUrl = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!token) {
    return { ok: false, response: jsonResponse({ error: 'Autenticación requerida.' }, 401, request, env, requestId) };
  }
  if (!supabaseUrl || !anonKey) {
    log('error', 'auth.configuration_missing', { requestId });
    return { ok: false, response: jsonResponse({ error: 'Servicio no configurado.' }, 503, request, env, requestId) };
  }

  let userResponse;
  try {
    userResponse = await fetchWithRetry(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    }, { retries: 1, timeoutMs: 5000 });
  } catch (error) {
    log('error', 'auth.user_lookup_failed', { requestId, message: error.message });
    return { ok: false, response: jsonResponse({ error: 'No se pudo validar la sesión.' }, 503, request, env, requestId) };
  }

  if (!userResponse.ok) {
    return { ok: false, response: jsonResponse({ error: 'Sesión no válida.' }, 401, request, env, requestId) };
  }

  const user = await userResponse.json();
  const claims = decodeJwtPayload(token) || {};
  if (requireMfa && claims.aal !== 'aal2') {
    return { ok: false, response: jsonResponse({ error: 'Se requiere MFA para esta operación.' }, 403, request, env, requestId) };
  }

  let adminResponse;
  try {
    adminResponse = await fetchWithRetry(`${supabaseUrl}/rest/v1/rpc/is_admin`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    }, { retries: 1, timeoutMs: 5000 });
  } catch (error) {
    log('error', 'auth.admin_lookup_failed', { requestId, userId: user.id, message: error.message });
    return { ok: false, response: jsonResponse({ error: 'No se pudo validar el permiso.' }, 503, request, env, requestId) };
  }

  if (!adminResponse.ok || (await adminResponse.json()) !== true) {
    return { ok: false, response: jsonResponse({ error: 'Permisos insuficientes.' }, 403, request, env, requestId) };
  }

  return { ok: true, user, claims, token, requestId };
}

export function validateText(value, { min = 0, max = 10000 } = {}) {
  return typeof value === 'string' && value.trim().length >= min && value.length <= max;
}

export async function enforceRateLimit(request, namespace, max = 8, windowSec = 600) {
  try {
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown';
    if (typeof caches === 'undefined' || !caches.default) return true;
    const key = new Request(`https://textum.internal/rate/${namespace}/${ip}`);
    const hit = await caches.default.match(key);
    const count = hit ? Number.parseInt(await hit.text(), 10) || 0 : 0;
    if (count >= max) return false;
    await caches.default.put(key, new Response(String(count + 1), {
      headers: { 'Cache-Control': `max-age=${windowSec}` },
    }));
    return true;
  } catch {
    return true;
  }
}

export async function verifyTurnstile(token, request, env) {
  const secret = env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (typeof token !== 'string' || token.length < 10 || token.length > 2048) return { ok: false };

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);

  try {
    const response = await fetchWithRetry('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }, { retries: 0, timeoutMs: 5000 });
    if (!response.ok) return { ok: false };
    const result = await response.json();
    return { ok: result.success === true, skipped: false };
  } catch {
    return { ok: false };
  }
}

export function validateImageBytes(bytes, contentType) {
  if (contentType === 'image/png') {
    return bytes.length >= 8 && bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index]);
  }
  if (contentType === 'image/webp') {
    return bytes.length >= 12
      && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF'
      && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
  }
  if (contentType === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  return false;
}
