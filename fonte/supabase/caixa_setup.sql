-- =====================================================================
--  Bia Castelano — CAIXA DA EMPRESA dentro do CRM
--  Rode DEPOIS do crm_setup.sql. Cole no SQL Editor do Supabase e "Run".
--  Pode rodar mais de uma vez sem problema (é idempotente).
--  Dados PRIVADOS — só quem está logado lê e escreve.
-- =====================================================================

-- 1) Casais do caixa = clientes do CRM (duas colunas novas) -------------
alter table public.crm_clients add column if not exists legacy_id text;
alter table public.crm_clients add column if not exists parcelas_avulsas jsonb not null default '[]'::jsonb;
create unique index if not exists crm_clients_legacy_idx on public.crm_clients (legacy_id);

-- 2) TABELAS DO CAIXA ---------------------------------------------------
create table if not exists public.cx_meses (
  mes         text primary key check (mes ~ '^\d{4}-\d{2}$'),   -- 'YYYY-MM'
  saldo_final numeric(12,2)                                      -- saldo no banco no fim do mês
);

create table if not exists public.cx_contas (
  id    text primary key,
  nome  text not null default '',
  valor numeric(12,2) not null default 0,
  dia   int check (dia between 1 and 31)
);

create table if not exists public.cx_movimentos (
  id         text primary key,
  mes        text not null references public.cx_meses(mes) on delete cascade,
  d          text not null default '',          -- descrição
  e          numeric(12,2),                     -- entrada
  s          numeric(12,2),                     -- saída
  c          text not null default '',          -- categoria ('' = automática)
  o          int  not null default 0,           -- ordem na planilha
  client_id  uuid references public.crm_clients(id) on delete set null,
  conta_id   text references public.cx_contas(id) on delete set null,
  payment_id uuid references public.crm_payments(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists cx_mov_mes_idx    on public.cx_movimentos (mes);
create index if not exists cx_mov_client_idx on public.cx_movimentos (client_id);

create table if not exists public.cx_historico (
  id         uuid primary key default gen_random_uuid(),
  t          timestamptz not null default now(),
  user_email text,
  a          text not null,
  det        text not null default '',
  ref        jsonb,
  antes      jsonb,
  depois     jsonb
);
create index if not exists cx_hist_t_idx on public.cx_historico (t desc);

-- 3) SEGURANÇA (RLS): nada público --------------------------------------
alter table public.cx_meses      enable row level security;
alter table public.cx_contas     enable row level security;
alter table public.cx_movimentos enable row level security;
alter table public.cx_historico  enable row level security;

drop policy if exists "auth all cx_meses"      on public.cx_meses;
drop policy if exists "auth all cx_contas"     on public.cx_contas;
drop policy if exists "auth all cx_movimentos" on public.cx_movimentos;
drop policy if exists "auth all cx_historico"  on public.cx_historico;
create policy "auth all cx_meses"      on public.cx_meses      for all to authenticated using (true) with check (true);
create policy "auth all cx_contas"     on public.cx_contas     for all to authenticated using (true) with check (true);
create policy "auth all cx_movimentos" on public.cx_movimentos for all to authenticated using (true) with check (true);
create policy "auth all cx_historico"  on public.cx_historico  for all to authenticated using (true) with check (true);

revoke all on public.cx_meses, public.cx_contas, public.cx_movimentos, public.cx_historico from anon;

-- 4) TEMPO REAL: o CRM atualiza sozinho quando outra pessoa edita --------
do $$
declare t text;
begin
  foreach t in array array['cx_meses','cx_contas','cx_movimentos','crm_clients','crm_payments'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- Fim. Depois rode o import_caixa.sql (gerado à parte, NÃO fica no GitHub).
