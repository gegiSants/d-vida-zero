import { DBExtra, DBPayment } from "@/hooks/useFinanceData";

import {
  resolveTipoObrigacao,
  resolveNatureza,
  isNaturezaProdutiva,
  TipoObrigacao,
} from "@/types/financeTaxonomy";

export type Semaforo = "success" | "warning" | "destructive" | "info";

export const SEMAFORO_LABEL: Record<Semaforo, string> = {
  success: "Saudável",
  warning: "Atenção",
  destructive: "Crítico",
  info: "Informativo",
};

export const SEMAFORO_CLASS: Record<Semaforo, string> = {
  success: "border-success/40 bg-success/5",
  warning: "border-yellow-500/40 bg-yellow-500/5",
  destructive: "border-destructive/40 bg-destructive/5",
  info: "border-primary/30 bg-primary/5",
};

export const isAssinatura = (p: DBPayment) =>
  resolveTipoObrigacao(p) === TipoObrigacao.RECORRENTE;

export const isCartao = (p: DBPayment) =>
  resolveTipoObrigacao(p) === TipoObrigacao.ROTATIVO;

export const isRecorrente = isAssinatura;
export const isAtivo = (p: DBPayment) => p.ja_pago < p.parcelas;
export const isEncerrado = (p: DBPayment) => p.ja_pago >= p.parcelas;

/** Primeiro dia do mês em fuso local — evita bug UTC em datas ISO */
export const parseLocalMonth = (iso: string) => {
  const [y, m] = iso.split("T")[0].split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
};

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const addMonths = (base: Date, n: number) =>
  new Date(base.getFullYear(), base.getMonth() + n, 1);

export const parcelaMensal = (p: DBPayment) => {
  if (isAssinatura(p)) {
    // Legado: plano anual cadastrado com total do período + parcelas = meses (ex.: Vivo 12×)
    if (p.parcelas > 1) return Number(p.total) / p.parcelas;
    return Number(p.total);
  }
  if (p.parcelas <= 0) return 0;
  return Number(p.total) / p.parcelas;
};

export const saldoItem = (p: DBPayment) => {
  if (isAssinatura(p) || !isAtivo(p)) return 0;
  return parcelaMensal(p) * (p.parcelas - p.ja_pago);
};

export const parcelasRestantes = (p: DBPayment) => {
  if (!isAtivo(p)) return 0;
  if (isAssinatura(p) && p.parcelas <= 1) return 0;
  return p.parcelas - p.ja_pago;
};

/** Último mês com parcela — baseado no que falta pagar, não na data de início cadastrada */
export const dataTerminoEstimada = (p: DBPayment, from = new Date()) => {
  const remaining = parcelasRestantes(p);
  if (remaining <= 0) return null;
  const base = new Date(from.getFullYear(), from.getMonth(), 1);
  return addMonths(base, remaining - 1);
};

export interface FinanceStats {
  saldoEmAberto: number;
  exposicaoAtiva: number;
  historicoEncerrado: number;
  compromissoMensalDividas: number;
  compromissoMensalExtras: number;
  compromissoMensalTotal: number;
  compromissoConsumo: number;
  compromissoInvestimento: number;
  compromissoCartao: number;
  mesesReserva: number;
  taxaEndividamentoAnual: number;
  pctRendaComprometida: number;
  rendaLivre: number;
  margemSeguranca: number;
  tempoAteQuitacaoMeses: number;
  pctCompromissoProdutivo: number;
  pctCompromissoConsumo: number;
  indiceRisco: number;
  riscoLabel: string;
  riscoSemaforo: Semaforo;
  capacidadeCompraParcelada: number;
  coberturaQuitacaoReserva: number;
  liberacaoMensal3Meses: number;
  pesoCartao: number;
  semaforos: {
    comprometimento: Semaforo;
    endividamento: Semaforo;
    reserva: Semaforo;
    rendaLivre: Semaforo;
    tempoQuitacao: Semaforo;
    produtivo: Semaforo;
    coberturaReserva: Semaforo;
    pesoCartao: Semaforo;
    margemSeguranca: Semaforo;
  };
}

const semComprometimento = (pct: number): Semaforo =>
  pct < 30 ? "success" : pct < 50 ? "warning" : "destructive";

const semEndividamento = (pct: number): Semaforo =>
  pct < 20 ? "success" : pct < 40 ? "warning" : "destructive";

const semReserva = (meses: number): Semaforo =>
  meses >= 6 ? "success" : meses >= 3 ? "warning" : "destructive";

const semRendaLivre = (livre: number, salario: number): Semaforo => {
  if (salario <= 0) return "info";
  const pct = (livre / salario) * 100;
  if (livre < 0) return "destructive";
  return pct > 30 ? "success" : pct >= 10 ? "warning" : "destructive";
};

const semTempoQuitacao = (meses: number): Semaforo =>
  meses <= 6 ? "success" : meses <= 18 ? "warning" : "destructive";

const semProdutivo = (pctProdutivo: number, pctConsumo: number): Semaforo => {
  if (pctConsumo > 70) return "destructive";
  if (pctProdutivo >= 50 && pctConsumo < 50) return "success";
  return "warning";
};

const semCoberturaReserva = (pct: number): Semaforo =>
  pct >= 100 ? "success" : pct >= 50 ? "warning" : "destructive";

const semPesoCartao = (pct: number): Semaforo =>
  pct < 20 ? "success" : pct <= 35 ? "warning" : "destructive";

const semMargemSeguranca = (pct: number): Semaforo =>
  pct >= 40 ? "success" : pct >= 20 ? "warning" : "destructive";

const calcIndiceRisco = (
  pctComprometido: number,
  mesesReserva: number,
  taxaEndividamento: number,
  rendaLivre: number,
  salario: number
): { score: number; label: string; semaforo: Semaforo } => {
  let score = 0;
  if (pctComprometido > 50) score += 30;
  else if (pctComprometido > 30) score += 15;
  if (mesesReserva < 3) score += 25;
  else if (mesesReserva < 6) score += 10;
  if (taxaEndividamento > 40) score += 25;
  else if (taxaEndividamento > 20) score += 12;
  if (rendaLivre < 0) score += 20;
  else if (salario > 0 && rendaLivre < salario * 0.1) score += 10;

  const semaforo: Semaforo = score <= 35 ? "success" : score <= 65 ? "warning" : "destructive";
  const label = semaforo === "success" ? "Estável" : semaforo === "warning" ? "Atenção" : "Crítico";
  return { score: Math.min(100, score), label, semaforo };
};

export const computeFinanceStats = (
  payments: DBPayment[],
  extras: DBExtra[],
  salario: number,
  reserva: number
): FinanceStats => {
  const ativos = payments.filter(isAtivo);
  const encerrados = payments.filter(isEncerrado);

  const saldoEmAberto = payments.reduce((s, p) => s + saldoItem(p), 0);

  const exposicaoAtiva = ativos
    .filter((p) => !isAssinatura(p))
    .reduce((s, p) => s + Number(p.total), 0);

  const historicoEncerrado = encerrados
    .filter((p) => !isAssinatura(p))
    .reduce((s, p) => s + Number(p.total), 0);

  const compromissoMensalDividas = ativos.reduce((s, p) => s + parcelaMensal(p), 0);
  const compromissoMensalExtras = extras.reduce((s, e) => s + Number(e.valor_mensal), 0);
  const compromissoMensalTotal = compromissoMensalDividas + compromissoMensalExtras;

  const compromissoConsumo = ativos
    .filter((p) => !isNaturezaProdutiva(resolveNatureza(p)) && resolveNatureza(p) !== "transferencia")
    .reduce((s, p) => s + parcelaMensal(p), 0) + compromissoMensalExtras;

  const compromissoInvestimento = ativos
    .filter((p) => isNaturezaProdutiva(resolveNatureza(p)))
    .reduce((s, p) => s + parcelaMensal(p), 0);

  const compromissoCartao = ativos
    .filter(isCartao)
    .reduce((s, p) => s + parcelaMensal(p), 0);

  const mesesReserva = compromissoMensalTotal > 0 ? reserva / compromissoMensalTotal : 0;

  const rendaAnual = salario > 0 ? salario * 12 : 0;
  const taxaEndividamentoAnual = rendaAnual > 0 ? (saldoEmAberto / rendaAnual) * 100 : 0;

  const pctRendaComprometida = salario > 0 ? (compromissoMensalTotal / salario) * 100 : 0;

  const rendaLivre = salario - compromissoMensalTotal;
  const margemSeguranca = salario > 0 ? (rendaLivre / salario) * 100 : 0;

  const tempoAteQuitacaoMeses = ativos.reduce(
    (max, p) => Math.max(max, parcelasRestantes(p)),
    0
  );

  const pctCompromissoProdutivo =
    compromissoMensalTotal > 0 ? (compromissoInvestimento / compromissoMensalTotal) * 100 : 0;

  const pctCompromissoConsumo =
    compromissoMensalTotal > 0 ? (compromissoConsumo / compromissoMensalTotal) * 100 : 0;

  const capacidadeCompraParcelada = Math.max(0, rendaLivre * 0.3);

  const coberturaQuitacaoReserva =
    saldoEmAberto > 0 ? (reserva / saldoEmAberto) * 100 : reserva > 0 ? 100 : 0;

  const liberacaoMensal3Meses = ativos
    .filter((p) => !isAssinatura(p) && parcelasRestantes(p) > 0 && parcelasRestantes(p) <= 3)
    .reduce((s, p) => s + parcelaMensal(p), 0);

  const pesoCartao =
    compromissoMensalTotal > 0 ? (compromissoCartao / compromissoMensalTotal) * 100 : 0;

  const risco = calcIndiceRisco(
    pctRendaComprometida,
    mesesReserva,
    taxaEndividamentoAnual,
    rendaLivre,
    salario
  );

  return {
    saldoEmAberto,
    exposicaoAtiva,
    historicoEncerrado,
    compromissoMensalDividas,
    compromissoMensalExtras,
    compromissoMensalTotal,
    compromissoConsumo,
    compromissoInvestimento,
    compromissoCartao,
    mesesReserva,
    taxaEndividamentoAnual,
    pctRendaComprometida,
    rendaLivre,
    margemSeguranca,
    tempoAteQuitacaoMeses,
    pctCompromissoProdutivo,
    pctCompromissoConsumo,
    indiceRisco: risco.score,
    riscoLabel: risco.label,
    riscoSemaforo: risco.semaforo,
    capacidadeCompraParcelada,
    coberturaQuitacaoReserva,
    liberacaoMensal3Meses,
    pesoCartao,
    semaforos: {
      comprometimento: semComprometimento(pctRendaComprometida),
      endividamento: semEndividamento(taxaEndividamentoAnual),
      reserva: semReserva(mesesReserva),
      rendaLivre: semRendaLivre(rendaLivre, salario),
      tempoQuitacao: semTempoQuitacao(tempoAteQuitacaoMeses),
      produtivo: semProdutivo(pctCompromissoProdutivo, pctCompromissoConsumo),
      coberturaReserva: semCoberturaReserva(coberturaQuitacaoReserva),
      pesoCartao: semPesoCartao(pesoCartao),
      margemSeguranca: semMargemSeguranca(margemSeguranca),
    },
  };
};

/** Agenda parcelas restantes a partir do mês atual */
const scheduleParcelado = (p: DBPayment, fromMonth: Date): Map<string, number> => {
  const map = new Map<string, number>();
  const mensal = parcelaMensal(p);
  const remaining = p.parcelas - p.ja_pago;
  for (let k = 0; k < remaining; k++) {
    const due = addMonths(fromMonth, k);
    const key = monthKey(due);
    map.set(key, (map.get(key) || 0) + mensal);
  }
  return map;
};

export interface MonthlyProjection {
  mes: string;
  valor: number;
  key: string;
}

/** Projeção de compromisso mensal — parcelas + recorrentes + extras */
export const projectNext12Months = (
  payments: DBPayment[],
  extras: { valor_mensal: number }[],
  from = new Date()
): MonthlyProjection[] => {
  const base = new Date(from.getFullYear(), from.getMonth(), 1);
  const totals = new Map<string, number>();

  payments.filter(isAtivo).forEach((p) => {
    if (isAssinatura(p)) {
      const mensal = parcelaMensal(p);
      const remaining = p.parcelas > 1 ? p.parcelas - p.ja_pago : 12;
      const months = p.parcelas <= 1 ? 12 : Math.min(12, Math.max(0, remaining));
      for (let i = 0; i < months; i++) {
        const d = addMonths(base, i);
        totals.set(monthKey(d), (totals.get(monthKey(d)) || 0) + mensal);
      }
      return;
    }
    scheduleParcelado(p, base).forEach((v, k) => {
      totals.set(k, (totals.get(k) || 0) + v);
    });
  });

  extras.forEach((e) => {
    for (let i = 0; i < 12; i++) {
      const d = addMonths(base, i);
      const key = monthKey(d);
      totals.set(key, (totals.get(key) || 0) + Number(e.valor_mensal));
    }
  });

  return Array.from({ length: 12 }, (_, i) => {
    const d = addMonths(base, i);
    const key = monthKey(d);
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      valor: Math.round(totals.get(key) || 0),
      key,
    };
  });
};
