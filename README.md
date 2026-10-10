# Site — Bia Castelano

Site da fotógrafa **Bia Castelano** (fotografia e filme de casamento) com painel de edição próprio.
Site estático (HTML + JavaScript) que lê o conteúdo de um backend **Supabase** e continua funcionando
com conteúdo de exemplo mesmo se o banco estiver fora do ar.

- **Site no ar:** https://opedroofelix-coder.github.io/biacastelano/
- **Painel de edição:** https://opedroofelix-coder.github.io/biacastelano/admin/
- **CRM (clientes, agenda, financeiro, entregas):** https://opedroofelix-coder.github.io/biacastelano/crm/

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

## CRM (`/crm`)

Clientes em funil (arrastar entre etapas), agenda mensal, parcelas e faturamento, entregas com
progresso e tarefas. Usa o mesmo login do `/admin`.

- **Antes do primeiro uso:** rode `fonte/supabase/crm_setup.sql` no SQL Editor do Supabase.
- Tabelas: `crm_clients`, `crm_events`, `crm_payments`, `crm_deliveries`, `crm_tasks` —
  **sem leitura pública** (só quem está logado vê os dados).
- Data do evento do cliente, prazos de entrega, vencimentos de parcela e aniversários de casamento
  aparecem sozinhos na agenda — não precisa cadastrá-los duas vezes.

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

A Bia digita o e-mail da agenda e clica em **Conectar**. A partir daí:

- os eventos do Google Agenda (de 3 meses atrás até 18 meses à frente) aparecem na agenda do CRM;
- compromissos criados ou editados no CRM vão para o Google, e os apagados saem de lá;
- casamentos **contratados** (Contratado, Em edição, Entregue) com data entram no Google como evento de dia inteiro.
  Se a data muda, o evento muda junto. Se o cliente volta para o funil ou é excluído, o evento sai;
- um evento que só existe no Google pode ser editado pelo CRM e, se quiser, ligado a um cliente.

A conexão vale 1 hora por segurança (é o padrão do Google para sites sem servidor). Ao abrir a Agenda,
o CRM reconecta sozinho, e se o navegador bloquear basta clicar em **Reconectar**. Nada se perde
enquanto está desconectado: a próxima sincronização envia o que mudou.

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

Tabela nova: `crm_settings` (e-mail da agenda). Colunas novas: `gcal_id` em `crm_events` e
`crm_clients` (ligação com o evento do Google).

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
