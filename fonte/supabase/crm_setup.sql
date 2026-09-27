-- =====================================================================
--  Bia Castelano — CRM (clientes, agenda, financeiro, entregas, tarefas)
--  Cole tudo isto no SQL Editor do Supabase e clique em "Run".
--  Pode rodar mais de uma vez sem problema (é idempotente).
--  IMPORTANTE: estes dados são PRIVADOS — só quem está logado lê e escreve.
-- =====================================================================

-- 1) TABELAS ----------------------------------------------------------

create table if not exists public.crm_clients (
  id          uuid primary key default gen_random_uuid(),
  couple      text not null,                  -- ex: "Helena & Théo"
  stage       text not null default 'lead'
              check (stage in ('lead','conv','prop','contr','prod','done')),
  event_type  text not null default 'wed'
              check (event_type in ('wed','pre','ens','outro')),
  event_date  date,
  venue       text,
  package     text,
  value       numeric(12,2),
  source      text not null default 'instagram'
              check (source in ('instagram','indicacao','site','outro')),
  whatsapp    text,
  instagram   text,
  email       text,
  notes       text,
  checklist   jsonb not null default '[]'::jsonb, -- [{t:"texto", done:false}]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.crm_events (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.crm_clients(id) on delete cascade,
  type       text not null default 'reu'
             check (type in ('wed','ens','reu','ent','ani')),
  title      text not null,
  starts_at  timestamptz not null,
  location   text,
  notes      text,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_payments (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid references public.crm_clients(id) on delete cascade,
  description text,                           -- ex: "Entrada 30%"
  amount      numeric(12,2) not null default 0,
  due_date    date,
  paid_at     date,                           -- vazio = ainda não pago
  created_at  timestamptz not null default now()
);

create table if not exists public.crm_deliveries (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.crm_clients(id) on delete cascade,
  item       text not null,                   -- ex: "Galeria completa"
  detail     text,                            -- ex: "400 fotos tratadas"
  due_date   date,
  progress   int not null default 0 check (progress between 0 and 100),
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_tasks (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.crm_clients(id) on delete set null,
  title      text not null,
  detail     text,
  due_date   date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists crm_events_starts_idx     on public.crm_events (starts_at);
create index if not exists crm_payments_client_idx   on public.crm_payments (client_id);
create index if not exists crm_deliveries_client_idx on public.crm_deliveries (client_id);

-- updated_at automático nos clientes
create or replace function public.crm_touch() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists crm_clients_touch on public.crm_clients;
create trigger crm_clients_touch before update on public.crm_clients
  for each row execute function public.crm_touch();

-- 2) SEGURANÇA (RLS): NADA público — só usuário logado (a Bia) --------

alter table public.crm_clients    enable row level security;
alter table public.crm_events     enable row level security;
alter table public.crm_payments   enable row level security;
alter table public.crm_deliveries enable row level security;
alter table public.crm_tasks      enable row level security;

drop policy if exists "auth all crm_clients"    on public.crm_clients;
drop policy if exists "auth all crm_events"     on public.crm_events;
drop policy if exists "auth all crm_payments"   on public.crm_payments;
drop policy if exists "auth all crm_deliveries" on public.crm_deliveries;
drop policy if exists "auth all crm_tasks"      on public.crm_tasks;
create policy "auth all crm_clients"    on public.crm_clients    for all to authenticated using (true) with check (true);
create policy "auth all crm_events"     on public.crm_events     for all to authenticated using (true) with check (true);
create policy "auth all crm_payments"   on public.crm_payments   for all to authenticated using (true) with check (true);
create policy "auth all crm_deliveries" on public.crm_deliveries for all to authenticated using (true) with check (true);
create policy "auth all crm_tasks"      on public.crm_tasks      for all to authenticated using (true) with check (true);

revoke all on public.crm_clients, public.crm_events, public.crm_payments,
              public.crm_deliveries, public.crm_tasks from anon;

-- Fim. Se rodou sem erro em vermelho, o CRM está pronto do lado do banco.
