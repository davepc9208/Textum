-- ============================================================================
-- PARCHE DE DESPLIEGUE — Fix del asistente TEXTUM (503 en producción)
--
-- Causa: la tabla public.api_rate_limits y la función
-- public.consume_api_rate_limit nunca se aplicaron en producción. Sin ellas,
-- el limitador antiabuso de los endpoints del asistente y del formulario de
-- contacto lanza RateLimitUnavailableError y los endpoints responden 503.
--
-- Cómo aplicarlo: Supabase → SQL Editor → pegar todo → Run.
-- Idempotente: se puede repetir sin romper nada.
-- ============================================================================

-- Ratelimit compartido y atómico para Cloudflare Pages Functions.
create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  updated_at timestamptz not null default now()
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;

create or replace function public.consume_api_rate_limit(
  p_bucket_key text,
  p_max_count integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz := date_trunc('second', clock_timestamp());
  allowed boolean;
begin
  if p_bucket_key is null or p_bucket_key !~ '^[a-f0-9]{64}$'
    or p_max_count < 1 or p_max_count > 10000
    or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit parameters';
  end if;

  if random() < 0.01 then
    delete from public.api_rate_limits where window_started_at < current_window - interval '2 days';
  end if;

  insert into public.api_rate_limits (bucket_key, window_started_at, request_count, updated_at)
  values (p_bucket_key, current_window, 1, current_window)
  on conflict (bucket_key) do update
    set window_started_at = case
          when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= current_window
            then current_window
          else public.api_rate_limits.window_started_at
        end,
        request_count = case
          when public.api_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= current_window
            then 1
          else public.api_rate_limits.request_count + 1
        end,
        updated_at = current_window
  returning request_count <= p_max_count into allowed;

  return allowed;
end;
$$;
revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
