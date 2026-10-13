-- =====================================================================
--  Bia Castelano — Google Agenda + lembretes de relacionamento no CRM
--  Rode DEPOIS do crm_setup.sql. Cole no SQL Editor do Supabase e "Run".
--  Pode rodar mais de uma vez sem problema (é idempotente).
--  Dados PRIVADOS — só quem está logado lê e escreve.
-- =====================================================================

-- 1) Configurações do CRM (ex.: e-mail da agenda do Google) ------------
create table if not exists public.crm_settings (
  key        text primary key,                -- ex: 'google_email'
  value      jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Ligação com o Google Agenda ----------------------------------------
-- id do evento no Google: compromissos e casamentos já enviados
alter table public.crm_events  add column if not exists gcal_id text;
alter table public.crm_clients add column if not exists gcal_id text;

-- 3) Lembretes automáticos (álbum aos 3 meses, lembrança de 1 ano) -----
-- As datas são calculadas pelo CRM a partir da data do casamento.
-- Aqui fica só o que já foi feito ou pulado: {"album":"2026-10-10","presente1":"pulado"}
alter table public.crm_clients add column if not exists marcos jsonb not null default '{}'::jsonb;

-- 4) SEGURANÇA (RLS): nada público --------------------------------------
alter table public.crm_settings enable row level security;
drop policy if exists "auth all crm_settings" on public.crm_settings;
create policy "auth all crm_settings" on public.crm_settings for all to authenticated using (true) with check (true);
revoke all on public.crm_settings from anon;

-- Fim. Se rodou sem erro em vermelho, a agenda e os lembretes estão prontos do lado do banco.
