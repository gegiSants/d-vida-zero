# Documentação do projeto — Controle de Pagamentos

App de finanças pessoais: cadastro de dívidas/parcelas, visão de compromisso mensal, gráficos, timeline e consultora IA com dados reais do usuário.

---

## Stack (linguagens e ferramentas)

| Camada | Tecnologia | Função |
|--------|------------|--------|
| **Linguagem** | TypeScript | Tipagem no front e consistência |
| **UI** | React 18 | Interface componentizada |
| **Build** | Vite 5 | Dev server e bundle de produção |
| **Estilo** | Tailwind CSS 3 | Utility-first CSS |
| **Componentes** | shadcn/ui + Radix UI | Dialog, Select, Tabs, etc. |
| **Roteamento** | React Router 6 | `/`, `/auth`, 404 |
| **Estado servidor** | TanStack React Query | Cache (estrutura pronta) |
| **Gráficos** | Recharts | Pizza e barras por categoria/mês |
| **Markdown (IA)** | react-markdown | Respostas da consultora |
| **Toasts** | Sonner | Feedback de erro/sucesso |
| **Backend** | Supabase | Auth, PostgreSQL, Edge Functions |
| **IA** | Google Gemini (API OpenAI-compat) | Consultora financeira |
| **Deploy front** | Cloudflare Pages | Build a partir do GitHub |
| **Lint** | ESLint 9 | Qualidade de código |
| **Testes** | Vitest + Testing Library | Setup básico |
| **Origem do template** | Lovable | Scaffold inicial + Supabase Cloud |

---

## Arquitetura (visão geral)

```
┌─────────────────┐     HTTPS      ┌──────────────────┐
│  Cloudflare     │ ◄───────────── │  Usuário (browser)│
│  Pages (React)  │                └──────────────────┘
└────────┬────────┘
         │ VITE_SUPABASE_* (build)
         ▼
┌─────────────────┐     RLS        ┌──────────────────┐
│  Supabase Auth  │ ◄────────────► │  PostgreSQL      │
│  + PostgREST    │                │  profiles        │
└────────┬────────┘                │  payments        │
         │ JWT                     │  extras          │
         ▼                         └──────────────────┘
┌─────────────────┐
│ Edge Function   │ ──► Gemini API (GOOGLE_API_KEY secret)
│ financial-advisor│
└─────────────────┘
```

1. O **front** autentica via Supabase Auth (email/senha).
2. Dados financeiros vão para tabelas com **RLS** (cada usuário só vê os próprios registros).
3. O **chat IA** envia um *snapshot* JSON + histórico para a Edge Function, que chama o Gemini com a chave guardada no servidor.

---

## Estrutura de pastas e arquivos

### Raiz do repositório

| Arquivo / pasta | Descrição |
|-----------------|-----------|
| `index.html` | HTML base, meta tags SEO, fonte Inter |
| `package.json` | Dependências e scripts (`dev`, `build`, `test`) |
| `package-lock.json` | Lock de versões npm |
| `vite.config.ts` | Vite: porta 8080, alias `@/` → `src/` |
| `tailwind.config.ts` | Tema, cores CSS variables, animações |
| `postcss.config.js` | Pipeline Tailwind + Autoprefixer |
| `tsconfig.json` | Config TypeScript do monorepo |
| `tsconfig.app.json` | TS estrito para código da app |
| `tsconfig.node.json` | TS para configs Node (Vite) |
| `eslint.config.js` | Regras ESLint |
| `vitest.config.ts` | Config de testes |
| `components.json` | Config shadcn/ui (aliases, estilo) |
| `.env` | **Local only** — chaves Supabase (não commitar) |
| `.env.example` | Template sem segredos para novos devs |
| `.gitignore` | Ignora `node_modules`, `dist`, `.env`, `supabase/.temp/` |
| `README.md` | Entrada rápida do repo |
| `docs/PROJETO.md` | Este documento |

### `public/`

Arquivos estáticos servidos sem processamento.

| Arquivo | Descrição |
|---------|-----------|
| `favicon.ico` | Ícone do site |
| `placeholder.svg` | Placeholder de imagem |
| `robots.txt` | Regras para crawlers |

### `src/` — código da aplicação

| Arquivo | Descrição |
|---------|-----------|
| `main.tsx` | Ponto de entrada React (`createRoot`) |
| `App.tsx` | Providers (Query, Router, Auth) e rotas |
| `App.css` | Estilos globais complementares |
| `index.css` | Tailwind directives + CSS variables (tema roxo) |
| `vite-env.d.ts` | Tipos Vite (`import.meta.env`) |

#### `src/pages/`

| Arquivo | Descrição |
|---------|-----------|
| `Index.tsx` | Dashboard principal: stats, tabela, gráficos, IA |
| `Auth.tsx` | Login e cadastro (email/senha) |
| `NotFound.tsx` | Página 404 |

#### `src/components/` — negócio

| Arquivo | Descrição |
|---------|-----------|
| `AddPaymentDialog.tsx` | Modal nova dívida; parcela mensal × parcelas → total |
| `EditPaymentDialog.tsx` | Edição de pagamento existente |
| `PaymentsTable.tsx` | Tabela com progresso, parcela, editar/remover |
| `MonthlyCommitments.tsx` | Salário, extras mensais, % comprometida |
| `StatCard.tsx` | Card de métrica (total, falta, mensal) |
| `ReserveCard.tsx` | Reserva de emergência e simulação de quitação |
| `Charts.tsx` | Gráficos Recharts (categoria + projeção mensal) |
| `Timeline.tsx` | Linha do tempo até quitar cada dívida |
| `AdvisorChat.tsx` | Chat com consultora IA + typing + JSON de erro |
| `NavLink.tsx` | Link de navegação estilizado |

#### `src/components/ui/`

Biblioteca **shadcn/ui** (primitivos Radix + Tailwind): `button`, `input`, `dialog`, `select`, `tabs`, `card`, `table`, `toast`, etc. Não alterar manualmente salvo customização visual.

#### `src/hooks/`

| Arquivo | Descrição |
|---------|-----------|
| `useAuth.tsx` | Contexto de sessão Supabase (user, session, signOut) |
| `useFinanceData.ts` | CRUD payments/extras/profile via Supabase |
| `useLocalStorage.ts` | Persistência local genérica |
| `use-mobile.tsx` | Breakpoint mobile para sidebar |
| `use-toast.ts` | Hook de toast (shadcn) |

#### `src/integrations/supabase/`

| Arquivo | Descrição |
|---------|-----------|
| `client.ts` | Cliente Supabase (`createClient` + env vars) |
| `types.ts` | Tipos gerados do schema Postgres (atualizar após migrations) |

#### `src/lib/`

| Arquivo | Descrição |
|---------|-----------|
| `utils.ts` | `cn()` — merge de classes Tailwind |
| `format.ts` | `brl()` — formatação moeda pt-BR |

#### `src/types/`

| Arquivo | Descrição |
|---------|-----------|
| `payment.ts` | Tipos legados/alternativos de pagamento |

#### `src/test/`

| Arquivo | Descrição |
|---------|-----------|
| `setup.ts` | Setup Vitest |
| `example.test.ts` | Teste exemplo |

### `supabase/` — backend

| Arquivo / pasta | Descrição |
|-----------------|-----------|
| `config.toml` | ID do projeto local CLI; `verify_jwt = true` na function IA |
| `migrations/*.sql` | Schema Postgres + RLS + trigger de perfil |
| `functions/financial-advisor/index.ts` | Edge Function: Gemini + prompt consultora |
| `.temp/` | Estado local CLI (**não commitar**) |

#### Migrations

| Migration | Conteúdo |
|-----------|----------|
| `20260428222859_...sql` | Tabelas `profiles`, `payments`, `extras` + RLS + trigger signup |
| `20260428222915_...sql` | Revoga execução pública da função `handle_new_user` |

#### Tabelas (PostgreSQL)

| Tabela | Campos principais | RLS |
|--------|-------------------|-----|
| `profiles` | `salario`, `reserva` | Só o próprio `auth.uid()` |
| `payments` | `item`, `tipo`, `total`, `parcelas`, `ja_pago`, `origem`, `start_date` | Só registros com `user_id = auth.uid()` |
| `extras` | `item`, `valor_mensal` | Idem payments |

> **Nota:** O front também usa `categoria` e `tipo_financeiro` em `payments`. Se existirem no banco de produção, falta migration/types no repo — alinhar schema e rodar `supabase gen types`.

---

## Fluxos importantes

### Autenticação

1. Usuário acessa `/auth` → `signUp` ou `signInWithPassword`.
2. Supabase devolve JWT; sessão fica em `localStorage`.
3. `Index` redireciona para `/auth` se não houver `user`.
4. Proteção real dos dados: **RLS no Postgres**, não só redirect no front.

### CRUD financeiro

`useFinanceData` → `supabase.from(...)` com JWT do usuário → Postgres aplica políticas RLS.

### Consultora IA

1. `Index` monta `snapshot` (salário, reserva, dívidas, totais).
2. `AdvisorChat` envia `POST /functions/v1/financial-advisor` com `Authorization: Bearer <JWT>`.
3. Edge Function lê `GOOGLE_API_KEY` do ambiente Supabase e chama Gemini.
4. Resposta markdown renderizada no chat.

---

## Variáveis de ambiente

### Front (`.env` local / Cloudflare Pages)

| Variável | Obrigatória | Onde obter |
|----------|-------------|------------|
| `VITE_SUPABASE_URL` | Sim | Supabase → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Idem (chave publishable/anon) |
| `VITE_SUPABASE_PROJECT_ID` | Opcional | ID do projeto |

### Supabase Edge Functions (secrets — **nunca no Git**)

| Secret | Obrigatória | Onde configurar |
|--------|-------------|-------------------|
| `GOOGLE_API_KEY` | Sim (IA) | Supabase Dashboard → Edge Functions → Secrets |

---

## Deploy

| Ambiente | Como |
|----------|------|
| **Local** | `npm install` → copiar `.env.example` → `.env` → `npm run dev` |
| **Produção (front)** | Push `main` → Cloudflare Pages (`npm run build` → `dist`) |
| **Edge Function** | `npx supabase functions deploy financial-advisor` |

Variáveis `VITE_*` devem estar no painel Cloudflare (Production), não no repositório.

---

## Auditoria de segurança

Última revisão: documento gerado junto com preparação para repositório público.

### ✅ O que está bem implementado

| Item | Detalhe |
|------|---------|
| **RLS ativo** | `profiles`, `payments`, `extras` com políticas por `auth.uid()` |
| **Isolamento por usuário** | INSERT exige `user_id` = usuário logado (WITH CHECK) |
| **Chave de IA no servidor** | `GOOGLE_API_KEY` só via `Deno.env` na Edge Function |
| **Front não expõe service_role** | Cliente usa apenas publishable key |
| **Trigger de signup** | `handle_new_user` com `SECURITY DEFINER` + `search_path` + REVOKE EXECUTE |
| **Chat exige sessão** | Front bloqueia envio sem `access_token` |
| **JWT na Edge Function** | `verify_jwt = true` em `supabase/config.toml` |
| **`.env` no `.gitignore`** | Segredos locais fora do Git |
| **`.env.example`** | Onboarding sem vazar chaves |

### ⚠️ Riscos e recomendações

| Prioridade | Risco | Recomendação |
|------------|-------|--------------|
| **Alta** | `.env` já commitado no histórico Git | Rotacionar publishable key no Supabase antes de tornar repo público |
| **Alta** | Cadastro aberto (`signUp`) | Se repo for público, considerar desabilitar signup ou exigir confirmação de email no Supabase Auth |
| **Média** | Snapshot financeiro enviado pelo client | Atacante autenticado pode enviar números falsos à IA (não vaza dados de outros). Ideal: montar snapshot no servidor a partir do DB |
| **Média** | CORS `Access-Control-Allow-Origin: *` na function | Restringir ao domínio de produção quando estiver estável |
| **Média** | Sem rate limit na Edge Function | Configurar limite no Supabase ou no Google Cloud; evita abuso de créditos IA |
| **Média** | Erros Gemini retornam texto bruto ao client | Logar no servidor; retornar mensagem genérica ao usuário |
| **Baixa** | Senha sem política de complexidade | Mínimo 8+ caracteres no Supabase Auth settings |
| **Baixa** | Sessão em `localStorage` | Padrão Supabase; risco se houver XSS — manter dependências atualizadas |
| **Baixa** | `profiles` sem policy DELETE | Intencional; usuário não apaga perfil via API |
| **Baixa** | Schema drift (`categoria`, `tipo_financeiro`) | Gerar migration + atualizar `types.ts` |
| **Baixa** | `config.toml` com `project_id` diferente do `.env` | Alinhar projeto local CLI com produção |

### 🔒 O que NUNCA deve ir para o Git

- `.env` e qualquer arquivo com chaves reais
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY` / `LOVABLE_API_KEY`
- Tokens Cloudflare, GitHub PAT
- `supabase/.temp/`
- Senhas ou dumps de banco

### Checklist antes de repositório público

- [ ] Commit com `.gitignore` + remoção do `.env` do tracking
- [ ] Rotacionar chaves que vazaram no histórico
- [ ] Confirmar RLS ativo em produção (Supabase → Table Editor → RLS)
- [ ] Secrets `GOOGLE_API_KEY` só no Supabase
- [ ] Variáveis `VITE_*` só no Cloudflare
- [ ] URLs de redirect no Supabase Auth incluem domínio final
- [ ] Revisar se signup aberto é desejado

---

## Scripts npm

| Comando | Ação |
|---------|------|
| `npm run dev` | Servidor dev em `http://localhost:8080` |
| `npm run build` | Build produção em `dist/` |
| `npm run preview` | Preview do build local |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (uma execução) |

---

## Rotas

| Rota | Página | Acesso |
|------|--------|--------|
| `/` | Dashboard | Autenticado |
| `/auth` | Login/cadastro | Público |
| `*` | NotFound | Público |

---

## Contato / evolução

Documento vivo: atualize ao adicionar migrations, functions ou mudar deploy. Para dúvidas de segurança em produção, revise sempre Supabase Dashboard + Cloudflare Pages settings.
