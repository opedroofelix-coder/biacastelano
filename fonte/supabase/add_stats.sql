-- Números da Bia Castelano (quantos quiser, não só 3)
-- Rode este SQL no Supabase: painel do projeto → SQL Editor → New query → cole → Run.

-- lista de números: [{"num":"+400","label":"casamentos registrados"}, ...]
alter table public.site_settings
  add column if not exists stats jsonb default '[]'::jsonb;

-- traz os 3 números que já estavam salvos para a lista nova
update public.site_settings
  set stats = (
    select coalesce(jsonb_agg(jsonb_build_object('num', coalesce(n,''), 'label', coalesce(l,''))), '[]'::jsonb)
    from (values (stat1_num, stat1_label, 1), (stat2_num, stat2_label, 2), (stat3_num, stat3_label, 3)) v(n, l, o)
    where coalesce(n,'') <> '' or coalesce(l,'') <> ''
  )
  where stats is null or stats = '[]'::jsonb;
