import { Card } from "@/components/ui/card";
import { DBPayment } from "@/hooks/useFinanceData";
import { CalendarCheck } from "lucide-react";
import { brl } from "@/lib/format";
import {
  isAssinatura,
  isAtivo,
  parcelaMensal,
  parcelasRestantes,
  dataTerminoEstimada,
} from "@/lib/financeMetrics";

export const Timeline = ({ payments }: { payments: DBPayment[] }) => {
  const now = new Date();
  const items = payments
    .filter((p) => isAtivo(p) && !isAssinatura(p))
    .map((p) => {
      const end = dataTerminoEstimada(p, now)!;
      const parcelaMensalVal = parcelaMensal(p);
      const restantes = parcelasRestantes(p);
      return { ...p, end, parcelaMensal: parcelaMensalVal, mesesRestantes: restantes };
    })
    .sort((a, b) => a.end.getTime() - b.end.getTime());

  if (items.length === 0) return null;

  return (
    <Card className="p-6 border-0 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-base font-semibold">Quando cada dívida acaba</h3>
          <p className="text-xs text-muted-foreground">Com base nas parcelas restantes (não na data de cadastro)</p>
        </div>
      </div>
      <ol className="space-y-3">
        {items.map((it, idx) => (
          <li key={it.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center pt-1">
              <div className="h-2.5 w-2.5 rounded-full bg-primary" />
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
                {it.mesesRestantes}× de {brl(it.parcelaMensal)} • {it.ja_pago}/{it.parcelas} pagas
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
};
