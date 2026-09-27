-- Ajuste do painel: coluna para as "Fotos da abertura"
-- Cole no SQL Editor do seu projeto e clique em Run (roda uma vez; é seguro repetir).

alter table public.site_settings
  add column if not exists hero_gallery jsonb default '[]'::jsonb;
