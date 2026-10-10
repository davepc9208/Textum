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

## 6. Prospección institucional (MVP outbound)

El panel Admin incluye la pestaña **Prospección** para trabajar con contactos profesionales investigados y no solo con leads que ya llegaron a la web.

### Flujo recomendado

1. Investiga contactos de programas doctorales en directorios públicos o usa una lista autorizada.
2. Prepara un CSV con `nombre,email,institucion,programa doctoral,cargo,pais,fuente url,base de contacto`.
3. Importa el CSV en Admin → Prospección.
4. Revisa cada registro y activa **Listo para campaña** solo cuando la fuente y la base de contacto estén documentadas.
5. Crea la campaña **Piloto institucional — Doctorado**.
6. Incorpora los prospectos aprobados y revisa la secuencia de tres mensajes.
7. Activa la campaña únicamente después de verificar el remitente y el subdominio.

### Variables adicionales de Cloudflare Pages

| Variable | Para qué |
|---|---|
| `OUTREACH_ENABLED` | Debe ser `false` o estar ausente hasta terminar la configuración. Cambiar a `true` solo después de revisar la campaña. |
| `OUTREACH_FROM_EMAIL` | Remitente del subdominio independiente, por ejemplo `hola@outreach.mentoriatextum.com`. |
| `OUTREACH_RESEND_API_KEY` | API key del proveedor habilitado para ese remitente. Si no existe, se usa `RESEND_API_KEY`. |
| `OUTREACH_WEBHOOK_SECRET` | Protege el endpoint que pausa campañas al recibir respuestas, rebotes o bajas. |

Configura SPF, DKIM y DMARC en el subdominio antes de activar los envíos. El límite inicial del panel es de 10–20 contactos diarios. El runner respeta bajas, respuestas, rebotes y prospectos no aprobados.

La lista debe limitarse a contactos profesionales obtenidos de fuentes públicas o autorizadas. No se implementa scraping indiscriminado de perfiles personales ni calentamiento artificial.

### 6.1. Búsqueda de contactos dentro del panel (nuevo)

Admin → Prospección → pestaña **Buscar contactos**. Llamas a la Function
`/api/prospecting-search`, que:

1. Consulta Serper.dev con 3–4 queries dirigidas (coordinador de doctorado,
   escuela de doctorado, escuela de posgrado/unidad de investigación) filtradas
   por región (España / LATAM) y disciplina.
2. Visita hasta 12 páginas institucionales de los resultados, con timeout corto
   por página.
3. Extrae como máximo 4 correos por página: prioriza `mailto:`, acepta formatos
   ofuscados (`usuario (at) universidad.es`) y descarta gmail/hotmail,
   `noreply@`, `webmaster@` y archivos estáticos.
4. Devuelve candidatos con `source_url` y `contact_basis` ("Correo publicado en
   <URL>"). **No escribe nada en la base de datos.**

Requisitos para que funcione:

- `SERPER_API_KEY` en Cloudflare Pages (la misma que ya usa el asistente; si
  existe, esta Function no necesita nada nuevo).
- Revisión manual obligatoria: los candidatos importados quedan como `Nuevo`
  (`approved=false`). Solo se envían los que tú marques como **Listo para
  campaña**.

Notas éticas y técnicas:
- Solo se procesan páginas públicas indexadas por el buscador, hasta 12 por
  búsqueda, y con un límite de 8 búsquedas por IP cada 10 minutos.
- No se visitan perfiles personales ni redes sociales; se filtran.linkedin,
  Facebook, ResearchGate, aggregadores de empleo.
- Cada prospecto guarda su URL de origen; si una universidad pide retirar el
  contacto, basta con desactivarlo en el panel.

### 6.2. Checklist «de lista a campaña» (activar el envío real)

Cuando tengas prospectos revisados y aprobados, sigue este orden exacto:

1. **Subdominio de envío**: crea `outreach.mentoriatextum.com` en Resend,
   verifica el dominio y añade en Cloudflare DNS los registros SPF, DKIM y
   DMARC que Resend indica.

2. **Variables de Cloudflare Pages** (Settings → Environment variables):

   | Variable | Valor |
   |---|---|
   | `OUTREACH_ENABLED` | `true` solo cuando los pasos 1 y 3 estén listos |
   | `OUTREACH_FROM_EMAIL` | `hola@outreach.mentoriatextum.com` |
   | `OUTREACH_RESEND_API_KEY` | API key del subdominio (si no, se usa `RESEND_API_KEY`) |
   | `OUTREACH_WEBHOOK_SECRET` | string aleatorio para `prospecting-reply` |
   | `SERPER_API_KEY` | ya la tienes si el asistente funciona |

3. **Prueba del webhook de respuestas**: ejecuta un POST a
   `/api/prospecting-reply` con el secreto correcto y comprueba que el prospecto
   cambia de estado; esto valida el circuito completo de respuesta/rebote.

4. **Primer envío pequeño**: crea la campaña «Piloto institucional — Doctorado»
   en el panel, incorpora 5–15 aprobados (nada más) y activa la campaña.
   Dispara `prospecting-run` desde GitHub Actions (workflow "Institutional
   outreach" → Run workflow) o espera al cron de L–V 09:00 UTC.

5. **Escala gradual**: solo cuando los primeros envíos no generen rebotes
   (revisa la pestaña Métricas), sube el límite diario hacia 15–20. Mantén la
   revisión manual como filtro permanente antes de aprobar nuevos lotes.

6. **Privacidad**: respeta cualquier petición de baja inmediata («No contactar»
   en el panel) y conserva `source_url` como evidencia del origen público del
   contacto.
