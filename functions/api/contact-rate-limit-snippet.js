// functions/api/contact.js — rate limit incluido
// Si ya tienes contact.js, fusiona enforceRateLimit al inicio del handler POST.

async function enforceRateLimit(request, max = 5, windowSec = 600) {
  try {
    const ip = request.headers.get('CF-Connecting-IP')
      || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || 'unknown';
    const cache = caches.default;
    const key = new Request(`https://textum.internal/rate/contact/${ip}`);
    const hit = await cache.match(key);
    let count = 0;
    if (hit) count = parseInt(await hit.text(), 10) || 0;
    if (count >= max) return false;
    await cache.put(key, new Response(String(count + 1), {
      headers: { 'Cache-Control': `max-age=${windowSec}` },
    }));
    return true;
  } catch {
    return true;
  }
}

// Al inicio del POST handler:
// if (!(await enforceRateLimit(request))) {
//   return new Response(JSON.stringify({ error: 'Too many requests' }), { status: 429, headers: corsHeaders });
// }
