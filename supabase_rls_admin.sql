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

revoke all on function public.is_admin() from public;grant execute on function public.is_admin() to authenticated;

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

-- 4. Leads — la información personal solo es visible con admin + MFA
alter table public.leads enable row level security;

alter table public.leads add column if not exists status           text not null default 'nuevo';
alter table public.leads add column if not exists utm_term         text;
alter table public.leads add column if not exists utm_content      text;
alter table public.leads add column if not exists gclid            text;
alter table public.leads add column if not exists fbclid           text;
alter table public.leads add column if not exists referrer         text;
alter table public.leads add column if not exists landing_path     text;
alter table public.leads add column if not exists first_seen_at    timestamptz;
alter table public.leads add column if not exists sequence_step    integer not null default 0;
alter table public.leads add column if not exists sequence_next_at timestamptz;
alter table public.leads add column if not exists sequence_paused  boolean not null default false;
alter table public.leads add column if not exists last_nurture_at  timestamptz;

create index if not exists leads_status_idx on public.leads (status, created_at desc);
create index if not exists leads_nurture_queue_idx
  on public.leads (sequence_next_at)
  where unsubscribed_at is null and sequence_paused = false;

drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin_mfa());

drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads"
  on public.leads for update
  to authenticated
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

-- 5. Storage — solo admins pueden subir/editar/borrar imágenes
drop policy if exists "Authenticated upload blog images" on storage.objects;
drop policy if exists "Authenticated update blog images" on storage.objects;
drop policy if exists "Authenticated delete blog images" on storage.objects;
drop policy if exists "Admins upload blog images" on storage.objects;
drop policy if exists "Admins update blog images" on storage.objects;
drop policy if exists "Admins delete blog images" on storage.objects;

create policy "Admins upload blog images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'blog-images' and public.is_admin_mfa());

create policy "Admins update blog images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin_mfa());

create policy "Admins delete blog images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'blog-images' and public.is_admin_mfa());
