-- =====================================================================
--  ZERAR CONTEÚDO DE TESTE — Site da Bia Castelano
--  Cole no SQL Editor do seu projeto Supabase e clique em Run.
--
--  O que isto faz:
--   - apaga TODOS os álbuns, depoimentos e filmes
--   - limpa as fotos das configurações (abertura, sobre, contato)
--   Resultado: o site volta a mostrar o CONTEÚDO DE EXEMPLO embutido,
--   pronto pra você inserir o conteúdo real pelo /admin.
--
--   Os TEXTOS (Propósito, Sobre, números, contato) são MANTIDOS.
--   (Se quiser zerar os textos também, veja o bloco comentado no fim.)
--
--   Os ARQUIVOS de imagem no storage não saem por SQL (o Supabase bloqueia).
--   Isso não afeta o site. Para apagá-los também, use o painel do Supabase:
--     Storage -> bucket "fotos" -> selecionar tudo -> Delete.
-- =====================================================================

-- 1) apagar os itens adicionados pelo painel
delete from public.albums;
delete from public.testimonials;
delete from public.films;

-- 2) limpar as fotos das configurações (mantém os textos)
update public.site_settings
   set hero_gallery  = '[]'::jsonb,
       hero_image    = null,
       about_image   = null,
       contact_image = null
 where id = 1;

-- ---------------------------------------------------------------------
-- OPCIONAL — zerar também os textos (volta ao texto de exemplo original).
-- Descomente (remova o /* e */) só se quiser limpar os textos também.
/*
update public.site_settings set
  proposito = '["Planejar um casamento é uma jornada intensa, cheia de expectativas e sonhos. Sabemos que cada detalhe reflete o desejo de tornar este momento único e inesquecível. Para nós, trabalhar com casamentos é mais do que prestar um serviço; é compartilhar emoções, acompanhar cada sorriso, e celebrar junto com vocês.","Nosso propósito é transformar esse dia em uma experiência inesquecível e garantir que cada momento seja registrado da forma mais especial possível, para que as memórias permaneçam vivas por toda a vida.","Mais do que fornecedores, nos dedicamos a criar experiências significativas e a participar de um momento que será lembrado com carinho por todos. Essa é a nossa maior recompensa, pois acreditamos no amor, e no poder das memórias que duram para sempre."]'::jsonb,
  sobre = '["Cristã, apaixonada por filmes românticos e música. Diretora artística e musicista, sempre sonhei em ser psicóloga, mas encontrei minha verdadeira paixão na fotografia.","Há mais de 6 anos me dedico a contar histórias por meio das lentes, registrando mais de 400 casamentos com um olhar único. Com delicadeza e sensibilidade, busco transformar momentos especiais em memórias eternas, trazendo minha visão de mundo para cada registro."]'::jsonb,
  stat1_num='+400', stat1_label='casamentos registrados',
  stat2_num='6',    stat2_label='anos de estrada',
  stat3_num='∞',    stat3_label='memórias eternas',
  whatsapp='', instagram='', email='', location='São Paulo · Brasil'
 where id = 1;
*/
