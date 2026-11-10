-- =====================================================================
-- CRM · Novos tipos de evento: Corporativo e Jantar
-- Rode no SQL Editor do Supabase, depois do crm_setup.sql.
-- Pode rodar de novo sem problema.
-- Na agenda: casamento em vermelho, corporativo em azul e
-- ensaio / pré-wedding / jantar em marrom.
-- =====================================================================

-- tipo do evento do cliente (ficha do casal / cliente)
alter table public.crm_clients drop constraint if exists crm_clients_event_type_check;
alter table public.crm_clients add constraint crm_clients_event_type_check
  check (event_type in ('wed','corp','pre','ens','jantar','outro'));

-- tipo do compromisso avulso da agenda
alter table public.crm_events drop constraint if exists crm_events_type_check;
alter table public.crm_events add constraint crm_events_type_check
  check (type in ('wed','corp','ens','reu','ent','ani'));

-- Fim. Se rodou sem erro em vermelho, já dá para escolher Corporativo e Jantar.
