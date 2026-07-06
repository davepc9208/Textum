# Cloudflare Pages — Blog SEO Dinámico

Esta solución genera automáticamente metadatos Open Graph dinámicos para los posts del blog cuando se comparten en redes sociales.

## Cómo funciona

1. Cuando alguien comparte un link de blog (ej: `https://mentoriatextum.com/blog/como-escribir-bien`)
2. La función serverless en `functions/blog/[slug].js` intercepta el request
3. Fetch de los datos del post desde Supabase usando el slug
4. Genera HTML con metadatos OG dinámicos (título, descripción, imagen, etc.)
5. Retorna ese HTML a bots de redes sociales (Facebook, Twitter, LinkedIn, WhatsApp)
6. El navegador es redirigido a la aplicación React normal

## Configuración requerida

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

- `functions/blog/[slug].js` - Función serverless que maneja `/blog/[slug]`
- `package.json` - Dependencias actualizadas

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

