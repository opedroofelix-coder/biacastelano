-- =====================================================================
--  Bia Castelano — Google Agenda no CRM pelo endereço secreto (iCal)
--  Rode DEPOIS do agenda_setup.sql. Cole no SQL Editor do Supabase e "Run".
--  Pode rodar mais de uma vez sem problema.
--
--  Guarda o "Endereço secreto no formato iCal" do Google Agenda.
--  Ninguém lê esta tabela pelo CRM: só a Edge Function crm-agenda
--  (com a chave de administrador, que fica dentro do Supabase).
-- =====================================================================

create table if not exists public.crm_segredos (
  key        text primary key,          -- 'google_ics_url'
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.crm_segredos enable row level security;
-- sem nenhuma regra (policy) = nenhum login lê nem altera; só a função
revoke all on public.crm_segredos from anon, authenticated;

-- Fim. Depois publique a Edge Function crm-agenda (README › Google Agenda no CRM).
