import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceData } from "@/hooks/useFinanceData";
import { AddPaymentDialog } from "@/components/AddPaymentDialog";
import { PaymentsTable } from "@/components/PaymentsTable";
import { MonthlyCommitments } from "@/components/MonthlyCommitments";
import { StatCard } from "@/components/StatCard";
import { ReserveCard } from "@/components/ReserveCard";
import { Charts } from "@/components/Charts";
import { Timeline } from "@/components/Timeline";
import { AdvisorChat } from "@/components/AdvisorChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Wallet, TrendingDown, Calendar, LogOut } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const fd = useFinanceData();
  const [tabAtivo, setTabAtivo] = useState("ativas");

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const stats = useMemo(() => {
    const totalDevido = fd.payments.reduce(
      (s, p) => s + (p.total / p.parcelas) * (p.parcelas - p.ja_pago), 0
    );
    const totalGeral = fd.payments.reduce((s, p) => s + Number(p.total), 0);
    const mensalDividas = fd.payments.reduce(
      (s, p) => (p.parcelas - p.ja_pago > 0 ? s + p.total / p.parcelas : s), 0
    );
    return { totalDevido, totalGeral, mensalDividas };
  }, [fd.payments]);

  const pagamentosAtivos = fd.payments.filter(p => p.ja_pago < p.parcelas);
  const pagamentosPagos = fd.payments.filter(p => p.ja_pago === p.parcelas);

  const snapshot = useMemo(() => ({
    salario: fd.profile.salario,
    reserva: fd.profile.reserva,
    total_devido: Math.round(stats.totalDevido),
    compromisso_mensal_dividas: Math.round(stats.mensalDividas),
    despesas_extras_mensais: fd.extras.map((e) => ({ item: e.item, valor: Number(e.valor_mensal) })),
    dividas: fd.payments.map((p) => ({
      item: p.item, tipo: p.tipo, categoria: p.categoria, tipo_financeiro: p.tipo_financeiro, total: Number(p.total),
      parcelas: p.parcelas, ja_pago: p.ja_pago,
      parcela_mensal: Math.round(p.total / p.parcelas),
      falta_pagar: Math.round((p.total / p.parcelas) * (p.parcelas - p.ja_pago)),
    })),
  }), [fd, stats]);

  if (loading || !user) {
    return <div className="min-h-screen bg-gradient-soft flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-6xl py-6 md:py-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card shadow-soft mb-3">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary">Controle financeiro pessoal</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Controle de <span className="text-gradient">Pagamentos</span> 💜
            </h1>
            <p className="text-muted-foreground mt-1">Saiba o que deve, quanto falta e quanto paga por mês.</p>
          </div>
          <div className="flex gap-2">
            <AddPaymentDialog onAdd={fd.addPayment} />
            <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate("/auth"))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <StatCard label="Total das dívidas" value={stats.totalGeral} icon={Wallet} />
          <StatCard label="Falta pagar" value={stats.totalDevido} icon={TrendingDown} />
          <StatCard label="Compromisso mensal" value={stats.mensalDividas} icon={Calendar} highlight />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6 border-0 shadow-soft">
            <h2 className="text-lg font-semibold mb-4">📋 Suas dívidas</h2>
            <Tabs value={tabAtivo} onValueChange={setTabAtivo}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ativas">Ativas ({pagamentosAtivos.length})</TabsTrigger>
                <TabsTrigger value="pagas">Pagas ({pagamentosPagos.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="ativas" className="mt-4">
                <PaymentsTable payments={pagamentosAtivos} onUpdate={fd.updatePayment} onRemove={fd.removePayment} />
              </TabsContent>
              <TabsContent value="pagas" className="mt-4">
                <PaymentsTable payments={pagamentosPagos} onUpdate={fd.updatePayment} onRemove={fd.removePayment} />
              </TabsContent>
            </Tabs>
          </Card>

          <MonthlyCommitments
            extras={fd.extras}
            payments={fd.payments}
            salario={fd.profile.salario}
            onAddExtra={fd.addExtra}
            onRemoveExtra={fd.removeExtra}
            onSalarioChange={(v) => fd.saveProfile({ salario: v })}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <ReserveCard
            reserva={fd.profile.reserva}
            onChange={(v) => fd.saveProfile({ reserva: v })}
            payments={fd.payments}
          />
          <div className="lg:col-span-2">
            <Timeline payments={fd.payments} />
          </div>
        </div>

        <div className="mb-6">
          <Charts payments={fd.payments} />
        </div>

        <div className="mb-6">
          <AdvisorChat snapshot={snapshot} />
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-10">
          Seus dados ficam salvos com segurança 💜🔒
        </footer>
      </div>
    </div>
  );
};

export default Index;
