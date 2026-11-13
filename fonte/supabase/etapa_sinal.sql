-- =====================================================================
-- CRM · Etapa "Aguardando sinal" no funil (contrato assinado, falta o sinal/entrada)
-- Rode no SQL Editor do Supabase. Pode rodar de novo sem problema.
-- =====================================================================

alter table public.crm_clients drop constraint if exists crm_clients_stage_check;
alter table public.crm_clients add constraint crm_clients_stage_check
  check (stage in ('lead','conv','prop','sinal','contr','prod','done'));

-- Fim. Se rodou sem erro em vermelho, já dá para mover casais para Aguardando sinal.
