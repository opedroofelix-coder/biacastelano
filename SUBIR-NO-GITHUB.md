# Como subir este projeto no GitHub

Escolha **UM** dos caminhos abaixo. Rode os comandos dentro da pasta do projeto
(a pasta que tem o `index.html` e este arquivo).

---

## Caminho A — com o GitHub CLI (`gh`) — mais rápido

Precisa ter o `gh` instalado e logado uma vez (`gh auth login`).

```bash
git init
git add -A
git commit -m "Site da Bia Castelano"
git branch -M main
gh repo create biacastelano-site --public --source=. --remote=origin --push
```

Troque `biacastelano-site` pelo nome que quiser, e `--public` por `--private` se preferir privado.
Pronto — o repositório é criado e o código sobe de uma vez.

---

## Caminho B — manual (sem CLI)

1. Entre em https://github.com/new e crie um repositório **vazio**
   (sem README, sem .gitignore, sem licença). Anote o nome, ex.: `biacastelano-site`.
2. Na pasta do projeto, rode (troque `SEU-USUARIO` e o nome do repositório):

```bash
git init
git add -A
git commit -m "Site da Bia Castelano"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/biacastelano-site.git
git push -u origin main
```

Se pedir login, use seu usuário do GitHub e um **token de acesso** como senha
(GitHub → Settings → Developer settings → Personal access tokens).

---

## Depois de subir

- Pra publicar o site a partir do GitHub: Netlify → *Add new site* → *Import an existing project*
  → GitHub → este repositório. Sem build; a cada `git push` o site atualiza.
- `.gitignore` já ignora `build/`, `.env` e afins.
