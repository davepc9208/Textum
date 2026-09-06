// src/lib/attribution.ts
// Atribución de marketing: guarda el primer contacto (first-touch) del visitante
// —UTMs, gclid/fbclid, referrer y página de aterrizaje— y lo adjunta a cada lead.
// First-touch NO se sobrescribe; last-touch sí se actualiza en cada visita.

const KEY = 'textum_attribution_v1';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

export type Attribution = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrer: string | null;
  landing_path: string | null;
  first_seen_at: string;
};

type Stored = { first: Attribution; last: Attribution };

function readCurrent(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const clean = (v: string | null) => (v ? v.slice(0, 200) : null);
  const obj = {} as Attribution;
  UTM_KEYS.forEach((k) => { obj[k] = clean(params.get(k)); });
  obj.gclid = clean(params.get('gclid'));
  obj.fbclid = clean(params.get('fbclid'));
  let ref: string | null = null;
  try {
    ref = document.referrer && !document.referrer.includes(window.location.host)
      ? new URL(document.referrer).hostname
      : null;
  } catch { ref = null; }
  obj.referrer = ref;
  obj.landing_path = (window.location.pathname + window.location.search).slice(0, 300);
  obj.first_seen_at = new Date().toISOString();
  return obj;
}

function hasSignal(a: Attribution): boolean {
  return Boolean(a.utm_source || a.utm_campaign || a.gclid || a.fbclid || a.referrer);
}

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch { return null; }
}

/** Llamar una vez al arrancar la app. */
export function initAttribution(): void {
  try {
    const current = readCurrent();
    const stored = load();
    if (!stored) {
      const seed: Stored = { first: current, last: current };
      localStorage.setItem(KEY, JSON.stringify(seed));
      return;
    }
    // Actualiza last-touch solo si la nueva visita trae señal de campaña.
    if (hasSignal(current)) {
      stored.last = current;
      // Si el first-touch no tenía señal (visita directa previa), promuévelo.
      if (!hasSignal(stored.first)) stored.first = current;
      localStorage.setItem(KEY, JSON.stringify(stored));
    }
  } catch { /* localStorage no disponible */ }
}

/** Objeto plano para enviar en el payload de un lead. */
export function getAttribution(): Record<string, string> {
  const stored = load();
  if (!stored) return {};
  const f = stored.first;
  const l = stored.last;
  const out: Record<string, string> = {};
  const put = (k: string, v: string | null) => { if (v) out[k] = v; };
  put('utm_source', f.utm_source);
  put('utm_medium', f.utm_medium);
  put('utm_campaign', f.utm_campaign);
  put('utm_term', f.utm_term);
  put('utm_content', f.utm_content);
  put('gclid', f.gclid);
  put('fbclid', f.fbclid);
  put('referrer', f.referrer);
  put('landing_path', f.landing_path);
  put('first_seen_at', f.first_seen_at);
  // last-touch: solo si difiere de first-touch en la campaña.
  if (l.utm_campaign && l.utm_campaign !== f.utm_campaign) put('last_utm_campaign', l.utm_campaign);
  if (l.utm_source && l.utm_source !== f.utm_source) put('last_utm_source', l.utm_source);
  return out;
}
