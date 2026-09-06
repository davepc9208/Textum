-- Esquema de referencia para TEXTUM (sincronizado con producción)
-- Ejecutar en Supabase → SQL Editor si partes de cero

-- 1. Tabla de artículos del blog
create table if not exists public.posts (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title_es     text not null default '',
  title_en     text not null default '',
  excerpt_es   text not null default '',
  excerpt_en   text not null default '',
  content_es   text not null default '',
  content_en   text not null default '',
  keywords_es  text not null default '',
  keywords_en  text not null default '',
  author       text not null default '',
  cover_url    text not null default '',
  cover_alt    text,
  category     text,
  collection_type text,
  published    boolean not null default false,
  reading_time integer not null default 1,
  created_at   timestamptz not null default now()
);

-- Columnas añadidas después del CREATE inicial (idempotente para BD ya existentes)
alter table public.posts add column if not exists keywords_es     text not null default '';
alter table public.posts add column if not exists keywords_en     text not null default '';
alter table public.posts add column if not exists collection_type text;

create index if not exists posts_published_cursor_idx
  on public.posts (published, collection_type, created_at desc, id desc);

-- 2. Leads captados desde recursos y formularios (PII; nunca público)
create table if not exists public.leads (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  email            text not null,
  institution      text,
  country          text,
  role             text,
  resource_slug    text,
  resource_type    text,
  resource_title   text,
  lang             text not null default 'es',
  source           text,
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  privacy_accepted boolean not null default false,
  email_sent       boolean not null default false,
  downloaded_at    timestamptz,
  unsubscribed_at  timestamptz,
  assistant_need    text,
  assistant_program text,
  assistant_summary text,
  assistant_consent_at timestamptz,
  assistant_deadline text,
  assistant_priority text,
  -- Pipeline comercial (gestionado desde el panel admin)
  status           text not null default 'nuevo',
  -- Atribución de marketing (first-touch)
  utm_term         text,
  utm_content      text,
  gclid            text,
  fbclid           text,
  referrer         text,
  landing_path     text,
  first_seen_at    timestamptz,
  -- Secuencia de nurture por email
  sequence_step    integer not null default 0,
  sequence_next_at timestamptz,
  sequence_paused  boolean not null default false,
  last_nurture_at  timestamptz,
  created_at       timestamptz not null default now()
);

-- Columnas idempotentes para bases de datos ya existentes
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

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_status_idx on public.leads (status, created_at desc);
-- Cola de nurture: leads activos con un paso pendiente y ya vencido.
create index if not exists leads_nurture_queue_idx
  on public.leads (sequence_next_at)
  where unsubscribed_at is null and sequence_paused = false;

alter table public.leads enable row level security;

-- 3. Administradores autorizados
create table if not exists public.admins (
  email text primary key check (email ~* '^[^@]+@[^@]+\.[^@]+$')
);

alter table public.admins enable row level security;

insert into public.admins (email)
values ('revedit917@gmail.com')
on conflict (email) do nothing;

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

-- 4. Row Level Security — posts
alter table public.posts enable row level security;

create policy "Public can read published posts"
  on public.posts for select
  using (published = true);

create policy "Admins can read all posts"
  on public.posts for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert posts"
  on public.posts for insert
  to authenticated
  with check (public.is_admin_mfa());

create policy "Admins can update posts"
  on public.posts for update
  to authenticated
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

create policy "Admins can delete posts"
  on public.posts for delete
  to authenticated
  using (public.is_admin_mfa());

-- 5. Leads: solo el administrador con MFA puede leer / actualizar datos personales
drop policy if exists "Admins can read leads" on public.leads;
create policy "Admins can read leads"
  on public.leads for select
  to authenticated
  using (public.is_admin_mfa());

-- El panel admin cambia el `status` del lead (pipeline comercial).
drop policy if exists "Admins can update leads" on public.leads;
create policy "Admins can update leads"
  on public.leads for update
  to authenticated
  using (public.is_admin_mfa())
  with check (public.is_admin_mfa());

-- 6. Presupuesto diario del asistente IA (Groq)
-- Contador por día usado por functions/api/assistant.js para no agotar
-- los créditos gratuitos. Nunca es público: solo el service role lo escribe.
create table if not exists public.ai_usage (
  day          date primary key,
  llm_calls    integer not null default 0,
  tokens_est   bigint  not null default 0,
  updated_at   timestamptz not null default now()
);

alter table public.ai_usage enable row level security;

-- Incremento atómico del contador del día y devolución del total.
-- La función es security definer y solo se concede al service role,
-- de modo que un visitante no puede leer ni manipular el contador.
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

-- 7. Storage: bucket blog-images
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

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
