import { Card } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { DBExtra, DBPayment } from "@/hooks/useFinanceData";
import { brl } from "@/lib/format";
import { useMemo } from "react";
import { saldoItem, projectNext12Months } from "@/lib/financeMetrics";
import { labelCategoria } from "@/types/financeTaxonomy";

const COLORS = ["hsl(24 42% 38%)", "hsl(220 18% 45%)", "hsl(24 38% 48%)", "hsl(220 12% 55%)", "hsl(24 32% 52%)"];

interface Props {
  payments: DBPayment[];
  extras: DBExtra[];
}

export const Charts = ({ payments, extras }: Props) => {
  const byCategoria = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => {
      const falta = saldoItem(p);
      if (falta > 0) {
        const label = labelCategoria(p.categoria ?? "outro");
        map.set(label, (map.get(label) || 0) + falta);
      }
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [payments]);

  const next12 = useMemo(
    () => projectNext12Months(payments, extras),
    [payments, extras]
  );

  if (payments.length === 0 && extras.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6 border-0 shadow-soft">
        <h3 className="text-base font-semibold mb-3">Saldo em aberto por categoria</h3>
        {byCategoria.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Nenhum saldo em aberto nas categorias ativas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byCategoria} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                {byCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => brl(v)} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Card>

      <Card className="p-6 border-0 shadow-soft">
        <h3 className="text-base font-semibold mb-1">Projeção — próximos 12 meses</h3>
        <p className="text-xs text-muted-foreground mb-3">Parcelas ativas + recorrentes + despesas fixas cadastradas</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={next12}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 12, border: "none", boxShadow: "var(--shadow-soft)" }} />
            <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
