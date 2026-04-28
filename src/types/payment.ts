export type PaymentType = "Dívida" | "Cartão" | "Assinatura" | "Outro";

export interface Payment {
  id: string;
  item: string;
  tipo: PaymentType;
  total: number;
  parcelas: number;
  jaPago: number;
  origem: string;
}

export interface MonthlyCommitment {
  id: string;
  item: string;
  valorMensal: number;
}
