import { Card } from "@/components/ui/card";
import { DBPayment } from "@/hooks/useFinanceData";
import { CalendarCheck } from "lucide-react";
import { brl } from "@/lib/format";

export const Timeline = ({ payments }: { payments: DBPayment[] }) => {
  const items = payments
    .filter((p) => p.parcelas - p.ja_pago > 0)
    .map((p) => {
      const start = new Date(p.start_date);
      const endIdx = p.parcelas - 1;
      const end = new Date(start.getFullYear(), start.getMonth() + endIdx, 1);
      const parcelaMensal = p.total / p.parcelas;
      const mesesRestantes = p.parcelas - p.ja_pago;
      return { ...p, end, parcelaMensal, mesesRestantes };
    })
    .sort((a, b) => a.end.getTime() - b.end.getTime());

  if (items.length === 0) return null;

  return (
    <Card className="p-6 border-0 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold">Quando cada dívida acaba</h3>
      </div>
      <ol className="space-y-3">
        {items.map((it, idx) => (
          <li key={it.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-gradient-primary" />
              {idx < items.length - 1 && <div className="w-px flex-1 bg-border mt-1 min-h-8" />}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <span className="font-medium">{it.item}</span>
                <span className="text-xs text-muted-foreground">
                  termina em{" "}
                  <span className="font-semibold text-primary">
                    {it.end.toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                  </span>
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {it.mesesRestantes}× de {brl(it.parcelaMensal)} • libera {brl(it.parcelaMensal)}/mês depois
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
};
