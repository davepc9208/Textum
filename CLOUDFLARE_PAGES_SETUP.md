# Cloudflare Pages — Blog SEO Dinámico

Esta solución genera automáticamente metadatos Open Graph dinámicos para los posts del blog cuando se comparten en redes sociales.

## Cómo funciona

1. Cuando alguien comparte un link de blog (ej: `https://www.mentoriatextum.com/blog/como-escribir-bien`)
2. La función serverless en `functions/blog/[slug].js` intercepta el request
3. Fetch de los datos del post desde Supabase usando el slug
4. Genera HTML con metadatos OG dinámicos (título, descripción, imagen, etc.)
5. Retorna ese HTML a bots de redes sociales (Facebook, Twitter, LinkedIn, WhatsApp)
6. El navegador es redirigido a la aplicación React normal

## Configuración requerida

### Rutas SPA y errores 404

`functions/[[path]].js` sirve `index.html` únicamente para las rutas conocidas de la aplicación y devuelve una respuesta HTTP 404 con la identidad de TEXTUM para rutas inexistentes. Por eso `public/_redirects` no debe incluir un fallback global `/* /index.html 200`: ese fallback convertiría todos los errores en respuestas 200.

La ruta wildcard de React (`/src/pages/NotFoundPage.tsx`) cubre también la navegación desde el cliente, incluidos artículos o piezas que ya no existan.

### 1. **Configurar variable de entorno en Cloudflare Pages**

En tu dashboard de Cloudflare Pages:

1. Ve a **Settings → Environment Variables**
2. Agrega una variable de entorno:
   - **Nombre:** `SUPABASE_ANON_KEY`
   - **Valor:** Tu API key anónima de Supabase (no la service role key)

**Dónde obtener la API key:**
- Ve a [Supabase Dashboard](https://app.supabase.com) → Tu proyecto
- **Settings → API** 
- Copia la clave **anon** (pública)

### 2. **Configurar el despliegue**

En Cloudflare Pages, configura:
- **Framework preset:** None
- **Build command:** `npm run build`
- **Build output directory:** `dist`

### 3. **Deploy**

```bash
# Desde tu repo local
npm run build
# Luego hacer push a tu rama de producción
git push origin main
```

## Archivos creados/modificados

- `functions/[[path]].js` - Shell SPA para rutas conocidas y 404 HTTP real para rutas desconocidas
- `functions/blog/[slug].js` - Función serverless que maneja `/blog/[slug]` y devuelve 404 de marca para artículos inexistentes
- `src/pages/NotFoundPage.tsx` - Página 404 bilingüe para navegación client-side
- `src/components/AppErrorBoundary.tsx` - Recuperación global ante errores de renderizado React
- `tests/resilience.test.js` - Pruebas de 404, redirects y validación básica de APIs
- `public/sitemap.xml` - Índice de los sitemaps por idioma
- `package.json` - Scripts de test y SEO alineados con Cloudflare Pages

La configuración anterior de Netlify se eliminó para evitar dos runtimes con endpoints y redirects divergentes. El despliegue soportado por esta configuración es Cloudflare Pages.

## Debugging

Para ver los metadatos que se generan, abre DevTools en tu navegador y busca en el HTML:
- `og:title`
- `og:description`
- `og:image`

O usa herramientas de previsualización:
- [Facebook Share Debugger](https://developers.facebook.com/tools/debug/sharing/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)

## Notas importantes

- ✅ Solo funciona con posts `published: true`
- ✅ Los metadatos se cachean por 1 hora en Cloudflare
- ✅ Soporta detección automática de idioma (`?lang=en` o `?lang=es`)
- ✅ Las imágenes de portada (`cover_url`) deben estar en Supabase Storage
- ✅ Si no hay `cover_url`, usa la imagen genérica por defecto

## Qué verán en redes sociales

| Red Social | Qué ve |
|-----------|--------|
| **Facebook** | Título del artículo + imagen portada + descripción |
| **Twitter/X** | Tweet con imagen destacada del blog |
| **LinkedIn** | Artículo con autor, fecha y descripción |
| **WhatsApp** | Imagen + título en el preview |

## Troubleshooting

### Los metadatos no aparecen
1. Verifica que `SUPABASE_ANON_KEY` esté configurada en Cloudflare Pages
2. Verifica que el post tenga `published: true`
3. Verifica que el slug sea exacto en la URL

### La imagen no se muestra
1. Asegúrate de que `cover_url` esté poblado en el post
2. Verifica que la URL sea accesible públicamente

### "Not Found" error
- El slug no existe en Supabase, o el post no está publicado

## Variables adicionales de producción

- `APP_ORIGIN`: origen público permitido para CORS, normalmente `https://www.mentoriatextum.com`.
- `SUPABASE_SERVICE_ROLE_KEY`: solo como secreto de Cloudflare; la usa el endpoint server-side de imágenes.
- `VITE_SENTRY_DSN`: DSN público de Sentry para errores del frontend.
- `VITE_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`: protección opcional de formularios con Cloudflare Turnstile.
- `VITE_CAL_LINK`: URL pública de Cal.com. Si no existe, los CTA vuelven al formulario interno.

## Límites del asistente IA (protección del presupuesto de Groq)

La clave de Groq gratuita tiene límites de uso diario. El asistente aplica tres niveles de protección configurables por variables de entorno (no hace falta configurarlas: tienen valores por defecto seguros):

| Variable | Por defecto | Qué controla |
|---|---|---|
| `ASSISTANT_DAILY_LLM_LIMIT` | `300` | Llamadas a Groq al día en toda la web (contador global en Supabase, tabla `ai_usage`). Al alcanzarlo, el asistente sigue respondiendo desde la base de conocimiento y deriva al equipo humano. |
| `ASSISTANT_SESSION_MESSAGE_LIMIT` | `15` | Mensajes máximos por conversación (IP + `session_id`) al día. |
| `ASSISTANT_IP_CHAT_LIMIT` | `12` | Mensajes máximos por IP en 10 minutos (ventana deslizante). |

Cuando se alcanza cualquiera de estos límites, el widget no corta la ayuda: muestra un aviso amable y ofrece WhatsApp, email y el formulario de lead.

### Migración de Supabase necesaria

Ejecuta en Supabase → SQL Editor (también incluido en `supabase_schema.sql`):

```sql
create table if not exists public.ai_usage (
  day          date primary key,
  llm_calls    integer not null default 0,
  tokens_est   bigint  not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

create or replace function public.bump_ai_usage(p_calls integer default 1, p_tokens bigint default 0)
returns table (calls integer, tokens bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ai_usage (day, llm_calls, tokens_est, updated_at)
  values (current_date, p_calls, p_tokens, now())
  on conflict (day)
  do update set
    llm_calls  = public.ai_usage.llm_calls + excluded.llm_calls,
    tokens_est = public.ai_usage.tokens_est + excluded.tokens_est,
    updated_at = now();

  return query
    select au.llm_calls, au.tokens_est
    from public.ai_usage au
    where au.day = current_date;
end;
$$;

revoke all on function public.bump_ai_usage(integer, bigint) from public, anon, authenticated;
grant execute on function public.bump_ai_usage(integer, bigint) to service_role;
```

## MFA obligatorio para administración

La migración `supabase_rls_admin.sql` debe ejecutarse después de activar MFA TOTP para la cuenta administradora. Añade `is_admin_mfa()` y exige `auth.jwt() ->> 'aal' = 'aal2'` para insertar, actualizar o borrar posts y para modificar imágenes. Las Functions `translate`, `distribute` y `upload-image` también validan JWT, pertenencia a `admins` y AAL2 antes de ejecutar operaciones.

No publiques `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` ni ningún secreto con prefijo `VITE_`: las variables `VITE_*` se incorporan al bundle del navegador.

## Calidad y previews

Cada push y pull request ejecuta `.github/workflows/ci.yml` con typecheck, lint, tests de Functions, build y smoke tests de Playwright. Conecta el repositorio a Cloudflare Pages para que cada pull request genere automáticamente una preview deployment; configura las mismas variables públicas y secretos de preview, nunca las de producción.

El blog y las colecciones usan paginación por cursor basada en `created_at` + `id`, evitando offsets costosos cuando crece la tabla. La generación SSR de artículos usa caché distribuida de Cloudflare durante cinco minutos y reintentos acotados para lecturas idempotentes.

