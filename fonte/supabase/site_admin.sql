-- =====================================================================
--  Bia Castelano — PAINEL DO SITE (/admin) SÓ PARA ADMINISTRADORES
--  Cole tudo isto no SQL Editor do Supabase e clique em "Run".
--  Rode DEPOIS do acessos_setup.sql. Pode rodar de novo sem problema.
--
--  O que muda: textos, álbuns, depoimentos, filmes e fotos/vídeos do site
--  só podem ser alterados por quem é administrador na tela Acessos do CRM.
--  O site continua público para leitura, como antes.
-- =====================================================================

-- 1) TABELAS DO SITE: escrita só para administrador -----------------

drop policy if exists "auth write settings"     on public.site_settings;
drop policy if exists "auth write albums"       on public.albums;
drop policy if exists "auth write testimonials" on public.testimonials;
drop policy if exists "auth write films"        on public.films;
drop policy if exists "admin write settings"     on public.site_settings;
drop policy if exists "admin write albums"       on public.albums;
drop policy if exists "admin write testimonials" on public.testimonials;
drop policy if exists "admin write films"        on public.films;

create policy "admin write settings"     on public.site_settings for all to authenticated
  using ((select public.crm_eh_admin())) with check ((select public.crm_eh_admin()));
create policy "admin write albums"       on public.albums        for all to authenticated
  using ((select public.crm_eh_admin())) with check ((select public.crm_eh_admin()));
create policy "admin write testimonials" on public.testimonials  for all to authenticated
  using ((select public.crm_eh_admin())) with check ((select public.crm_eh_admin()));
create policy "admin write films"        on public.films         for all to authenticated
  using ((select public.crm_eh_admin())) with check ((select public.crm_eh_admin()));

-- 2) FOTOS E VÍDEOS (bucket "fotos"): enviar/trocar/apagar só administrador

drop policy if exists "auth upload fotos" on storage.objects;
drop policy if exists "auth update fotos" on storage.objects;
drop policy if exists "auth delete fotos" on storage.objects;
drop policy if exists "admin upload fotos" on storage.objects;
drop policy if exists "admin update fotos" on storage.objects;
drop policy if exists "admin delete fotos" on storage.objects;

create policy "admin upload fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'fotos' and (select public.crm_eh_admin()));
create policy "admin update fotos" on storage.objects for update to authenticated
  using (bucket_id = 'fotos' and (select public.crm_eh_admin()));
create policy "admin delete fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'fotos' and (select public.crm_eh_admin()));

-- Fim. Se rodou sem erro em vermelho, só administradores editam o site.
