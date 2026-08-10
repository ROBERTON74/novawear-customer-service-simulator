create table if not exists public.training_progress (
  id bigint generated always as identity primary key,
  agent_name text not null default 'Mari Luz Sanabria',
  call_id bigint,
  order_number text,
  customer_name text,
  scenario_type text,
  started_at timestamptz,
  finished_at timestamptz not null,
  duration_seconds integer not null default 0,
  score integer,
  actions jsonb not null default '{}'::jsonb,
  verification jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.training_progress enable row level security;

grant usage on schema public to service_role;
grant select, insert on public.training_progress to service_role;
grant usage, select on sequence public.training_progress_id_seq to service_role;
