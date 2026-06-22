import { DBPayment } from "@/hooks/useFinanceData";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";
import { EditPaymentDialog } from "./EditPaymentDialog";
import { isAssinatura, parcelaMensal, saldoItem } from "@/lib/financeMetrics";
import { labelCategoria, labelNatureza, labelTipoObrigacao } from "@/types/financeTaxonomy";

interface Props {
  payments: DBPayment[];
  onUpdate: (id: string, patch: Partial<DBPayment>) => void;
  onRemove: (id: string) => void;
  encerrados?: boolean;
  capacidadeParcela?: number;
}

const formatEncerrado = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
};

export const PaymentsTable = ({ payments, onUpdate, onRemove, encerrados, capacidadeParcela }: Props) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">{encerrados ? "Nenhum contrato encerrado." : "Nenhum contrato ativo."}</p>
        {!encerrados && <p className="text-xs mt-1">Use &quot;Nova dívida&quot; para cadastrar.</p>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Item</TableHead>
            <TableHead>Obrigação</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Natureza</TableHead>
            <TableHead className="text-right">{encerrados ? "Volume" : "Total"}</TableHead>
            <TableHead className="text-right">Mensal</TableHead>
            {!encerrados && <TableHead className="w-[180px]">Progresso</TableHead>}
            <TableHead className="text-right">{encerrados ? "Encerrado em" : "Saldo"}</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const mensal = parcelaMensal(p);
            const saldo = saldoItem(p);
            const assinatura = isAssinatura(p);
            const falta = p.parcelas - p.ja_pago;
            const pct = p.parcelas > 0 ? (p.ja_pago / p.parcelas) * 100 : 0;

            const acimaCapacidade = capacidadeParcela != null && capacidadeParcela > 0 && mensal > capacidadeParcela && !encerrados && !assinatura;

            return (
              <TableRow key={p.id} className={acimaCapacidade ? "bg-destructive/5" : undefined}>
                <TableCell>
                  <div className="font-medium">{p.item}</div>
                  {p.origem && <div className="text-xs text-muted-foreground">{p.origem}</div>}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{labelTipoObrigacao(p.tipo_obrigacao ?? p.tipo)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{labelCategoria(p.categoria)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{labelNatureza(p.natureza_financeira ?? p.tipo_financeiro)}</Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{brl(p.total)}</TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-primary">
                  {brl(mensal)}
                  {acimaCapacidade && (
                    <div className="text-xs text-destructive font-normal">acima da capacidade</div>
                  )}
                </TableCell>
                {!encerrados && (
                  <TableCell>
                    {assinatura ? (
                      <Badge variant="outline" className="text-xs">Recorrente</Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => onUpdate(p.id, { ja_pago: Math.max(0, p.ja_pago - 1) })}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="flex-1">
                          <Progress value={pct} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{p.ja_pago}/{p.parcelas}</div>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7"
                          onClick={() => onUpdate(p.id, { ja_pago: Math.min(p.parcelas, p.ja_pago + 1) })}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right tabular-nums">
                  {encerrados ? (
                    <div className="text-sm">{formatEncerrado(p.encerrado_em)}</div>
                  ) : assinatura ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => onUpdate(p.id, { ja_pago: 1 })}>
                      Encerrar
                    </Button>
                  ) : (
                    <>
                      <div className="font-semibold">{brl(saldo)}</div>
                      <div className="text-xs text-muted-foreground">{falta} {falta === 1 ? "parcela" : "parcelas"}</div>
                    </>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <EditPaymentDialog payment={p} onUpdate={onUpdate} />
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onRemove(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
