-- =====================================================================
--  Bia Castelano — configuração do banco (Supabase)
--  Cole tudo isto no SQL Editor do seu projeto novo e clique em "Run".
--  Pode rodar mais de uma vez sem problema (é idempotente).
-- =====================================================================

-- 1) TABELAS ----------------------------------------------------------

create table if not exists public.site_settings (
  id            int primary key default 1 check (id = 1),
  proposito     jsonb default '[]'::jsonb,   -- parágrafos da seção "Propósito"
  sobre         jsonb default '[]'::jsonb,   -- parágrafos da seção "Sobre"
  hero_image    text,
  about_image   text,
  contact_image text,
  stat1_num text, stat1_label text,
  stat2_num text, stat2_label text,
  stat3_num text, stat3_label text,
  whatsapp text, instagram text, email text, location text,
  updated_at timestamptz default now()
);

create table if not exists public.albums (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  subtitle   text,
  category   text not null default 'wed' check (category in ('pre','wed')),
  photos     jsonb default '[]'::jsonb,      -- lista de URLs de fotos
  sort       int default 0,
  created_at timestamptz default now()
);

create table if not exists public.testimonials (
  id           uuid primary key default gen_random_uuid(),
  handle       text,                          -- @ do casal
  date_label   text,                          -- ex: "18 de jul"
  body         text,                          -- texto do depoimento
  couple_photo text,                          -- foto de fundo (casal)
  avatar_photo text,                          -- foto de perfil
  sort         int default 0,
  created_at   timestamptz default now()
);

create table if not exists public.films (
  id          uuid primary key default gen_random_uuid(),
  title       text,
  subtitle    text,
  thumb       text,                           -- capa do vídeo
  youtube_url text,
  sort        int default 0,
  created_at  timestamptz default now()
);

-- 2) SEGURANÇA (RLS): público só LÊ, quem estiver logado ESCREVE -------

alter table public.site_settings enable row level security;
alter table public.albums        enable row level security;
alter table public.testimonials  enable row level security;
alter table public.films         enable row level security;

-- leitura pública
drop policy if exists "public read settings"     on public.site_settings;
drop policy if exists "public read albums"       on public.albums;
drop policy if exists "public read testimonials" on public.testimonials;
drop policy if exists "public read films"        on public.films;
create policy "public read settings"     on public.site_settings for select using (true);
create policy "public read albums"       on public.albums        for select using (true);
create policy "public read testimonials" on public.testimonials  for select using (true);
create policy "public read films"        on public.films         for select using (true);

-- escrita apenas para usuários autenticados (a Bia)
drop policy if exists "auth write settings"     on public.site_settings;
drop policy if exists "auth write albums"       on public.albums;
drop policy if exists "auth write testimonials" on public.testimonials;
drop policy if exists "auth write films"        on public.films;
create policy "auth write settings"     on public.site_settings for all to authenticated using (true) with check (true);
create policy "auth write albums"       on public.albums        for all to authenticated using (true) with check (true);
create policy "auth write testimonials" on public.testimonials  for all to authenticated using (true) with check (true);
create policy "auth write films"        on public.films         for all to authenticated using (true) with check (true);

-- 3) STORAGE (fotos) --------------------------------------------------

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "public read fotos"  on storage.objects;
drop policy if exists "auth upload fotos"  on storage.objects;
drop policy if exists "auth update fotos"  on storage.objects;
drop policy if exists "auth delete fotos"  on storage.objects;
create policy "public read fotos" on storage.objects for select using (bucket_id = 'fotos');
create policy "auth upload fotos" on storage.objects for insert to authenticated with check (bucket_id = 'fotos');
create policy "auth update fotos" on storage.objects for update to authenticated using (bucket_id = 'fotos');
create policy "auth delete fotos" on storage.objects for delete to authenticated using (bucket_id = 'fotos');

-- 4) CONTEÚDO INICIAL (textos atuais da Bia) --------------------------

insert into public.site_settings
  (id, proposito, sobre,
   stat1_num, stat1_label, stat2_num, stat2_label, stat3_num, stat3_label,
   whatsapp, instagram, email, location)
values (
  1,
  '["Planejar um casamento é uma jornada intensa, cheia de expectativas e sonhos. Sabemos que cada detalhe reflete o desejo de tornar este momento único e inesquecível. Para nós, trabalhar com casamentos é mais do que prestar um serviço; é compartilhar emoções, acompanhar cada sorriso, e celebrar junto com vocês.","Nosso propósito é transformar esse dia em uma experiência inesquecível e garantir que cada momento seja registrado da forma mais especial possível, para que as memórias permaneçam vivas por toda a vida.","Mais do que fornecedores, nos dedicamos a criar experiências significativas e a participar de um momento que será lembrado com carinho por todos. Essa é a nossa maior recompensa, pois acreditamos no amor, e no poder das memórias que duram para sempre."]'::jsonb,
  '["Cristã, apaixonada por filmes românticos e música. Diretora artística e musicista, sempre sonhei em ser psicóloga, mas encontrei minha verdadeira paixão na fotografia.","Há mais de 6 anos me dedico a contar histórias por meio das lentes, registrando mais de 400 casamentos com um olhar único. Com delicadeza e sensibilidade, busco transformar momentos especiais em memórias eternas, trazendo minha visão de mundo para cada registro."]'::jsonb,
  '+400', 'casamentos registrados',
  '6',    'anos de estrada',
  '∞',    'memórias eternas',
  '', '', '', 'São Paulo · Brasil'
)
on conflict (id) do nothing;

-- Fim. Se rodou sem erro em vermelho, está tudo pronto do lado do banco.
