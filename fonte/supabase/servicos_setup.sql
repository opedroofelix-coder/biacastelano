-- =====================================================================
-- CRM · O que cada casal contratou (foto, vídeo, ensaio, vídeo no ensaio)
-- Rode no SQL Editor do Supabase, depois do crm_setup.sql.
-- Pode rodar de novo sem problema: só cria o que ainda não existe.
-- =====================================================================

-- lista do que foi contratado: plano ("foto","video") + adicionais
-- ("ensaio" = pré-wedding, "video_ensaio", "drone", "album", "same_day")
alter table public.crm_clients add column if not exists servicos jsonb not null default '[]'::jsonb;

-- Fim. Se rodou sem erro em vermelho, a ficha, a agenda e o filtro de
-- próximos casamentos passam a mostrar o que foi contratado.
