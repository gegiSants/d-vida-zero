export const MomentoVida = {
  JOVEM_INICIO: "jovem_inicio_carreira",
  ESTUDANTE: "estudante",
  CLT_ESTAVEL: "clt_estavel",
  AUTONOMO: "autonomo",
  MEI: "mei",
  TRANSICAO: "transicao_carreira",
  FAMILIA: "familia_constituida",
} as const;
export type MomentoVida = (typeof MomentoVida)[keyof typeof MomentoVida];

export const MoradiaSituacao = {
  COM_PAIS: "com_pais",
  ALUGUEL: "aluguel",
  PROPRIA: "propria",
  DIVIDE: "divide_moradia",
  UNIVERSITARIO: "republica_faculdade",
} as const;
export type MoradiaSituacao = (typeof MoradiaSituacao)[keyof typeof MoradiaSituacao];

export const Dependentes = {
  NENHUM: "nenhum",
  FILHOS: "filhos",
  PAIS: "pais_idosos",
  OUTROS: "outros_dependentes",
} as const;
export type Dependentes = (typeof Dependentes)[keyof typeof Dependentes];

export const RendaTipo = {
  CLT: "clt",
  PJ: "pj",
  MISTA: "mista",
  INFORMAL: "informal",
  MESADA: "mesada_apoio_familiar",
} as const;
export type RendaTipo = (typeof RendaTipo)[keyof typeof RendaTipo];

export const ObjetivoPrincipal = {
  QUITAR_DIVIDAS: "quitar_dividas",
  ORGANIZAR: "organizar_financas",
  RESERVA: "montar_reserva",
  INVESTIR: "investir_carreira",
  COMPRAR: "comprar_patrimonio",
  EQUILIBRAR: "equilibrar_mes",
} as const;
export type ObjetivoPrincipal = (typeof ObjetivoPrincipal)[keyof typeof ObjetivoPrincipal];

export const MOMENTO_VIDA_LABEL: Record<MomentoVida, string> = {
  jovem_inicio_carreira: "Jovem — início de carreira",
  estudante: "Estudante",
  clt_estavel: "CLT estável",
  autonomo: "Profissional autônomo",
  mei: "MEI / microempreendedor",
  transicao_carreira: "Em transição de carreira",
  familia_constituida: "Família constituída",
};

export const MORADIA_LABEL: Record<MoradiaSituacao, string> = {
  com_pais: "Moro com meus pais / família",
  aluguel: "Aluguel",
  propria: "Moradia própria (financiada ou quitada)",
  divide_moradia: "Divido moradia (roommate, parceiro)",
  republica_faculdade: "República / moradia universitária",
};

export const DEPENDENTES_LABEL: Record<Dependentes, string> = {
  nenhum: "Não tenho dependentes",
  filhos: "Tenho filhos dependentes",
  pais_idosos: "Ajudo pais / familiares",
  outros_dependentes: "Outros dependentes",
};

export const RENDA_LABEL: Record<RendaTipo, string> = {
  clt: "CLT (carteira assinada)",
  pj: "PJ / autônomo",
  mista: "Renda mista (CLT + extra)",
  informal: "Renda informal / bicos",
  mesada_apoio_familiar: "Apoio familiar / mesada",
};

export const OBJETIVO_LABEL: Record<ObjetivoPrincipal, string> = {
  quitar_dividas: "Quitar dívidas o quanto antes",
  organizar_financas: "Organizar e entender para onde vai o dinheiro",
  montar_reserva: "Montar reserva de emergência",
  investir_carreira: "Investir em carreira / formação",
  comprar_patrimonio: "Comprar algo (carro, imóvel, equipamento)",
  equilibrar_mes: "Fechar o mês sem aperto",
};

export interface UserLifeProfile {
  salario: number;
  reserva: number;
  momento_vida: MomentoVida | "";
  moradia_situacao: MoradiaSituacao | "";
  dependentes: Dependentes | "";
  renda_tipo: RendaTipo | "";
  objetivo_principal: ObjetivoPrincipal | "";
  mora_com_pais: boolean;
  paga_aluguel: boolean;
  paga_contas_casa: boolean;
  sustenta_familia: boolean;
  contexto_livre: string;
  perfil_completo: boolean;
}

export const EMPTY_LIFE_PROFILE: UserLifeProfile = {
  salario: 0,
  reserva: 0,
  momento_vida: "",
  moradia_situacao: "",
  dependentes: "",
  renda_tipo: "",
  objetivo_principal: "",
  mora_com_pais: false,
  paga_aluguel: false,
  paga_contas_casa: false,
  sustenta_familia: false,
  contexto_livre: "",
  perfil_completo: false,
};

export const buildProfileContextForAi = (p: UserLifeProfile) => {
  const moradia = p.moradia_situacao ? MORADIA_LABEL[p.moradia_situacao as MoradiaSituacao] : "não informada";
  const momento = p.momento_vida ? MOMENTO_VIDA_LABEL[p.momento_vida as MomentoVida] : "não informado";
  const renda = p.renda_tipo ? RENDA_LABEL[p.renda_tipo as RendaTipo] : "não informada";
  const objetivo = p.objetivo_principal ? OBJETIVO_LABEL[p.objetivo_principal as ObjetivoPrincipal] : "não informado";
  const dep = p.dependentes ? DEPENDENTES_LABEL[p.dependentes as Dependentes] : "não informado";

  const responsabilidades: string[] = [];
  if (p.mora_com_pais) responsabilidades.push("mora com pais/família");
  if (p.paga_aluguel) responsabilidades.push("paga aluguel");
  if (p.paga_contas_casa) responsabilidades.push("paga contas da casa (luz, água, internet etc.)");
  if (p.sustenta_familia) responsabilidades.push("sustenta familiares financeiramente");
  if (!p.paga_contas_casa && !p.paga_aluguel && p.mora_com_pais) {
    responsabilidades.push("NÃO arca com contas básicas de moradia (luz, água, aluguel)");
  }

  return {
    momento_de_vida: momento,
    moradia,
    tipo_renda: renda,
    dependentes: dep,
    objetivo_principal: objetivo,
    responsabilidades_casa: responsabilidades.length ? responsabilidades : ["não detalhadas"],
    contexto_adicional: p.contexto_livre || "nenhum",
    perfil_preenchido: p.perfil_completo,
    instrucao_para_ia:
      "Personalize a análise ao perfil acima. Não presuma despesas de moradia (luz, água, aluguel) se o usuário indicou que não as paga. Não invente números.",
  };
};

export const getAiSuggestions = (p: UserLifeProfile, stats: { pctRendaComprometida: number; saldoEmAberto: number }) => {
  const base = [
    "Com minha reserva atual, vale quitar alguma dívida à vista?",
    "Qual percentual da minha renda está comprometido hoje?",
  ];
  if (p.momento_vida === MomentoVida.JOVEM_INICIO || p.mora_com_pais) {
    base.unshift("Considerando meu momento de vida, minhas prioridades financeiras fazem sentido?");
  }
  if (stats.saldoEmAberto > 0) {
    base.push("Em quantos meses fico sem parcelas ativas?");
  }
  if (p.objetivo_principal === ObjetivoPrincipal.QUITAR_DIVIDAS) {
    base.push("Qual dívida devo priorizar para quitar primeiro?");
  }
  if (!p.paga_contas_casa && p.mora_com_pais) {
    base.push("Meu comprometimento atual é saudável para quem mora com a família?");
  }
  return [...new Set(base)].slice(0, 4);
};
