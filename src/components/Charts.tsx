import { Card } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { DBPayment } from "@/hooks/useFinanceData";
import { brl } from "@/lib/format";
import { useMemo } from "react";

const COLORS = ["hsl(280 70% 55%)", "hsl(320 80% 65%)", "hsl(290 85% 70%)", "hsl(260 60% 60%)", "hsl(340 70% 65%)"];

export const Charts = ({ payments }: { payments: DBPayment[] }) => {
  const byCategoria = useMemo(() => {
    const map = new Map<string, number>();
    payments.forEach((p) => {
      const falta = (p.total / p.parcelas) * (p.parcelas - p.ja_pago);
      if (falta > 0) map.set(p.categoria, (map.get(p.categoria) || 0) + falta);
    });
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [payments]);

  const next12 = useMemo(() => {
    const months: { mes: string; valor: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      let total = 0;
      payments.forEach((p) => {
        const start = new Date(p.start_date);
        const monthsSinceStart = (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());
        const parcelaIndex = monthsSinceStart;
        // active if parcela ainda não foi paga e ainda dentro do plano
        if (parcelaIndex >= p.ja_pago && parcelaIndex < p.parcelas) {
          total += p.total / p.parcelas;
        }
      });
      months.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
        valor: Math.round(total),
      });
    }
    return months;
  }, [payments]);

  if (payments.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="p-6 border-0 shadow-soft">
        <h3 className="text-base font-semibold mb-3">📊 Falta pagar por categoria</h3>
        {byCategoria.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Tudo quitado! 🎉</p>
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
        <h3 className="text-base font-semibold mb-3">📅 Próximos 12 meses</h3>
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
