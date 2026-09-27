-- Vídeo de abertura da Bia Castelano
-- Rode este SQL no Supabase: painel do projeto → SQL Editor → New query → cole → Run.

-- 1) coluna que guarda o link/arquivo do vídeo de abertura
alter table public.site_settings
  add column if not exists hero_video text default '';

-- 2) permitir enviar vídeos pelo painel (bucket "fotos")
--    libera qualquer tipo de arquivo e aumenta o limite pra 50 MB por arquivo
update storage.buckets
  set file_size_limit = 52428800,
      allowed_mime_types = null
  where id = 'fotos';
