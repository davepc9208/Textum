-- Ejecuta este script en el SQL Editor de tu proyecto Supabase
-- (Dashboard → SQL Editor → New query → pega y ejecuta)

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
  author       text not null default '',
  cover_url    text not null default '',
  published    boolean not null default false,
  reading_time integer not null default 1,
  created_at   timestamptz not null default now()
);

-- 2. Habilitar Row Level Security
alter table public.posts enable row level security;

-- 3. Política: cualquiera puede leer artículos publicados
create policy "Public can read published posts"
  on public.posts
  for select
  using (published = true);

-- 4. Política: solo usuarios autenticados pueden hacer todo
create policy "Authenticated users have full access"
  on public.posts
  for all
  to authenticated
  using (true)
  with check (true);
