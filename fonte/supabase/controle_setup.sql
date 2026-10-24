-- =====================================================================
-- CRM · Controle de clientes (contratos, sinal, prazos e histórico)
-- Rode UMA vez no SQL Editor do Supabase, depois do crm_setup.sql.
-- Pode rodar de novo sem problema: só cria o que ainda não existe.
-- =====================================================================

-- 1) CAMPOS DO CONTROLE NA FICHA DO CLIENTE ----------------------------
-- Cliente, plano (package), orçamento (value) e casamento (event_date)
-- já existem em crm_clients; aqui entram só os campos novos da planilha.
alter table public.crm_clients add column if not exists diferencial text;          -- brinde, desconto, drone…
alter table public.crm_clients add column if not exists contrato    text;          -- Pendente | Assinado | Cancelado
alter table public.crm_clients add column if not exists sinal       numeric(12,2); -- 20% do orçamento
alter table public.crm_clients add column if not exists data_sinal  date;
alter table public.crm_clients add column if not exists agenda      text;          -- Reservado | Agendado | Cancelado
alter table public.crm_clients add column if not exists data_final  date;          -- pagamento final até
alter table public.crm_clients add column if not exists data_multa  date;
alter table public.crm_clients add column if not exists etapa       text;          -- etapa do contrato (vazio = segue o funil)

-- 2) HISTÓRICO DAS ALTERAÇÕES (permite desfazer) ------------------------
create table if not exists public.crm_historico (
  id         uuid primary key default gen_random_uuid(),
  t          timestamptz not null default now(),
  user_email text,
  a          text not null,
  det        text not null default '',
  ref        jsonb,
  antes      jsonb,
  depois     jsonb
);
create index if not exists crm_hist_t_idx on public.crm_historico (t desc);

-- 3) SEGURANÇA (RLS): nada público --------------------------------------
alter table public.crm_historico enable row level security;
drop policy if exists "auth all crm_historico" on public.crm_historico;
create policy "auth all crm_historico" on public.crm_historico for all to authenticated using (true) with check (true);
revoke all on public.crm_historico from anon;

-- 4) TEMPO REAL ----------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public' and tablename='crm_historico') then
    alter publication supabase_realtime add table public.crm_historico;
  end if;
end $$;

-- Fim. Se rodou sem erro em vermelho, as abas Contratos e prazos, Planilha
-- e Histórico (em Clientes) passam a funcionar.
