export type PaymentType = "Dívida" | "Cartão" | "Assinatura" | "Outro";

export type {
  TipoObrigacao,
  Categoria,
  OrigemTipo,
  NaturezaFinanceira,
} from "./financeTaxonomy";

export interface Payment {
  id: string;
  item: string;
  tipo: PaymentType;
  tipo_obrigacao?: string;
  total: number;
  parcelas: number;
  jaPago: number;
  origem: string;
  origem_tipo?: string;
  categoria: string;
  natureza_financeira?: string;
}

export interface MonthlyCommitment {
  id: string;
  item: string;
  valorMensal: number;
  categoria?: string;
  natureza_financeira?: string;
}
