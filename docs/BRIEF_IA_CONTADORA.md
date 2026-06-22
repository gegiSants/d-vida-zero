# Brief para IA contadora / consultora fiscal — Mapa Zero

> **Como usar este documento:** cole na sua IA de contabilidade/fiscalidade e peça: *"Com base neste produto, sugira melhorias de UX, nomenclatura fiscalmente correta, métricas adicionais e regras de negócio para o usuário final (pessoa física com dívidas parceladas)."*

---

## 1. O que é o produto

**Mapa Zero** (domínio: `mapazero.com.br`) é um sistema web de **gestão financeira pessoal** focado em:

- Registrar **dívidas e compromissos** (cartão, empréstimo, assinatura, etc.)
- Acompanhar **parcelas** (quanto paga por mês, quanto falta)
- Visualizar **comprometimento da renda** (salário vs. saídas fixas)
- Simular **quitação antecipada** com reserva de emergência
- Receber **orientação por IA** com base nos números reais do usuário (não inventa dados)

**Público-alvo:** pessoa física que precisa de clareza sobre quanto da renda está comprometida e quando cada dívida termina.

**Posicionamento desejado:** ferramenta **séria e profissional** (portfólio de dev fiscal), não estética de app genérico de IA ou banco digital.

---

## 2. Stack técnica (contexto)

| Camada | Tecnologia |
|--------|------------|
| Front | React, TypeScript, Vite, Tailwind, shadcn/ui |
| Back | Supabase (Auth, PostgreSQL, RLS por usuário) |
| IA | Edge Function → Google Gemini (chave só no servidor) |
| Deploy | Cloudflare Pages |

Cada usuário só acessa **seus próprios dados** (Row Level Security no banco).

---

## 3. Modelo de dados

### 3.1 Perfil (`profiles`)

| Campo | Tipo | Significado |
|-------|------|-------------|
| `salario` | número | Renda mensal declarada pelo usuário |
| `reserva` | número | Reserva de emergência / caixa disponível |

### 3.2 Pagamento / dívida (`payments`)

| Campo | Tipo | Significado |
|-------|------|-------------|
| `item` | texto | Nome (ex.: MacBook, iPhone, curso) |
| `tipo` | enum | `Dívida`, `Cartão`, `Assinatura`, `Outro` |
| `categoria` | enum | `Trabalho`, `Educação`, `Lazer`, `Necessidade`, `Assinatura`, `Outro` |
| `tipo_financeiro` | enum | `Investimento`, `Consumo`, `Obrigação` |
| `total` | número | **Valor total original do contrato** (estático após cadastro) |
| `parcelas` | inteiro | Quantidade total de parcelas do plano |
| `ja_pago` | inteiro | Quantas parcelas o usuário já pagou (incremento manual) |
| `origem` | texto | Instituição (ex.: Nubank, Robson) |
| `start_date` | data | Mês de início do parcelamento (para projeção) |

**Regras de cálculo derivadas:**

```
parcela_mensal = total / parcelas
saldo_em_aberto = parcela_mensal × (parcelas - ja_pago)
parcelas_restantes = parcelas - ja_pago
```

**Importante para a IA fiscal:** o campo `total` **não diminui** quando o usuário marca parcelas como pagas. Apenas `ja_pago` aumenta. Isso é intencional: separar **exposição contratada** de **saldo em aberto**.

### 3.3 Despesas extras mensais (`extras`)

| Campo | Tipo | Significado |
|-------|------|-------------|
| `item` | texto | Nome (ex.: aluguel, Netflix, DAS) |
| `valor_mensal` | número | Valor fixo mensal fora do parcelamento |

Não são parceladas no sistema — entram direto no compromisso mensal.

---

## 4. Métricas do dashboard (como são calculadas hoje)

### Card 1 — Volume contratado (label atual: "Total das dívidas")

```
volume_contratado = SOMA(p.total) para TODAS as dívidas cadastradas
                    (inclui dívidas já quitadas na aba "Pagas")
```

**Intenção de produto:** valor **estático/histórico** — quanto o usuário já contraiu no total, mesmo tendo quitado parte. Não reduz ao pagar parcelas.

**Pergunta para a IA fiscal:** essa métrica faz sentido fiscalmente ou deveria haver também "exposição ativa" separada?

### Card 2 — Saldo em aberto (label atual: "Falta pagar")

```
saldo_em_aberto = SOMA( (total/parcelas) × (parcelas - ja_pago) )
                  apenas onde parcelas - ja_pago > 0
```

Quanto ainda falta pagar considerando parcelas restantes.

### Card 3 — Compromisso mensal

```
compromisso_mensal_dividas = SOMA( total/parcelas ) onde ainda há parcelas a pagar
compromisso_mensal_extras  = SOMA( valor_mensal ) dos extras
compromisso_mensal_total   = dívidas + extras
```

### Compromisso mensal (painel lateral)

- Lista cada dívida ativa com parcela mensal
- Lista extras com valor mensal
- Compara com **salário**:
  - `% comprometido = total / salário × 100`
  - `sobra = salário - total`
  - Semáforo: &lt;30% saudável, 30–50% atenção, &gt;50% comprometido

### Reserva — simulação de quitação

Usuário escolhe uma dívida ativa e o sistema calcula:

```
valor_quitacao = parcela_mensal × parcelas_restantes
sobra_reserva  = reserva - valor_quitacao
libera_mensal  = parcela_mensal (se quitasse à vista)
```

Indica se a reserva cobre quitação antecipada.

### Gráficos

1. **Pizza:** saldo em aberto por `categoria`
2. **Barras:** soma das parcelas mensais projetadas para os **próximos 12 meses** (usa `start_date` + `ja_pago` + `parcelas`)

### Timeline

Lista dívidas ativas ordenadas por **data estimada de término** do parcelamento.

---

## 5. Fluxos do usuário

### Cadastro / login
- Email + senha (Supabase Auth)
- Ao criar conta, perfil vazio é criado automaticamente

### Adicionar dívida
- Se `parcelas > 1`: informa **parcela mensal** → sistema calcula `total = parcela × parcelas`
- Se `parcelas = 1`: informa total direto
- Campos: tipo, categoria, tipo financeiro, origem, já pagas

### Marcar parcela paga
- Botão "+1" na tabela incrementa `ja_pago` (máximo = `parcelas`)
- Dívida vai para aba "Pagas" quando `ja_pago === parcelas`

### Editar / remover
- Edição via modal; remoção com confirmação

### Assistente de análise (IA)

O front monta um **snapshot JSON** e envia à Edge Function:

```json
{
  "salario": 3500,
  "reserva": 0,
  "total_devido": 4975,
  "compromisso_mensal_dividas": 1474,
  "despesas_extras_mensais": [{ "item": "DAS", "valor": 80 }],
  "dividas": [
    {
      "item": "Macbook",
      "tipo": "Dívida",
      "categoria": "Trabalho",
      "tipo_financeiro": "Investimento",
      "total": 4300,
      "parcelas": 5,
      "ja_pago": 0,
      "parcela_mensal": 860,
      "falta_pagar": 4300
    }
  ]
}
```

A IA recebe instrução de **não inventar números** — só usar o snapshot. Responde em português com recomendações práticas.

---

## 6. O que o produto NÃO faz hoje (lacunas)

- Não calcula **juros**, **CET**, **IOF** ou **multas**
- Não integra com Open Finance / extratos bancários
- Não gera relatório fiscal (IR, DAS automático, etc.)
- Não distingue **despesa dedutível** vs. pessoal
- Não há auditoria de quem alterou dados
- Não há exportação PDF/Excel
- Categorias são livres, sem plano de contas contábil
- `tipo_financeiro: Investimento` não amortiza patrimônio no sistema
- Parcela paga é manual (+1), não vinculada a data real de pagamento
- Dívidas quitadas continuam no **volume contratado** (soma histórica)

---

## 7. Direção de redesign (pedido da product owner)

A dev é **fiscal/tributária** e o app está no **portfólio profissional**.

### Visual
- Remover emojis e estética "fofa" / genérica de IA
- Paleta: **cinza neutro** + **cor de destaque única** (ex.: cobre/bronze — fora do padrão azul/verde/vermelho de bancos)
- Tipografia limpa, cards sóbrios, menos gradientes
- Linguagem institucional, não informal

### Produto
- Renomear métricas para termos mais claros:
  - "Total das dívidas" → **"Volume contratado"** (estático)
  - "Falta pagar" → **"Saldo em aberto"**
  - "Compromisso mensal" → manter ou **"Comprometimento da renda"**
- Repensar se dívidas quitadas devem sair do volume contratado ou ir para histórico separado
- Assistente IA: posicionar como **"Análise orientada"** ou **"Parecer preliminar"** (não substitui contador)

---

## 8. Prompt sugerido para a IA contadora

Copie e cole:

---

Você é uma contadora e consultora fiscal brasileira, com experiência em finanças pessoais de PF e MEI.

Analise o produto **Mapa Zero** conforme o brief técnico acima e entregue:

1. **Nomenclatura:** nomes mais precisos para os 3 cards do topo e para cada seção do dashboard (linguagem clara para leigo, mas correta fiscalmente).

2. **Métricas adicionais:** quais indicadores faltam? (ex.: taxa de endividamento, margem de segurança, meses de reserva, custo efetivo estimado.)

3. **Regras de negócio:** o volume contratado deve incluir dívidas quitadas? Como tratar investimento vs. consumo? Assinaturas devem entrar diferente de empréstimo?

4. **Categorias e tipos:** sugerir taxonomia melhor alinhada a controle pessoal e, se aplicável, visão fiscal (despesa dedutível, custo operacional MEI, etc.).

5. **UX / fluxos:** melhorias nos formulários, alertas e na simulação de quitação.

6. **IA assistente:** que perguntas pré-definidas fariam sentido? Que disclaimers legais incluir? (não é consultoria fiscal formal.)

7. **Roadmap priorizado:** top 5 mudanças com maior impacto para usuário PF com dívidas parceladas.

8. **Riscos:** o que o app pode induzir o usuário a interpretar errado do ponto de vista fiscal ou financeiro?

Responda em português, objetiva, com listas e exemplos numéricos quando útil.

---

## 9. Exemplo de dados reais (anonimizado)

Usuário com salário R$ 3.500:

| Item | Tipo | Total | Parcelas | Pagas | Parcela/mês | Saldo aberto |
|------|------|-------|----------|-------|-------------|--------------|
| MacBook Robson | Dívida | 4.300 | 5 | 0 | 860 | 4.300 |
| MacBook Nubank | Cartão | 1.200 | 4 | 0 | 300 | 1.200 |
| iPhone Nubank | Cartão | 1.200 | 10 | 0 | 120 | 1.200 |
| Curso inglês | Dívida | 1.200 | 10 | 0 | 120 | 1.200 |
| DAS (extra) | — | — | — | — | 80/mês | — |

- Volume contratado: **R$ 11.193,78** (soma dos totais cadastrados)
- Saldo em aberto: **~R$ 4.975** (depende do que está ativo)
- Compromisso mensal: **~R$ 1.474** (parcelas + extras)

---

## 10. Arquivos de referência no código

| Conceito | Arquivo |
|----------|---------|
| Cálculo das métricas | `src/pages/Index.tsx` |
| CRUD financeiro | `src/hooks/useFinanceData.ts` |
| Compromisso mensal | `src/components/MonthlyCommitments.tsx` |
| Snapshot IA | `src/pages/Index.tsx` (useMemo `snapshot`) |
| Edge Function IA | `supabase/functions/financial-advisor/index.ts` |
| Schema + RLS | `supabase/migrations/*.sql` |

---

*Documento gerado para apoiar evolução de produto e consulta a IA especializada. Atualizar conforme o sistema mudar.*
