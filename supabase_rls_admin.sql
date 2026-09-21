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

-- 3. Posts — columnas localizadas para slug y portada
alter table public.posts add column if not exists slug_es      text;
alter table public.posts add column if not exists slug_en      text;
alter table public.posts add column if not exists cover_url_es text;
alter table public.posts add column if not exists cover_url_en text;
alter table public.posts add column if not exists cover_alt_es text;
alter table public.posts add column if not exists cover_alt_en text;

update public.posts set slug_es = coalesce(nullif(slug_es, ''), slug) where slug_es is null or slug_es = '';
update public.posts set cover_url_es = coalesce(nullif(cover_url_es, ''), cover_url) where cover_url_es is null or cover_url_es = '';
update public.posts set cover_alt_es = coalesce(nullif(cover_alt_es, ''), cover_alt) where cover_alt_es is null or cover_alt_es = '';
update public.posts set slug_en = coalesce(nullif(slug_en, ''), slug) where slug_en is null or slug_en = '';
update public.posts set cover_url_en = coalesce(nullif(cover_url_en, ''), cover_url) where cover_url_en is null or cover_url_en = '';
update public.posts set cover_alt_en = coalesce(nullif(cover_alt_en, ''), cover_alt) where cover_alt_en is null or cover_alt_en = '';

create unique index if not exists posts_slug_es_unique_idx on public.posts (slug_es);
create unique index if not exists posts_slug_en_unique_idx on public.posts (slug_en);

-- 3 bis. collection_type: admitir el tipo EII (Enfoque Investigativo Integral).
-- La base en producción conserva una restricción antigua que solo permite
-- principio / categoria / herramienta, por lo que guardar EII fallaba con
-- "violates check constraint \"posts_collection_type_check\"".
-- Idempotente: si la restricción no existe, no hace nada.
alter table public.posts drop constraint if exists posts_collection_type_check;
alter table public.posts add constraint posts_collection_type_check
  check (collection_type is null or collection_type in ('principio', 'categoria', 'herramienta', 'eii', 'flux'));

-- 4. Posts — reemplazar política permisiva anterior
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

-- 6. Prospección institucional: ejecutar después del esquema inicial.
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  institution text,
  department text,
  programme text,
  role text,
  country text,
  language text not null default 'es' check (language in ('es','en')),
  source_url text,
  contact_basis text,
  tags text[] not null default '{}',
  status text not null default 'nuevo' check (status in ('nuevo','investigado','aprobado','contactado','respondio','reunion','propuesta','cliente','no_interesado','baja')),
  approved boolean not null default false,
  do_not_contact boolean not null default false,
  notes text,
  last_contact_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.prospects add column if not exists department text;
alter table public.prospects add column if not exists programme text;
alter table public.prospects add column if not exists source_url text;
alter table public.prospects add column if not exists contact_basis text;
alter table public.prospects add column if not exists tags text[] not null default '{}';
alter table public.prospects add column if not exists approved boolean not null default false;
alter table public.prospects add column if not exists do_not_contact boolean not null default false;
alter table public.prospects add column if not exists notes text;
alter table public.prospects add column if not exists last_contact_at timestamptz;
alter table public.prospects add column if not exists updated_at timestamptz not null default now();
create unique index if not exists prospects_email_unique_idx on public.prospects (email);
create index if not exists prospects_status_idx on public.prospects (status, created_at desc);

create table if not exists public.outreach_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  language text not null default 'es' check (language in ('es','en')),
  offer text not null default 'piloto-doctorado',
  status text not null default 'borrador' check (status in ('borrador','activa','pausada','finalizada')),
  daily_limit integer not null default 15 check (daily_limit between 1 and 100),
  send_hour integer not null default 10 check (send_hour between 0 and 23),
  from_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.outreach_steps (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  step_number integer not null check (step_number between 1 and 5),
  delay_days integer not null default 0 check (delay_days between 0 and 30),
  subject text not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (campaign_id, step_number)
);
create table if not exists public.outreach_enrollments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.outreach_campaigns(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  step_number integer not null default 1,
  next_at timestamptz,
  paused boolean not null default false,
  completed boolean not null default false,
  replied boolean not null default false,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, prospect_id)
);
create index if not exists outreach_queue_idx on public.outreach_enrollments (next_at)
  where paused = false and completed = false and replied = false;
create table if not exists public.outreach_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.outreach_campaigns(id) on delete set null,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  enrollment_id uuid references public.outreach_enrollments(id) on delete set null,
  event_type text not null,
  step_number integer,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists outreach_events_created_idx on public.outreach_events (created_at desc);
alter table public.prospects enable row level security;
alter table public.outreach_campaigns enable row level security;
alter table public.outreach_steps enable row level security;
alter table public.outreach_enrollments enable row level security;
alter table public.outreach_events enable row level security;
drop policy if exists "Admins manage prospects" on public.prospects;
create policy "Admins manage prospects" on public.prospects for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
drop policy if exists "Admins manage outreach campaigns" on public.outreach_campaigns;
create policy "Admins manage outreach campaigns" on public.outreach_campaigns for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
drop policy if exists "Admins manage outreach steps" on public.outreach_steps;
create policy "Admins manage outreach steps" on public.outreach_steps for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
drop policy if exists "Admins manage outreach enrollments" on public.outreach_enrollments;
create policy "Admins manage outreach enrollments" on public.outreach_enrollments for all to authenticated using (public.is_admin_mfa()) with check (public.is_admin_mfa());
drop policy if exists "Admins read outreach events" on public.outreach_events;
create policy "Admins read outreach events" on public.outreach_events for select to authenticated using (public.is_admin_mfa());
