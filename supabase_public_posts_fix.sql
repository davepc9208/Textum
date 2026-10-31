-- ============================================================================
-- REPARACIÓN DE PRODUCCIÓN — Blog y colecciones sin artículos visibles
--
-- La API pública de Supabase responde HTTP 200, pero no devuelve filas para
-- `posts`. Esto es compatible con una política RLS pública ausente o revocada.
-- Este parche restaura lectura anónima solo para artículos publicados; no
-- concede acceso público a borradores ni a escritura.
--
-- Aplicar en Supabase → SQL Editor. Es idempotente.
-- ============================================================================

begin;

alter table public.posts enable row level security;

-- Elimina la política permisiva anterior si todavía existe.
drop policy if exists "Authenticated users have full access" on public.posts;
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
  on public.posts
  for select
  to anon, authenticated
  using (published is true);

grant usage on schema public to anon, authenticated;
grant select on table public.posts to anon, authenticated;

commit;

-- Verificación posterior: debe devolver publicaciones visibles públicamente.
select count(*) as published_posts
from public.posts
where published is true;

select collection_type, count(*) as published_posts
from public.posts
where published is true and collection_type is not null
group by collection_type
order by collection_type;
