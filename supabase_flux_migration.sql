-- Migración específica para poder guardar artículos de TEXTUM Flux®.
-- Ejecutar en Supabase → SQL Editor con la cuenta administradora del proyecto.
-- No desactiva RLS ni elimina el requisito MFA.

alter table public.posts
  drop constraint if exists posts_collection_type_check;

alter table public.posts
  add constraint posts_collection_type_check
  check (collection_type is null or collection_type in (
    'principio', 'categoria', 'herramienta', 'eii', 'flux'
  ));

create or replace function public.is_admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (auth.jwt() ->> 'aal') = 'aal2' and public.is_admin();
$$;

revoke all on function public.is_admin_mfa() from public;
grant execute on function public.is_admin_mfa() to authenticated;

drop policy if exists "Admins can insert posts" on public.posts;
create policy "Admins can insert posts"
  on public.posts for insert
  to authenticated
  with check (public.is_admin_mfa());

drop policy if exists "Admins can update posts" on public.posts;
create policy "Admins can update posts"
  on public.posts for update
  to authenticated
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_admin_mfa());
