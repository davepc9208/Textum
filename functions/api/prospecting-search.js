// Búsqueda de prospectos para prospección institucional (solo admin con MFA).
// Usa Serper.dev (la misma SERPER_API_KEY que assistant.js) para localizar
// páginas de contacto de programas doctorales, escuelas de doctorado y unidades
// de investigación, y visita un número limitado de resultados para extraer
// SOLO correos institucionales publicados (mailto u ofuscados). No escribe en
// `prospects`: devuelve candidatos para revisión humana en el panel
// (AdminProspecting → Buscar contactos).
import { corsHeaders, enforceRateLimit, fetchWithRetry, getRequestId, log, requireAdmin } from '../_shared/security.js';

const MAX_QUERIES = 4;
const MAX_SERP_RESULTS = 10;
const MAX_PAGES = 12;
const PAGE_TIMEOUT_MS = 6000;
const MAX_HTML = 400_000;
const MAX_EMAILS_PER_PAGE = 4;
const MAX_CANDIDATES = 40;
const FETCH_CONCURRENCY = 5;

const ROLE_LABELS = {
  doctoral: 'Coordinación de programa doctoral',
  posgrado: 'Escuela de Posgrado',
  investigacion: 'Unidad de investigación',
};

const BLOCKED_DOMAINS = new Set([
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.es',
  'icloud.com', 'live.com', 'protonmail.com', 'gmx.com', 'aol.com',
]);

const NON_CONTACT_PREFIX = /^(?:no-?reply|noreply|postmaster|abuse|webmaster|hostmaster|admin@|info@|w3\.org|example\.)+/;

const SKIP_LINK_PATTERNS = [
  'linkedin.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com',
  'youtube.com', 'glassdoor', 'indeed.', 'computrabajo', 'occ.com.mx',
  'mendoza.conicet', 'researchgate', 'academia.edu', 'baidu.com',
];

export function validateInput(body) {
  const region = ['espana', 'latam', 'todas'].includes(body?.region) ? body.region : 'todas';
  const topic = ['educacion', 'ciencias', 'salud', 'ingenieria', 'todas'].includes(body?.topic) ? body.topic : 'todas';
  const limit = typeof body?.limit === 'number' && Number.isFinite(body.limit)
    ? Math.max(5, Math.min(40, Math.round(body.limit)))
    : 15;
  return { region, topic, limit };
}

export function serperQueries({ region, topic }) {
  const roleTerms = [
    '"coordinador de programa de doctorado"',
    '"coordinación de doctorado" OR "escuela de doctorado"',
    '"escuela de posgrado" OR "unidad de investigación" contacto',
  ];
  const regionTerm = region === 'espana'
    ? 'site:es'
    : region === 'latam'
      ? '(México OR Colombia OR Argentina OR Chile OR Perú OR Ecuador OR Uruguay)'
      : '';
  const topicTerm = topic === 'educacion'
    ? '"educación" OR "pedagogía" OR "didáctica"'
    : topic === 'ciencias'
      ? '"ciencias" OR "biología" OR "química" OR "física"'
      : topic === 'salud'
        ? '"enfermería" OR "salud pública" OR "medicina"'
        : topic === 'ingenieria'
          ? '"ingeniería" OR "tecnología"'
          : '';
  return roleTerms.map((roleTerm) => {
    const parts = ['universidad', roleTerm, 'correo electrónico contacto', regionTerm, topicTerm].filter(Boolean);
    return parts.join(' ');
  });
}

function isLikelyRelevantPage(url, title = '') {
  const hay = `${url} ${title}`.toLowerCase();
  return /doctorad|posgrad|postgrad|investigaci|vicerrector|escuela|international|research/.test(hay);
}

// Descarta redes sociales, agregadores de empleo y fichas no institucionales;
// y aplica un filtro suave de región por dominio/título.
export function cleanSerperResults(results, region) {
  const out = [];
  for (const result of results.slice(0, MAX_SERP_RESULTS)) {
    const link = String(result.link || '');
    const title = String(result.title || '');
    if (!/^https?:\/\//i.test(link)) continue;
    if (SKIP_LINK_PATTERNS.some((p) => link.includes(p))) continue;
    if (!isLikelyRelevantPage(link, title)) continue;
    if (region === 'espana') {
      const spanish = /\.es([/?#]|$)/i.test(link) || /españa|spain/i.test(title);
      if (!spanish) continue;
    }
    if (region === 'latam') {
      const latam = /\.(mx|cl|ar|pe|co|uy|ec|bo|py|cr|gt|hn|ni|sv|do|cu|pa|ve)([/?#]|$)/i.test(link)
        || /méxico|mexico|colombia|argentina|chile|perú|peru|ecuador|uruguay/i.test(title);
      const spanish = /\.es([/?#]|$)/i.test(link) || /españa|spain/i.test(title);
      if (!latam || spanish) continue;
    }
    out.push({ link, title });
    if (out.length >= 8) break;
  }
  return out;
}

export function classifyRole(text) {
  const hay = String(text || '').toLowerCase();
  if (/coordinad|direcció?n de.*doctorad|responsable de.*doctorad/.test(hay)) return 'doctoral';
  if (/escuela de posgrad|facultad de posgrad|posgrado|postgrado|estudios de posgrad/.test(hay)) return 'posgrado';
  if (/vicerrector|unidad de investigaci|direcció?n (?:de )?investigaci|secretar.*investigaci/.test(hay)) return 'investigacion';
  return 'doctoral';
}

function decodeContactValue(value) {
  return value
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/gi, '@')
    .replace(/%40/gi, '@')
    .replace(/&amp;/g, '&');
}

function truncateEmail(email) {
  return email.toLowerCase().replace(/[.,;:)>'"]+$/, '');
}

// Extrae correos de una página HTML: 1º mailto, 2º ofuscados "usuario (at) dominio",
// 3º texto plano. Limita por página para no barrer una web entera.
export function extractEmails(html, options = {}) {
  const maxEmails = options.maxEmails || MAX_EMAILS_PER_PAGE;
  const emails = new Set();
  let match;

  const mailtoRegex = /mailto:([^"'>\s?]+)/gi;
  while ((match = mailtoRegex.exec(html)) !== null) {
    const email = truncateEmail(decodeContactValue(match[1]).split('/').pop());
    if (email) emails.add(email);
    if (emails.size >= maxEmails) break;
  }

  if (emails.size < maxEmails) {
    const obfuscatedRegex = /([a-zA-Z][a-zA-Z0-9._%+-]{1,60})\s*(?:\(at\)|\[(?:at)\]|\(arroba\)|\(a\)|\[a\])\s*([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,})/gi;
    while ((match = obfuscatedRegex.exec(html)) !== null) {
      emails.add(truncateEmail(`${match[1]}@${match[2]}`));
      if (emails.size >= maxEmails) break;
    }
  }

  if (emails.size < maxEmails) {
    const plainRegex = /[a-zA-Z][a-zA-Z0-9._%+-]{1,60}@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+\.[a-zA-Z]{2,}/g;
    while ((match = plainRegex.exec(html)) !== null) {
      emails.add(truncateEmail(match[0]));
      if (emails.size >= maxEmails) break;
    }
  }

  const out = [];
  for (const email of emails) {
    if (email.length > 90) continue;
    if (/\.(png|jpe?g|gif|webp|svg|js|css|pdf|docx?|xlsx?|zip)$/i.test(email)) continue;
    if (/^(?:\d|[0-9a-f]{16})@/.test(email)) continue;
    if (NON_CONTACT_PREFIX.test(email)) continue;
    if (email.split('@')[1] === 'w3.org') continue;
    const domain = email.split('@')[1] || '';
    if (BLOCKED_DOMAINS.has(domain)) continue;
    out.push(email);
    if (out.length >= maxEmails) break;
  }
  return out;
}

function humanizeDomain(domain) {
  const host = domain.replace(/^www\./i, '').split('.');
  const label = host.length >= 2 ? host[host.length - 2] : host[0];
  if (!label) return null;
  return label.toUpperCase().slice(0, 60);
}

// Candidato = etiqueta institucional no personal (no conocemos el nombre de la
// persona aún), con fuente y base documentadas para revisión humana.
export function buildCandidate(email, pageUrl, pageTitle) {
  const person = email.split('@')[0];
  const domain = email.split('@')[1] || '';
  const role = classifyRole(`${pageTitle || ''} ${pageUrl || ''}`);
  const institution = humanizeDomain(domain) || institutionFromTitle(pageTitle) || 'Universidad';
  const looksPersonal = /^(?:jr|jose|juan|maria|luis|carlos|ana|pedro|lucia|pablo|sofia|laura|diego|martin|jorge|alberto|rafael|carmen|elena)\d*$/i.test(person);
  return {
    name: looksPersonal
      ? person.replace(/[._-]+/g, ' ').replace(/(\b\w)/g, (c) => c.toUpperCase())
      : ROLE_LABELS[role],
    email,
    institution,
    department: pageTitle ? String(pageTitle).slice(0, 120) : null,
    programme: null,
    role: ROLE_LABELS[role],
    country: null,
    language: 'es',
    source_url: pageUrl,
    contact_basis: `Correo publicado en ${pageUrl}`,
    tags: ['autodiscovery', role],
  };
}

function institutionFromTitle(pageTitle) {
  const match = /(?:Universidad de |Universidad |UAM |UBA |UNAM |PUCP |UCM |UChile )([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑ]+(?: [\wÁÉÍÓÚÑ]+)?)/.exec(String(pageTitle || ''));
  return match ? match[1].slice(0, 60) : null;
}

export function dedupeCandidates(candidates) {
  const seen = new Set();
  const out = [];
  for (const candidate of candidates) {
    const key = String(candidate.email || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({ ...candidate, email: key });
  }
  return out;
}

function json(data, status, request, env, requestId) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(requestId ? { 'X-Request-ID': requestId } : {}),
    },
  });
}

async function fetchPage(url) {
  try {
    const response = await fetchWithRetry(url, {
      headers: { 'User-Agent': 'TEXTUM-OutreachResearch/1.0 (+https://www.mentoriatextum.com; contacto institucional)' },
    }, { retries: 0, timeoutMs: PAGE_TIMEOUT_MS });
    if (!response.ok) return null;
    const ctype = response.headers.get('content-type') || '';
    if (!ctype.includes('html') && !ctype.includes('text/plain')) return null;
    return (await response.text()).slice(0, MAX_HTML);
  } catch {
    return null;
  }
}

async function fetchInBatches(items, batchSize = FETCH_CONCURRENCY) {
  const out = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const pages = await Promise.all(batch.map(async (item) => ({ ...item, html: await fetchPage(item.link) })));
    out.push(...pages);
  }
  return out;
}

async function runSerperQuery(query, apiKey, requestId) {
  const response = await fetchWithRetry('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, gl: 'es', hl: 'es', num: 10 }),
  }, { retries: 0, timeoutMs: 5000 });
  if (!response.ok) {
    log('warn', 'prospecting_search.serp_failed', { requestId, status: response.status });
    return [];
  }
  const data = await response.json();
  return Array.isArray(data.organic) ? data.organic : [];
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request, context.env) });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const requestId = getRequestId(request);

  const auth = await requireAdmin(request, env);
  if (!auth.ok) return auth.response;

  if (!(await enforceRateLimit(request, 'prospecting-search', 8, 600))) {
    return json({ error: 'Demasiadas búsquedas. Espera unos minutos antes de repetir.' }, 429, request, env, requestId);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body inválido.' }, 400, request, env, requestId); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Body inválido.' }, 400, request, env, requestId);
  }

  const serperKey = env.SERPER_API_KEY;
  if (!serperKey) return json({ error: 'SERPER_API_KEY no está configurada en Cloudflare Pages.' }, 503, request, env, requestId);

  const { region, topic, limit } = validateInput(body);
  const queries = serperQueries({ region, topic });
  const allResults = [];
  const visited = new Set();
  const candidates = [];
  const queriesUsed = [];

  for (const query of queries.slice(0, MAX_QUERIES)) {
    if (visited.size >= MAX_PAGES || candidates.length >= MAX_CANDIDATES) break;
    const organic = await runSerperQuery(query, serperKey, requestId);
    const kept = cleanSerperResults(organic, region);
    queriesUsed.push({ query, found: organic.length, kept: kept.length });
    const toVisit = kept
      .filter((item) => !visited.has(item.link))
      .slice(0, Math.max(0, MAX_PAGES - visited.size));

    for (const page of await fetchInBatches(toVisit)) {
      if (!page.html) continue;
      visited.add(page.link);
      const emails = extractEmails(page.html);
      for (const email of emails) {
        candidates.push(buildCandidate(email, page.link, page.title));
        if (candidates.length >= MAX_CANDIDATES) break;
      }
    }
    allResults.push(...kept.map((item) => item.link));
  }

  if (!queriesUsed.length) {
    return json({ error: 'No se pudo completar la búsqueda externa. Revisa SERPER_API_KEY y vuelve a intentarlo.' }, 502, request, env, requestId);
  }

  const unique = dedupeCandidates(candidates).slice(0, limit);
  log('info', 'prospecting_search.complete', { requestId, region, topic, visited: visited.size, candidates: unique.length });
  return json({
    ok: true,
    region,
    topic,
    queries: queriesUsed,
    pages_visited: visited.size,
    candidates: unique,
    result_urls: allResults.slice(0, 40),
  }, 200, request, env, requestId);
}
