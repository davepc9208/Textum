# Configuración de Supabase para TEXTUM Admin

## 1. Variables de Entorno ✅
Ya configuradas en `.env` (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)

## 2. Ejecutar el Schema SQL en Supabase Dashboard

Ve a tu proyecto Supabase → **SQL Editor** → **New query** → copia y ejecuta el siguiente código:

```sql
-- ============================================================================
-- 1. Crear tabla de posts
-- ============================================================================
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title_es     text not null default '',
  title_en     text not null default '',
  excerpt_es   text not null default '',
  excerpt_en   text not null default '',
  content_es   text not null default '',
  content_en   text not null default '',
  author       text not null default '',
  cover_url    text not null default '',
  published    boolean not null default false,
  reading_time integer not null default 1,
  created_at   timestamptz not null default now()
);

-- Crear índices
create index if not exists posts_slug_idx on public.posts(slug);
create index if not exists posts_published_idx on public.posts(published);
create index if not exists posts_created_at_idx on public.posts(created_at desc);

-- ============================================================================
-- 2. Habilitar Row Level Security (RLS)
-- ============================================================================
alter table public.posts enable row level security;

-- ============================================================================
-- 3. Crear políticas de seguridad
-- ============================================================================

-- Política: Cualquiera puede leer artículos publicados
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts
  for select
  using (published = true);

-- Política: Usuarios autenticados pueden hacer todo
drop policy if exists "Authenticated users have full access" on public.posts;
create policy "Authenticated users have full access"
  on public.posts
  for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================================
-- 4. Verificar que las políticas están activas
-- ============================================================================
-- Esto debería mostrar 2 políticas si todo está correcto:
select * from pg_policies where tablename = 'posts';
```

## 3. Crear Usuario Admin en Supabase

Ve a **Authentication** → **Users** → **Add user** y crea un usuario con:
- Email: tu email
- Password: una contraseña segura
- Tick en "Auto Confirm User"

## 4. Verificar que Todo Funciona

1. Inicia sesión en `http://localhost:5173/admin` con tus credenciales
2. Debería redireccionar al panel admin (no a login)
3. Intenta crear un artículo nuevo
4. Verifica que aparece en la lista

## ⚠️ Troubleshooting

### Error: "VITE_SUPABASE_URL is not defined"
- Reinicia el servidor: `npm run dev`
- Verifica que `.env` tiene las variables correctas

### Error: "Unauthorized" al crear/editar artículos
- Revisa que las políticas RLS están habilitadas
- Ve a **RLS** en el editor y confirma que hay 2 políticas

### No puedo iniciar sesión
- Verifica que el usuario existe en Authentication → Users
- Comprueba que "Email" está habilitado en Auth → Providers

### Los artículos no aparecen en la lista
- Verifica que la tabla `posts` existe y tiene datos
- Revisa en **Database** → **posts** si hay registros

## 📋 Checklist Final

- [ ] Variables de entorno configuradas
- [ ] Tabla `posts` creada en Supabase
- [ ] RLS habilitado en la tabla
- [ ] Políticas de seguridad creadas
- [ ] Usuario admin creado
- [ ] Puedo iniciar sesión en admin panel
- [ ] Puedo crear un artículo de prueba
