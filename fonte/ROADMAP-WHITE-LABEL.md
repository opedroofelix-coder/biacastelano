# Roadmap: CRM white label para fotógrafos e filmmakers de casamento

Objetivo: transformar o CRM da Bia em um produto para vários clientes. Cada cliente recebe o CRM com a
própria marca. O onboarding é simples: **o cliente manda a planilha e o e-mail**, e nós preenchemos
o dashboard, o Caixa e a agenda.

## Decisão de tecnologia

- **CRM da Bia (agora):** continua em HTML + JavaScript puro (`crm/index.html`). Funciona, está no ar
  e recebeu Google Agenda, lembretes automáticos e correções. Reescrever agora só atrasaria a Bia.
- **White label (próximo projeto):** um app novo em **React + Vite + TypeScript**, no mesmo Supabase.
  O motivo é que um arquivo único de 1.900 linhas não escala para vários clientes. Precisamos de:
  - componentes reaproveitáveis (funil, agenda, planilha do caixa, ficha do casal);
  - tema e marca por cliente vindos do banco, não do código;
  - tipos (TypeScript) gerados a partir das tabelas do Supabase, para não quebrar ao mudar o banco;
  - testes automáticos (Vitest + Playwright) antes de cada publicação;
  - build e deploy por cliente ou multi-tenant (Vercel ou Netlify).
- O CRM atual serve de **especificação funcional**: cada tela vira um módulo React com o mesmo comportamento.

### Stack sugerida
React 18 + Vite + TypeScript · React Router · TanStack Query (cache e sincronização com Supabase) ·
Tailwind ou CSS Modules com os tokens de cor atuais · Chart.js ou Recharts · SheetJS (planilhas) ·
Supabase (Auth, Postgres com RLS, Realtime, Edge Functions, Storage).

### Estrutura de pastas
```
src/
  app/            rotas, layout, provedores (auth, tema, org atual)
  modules/
    painel/  agenda/  clientes/  financeiro/  caixa/  entregas/  relacionamento/
    importacao/   configuracoes/
  integrations/   google-calendar.ts, whatsapp.ts, pix.ts
  lib/            supabase.ts, datas.ts, dinheiro.ts (funções puras com teste)
  types/          database.ts (gerado pelo Supabase)
```

### Ordem de migração
1. Base: login, multi-tenant (`org_id`), tema por org, layout.
2. Clientes/funil e ficha do casal.
3. Agenda + Google Agenda (com Edge Function guardando o *refresh token*, assim não precisa reconectar a cada hora).
4. Financeiro e Caixa (a planilha é a parte mais complexa; vale reaproveitar a lógica atual como funções puras).
5. Entregas, tarefas e relacionamento.
6. Importador de planilha e onboarding.
7. Migrar a Bia para o app novo e desligar o `crm/index.html`.

## Melhorias, por prioridade

### 1. Onboarding por planilha + e-mail (essencial para vender)
- **Importador .xlsx/.csv**, com um modelo para baixar (abas: Clientes, Parcelas, Movimentação, Contas fixas).
  Um mapeamento de colunas aceita planilhas no formato que o cliente já usa.
- Prévia antes de importar: o que entra, duplicados (mesmo casal/data) e linhas com erro.
- O importador preenche clientes, data do casamento, valor, parcelas, Caixa e etapa do funil.
  **Os lembretes (álbum aos 3 meses, lembrança de 1 ano, aniversários) saem sozinhos da data**,
  sem preencher nada.
- E-mail do cliente: cria o login, já deixa o e-mail da agenda preenchido e manda o convite.
- Checklist de onboarding no primeiro acesso: conectar a agenda, conferir a importação, definir marca.

### 2. Configuração por cliente (sem mexer em código)
- Nome, logo, cores, fontes e domínio. Hoje "Bia Castelano" está escrito no HTML.
- Etapas do funil, tipos de evento, pacotes, origens dos clientes.
- Categorias do Caixa e regras de categorização automática. Hoje as regras são da Bia
  (nomes de freelas, igreja etc.) e precisam virar configuração.
- Checklist padrão do dia do casamento.
- Prazos e textos dos lembretes de relacionamento (álbum, lembrança de 1 ano, pedido de depoimento).
- Tudo isso em `crm_settings` por organização.

### 3. Multi-tenant e segurança
- Coluna `org_id` em todas as tabelas, com RLS por organização. Hoje qualquer usuário logado vê tudo,
  o que serve para uma empresa só.
- Usuários e papéis: dona, assistente (sem ver valores) e editor (só entregas).
- Histórico de alterações em todas as áreas (hoje só no Caixa).
- Backup automático e exportação completa (Excel/JSON) por cliente.

### 4. Agenda
- **Verificação do app no Google:** o escopo de agenda é "sensível". Para sair do modo de teste
  (limite de 100 usuários e aviso de "app não verificado"), é preciso pedir a verificação: política
  de privacidade, domínio e vídeo do fluxo.
- Refresh token numa Edge Function, para sincronizar em segundo plano sem reconectar a cada hora.
- Escolher qual calendário sincronizar (ex.: um calendário "Casamentos" separado).
- Opção Outlook/Microsoft 365 e iCal (só leitura) para quem não usa Google.
- Detectar conflito de data ao fechar um casamento (já tem evento naquele dia?).

### 5. Relacionamento e automações
- Envio automático (ou com 1 clique) por WhatsApp/e-mail dos lembretes de álbum, lembrança de 1 ano e
  aniversário, com modelos de mensagem editáveis. Precisa de uma Edge Function agendada.
- Pedido de depoimento depois da entrega, já ligado ao site (tabela `testimonials`).
- Sequência pós-lead: lembrete de follow-up se a proposta ficar X dias sem resposta.
- Lembrete de parcela vencendo, para o cliente e para o casal.

### 6. Comercial e financeiro
- Proposta e contrato em PDF com os dados do casal, assinatura eletrônica.
- Link de pagamento/Pix por parcela, com baixa automática no Caixa.
- Portal do casal: parcelas, cronograma, galeria e álbum.
- Relatórios: taxa de conversão do funil, origem que mais fecha, ticket médio por ano.

### 7. Experiência
- PWA instalável no celular, com notificações.
- Funil por toque no celular (hoje arrastar só funciona com mouse; no celular, a etapa muda pela ficha).
- Busca global (cliente, e-mail, telefone, lançamento).
- Modo escuro já existe; manter nos temas por cliente.

### 8. Produto/negócio
- Planos e cobrança recorrente (Stripe ou Asaas), período de teste.
- Página de vendas e cadastro self-service, sem precisar de nós para criar a conta.
- Painel interno nosso: clientes ativos, uso e saúde da importação.
- Termos de uso, política de privacidade e LGPD (exportar e apagar dados do casal a pedido).
