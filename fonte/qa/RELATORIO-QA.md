# Relatório de QA: site, painel (/admin) e CRM (/crm)

Data: 06/11/2026 · Ferramenta: Playwright (Chromium) · Viewports: 1366×800, 1440×900, iPhone 13 (390×664), 320, 360 e 414 px

## Status das correções

Os 16 bugs foram corrigidos em quatro commits, um por nível de severidade. Todas as baterias de `fonte/qa/`
foram rodadas de novo depois de cada commit.

| Commit | Bugs |
|---|---|
| Crítico | BUG-01 |
| Alto | BUG-02, BUG-03 |
| Médio | BUG-04 a BUG-10 |
| Baixo | BUG-11 a BUG-16 |

**Sobre "Ligia e Esdras" em Filmes:** o título aparece duas vezes, mas não é duplicado. São dois filmes
diferentes do mesmo casal: o **Pré wedding**, ainda sem link do YouTube, e o **Short Filme**, com link. No
site, o pré-wedding mostra "Este filme ainda não está disponível online" até receber o link. O painel agora
exige um link do YouTube válido para salvar um filme; então, para editar o pré-wedding pelo painel, é
preciso colar o link dele.

As 12 sugestões de UX abaixo também foram feitas. A maioria entrou junto com as correções dos bugs; as 7, 8 e 10 e o restante das 1 e 2 (prévia do valor ao digitar e CRM sem salvar enquanto os dados não carregaram) vieram depois, num PR próprio.

## Como foi testado

| Área | Backend usado | Observação |
|---|---|---|
| Site público (`/`) | **Supabase real**, só leitura | Também testado com o Supabase fora do ar e com o CDN bloqueado |
| Painel (`/admin`) | **Supabase simulado** (`mock.js`) | Não há credenciais de teste, e os dados reais não podiam ser alterados |
| CRM (`/crm`) | **Supabase simulado** (`mock.js`) | O simulador aplica as mesmas regras do banco: NOT NULL, CHECK, tipos numérico/data e chave estrangeira |

O simulador intercepta `*.supabase.co` (login, REST, storage e realtime) e roda com o `supabase-js` real
do CDN. Ele também permite simular falhas de leitura e de gravação.

**Console e rede:** nenhum erro de JavaScript da aplicação em nenhuma página. Os únicos erros e requisições
com falha vêm do player do YouTube (telemetria `log_event` 403, `qoe` abortado, miniaturas `ytimg`). São
de terceiros e não afetam o uso. Nenhuma página tem rolagem horizontal em 320, 360, 390 ou 414 px.

Para repetir a bateria: `python3 -m http.server 8080` na raiz do repositório e, em outro terminal,
`node fonte/qa/site.js` (ou `site-mobile.js`, `admin.js`, `crm1.js`, `crm2.js`, `crm4.js`). As capturas de tela vão para `fonte/qa/saida/`.

---

## Bugs encontrados

### BUG-01 · CRÍTICO · CRM grava valores em reais errados quando digitados no formato brasileiro
**Onde:** formulários "Novo cliente" (Valor do contrato) e "Nova parcela" (Valor). `crm/index.html:1667` com `<input type="number">`.

**Passos:** Novo → Cliente/casal → Casal "Teste" → Valor do contrato `1.500` → Salvar.

| Digitado | Esperado | Salvo |
|---|---|---|
| `1.500` | R$ 1.500,00 | **R$ 1,50** |
| `2.000` | R$ 2.000,00 | **R$ 2,00** |
| `1500,50` | R$ 1.500,50 | **R$ 150.050,00** |
| `1.500,50` | R$ 1.500,50 | **R$ 1,50** (o campo vira `1.50050`) |

**Esperado:** aceitar o formato brasileiro, ou recusar com uma mensagem. **Obtido:** grava em silêncio e mostra "salvo".
Isso afeta o "a receber", o ticket médio, o funil e o Caixa. Os valores ficam ocultos por padrão (olho), então o erro passa despercebido.

### BUG-02 · ALTO · Planilha do Caixa lê "1.500" como R$ 1,50 e apaga valores inválidos sem avisar
**Onde:** Caixa › Planilha › coluna Entrada/Saída. Função `parseNum`, `crm/index.html:1778`.

**Passos:** Caixa → Planilha → Adicionar lançamento → Entrada `1.500` → Tab.

**Esperado:** R$ 1.500,00. **Obtido:** R$ 1,50. `1.500,50` e `1500,50` funcionam. `abc` e `0` viram vazio sem nenhuma mensagem.

### BUG-03 · ALTO · Painel: se os textos não carregarem, "Salvar" apaga o conteúdo do site
**Onde:** `/admin` › aba Textos. `admin/index.html:640` (`S = r.data || {id:1}` ignora `r.error`).

**Passos:** entrar no painel numa conexão instável, em que a leitura de `site_settings` falha, e clicar em "Salvar textos & fotos".

**Esperado:** avisar que não carregou e bloquear o salvamento. **Obtido:** o formulário aparece vazio e sem nenhum aviso. Ao salvar,
Propósito, Sobre, Números, WhatsApp, Instagram, e-mail e fotos ficam vazios no banco e saem do site no ar.
(No teste, depois de salvar: `whatsapp=""`, `proposito=[]`, `stats=[]`.)

### BUG-04 · MÉDIO · Painel e CRM mostram "vazio" quando, na verdade, deu erro ao carregar
- **Painel:** a falha ao ler álbuns, depoimentos ou filmes mostra "Nenhum álbum ainda. Clique em + Novo álbum", sem aviso (`admin/index.html:715, 873, 922`). A Bia pode recriar álbuns que já existem.
- **CRM:** a falha ao ler `crm_clients` mostra um toast de 3 s e depois um painel vazio ("nada agendado hoje") (`crm/index.html:1169`).

**Esperado:** um aviso fixo com botão "Tentar de novo".

### BUG-05 · MÉDIO · Site: duplo clique na capa de um álbum abre também uma foto
**Passos:** Histórias → duplo clique numa capa.

**Esperado:** abrir só a grade do álbum. **Obtido:** o 1º clique abre o álbum e o 2º cai na foto que ficou sob o cursor, abrindo o visor.
Com dois cliques muito rápidos, entram duas entradas no histórico. O X fecha o álbum, mas a rolagem não volta ao ponto
onde a pessoa estava, `history.scrollRestoration` fica preso em `manual` e o botão Voltar seguinte não faz nada visível
(`index.html:669` e `empilharHistorico`).

### BUG-06 · MÉDIO · Site: duplo clique numa foto do álbum abre e fecha o visor na hora
**Passos:** abrir um álbum → duplo clique numa foto. **Esperado:** visor aberto. **Obtido:** o 2º clique cai no fundo do visor (`index.html:1087`) e o fecha. No mouse, parece que "a foto não abre".

### BUG-07 · MÉDIO · Site: sem o banco, os botões de contato não funcionam
**Passos:** abrir o site com o Supabase indisponível (fora do ar ou bloqueado) → Contato → WhatsApp.

**Esperado:** WhatsApp, Instagram e e-mail funcionando, porque o resto do site tem conteúdo de exemplo. **Obtido:** os 6 links
(contato e rodapé) trocam o texto para "a definir" e não fazem nada. A visitante não tem como chamar a Bia.

### BUG-08 · MÉDIO · Site: filme sem link mostra texto de desenvolvimento para a visitante
**Passos:** Filmes → 2º card ("Ligia e Esdras" · Pré wedding, ainda sem link do YouTube).

**Obtido:** o modal mostra "No site final, publicado no domínio de vocês, o vídeo do YouTube toca embutido aqui dentro da página." e
o botão "Assistir no YouTube", que ao toque vira "a definir" (`index.html:583`).

### BUG-09 · MÉDIO · Painel aceita conteúdo inválido que quebra o site
| Entrada | Resultado no site |
|---|---|
| Álbum sem título e sem fotos | Salvo ("álbum salvo ✓"). Some do site porque não tem fotos, e no painel aparece "(sem título)" |
| Depoimento todo em branco | Salvo. Aparece no site como card de depoimento vazio |
| Link do YouTube `nao é um link` | Salvo. O filme abre com o texto de desenvolvimento do BUG-08 |
| WhatsApp `abc`, e-mail `nao-e-email` | Salvos. Os botões de contato do site ficam quebrados (`wa.me/?text=…`, `mailto:nao-e-email`) |
| Arquivo `.txt` no campo de fotos (escolhendo "Todos os arquivos") | Enviado ao storage e incluído no álbum como foto quebrada |
| Ordem `99999999999` | Enviado ao banco. Provavelmente estoura o tipo `int`, com erro técnico em inglês (não confirmado no banco real) |

### BUG-10 · MÉDIO · CRM aceita valores fora do domínio
Todos os casos abaixo foram salvos sem aviso:
- Valor do contrato `-5000`
- Parcela de `-300`
- Parcela "paga em" 01/01/2030
- Parcela de R$ 0 sem cliente
- E-mail `nao-email` e WhatsApp `abc`
- Data do casamento em 1900

A parcela negativa marcada como paga entrou no Caixa como **entrada negativa** ("Parcela - parcela", −300).

### BUG-11 · BAIXO · Alterações descartadas sem aviso
- CRM: clicar fora do formulário (no fundo escuro) fecha o modal e perde o que foi digitado (`crm/index.html:1659`).
- Painel: com um álbum em edição, clicar em "Editar" noutro álbum troca o editor e descarta as mudanças. Fechar a aba também não avisa.

### BUG-12 · BAIXO · CRM: busca não ignora acentos
"theo" não encontra "Helena & Théo" (`crm/index.html:1390`). O Caixa já tem uma função `norm()` que remove acentos, mas a busca do topo não a usa.

### BUG-13 · BAIXO · CRM: nome longo sem espaços estoura o card do funil
Um nome de 300 caracteres sem espaço (por exemplo, um e-mail ou link colado) ocupa 3574 px num card de 188 px.

### BUG-14 · BAIXO · Mensagem de login em inglês
Com senha errada, o painel e o CRM mostram "Não foi possível entrar: **Invalid login credentials**".

### BUG-15 · BAIXO · Acessibilidade
- Cards de **filme** não recebem foco pelo teclado. É um `<article>` com `onclick`, sem `tabindex` nem `role` (`index.html:690`). Os álbuns já têm.
- A foto do visor tem `alt=""` (`index.html:566`).
- As bolinhas dos depoimentos no celular medem 14×26 px, abaixo dos 44×44 px recomendados.
- O botão Menu do celular não informa `aria-expanded`.

### BUG-16 · BAIXO · CRM: duplo clique em "marcar pago" faz duas gravações
São enviados dois `PATCH` e dois recarregamentos. O Caixa não duplicou o lançamento, porque a sincronização deduplica, mas o botão não fica desabilitado enquanto salva.

---

## O que passou ✅
- **Site:**
  - Navegação do menu (desktop e celular).
  - Filtros Todos / Pré-Wedding / Wedding.
  - Álbum, visor, setas, teclado (← → Esc), swipe e botão Voltar do aparelho (fecha a foto e depois o álbum).
  - Modal de filme: Esc, fundo, X (remove o iframe) e "Quero este filme".
  - Carrossel de depoimentos.
  - Tema claro/escuro persistente.
  - Conteúdo de exemplo quando o banco ou o CDN caem.
  - Sem rolagem horizontal em 320–414 px.
- **Painel:**
  - Login: vazio, e-mail inválido, senha errada, e-mail com espaços, sessão após recarregar.
  - Duplo clique em salvar (textos e álbum) não duplica.
  - Upload gera foto + miniatura.
  - Excluir pede confirmação.
  - HTML em títulos é escapado.
  - Sair.
  - Layout do celular.
- **CRM:**
  - Login, incluindo duplo clique em Entrar (1 requisição).
  - Campos obrigatórios (nome, data do compromisso, valor da parcela), inclusive nome só com espaços.
  - Duplo clique e Enter duplo não duplicam.
  - Erro de gravação mantém o formulário aberto com a mensagem.
  - Arrastar no funil, com reversão se falhar.
  - Ficha: checklist recusa item vazio; excluir pede confirmação.
  - Progresso de entrega limitado a 100.
  - XSS no nome do casal escapado.
  - Todas as abas sem erro e sem rolagem horizontal no desktop e no celular.

---

## Sugestões de melhoria de UX

1. **Campos de dinheiro (corrige BUG-01/02):** trocar `type="number"` por `type="text" inputmode="decimal"`, com uma única função de leitura BR (ponto = milhar, vírgula = decimal) e máscara "R$ 1.500,00" ao sair do campo. Mostrar o valor interpretado ao lado antes de salvar.
2. **Erro de carregamento ≠ lista vazia:** faixa fixa "Não foi possível carregar · Tentar de novo" e botões de salvar desabilitados até carregar (corrige BUG-03/04).
3. **Validação com mensagem no próprio campo:** e-mail, WhatsApp (só dígitos, 10–13), link do YouTube (reaproveitar `ytId()`), valores ≥ 0, "pago em" não futuro, datas entre 2000 e 2100. No painel, exigir título e ao menos 1 foto no álbum, e texto e @ no depoimento.
4. **Proteger cliques repetidos no site:** ignorar cliques por ~300 ms depois de abrir o álbum ou o visor, e só fechar o visor pelo fundo quando o clique começar e terminar no fundo (corrige BUG-05/06).
5. **Contato à prova de falha:** colocar WhatsApp, Instagram e e-mail reais no `FALLBACK` do site e esconder "Assistir no YouTube" e a nota de desenvolvimento quando o filme não tem link.
6. **Proteger rascunhos:** perguntar "Descartar alterações?" ao fechar ou trocar com dados digitados (formulários do CRM, editores do painel) e usar `beforeunload` no painel.
7. **Visor de fotos:** a foto grande pesa em média ~830 KB. Mostrar a miniatura borrada ou um spinner enquanto carrega (hoje a tela fica escura alguns instantes ao avançar) e pré-carregar a próxima foto.
8. **Funil no celular:** arrastar não funciona no toque, mas o texto "Arraste os cards entre as etapas" continua aparecendo. No toque, trocar para "Toque no card para mudar a etapa" (o seletor na ficha já existe).
9. **Busca do CRM:** ignorar acentos e procurar também por e-mail e WhatsApp.
10. **Celular, aba Entregas:** o botão "+ entrega" aparece acima do título e o rótulo "Produção" à direita. Alinhar o cabeçalho como nas outras abas.
11. **Mensagens em português:** traduzir os erros mais comuns do Supabase (credenciais inválidas, estouro numérico, sem conexão) e não mostrar texto técnico como "numeric field overflow".
12. **Acessibilidade:** dar foco por teclado aos filmes, `alt` na foto do visor com o nome do casal e o número da foto, alvos de toque de 44 px e `aria-expanded` no Menu.
