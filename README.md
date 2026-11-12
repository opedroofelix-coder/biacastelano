# Site — Bia Castelano

Site da fotógrafa **Bia Castelano** (fotografia e filme de casamento) com painel de edição próprio.
Site estático (HTML + JavaScript) que lê o conteúdo de um backend **Supabase** e continua funcionando
com conteúdo de exemplo mesmo se o banco estiver fora do ar.

- **Site no ar:** https://biacastelano.com.br/
- **Painel de edição:** https://biacastelano.com.br/admin/
- **CRM (clientes, agenda, financeiro, entregas):** https://biacastelano.com.br/crm/

## Estrutura

```
index.html            → o site (pronto pra publicar)
admin/index.html      → painel de edição (login por e-mail/senha via Supabase)
crm/index.html        → CRM da Bia (mesmo login do painel; dados privados)
.nojekyll             → diz ao GitHub Pages para servir os arquivos como estão
netlify.toml          → configuração da Netlify (mantida caso você volte pra lá)
COMO-PUBLICAR.txt     → passo a passo rápido de publicação
fonte/                → tudo que gera o site (não é necessário pra publicar)
  build_site.py       → gera o index.html a partir do site_full + fotos de exemplo
  site_full/index.html→ HTML/CSS de origem do site
  single_img/         → fotos de exemplo (embutidas no build)
  supabase/           → scripts SQL do banco (rodar no SQL Editor do Supabase)
```

## Como publicar (GitHub Pages)

A publicação é automática: o workflow `.github/workflows/pages.yml` roda a cada
push na `main` e publica a raiz do repositório. **Mas o Pages precisa ser ligado
uma única vez, à mão** — o token do Actions não tem permissão para criar o site
sozinho (ele falha com *"Resource not accessible by integration"*).

Para ligar, uma vez só:

1. No GitHub, abra este repositório → **Settings** → **Pages**.
2. Em *Build and deployment* → *Source*, escolha **GitHub Actions**.
   (Não escolha "Deploy from a branch": este repositório publica pelo workflow.)
3. Pronto. O próximo push na `main` publica o site. Para publicar sem esperar um
   push, vá em *Actions* → *Publicar no GitHub Pages* → *Run workflow*.

O site fica em `https://opedroofelix-coder.github.io/biacastelano/`.
Depois de publicar, dê **Ctrl+F5** pra ver a versão nova.

Como o site fica numa subpasta (`/biacastelano/`), todos os links internos são
relativos (`../admin/`, `../crm/`). Não use caminhos começando com `/` — eles
apontariam para fora do site.

Para usar um endereço próprio (ex.: `biacastelano.com.br`), é em *Settings → Pages
→ Custom domain*; aí o site passa a ficar na raiz do domínio.

## Backend (Supabase)

- Projeto: `ufacszuqskvgpmcjyaqi` — https://ufacszuqskvgpmcjyaqi.supabase.co
- A chave usada no site é a **publishable** (pode ficar pública, é feita pra isso).
- Tabelas: `site_settings`, `albums`, `testimonials`, `films`. Storage: bucket público `fotos`.
- Scripts em `fonte/supabase/` (rodar no **SQL Editor** do Supabase quando indicado).
  O `add_hero_video.sql` cria o campo do vídeo de abertura e libera envio de vídeo (até 50 MB).
  O `add_stats.sql` cria a lista de **Números** (quantos quiser; sem ele o painel salva só os 3 primeiros).

## CRM (`/crm`)

Clientes em funil (arrastar entre etapas), agenda mensal, parcelas e faturamento, entregas com
progresso e tarefas. Usa o mesmo login do `/admin`.

- **Antes do primeiro uso:** rode `fonte/supabase/crm_setup.sql` no SQL Editor do Supabase.
- **Tipos Corporativo e Jantar:** rode `fonte/supabase/tipos_evento.sql` uma vez. Na agenda, casamento fica
  em vermelho, corporativo em azul e ensaio / pré-wedding / jantar em marrom; aniversários e lembretes
  aparecem só com contorno.
- **O que foi contratado:** plano (Foto, Vídeo) + adicionais (Pré-wedding, Drone, Álbum, Same day).
  Quem já tem Álbum marcado não recebe o lembrete "Oferecer o álbum".
- **Etapa Aguardando sinal** no funil (entre Proposta e Contratado): rode `fonte/supabase/etapa_sinal.sql`.
  Fica ligada à planilha: contrato assinado → Aguardando sinal; data do sinal preenchida → Contratado.
- **Catálogo** (Clientes › Catálogo): planos, adicionais e valores para consulta rápida; fica em
  `crm_settings` (chave `catalogo`).
- **Datas pela regra:** pagamento final 15 dias antes do evento e multa 90 dias antes (ajustável em
  `CONFIG` no `crm/index.html`). Calcula sozinho ao mudar a data; não sobrescreve data digitada à mão.
- Tabelas: `crm_clients`, `crm_events`, `crm_payments`, `crm_deliveries`, `crm_tasks` —
  **sem leitura pública** (só quem está logado vê os dados).
- Data do evento do cliente, prazos de entrega, vencimentos de parcela e aniversários de casamento
  aparecem sozinhos na agenda — não precisa cadastrá-los duas vezes.

### Acessos por pessoa (tela Acessos do CRM)

Cada login vê só as áreas liberadas: **Painel, Agenda, Clientes (inclui o valor dos contratos), Financeiro
(parcelas, recebimentos e Caixa) e Entregas**, cada uma com **Editar**, **Ler** ou **Nenhum**. Administradores
têm acesso total e veem a tela **Acessos** (no menu e no avatar), onde mudam isso tudo.

- Rode `fonte/supabase/acessos_setup.sql` no SQL Editor (depois dos outros scripts do CRM). Antes, troque
  no fim do script os e-mails de exemplo pelos e-mails de login da Beatriz, do Pedro e da Juliana.
- Começa assim: Beatriz e Pedro administradores; Juliana edita tudo menos o Financeiro (parcelas, recebimentos
  e Caixa somem para ela), mas vê e preenche o valor dos contratos em Clientes, pois cuida dos leads;
  **Demais pessoas** (quem tem login e não está na lista) só leem a Agenda.
- A trava fica no banco (RLS): mesmo pelo navegador, ninguém lê ou grava o que não foi liberado. Quem só lê a
  Agenda recebe dos casais apenas nome, tipo, data, local, etapa e o que foi contratado (sem valores nem contatos).
- Enquanto ninguém estiver marcado como administrador, todos os logados têm acesso total (para o CRM não travar).
- Logins são criados pela própria tela Acessos (veja *Criar logins pelo CRM* abaixo). Também dá para criar no
  Supabase, em *Authentication › Users › Add user*.
- Tabela nova: `crm_acessos`. Funções: `crm_nivel`, `crm_meu_acesso`, `crm_usuarios`, `crm_agenda_clientes`.
- **Painel do site (`/admin`) só para administradores:** rode `fonte/supabase/site_admin.sql` (depois do
  `acessos_setup.sql`). Só quem é administrador grava textos, álbuns, depoimentos, filmes e fotos/vídeos; quem não
  é vê um aviso ao entrar no `/admin`. O site continua público para leitura. Se rodar o `setup.sql` de novo,
  rode o `site_admin.sql` logo depois (o `setup.sql` recria a permissão antiga).

### Criar logins pelo CRM (Edge Function `crm-usuarios`)

Na tela Acessos, o administrador digita e-mail, nome e uma **senha inicial** (ou clica em *gerar*) e clica em
**Criar login**. Cada linha tem **trocar senha** (ou **criar login**, para quem está na lista sem login).
Quem cria o login é uma Edge Function do Supabase, onde fica a chave de administrador do banco (service role):
essa chave nunca aparece no CRM. A função só atende administradores.

**Publicar a função (uma vez):**

1. Supabase › **Edge Functions** › **Deploy a new function** › **Via Editor**.
2. Nome: `crm-usuarios` (exatamente assim).
3. Apague o exemplo e cole todo o conteúdo de `fonte/supabase/functions/crm-usuarios/index.ts`.
4. Clique em **Deploy function**.
5. Se ao criar um login aparecer *Invalid JWT*: na função, abra **Details** e desligue
   **Verify JWT with legacy secret**, salve e tente de novo (a função confere sozinha se quem pediu é administrador).

Novos logins entram com o acesso de *Demais pessoas*; ajuste na linha da pessoa e clique em Salvar.
A senha precisa ter pelo menos 8 caracteres. Passe a senha para a pessoa por um canal privado.

### CRM como app no computador (PWA)

O CRM pode ser instalado como app: no Chrome ou no Edge, abra o `/crm`, clique no ícone de instalar
na barra de endereço (ou no avatar BC › "Instalar o CRM no computador") e confirme. Ele ganha ícone
na área de trabalho/menu Iniciar e abre em janela própria, sem a barra do navegador.

- Arquivos: `crm/manifest.webmanifest`, `crm/sw.js` e `crm/icons/` (escopo só do `/crm`).
- A página vem sempre da rede (publicações novas aparecem ao reabrir); sem internet, abre a última
  versão salva. Dados do Supabase e do Google nunca ficam guardados no service worker.
- Ao mudar `crm/sw.js`, suba o número em `VERSAO` para limpar o que ficou salvo.

### Controle de clientes (aba Clientes do CRM)

A aba Clientes tem quatro seções: Funil, Contratos e prazos (próximos prazos, totais, etapa de cada
cliente, agenda de casamentos e valor por plano), Planilha (contrato, sinal de 20%, agenda, pagamento
final e multa, editáveis na célula, com exportação para Excel) e Histórico (com desfazer).
Substitui o antigo artifact "Controle de clientes".

- Rode `fonte/supabase/controle_setup.sql` no SQL Editor (depois do `crm_setup.sql`). Ele só
  acrescenta colunas em `crm_clients` e cria `crm_historico`; nada existente é apagado.
- O que cada casal contratou (Foto, Vídeo, Ensaio, Vídeo no ensaio) fica na ficha e em Agenda ›
  Próximos casamentos, com filtro. Requer `fonte/supabase/servicos_setup.sql`.
- Entram no controle os clientes a partir de Proposta enviada no funil. Contrato marcado como
  Assinado na planilha leva o cliente para Contratado.

### Caixa da empresa (aba Caixa do CRM)

Painel (entradas × saídas, categorias, previsão de 6 meses, a receber, lucro por casamento,
conferência do saldo do banco) e Planilha (movimentação mensal, pagamentos dos casais, contas fixas,
histórico com desfazer). Substitui o antigo artifact "Caixa da empresa".

- Ordem dos scripts no SQL Editor: `crm_setup.sql` → `caixa_setup.sql` → arquivo de importação.
- O arquivo de importação com os dados reais **não fica neste repositório** (o repo é público).
- Os casais do caixa são os clientes do CRM em Contratado, Em edição ou Entregue.
- Marcar uma parcela como paga no Financeiro lança a entrada no Caixa, ligada ao casal.
- Tabelas: `cx_meses`, `cx_movimentos`, `cx_contas`, `cx_historico` (sem leitura pública).
  Com o tempo real ativado, o CRM se atualiza sozinho quando outra pessoa edita.

### Google Agenda no CRM (aba Agenda)

A Bia digita o e-mail da agenda e clica em **Conectar**. A partir daí, os eventos do Google Agenda
(de 3 meses atrás até 18 meses à frente) aparecem na agenda e no painel do CRM, junto com casamentos,
reuniões, parcelas e entregas. Clicar num evento do Google mostra os detalhes e um link para abri-lo no Google.

**É só leitura:** o CRM pede ao Google apenas permissão para *ver* os eventos
(`calendar.events.readonly`) e nunca cria, altera ou apaga nada na agenda. Compromissos e casamentos
cadastrados no CRM ficam só no CRM.

A conexão vale 1 hora por segurança (é o padrão do Google para sites sem servidor). Ao abrir a Agenda,
o CRM reconecta sozinho, e se o navegador bloquear basta clicar em **Reconectar**. O botão **Atualizar**
puxa os eventos de novo.

**Configuração (uma vez só):**

1. Rode `fonte/supabase/agenda_setup.sql` no SQL Editor do Supabase (depois do `crm_setup.sql`).
2. Em https://console.cloud.google.com crie um projeto (ex.: "CRM Bia").
3. *APIs e serviços › Biblioteca* → ative a **Google Calendar API**.
4. *APIs e serviços › Tela de consentimento OAuth* → tipo **Externo**, nome do app, e-mail de suporte.
   Em **Usuários de teste**, adicione o e-mail da Bia. Enquanto o app estiver "Em teste", o Google
   mostra o aviso "app não verificado": clique em *Continuar*.
5. *APIs e serviços › Credenciais › Criar credenciais › ID do cliente OAuth* → **Aplicativo da Web**.
   Em *Origens JavaScript autorizadas*, coloque `https://opedroofelix-coder.github.io`
   (e o domínio próprio, se houver). Não precisa de URI de redirecionamento.
6. Copie o **ID do cliente** (termina em `.apps.googleusercontent.com`) e cole em `crm/index.html`,
   no bloco `CONFIG`, campo `googleClientId`. Esse ID é público, pode ficar no repositório.

Tabela nova: `crm_settings` (e-mail da agenda). As colunas `gcal_id` criadas pelo script ficam
reservadas para uma futura sincronização nos dois sentidos e hoje não são usadas.

### Lembretes de relacionamento (automáticos)

Para cada casamento contratado, o CRM calcula sozinho, a partir da data do casamento:

- **Oferecer o álbum:** 3 meses depois do casamento;
- **Lembrança de 1 ano:** 15 dias antes do 1º aniversário de casamento (tempo para o presente chegar);
- **Aniversários de casamento:** todo ano.

Eles aparecem no Painel (card *Relacionamento*), na Agenda e na linha do tempo da ficha do casal, com
os botões **feito** e **pular**. Nada é digitado: se a data do casamento mudar, os lembretes mudam
junto. Os prazos ficam no bloco `CONFIG` (`albumMeses`, `presenteDiasAntes`). A coluna
`crm_clients.marcos` guarda só o que já foi feito ou pulado.

## Regenerar o site (opcional)

Só é preciso se você mexer no `fonte/site_full/index.html`:

```bash
cd fonte
python3 build_site.py       # gera fonte/build/index.html
cp build/index.html ../index.html
```

O painel (`admin/index.html`) é editado direto, não passa pelo build.
