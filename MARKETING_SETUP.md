# Captación de clientes — configuración

Todo lo de abajo funciona sin configurar nada (los canales opcionales quedan
inertes hasta que rellenes su variable). Pero para que sirva de algo hay que:

## 1. Ejecutar el SQL

En Supabase → SQL Editor, ejecuta `supabase_schema.sql` (o `supabase_rls_admin.sql`
si ya tienes la base montada). Añade a `leads`:

- `status` (pipeline: `nuevo`, `contactado`, `diagnostico`, `propuesta`, `cliente`, `perdido`)
- atribución: `utm_term`, `utm_content`, `gclid`, `fbclid`, `referrer`, `landing_path`, `first_seen_at`
- nurture: `sequence_step`, `sequence_next_at`, `sequence_paused`, `last_nurture_at`
- política RLS nueva: **`Admins can update leads`** (para poder cambiar el estado desde el panel)
- índices: `leads_status_idx`, `leads_nurture_queue_idx`

## 2. Variables de entorno

### Frontend (Cloudflare Pages → Settings → Environment variables, y `.env` local)
| Variable | Para qué | Obligatoria |
|---|---|---|
| `VITE_GA4_ID` | Google Analytics 4 (`G-XXXXXXXXXX`) | no |
| `VITE_META_PIXEL_ID` | Meta Pixel (solo dígitos) | no |
| `VITE_CAL_LINK` | URL de Cal.com/Calendly para el botón de diagnóstico | no (ya existía) |

GA4 y Meta Pixel se cargan **solo tras aceptar cookies** (respetan tu banner). Si no
pones el ID, no se carga nada.

### Backend (Cloudflare Pages → Environment variables)
| Variable | Para qué | Obligatoria |
|---|---|---|
| `CRON_SECRET` | protege `/api/nurture-run`; cualquier string largo aleatorio | sí, para el nurture |
| `RESEND_API_KEY` | envío de emails de la secuencia | ya la tienes |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | lectura/escritura de `leads` | ya las tienes |
| `UNSUBSCRIBE_SECRET` | firma del enlace de baja (si no, usa la service role key) | recomendada |

### GitHub (Settings → Secrets and variables → Actions)
| Secret | Valor |
|---|---|
| `CRON_SECRET` | **el mismo valor** que pusiste en Cloudflare |

## 3. Qué quedó implementado

### Atribución de marketing (first-touch)
`src/lib/attribution.ts` guarda en `localStorage` la primera visita con señal de
campaña (UTMs, `gclid`, `fbclid`, `referrer`, página de aterrizaje) y no la
sobrescribe. Se adjunta automáticamente a:
- descargas de recursos (`/api/lead-magnet` → columnas de `leads`)
- leads del asistente (`/api/assistant` mode `lead` → columnas de `leads`)
- formulario de contacto (`/api/contact` → incrustada en el email de aviso)

### Analítica multi-canal
`trackConversion()` (en `src/lib/conversion.ts`) ahora envía cada evento a
Clarity + GA4 (`gtag`) + Meta Pixel (`fbq trackCustom`), además del evento
interno. Todo *best-effort*: si un destino no está cargado, no hace nada.

### Pipeline de leads en el panel admin
`/textum-redaccion-2026` → pestaña **Leads**:
- columna **Pipeline** con desplegable editable por fila (guarda al instante)
- filtro por estado
- columna **Origen** (utm_source / campaña / referrer)
- el CSV incluye estado + utm_source + utm_campaign + referrer
- contador de "clientes" en la cabecera

### Secuencia de nurture por email
- Al crear un lead (descarga o asistente) entra en la secuencia: `sequence_step = 0`,
  primer email a los **2 días**.
- `functions/api/nurture-run.js` es el motor: `POST /api/nurture-run` con
  `Authorization: Bearer <CRON_SECRET>`. Busca leads con paso vencido, envía por
  Resend y avanza el contador. Respeta baja, pausa y consentimiento.
- 4 pasos (día 2, 5, 9, 16). Contenido en el propio archivo, ES/EN, con enlace de
  baja y CTA al diagnóstico gratuito. El último cierra la serie.
- Lo dispara `.github/workflows/nurture.yml` una vez al día (09:00 UTC).
  **Solo se ejecuta desde la rama `main`** — mientras trabajes en otra rama, no corre.
- Para pausar a un lead concreto: `update leads set sequence_paused = true where email = '…'`.

## 4. Alternativa si prefieres una herramienta dedicada de email

El motor propio es un v1 suficiente. Si más adelante quieres segmentación,
plantillas visuales y automatizaciones ramificadas:
[Listmonk](https://listmonk.app) (open-source, un binario + Postgres, envía por
Resend SMTP) o [Loops.so](https://loops.so) / Resend Broadcasts (SaaS). En ese
caso, deja de programar `nurture-run` y exporta los leads (CSV del panel) o
conecta Listmonk a la misma base.

## 5. Pendiente por tu parte (no es código)
- Crear la propiedad GA4 y el Meta Pixel, y pegar sus IDs en las variables.
- Dar de alta Google Search Console para el dominio.
- Definir `CRON_SECRET` en Cloudflare y en GitHub.
- Merge a `main` para que el cron de nurture empiece a correr.
