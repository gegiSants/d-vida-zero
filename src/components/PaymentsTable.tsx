import { Payment } from "@/types/payment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Minus, Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";

interface Props {
  payments: Payment[];
  onUpdate: (id: string, patch: Partial<Payment>) => void;
  onRemove: (id: string) => void;
}

export const PaymentsTable = ({ payments, onUpdate, onRemove }: Props) => {
  if (payments.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">Nenhuma dívida cadastrada ainda 💜</p>
        <p className="text-xs mt-1">Clique em "Nova dívida" para começar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Item</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Parcela</TableHead>
            <TableHead className="w-[180px]">Progresso</TableHead>
            <TableHead className="text-right">Falta</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => {
            const valorParcela = p.total / p.parcelas;
            const falta = p.parcelas - p.jaPago;
            const pct = (p.jaPago / p.parcelas) * 100;
            return (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="font-medium">{p.item}</div>
                  {p.origem && (
                    <div className="text-xs text-muted-foreground">{p.origem}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    {p.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {brl(p.total)}
                </TableCell>
                <TableCell className="text-right tabular-nums font-semibold text-primary">
                  {brl(valorParcela)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdate(p.id, { jaPago: Math.max(0, p.jaPago - 1) })
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        {p.jaPago}/{p.parcelas}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() =>
                        onUpdate(p.id, {
                          jaPago: Math.min(p.parcelas, p.jaPago + 1),
                        })
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  <div className="font-semibold">{brl(falta * valorParcela)}</div>
                  <div className="text-xs text-muted-foreground">
                    {falta} {falta === 1 ? "parcela" : "parcelas"}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
