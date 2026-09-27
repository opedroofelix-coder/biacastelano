# Site — Bia Castelano

Site da fotógrafa **Bia Castelano** (fotografia e filme de casamento) com painel de edição próprio.
Site estático (HTML + JavaScript) que lê o conteúdo de um backend **Supabase** e continua funcionando
com conteúdo de exemplo mesmo se o banco estiver fora do ar.

- **Site no ar:** https://biacastelano.netlify.app
- **Painel de edição:** https://biacastelano.netlify.app/admin

## Estrutura

```
index.html            → o site (pronto pra publicar)
admin/index.html      → painel de edição (login por e-mail/senha via Supabase)
netlify.toml          → configuração de publicação (site estático, sem build)
COMO-PUBLICAR.txt     → passo a passo rápido de publicação
fonte/                → tudo que gera o site (não é necessário pra publicar)
  build_site.py       → gera o index.html a partir do site_full + fotos de exemplo
  site_full/index.html→ HTML/CSS de origem do site
  single_img/         → fotos de exemplo (embutidas no build)
  supabase/           → scripts SQL do banco (rodar no SQL Editor do Supabase)
```

## Como publicar (Netlify)

Duas formas:

1. **Conectando este repositório** (recomendado): no Netlify → *Add new site* → *Import an existing project*
   → escolha o GitHub e este repositório. Sem build, publica a raiz (`netlify.toml` já configura isso).
   A cada `git push`, o site atualiza sozinho.
2. **Arrastando a pasta**: no Netlify, aba *Deploys*, arraste a pasta do projeto.

Depois de publicar, dê **Ctrl+F5** pra ver a versão nova.

## Backend (Supabase)

- Projeto: `ufacszuqskvgpmcjyaqi` — https://ufacszuqskvgpmcjyaqi.supabase.co
- A chave usada no site é a **publishable** (pode ficar pública, é feita pra isso).
- Tabelas: `site_settings`, `albums`, `testimonials`, `films`. Storage: bucket público `fotos`.
- Scripts em `fonte/supabase/` (rodar no **SQL Editor** do Supabase quando indicado).
  O `add_hero_video.sql` cria o campo do vídeo de abertura e libera envio de vídeo (até 50 MB).

## Regenerar o site (opcional)

Só é preciso se você mexer no `fonte/site_full/index.html`:

```bash
cd fonte
python3 build_site.py       # gera fonte/build/index.html
cp build/index.html ../index.html
```

O painel (`admin/index.html`) é editado direto, não passa pelo build.
