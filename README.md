# D-Vida Zero

Sistema inteligente de gestão financeira pessoal desenvolvido para ajudar usuários a organizar receitas, despesas, pagamentos e metas financeiras através de dashboards interativos, gráficos analíticos e recursos de Inteligência Artificial.

## Objetivo

O D-Vida Zero foi criado para simplificar o controle financeiro do dia a dia, oferecendo uma visão clara da situação financeira do usuário e auxiliando na tomada de decisões através de análises visuais e insights inteligentes.

## Principais Funcionalidades

* Controle de receitas e despesas
* Gestão de pagamentos e parcelas
* Dashboard financeiro
* Gráficos de evolução financeira
* Categorias personalizadas
* Consultora IA com análise dos seus números reais
* Timeline de quitação e compromisso mensal
* Acompanhamento mensal e anual

## Tecnologias Utilizadas

### Front-end

* React
* TypeScript
* Vite
* Tailwind CSS
* Shadcn UI

### Back-end e Dados

* Supabase (Auth, PostgreSQL, Edge Functions)
* Cloudflare Pages (deploy)

### Recursos Inteligentes

* Integração com Inteligência Artificial (Gemini) para insights financeiros

## Como Executar

```bash
git clone https://github.com/gegiSants/d-vida-zero
cd d-vida-zero
npm install
cp .env.example .env   # preencha com credenciais do Supabase
npm run dev
```

Abre em `http://localhost:8080`.

## Documentação completa

- **[docs/PROJETO.md](docs/PROJETO.md)** — arquitetura, pastas, deploy e segurança
- **[docs/BRIEF_IA_CONTADORA.md](docs/BRIEF_IA_CONTADORA.md)** — brief do produto para IA contadora/fiscal (métricas, regras, prompt)

## Segredos

Nunca commite `.env`. A chave de IA (`GOOGLE_API_KEY`) fica apenas nos **secrets** da Edge Function no Supabase.

## Status

Projeto em desenvolvimento ativo.
