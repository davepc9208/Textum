-- ============================================================
-- PROSPECCIÓN INSTITUCIONAL — patch independiente e idempotente
-- Ejecutar en Supabase → SQL Editor si el panel Prospección
-- muestra "Could not find the table 'public.outreach_events'".
-- Es el bloque 8 de supabase_schema.sql, extraído tal cual para
-- aplicarlo sobre una base ya montada sin tocar lo demás.
-- ============================================================

create table if not exists public.prospects (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  email           text not null unique,
  institution     text,
  department      text,
  programme       text,
  role            text,
  country         text,
  language        text not null default 'es' check (language in ('es', 'en')),
  source_url      text,
  contact_basis   text,
  tags            text[] not null default '{}',
  status          text not null default 'nuevo' check (status in ('nuevo','investigado','aprobado','contactado','respondio','reunion','propuesta','cliente','no_interesado','baja')),
  approved        boolean not null default false,
  do_not_contact  boolean not null default false,
  notes           text,
  last_contact_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
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
create index if not exists prospects_institution_idx on public.prospects (institution);

create table if not exists public.outreach_campaigns (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  language        text not null default 'es' check (language in ('es', 'en')),
  offer           text not null default 'piloto-doctorado',
  status          text not null default 'borrador' check (status in ('borrador','activa','pausada','finalizada')),
  daily_limit     integer not null default 15 check (daily_limit between 1 and 100),
  send_hour       integer not null default 10 check (send_hour between 0 and 23),
  from_email      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.outreach_steps (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.outreach_campaigns(id) on delete cascade,
  step_number     integer not null check (step_number between 1 and 5),
  delay_days      integer not null default 0 check (delay_days between 0 and 30),
  subject         text not null,
  body            text not null,
  created_at      timestamptz not null default now(),
  unique (campaign_id, step_number)
);

create table if not exists public.outreach_enrollments (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid not null references public.outreach_campaigns(id) on delete cascade,
  prospect_id     uuid not null references public.prospects(id) on delete cascade,
  step_number     integer not null default 1,
  next_at         timestamptz,
  paused          boolean not null default false,
  completed       boolean not null default false,
  replied         boolean not null default false,
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (campaign_id, prospect_id)
);

create index if not exists outreach_queue_idx on public.outreach_enrollments (next_at)
  where paused = false and completed = false and replied = false;

create table if not exists public.outreach_events (
  id              uuid primary key default gen_random_uuid(),
  campaign_id     uuid references public.outreach_campaigns(id) on delete set null,
  prospect_id     uuid not null references public.prospects(id) on delete cascade,
  enrollment_id   uuid references public.outreach_enrollments(id) on delete set null,
  event_type      text not null check (event_type in ('sent','delivered','bounced','replied','meeting','proposal','client','unsubscribed','note')),
  step_number     integer,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists outreach_events_created_idx on public.outreach_events (created_at desc);
create index if not exists outreach_events_type_idx on public.outreach_events (event_type, created_at desc);

alter table public.prospects enable row level security;
alter table public.outreach_campaigns enable row level security;
alter table public.outreach_steps enable row level security;
alter table public.outreach_enrollments enable row level security;
alter table public.outreach_events enable row level security;

-- Requiere la función is_admin_mfa() de supabase_rls_admin.sql.
create policy "Admins manage prospects" on public.prospects for all to authenticated
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy "Admins manage outreach campaigns" on public.outreach_campaigns for all to authenticated
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy "Admins manage outreach steps" on public.outreach_steps for all to authenticated
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy "Admins manage outreach enrollments" on public.outreach_enrollments for all to authenticated
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
create policy "Admins read outreach events" on public.outreach_events for select to authenticated
  using (public.is_admin_mfa());
