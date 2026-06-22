/** Taxonomia financeira Mapa Zero — 4 eixos independentes */

export const TipoObrigacao = {
  PARCELADO: "parcelado",
  RECORRENTE: "recorrente",
  ROTATIVO: "rotativo",
  AVISTA_PENDENTE: "avista_pendente",
  EMPRESTIMO: "emprestimo",
} as const;
export type TipoObrigacao = (typeof TipoObrigacao)[keyof typeof TipoObrigacao];

export const Categoria = {
  MORADIA: "moradia",
  ALIMENTACAO: "alimentacao",
  TRANSPORTE: "transporte",
  SAUDE: "saude",
  EDUCACAO: "educacao",
  SERVICOS_BASICOS: "servicos_basicos",
  LAZER: "lazer",
  VESTUARIO: "vestuario",
  BEM_ESTAR: "bem_estar",
  FERRAMENTAS_TRABALHO: "ferramentas_trabalho",
  MARKETING: "marketing",
  TRIBUTOS_MEI: "tributos_mei",
  CAPITAL_GIRO: "capital_giro",
  CREDITO_JUROS: "credito_juros",
  INVESTIMENTO: "investimento",
  SEGUROS: "seguros",
  FAMILIA_DEPENDENTES: "familia_dependentes",
  OUTRO: "outro",
} as const;
export type Categoria = (typeof Categoria)[keyof typeof Categoria];

export const OrigemTipo = {
  CARTAO_CREDITO: "cartao_credito",
  BANCO: "banco",
  VAREJO_PARCELADO: "varejo_parcelado",
  FINTECH: "fintech",
  OPERADORA_SERVICO: "operadora_servico",
  PESSOA_FISICA: "pessoa_fisica",
  GOVERNO: "governo",
  EMPREGADOR: "empregador",
  PROPRIO: "proprio",
  OUTRO: "outro",
} as const;
export type OrigemTipo = (typeof OrigemTipo)[keyof typeof OrigemTipo];

export const NaturezaFinanceira = {
  ESSENCIAL: "essencial",
  DISCRICIONARIO: "discricionario",
  PRODUTIVO: "produtivo",
  PATRIMONIAL: "patrimonial",
  FINANCEIRO: "financeiro",
  TRANSFERENCIA: "transferencia",
} as const;
export type NaturezaFinanceira = (typeof NaturezaFinanceira)[keyof typeof NaturezaFinanceira];

export const TIPO_OBRIGACAO_LABEL: Record<TipoObrigacao, string> = {
  parcelado: "Parcelado",
  recorrente: "Recorrente (mensal)",
  rotativo: "Rotativo (cartão/cheque)",
  avista_pendente: "À vista pendente",
  emprestimo: "Empréstimo / financiamento",
};

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  moradia: "Moradia",
  alimentacao: "Alimentação",
  transporte: "Transporte",
  saude: "Saúde",
  educacao: "Educação",
  servicos_basicos: "Serviços básicos",
  lazer: "Lazer",
  vestuario: "Vestuário",
  bem_estar: "Bem-estar",
  ferramentas_trabalho: "Ferramentas de trabalho",
  marketing: "Marketing",
  tributos_mei: "Tributos MEI",
  capital_giro: "Capital de giro",
  credito_juros: "Crédito / juros",
  investimento: "Investimento",
  seguros: "Seguros",
  familia_dependentes: "Família / dependentes",
  outro: "Outro",
};

export const ORIGEM_TIPO_LABEL: Record<OrigemTipo, string> = {
  cartao_credito: "Cartão de crédito",
  banco: "Banco",
  varejo_parcelado: "Varejo parcelado",
  fintech: "Fintech",
  operadora_servico: "Operadora / serviço",
  pessoa_fisica: "Pessoa física",
  governo: "Governo",
  empregador: "Empregador",
  proprio: "Próprio",
  outro: "Outro",
};

export const NATUREZA_LABEL: Record<NaturezaFinanceira, string> = {
  essencial: "Essencial",
  discricionario: "Discricionário",
  produtivo: "Produtivo",
  patrimonial: "Patrimonial",
  financeiro: "Financeiro (juros/tarifas)",
  transferencia: "Transferência / aporte",
};

export const CATEGORIA_GROUPS: { label: string; items: Categoria[] }[] = [
  {
    label: "Essenciais",
    items: [
      Categoria.MORADIA,
      Categoria.ALIMENTACAO,
      Categoria.TRANSPORTE,
      Categoria.SAUDE,
      Categoria.EDUCACAO,
      Categoria.SERVICOS_BASICOS,
    ],
  },
  {
    label: "Discricionários",
    items: [Categoria.LAZER, Categoria.VESTUARIO, Categoria.BEM_ESTAR],
  },
  {
    label: "Profissional / MEI",
    items: [
      Categoria.FERRAMENTAS_TRABALHO,
      Categoria.MARKETING,
      Categoria.TRIBUTOS_MEI,
      Categoria.CAPITAL_GIRO,
    ],
  },
  {
    label: "Financeiro",
    items: [Categoria.CREDITO_JUROS, Categoria.INVESTIMENTO, Categoria.SEGUROS],
  },
  {
    label: "Outros",
    items: [Categoria.FAMILIA_DEPENDENTES, Categoria.OUTRO],
  },
];

export const DEFAULTS_POR_CATEGORIA: Partial<
  Record<Categoria, { natureza: NaturezaFinanceira; origem_tipo?: OrigemTipo; tipo_obrigacao?: TipoObrigacao }>
> = {
  moradia: { natureza: NaturezaFinanceira.ESSENCIAL, tipo_obrigacao: TipoObrigacao.RECORRENTE },
  alimentacao: { natureza: NaturezaFinanceira.ESSENCIAL },
  transporte: { natureza: NaturezaFinanceira.ESSENCIAL },
  saude: { natureza: NaturezaFinanceira.ESSENCIAL },
  educacao: { natureza: NaturezaFinanceira.PRODUTIVO },
  servicos_basicos: { natureza: NaturezaFinanceira.ESSENCIAL, tipo_obrigacao: TipoObrigacao.RECORRENTE },
  lazer: { natureza: NaturezaFinanceira.DISCRICIONARIO, tipo_obrigacao: TipoObrigacao.RECORRENTE, origem_tipo: OrigemTipo.OPERADORA_SERVICO },
  ferramentas_trabalho: { natureza: NaturezaFinanceira.PRODUTIVO },
  marketing: { natureza: NaturezaFinanceira.PRODUTIVO },
  tributos_mei: { natureza: NaturezaFinanceira.ESSENCIAL, origem_tipo: OrigemTipo.GOVERNO },
  credito_juros: { natureza: NaturezaFinanceira.FINANCEIRO },
  investimento: { natureza: NaturezaFinanceira.PATRIMONIAL },
  seguros: { natureza: NaturezaFinanceira.ESSENCIAL },
};

/** Mapeia valores legados (pré-migration) para a nova taxonomia */
export const mapLegacyTipoObrigacao = (tipo?: string, parcelas?: number): TipoObrigacao => {
  if (tipo === "Assinatura") return TipoObrigacao.RECORRENTE;
  if (tipo === "Cartão") return TipoObrigacao.ROTATIVO;
  if (tipo === "Dívida") return (parcelas ?? 1) > 1 ? TipoObrigacao.PARCELADO : TipoObrigacao.AVISTA_PENDENTE;
  return TipoObrigacao.PARCELADO;
};

export const mapLegacyCategoria = (cat?: string): Categoria => {
  const m: Record<string, Categoria> = {
    Trabalho: Categoria.FERRAMENTAS_TRABALHO,
    Educação: Categoria.EDUCACAO,
    Lazer: Categoria.LAZER,
    Necessidade: Categoria.SERVICOS_BASICOS,
    Assinatura: Categoria.LAZER,
    Outro: Categoria.OUTRO,
    moradia: Categoria.MORADIA,
    alimentacao: Categoria.ALIMENTACAO,
    transporte: Categoria.TRANSPORTE,
    saude: Categoria.SAUDE,
    educacao: Categoria.EDUCACAO,
    servicos_basicos: Categoria.SERVICOS_BASICOS,
    lazer: Categoria.LAZER,
    vestuario: Categoria.VESTUARIO,
    bem_estar: Categoria.BEM_ESTAR,
    ferramentas_trabalho: Categoria.FERRAMENTAS_TRABALHO,
    marketing: Categoria.MARKETING,
    tributos_mei: Categoria.TRIBUTOS_MEI,
    capital_giro: Categoria.CAPITAL_GIRO,
    credito_juros: Categoria.CREDITO_JUROS,
    investimento: Categoria.INVESTIMENTO,
    seguros: Categoria.SEGUROS,
    familia_dependentes: Categoria.FAMILIA_DEPENDENTES,
    outro: Categoria.OUTRO,
  };
  return m[cat ?? ""] ?? Categoria.OUTRO;
};

export const mapLegacyNatureza = (tf?: string): NaturezaFinanceira => {
  if (tf === "Investimento") return NaturezaFinanceira.PRODUTIVO;
  if (tf === "Obrigação") return NaturezaFinanceira.ESSENCIAL;
  if (tf === "Consumo") return NaturezaFinanceira.DISCRICIONARIO;
  const valid = Object.values(NaturezaFinanceira) as string[];
  if (tf && valid.includes(tf)) return tf as NaturezaFinanceira;
  return NaturezaFinanceira.DISCRICIONARIO;
};

export const labelCategoria = (v: string) =>
  CATEGORIA_LABEL[v as Categoria] ?? v;

export const labelTipoObrigacao = (v: string) =>
  TIPO_OBRIGACAO_LABEL[v as TipoObrigacao] ?? v;

export const labelNatureza = (v: string) =>
  NATUREZA_LABEL[v as NaturezaFinanceira] ?? v;

export const labelOrigemTipo = (v: string) =>
  ORIGEM_TIPO_LABEL[v as OrigemTipo] ?? v;

/** Mantém colunas legadas sincronizadas até remoção futura */
export const syncLegacyTipo = (tipoObrigacao: TipoObrigacao): string => {
  if (tipoObrigacao === TipoObrigacao.RECORRENTE) return "Assinatura";
  if (tipoObrigacao === TipoObrigacao.ROTATIVO) return "Cartão";
  return "Dívida";
};

export const syncLegacyTipoFinanceiro = (natureza: NaturezaFinanceira): string => {
  if (natureza === NaturezaFinanceira.PRODUTIVO || natureza === NaturezaFinanceira.PATRIMONIAL) return "Investimento";
  if (natureza === NaturezaFinanceira.ESSENCIAL) return "Obrigação";
  return "Consumo";
};

export const resolveTipoObrigacao = (p: { tipo_obrigacao?: string; tipo?: string; parcelas?: number }): TipoObrigacao =>
  (p.tipo_obrigacao as TipoObrigacao) || mapLegacyTipoObrigacao(p.tipo, p.parcelas);

export const resolveCategoria = (p: { categoria?: string }): Categoria =>
  mapLegacyCategoria(p.categoria);

export const resolveNatureza = (p: { natureza_financeira?: string; tipo_financeiro?: string }): NaturezaFinanceira =>
  p.natureza_financeira
    ? mapLegacyNatureza(p.natureza_financeira)
    : mapLegacyNatureza(p.tipo_financeiro);

export const isNaturezaProdutiva = (natureza: NaturezaFinanceira) =>
  natureza === NaturezaFinanceira.PRODUTIVO || natureza === NaturezaFinanceira.PATRIMONIAL;
