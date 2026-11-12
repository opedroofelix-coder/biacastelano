-- =====================================================================
--  Bia Castelano — CRM: ACESSOS POR PESSOA
--  Cole tudo isto no SQL Editor do Supabase e clique em "Run".
--  Rode DEPOIS dos outros scripts do CRM (crm_setup, controle_setup,
--  caixa_setup, agenda_setup, servicos_setup). Pode rodar de novo sem problema.
--
--  O que muda: cada pessoa logada passa a ver só o que foi liberado para ela.
--  A trava fica no banco (não dá para contornar pelo navegador).
--
--  Áreas:  painel · agenda · clientes · financeiro (Financeiro + Caixa) · entregas
--  Níveis: nenhum · ler · editar
--  Administrador: acesso total + tela "Acessos" no CRM para mudar tudo isso.
--  Quem não está na lista recebe o acesso de "Demais pessoas"
--  (começa como: só leitura da Agenda).
-- =====================================================================

-- 1) TABELA DE ACESSOS ------------------------------------------------

create table if not exists public.crm_acessos (
  email      text primary key,               -- e-mail de login (minúsculo); '*' = demais pessoas
  nome       text,
  admin      boolean not null default false,
  modulos    jsonb not null default '{}'::jsonb, -- {"agenda":"ler","clientes":"editar",...}
  updated_at timestamptz not null default now()
);

alter table public.crm_acessos enable row level security;
revoke all on public.crm_acessos from anon;

-- 2) FUNÇÕES QUE DIZEM O QUE CADA UM PODE -----------------------------

-- e-mail de quem está logado
create or replace function public.crm_meu_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt()->>'email',''))
$$;

-- é administrador? (enquanto ninguém for administrador, todos os logados contam como
-- administrador, para o CRM não travar antes de você configurar a lista)
create or replace function public.crm_eh_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when not exists (select 1 from public.crm_acessos where admin and email <> '*') then auth.uid() is not null
    else exists (select 1 from public.crm_acessos where email = public.crm_meu_email() and admin)
  end
$$;

-- nível numa área: 0 = nenhum, 1 = ler, 2 = editar
create or replace function public.crm_nivel(area text) returns int
language plpgsql stable security definer set search_path = '' as $$
declare r public.crm_acessos; v text;
begin
  if auth.uid() is null then return 0; end if;
  if public.crm_eh_admin() then return 2; end if;
  select * into r from public.crm_acessos where email = public.crm_meu_email();
  if not found then select * into r from public.crm_acessos where email = '*'; end if;
  if not found then v := case when area = 'agenda' then 'ler' else 'nenhum' end;
  else v := coalesce(r.modulos->>area, 'nenhum'); end if;
  return case v when 'editar' then 2 when 'ler' then 1 else 0 end;
end $$;

-- o que o CRM usa ao abrir: quem sou e o que posso
create or replace function public.crm_meu_acesso() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r public.crm_acessos; a text; m jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then return null; end if;
  foreach a in array array['painel','agenda','clientes','financeiro','entregas'] loop
    m := m || jsonb_build_object(a, case public.crm_nivel(a) when 2 then 'editar' when 1 then 'ler' else 'nenhum' end);
  end loop;
  select * into r from public.crm_acessos where email = public.crm_meu_email();
  return jsonb_build_object(
    'email', public.crm_meu_email(),
    'nome', r.nome,
    'admin', public.crm_eh_admin(),
    'configurado', exists (select 1 from public.crm_acessos where admin and email <> '*'),
    'modulos', m);
end $$;

-- só para administradores: todo mundo que tem login, com o acesso de cada um
create or replace function public.crm_usuarios() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.crm_eh_admin() then raise exception 'Somente administradores'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('email', e.email, 'tem_login', e.tem_login, 'ultimo_acesso', e.ult,
             'nome', a.nome, 'admin', coalesce(a.admin,false), 'modulos', a.modulos, 'na_lista', a.email is not null)
           order by coalesce(a.admin,false) desc, e.email)
    from (
      select lower(u.email) as email, true as tem_login, max(u.last_sign_in_at) as ult
        from auth.users u where u.email is not null group by lower(u.email)
      union all
      select x.email, false, null from public.crm_acessos x
       where x.email <> '*' and not exists (select 1 from auth.users u where lower(u.email) = x.email)
    ) e left join public.crm_acessos a on a.email = e.email
  ), '[]'::jsonb);
end $$;

-- agenda sem acesso a Clientes: só o necessário para mostrar os eventos
-- (nome do casal, tipo, data, local, etapa, o que foi contratado) — sem valores nem contatos
create or replace function public.crm_agenda_clientes() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if public.crm_nivel('agenda') < 1 then return '[]'::jsonb; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', j->'id', 'couple', j->'couple', 'stage', j->'stage',
             'event_type', j->'event_type', 'event_date', j->'event_date', 'venue', j->'venue',
             'servicos', j->'servicos', 'marcos', j->'marcos', 'created_at', j->'created_at'))
    from (select to_jsonb(c) as j from public.crm_clients c where c.event_date is not null) s
  ), '[]'::jsonb);
end $$;

revoke all on function public.crm_eh_admin(), public.crm_nivel(text), public.crm_meu_acesso(),
                       public.crm_usuarios(), public.crm_agenda_clientes() from public, anon;
grant execute on function public.crm_meu_email(), public.crm_eh_admin(), public.crm_nivel(text),
                          public.crm_meu_acesso(), public.crm_usuarios(), public.crm_agenda_clientes() to authenticated;

-- 3) QUEM PODE MEXER NA LISTA DE ACESSOS --------------------------------

drop policy if exists "acessos ler"   on public.crm_acessos;
drop policy if exists "acessos admin" on public.crm_acessos;
create policy "acessos ler"   on public.crm_acessos for select to authenticated
  using (email = (select public.crm_meu_email()) or (select public.crm_eh_admin()));
create policy "acessos admin" on public.crm_acessos for all to authenticated
  using ((select public.crm_eh_admin())) with check ((select public.crm_eh_admin()));

-- 4) TROCA AS REGRAS "TODO LOGADO PODE TUDO" PELAS REGRAS POR ÁREA ------
--    (para cada tabela: ler precisa de nível 1; criar/alterar/apagar, nível 2)

create or replace function pg_temp.regras(tabela text, ler text, editar text) returns void
language plpgsql as $$
begin
  if to_regclass('public.'||tabela) is null then return; end if;  -- script daquela parte ainda não rodado
  execute format('drop policy if exists %I on public.%I', 'auth all '||tabela, tabela);
  execute format('drop policy if exists %I on public.%I', 'acesso ler '||tabela, tabela);
  execute format('drop policy if exists %I on public.%I', 'acesso criar '||tabela, tabela);
  execute format('drop policy if exists %I on public.%I', 'acesso alterar '||tabela, tabela);
  execute format('drop policy if exists %I on public.%I', 'acesso apagar '||tabela, tabela);
  execute format('create policy %I on public.%I for select to authenticated using (%s)', 'acesso ler '||tabela, tabela, ler);
  execute format('create policy %I on public.%I for insert to authenticated with check (%s)', 'acesso criar '||tabela, tabela, editar);
  execute format('create policy %I on public.%I for update to authenticated using (%s) with check (%s)', 'acesso alterar '||tabela, tabela, editar, editar);
  execute format('create policy %I on public.%I for delete to authenticated using (%s)', 'acesso apagar '||tabela, tabela, editar);
end $$;

select pg_temp.regras('crm_clients',    '(select public.crm_nivel(''clientes'')) >= 1', '(select public.crm_nivel(''clientes'')) >= 2');
select pg_temp.regras('crm_historico',  '(select public.crm_nivel(''clientes'')) >= 1', '(select public.crm_nivel(''clientes'')) >= 2');
select pg_temp.regras('crm_events',     '(select public.crm_nivel(''agenda'')) >= 1',   '(select public.crm_nivel(''agenda'')) >= 2');
select pg_temp.regras('crm_deliveries', '(select public.crm_nivel(''entregas'')) >= 1 or (select public.crm_nivel(''agenda'')) >= 1',
                                        '(select public.crm_nivel(''entregas'')) >= 2');
select pg_temp.regras('crm_tasks',      '(select public.crm_nivel(''painel'')) >= 1',   '(select public.crm_nivel(''painel'')) >= 2');
select pg_temp.regras('crm_payments',   '(select public.crm_nivel(''financeiro'')) >= 1', '(select public.crm_nivel(''financeiro'')) >= 2');
select pg_temp.regras('cx_meses',       '(select public.crm_nivel(''financeiro'')) >= 1', '(select public.crm_nivel(''financeiro'')) >= 2');
select pg_temp.regras('cx_movimentos',  '(select public.crm_nivel(''financeiro'')) >= 1', '(select public.crm_nivel(''financeiro'')) >= 2');
select pg_temp.regras('cx_contas',      '(select public.crm_nivel(''financeiro'')) >= 1', '(select public.crm_nivel(''financeiro'')) >= 2');
select pg_temp.regras('cx_historico',   '(select public.crm_nivel(''financeiro'')) >= 1', '(select public.crm_nivel(''financeiro'')) >= 2');
-- configurações (e-mail do Google Agenda, catálogo): todos leem; altera quem edita Agenda ou Clientes
select pg_temp.regras('crm_settings',   'true',
                      '(select public.crm_nivel(''agenda'')) >= 2 or (select public.crm_nivel(''clientes'')) >= 2');

-- 5) QUEM É QUEM ------------------------------------------------------
--    TROQUE os e-mails abaixo pelos e-mails de login de cada pessoa ANTES de rodar.
--    (Depois dá para mudar tudo pela tela Acessos do CRM, no menu do avatar.)
--    A pessoa precisa ter login criado em Authentication › Users › Add user.

insert into public.crm_acessos (email, nome, admin, modulos) values
  ('*', 'Demais pessoas', false, '{"agenda":"ler"}'),
  (lower('EMAIL_DA_BEATRIZ'), 'Beatriz', true, '{}'),
  (lower('EMAIL_DO_PEDRO'),   'Pedro',   true, '{}'),
  (lower('EMAIL_DA_JULIANA'), 'Juliana', false,
     '{"painel":"editar","agenda":"editar","clientes":"editar","financeiro":"nenhum","entregas":"editar"}')
on conflict (email) do nothing;

-- limpa os exemplos se os e-mails não foram trocados
delete from public.crm_acessos where email like 'email_d%';

-- Fim. Se rodou sem erro em vermelho, os acessos estão valendo.
-- Para conferir: select * from public.crm_acessos;
