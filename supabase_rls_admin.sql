-- Ejecuta este script en Supabase → SQL Editor (proyecto ya existente)
-- Restringe escritura del blog y storage solo a emails en public.admins

-- 1. Tabla de administradores (gestión manual por SQL)
create table if not exists public.admins (
  email text primary key check (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

alter table public.admins enable row level security;
-- Sin políticas: solo el service role puede modificar admins desde el dashboard

insert into public.admins (email)
values ('revedit917@gmail.com')
on conflict (email) do nothing;

-- Añade más admins cuando lo necesites:
-- insert into public.admins (email) values ('otro@email.com');

-- 2. Función helper (security definer para leer admins con JWT del usuario)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- 3. Posts — reemplazar política permisiva anterior
drop policy if exists "Authenticated users have full access" on public.posts;

drop policy if exists "Admins can read all posts" on public.posts;
create policy "Admins can read all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert posts" on public.posts;
create policy "Admins can insert posts"
  on public.posts for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_admin());

-- 4. Storage — solo admins pueden subir/editar/borrar imágenes
drop policy if exists "Authenticated upload blog images" on storage.objects;
drop policy if exists "Authenticated update blog images" on storage.objects;
drop policy if exists "Authenticated delete blog images" on storage.objects;

create policy "Admins upload blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin());

create policy "Admins update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());

create policy "Admins delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin());
