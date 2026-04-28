import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Payment, MonthlyCommitment } from "@/types/payment";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { AddPaymentDialog } from "@/components/AddPaymentDialog";
import { PaymentsTable } from "@/components/PaymentsTable";
import { MonthlyCommitments } from "@/components/MonthlyCommitments";
import { StatCard } from "@/components/StatCard";
import { Sparkles, Wallet, TrendingDown, Calendar } from "lucide-react";

const Index = () => {
  const [payments, setPayments] = useLocalStorage<Payment[]>("cp.payments", []);
  const [extras, setExtras] = useLocalStorage<MonthlyCommitment[]>("cp.extras", []);
  const [salario, setSalario] = useLocalStorage<number>("cp.salario", 0);

  const stats = useMemo(() => {
    const totalDevido = payments.reduce(
      (s, p) => s + (p.total / p.parcelas) * (p.parcelas - p.jaPago),
      0
    );
    const totalGeral = payments.reduce((s, p) => s + p.total, 0);
    const mensalDividas = payments.reduce(
      (s, p) => (p.parcelas - p.jaPago > 0 ? s + p.total / p.parcelas : s),
      0
    );
    return { totalDevido, totalGeral, mensalDividas };
  }, [payments]);

  const derived = useMemo(
    () =>
      payments
        .filter((p) => p.parcelas - p.jaPago > 0)
        .map((p) => ({ item: p.item, valor: p.total / p.parcelas })),
    [payments]
  );

  const addPayment = (p: Payment) => setPayments([...payments, p]);
  const updatePayment = (id: string, patch: Partial<Payment>) =>
    setPayments(payments.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const removePayment = (id: string) =>
    setPayments(payments.filter((p) => p.id !== id));

  const addExtra = (it: MonthlyCommitment) => setExtras([...extras, it]);
  const removeExtra = (id: string) =>
    setExtras(extras.filter((e) => e.id !== id));

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-6xl py-8 md:py-12">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card shadow-soft mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">
                Controle financeiro pessoal
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Controle de <span className="text-gradient">Pagamentos</span> 💜
            </h1>
            <p className="text-muted-foreground mt-1">
              Saiba o que deve, quanto falta e quanto paga por mês.
            </p>
          </div>
          <AddPaymentDialog onAdd={addPayment} />
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Total das dívidas"
            value={stats.totalGeral}
            icon={Wallet}
          />
          <StatCard
            label="Falta pagar"
            value={stats.totalDevido}
            icon={TrendingDown}
          />
          <StatCard
            label="Compromisso mensal"
            value={stats.mensalDividas}
            icon={Calendar}
            highlight
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 border-0 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">📋 Suas dívidas</h2>
            <PaymentsTable
              payments={payments}
              onUpdate={updatePayment}
              onRemove={removePayment}
            />
          </Card>

          <MonthlyCommitments
            items={extras}
            onAdd={addExtra}
            onRemove={removeExtra}
            derivedFromDebts={derived}
            salario={salario}
            onSalarioChange={setSalario}
          />
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-10">
          Seus dados ficam salvos no seu navegador 🔒
        </footer>
      </div>
    </div>
  );
};

export default Index;
