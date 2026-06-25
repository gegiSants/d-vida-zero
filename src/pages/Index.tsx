import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceData } from "@/hooks/useFinanceData";
import { AddPaymentDialog } from "@/components/AddPaymentDialog";
import { PaymentsTable } from "@/components/PaymentsTable";
import { MonthlyCommitments } from "@/components/MonthlyCommitments";
import { MetricCard } from "@/components/MetricCard";
import { ReserveCard } from "@/components/ReserveCard";
import { Charts } from "@/components/Charts";
import { Timeline } from "@/components/Timeline";
import { AdvisorChat } from "@/components/AdvisorChat";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { FinancialAlerts } from "@/components/FinancialAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Wallet, TrendingDown, Calendar, LogOut, History, Shield, Percent,
  Banknote, Clock, ShoppingCart, Target, CreditCard, TrendingUp, Activity, Sparkles, Pencil, ChevronDown,
} from "lucide-react";
import { useEffect } from "react";
import { computeFinanceStats, isAtivo, SEMAFORO_CLASS } from "@/lib/financeMetrics";
import { brl } from "@/lib/format";
import { buildProfileContextForAi } from "@/types/userProfile";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const fd = useFinanceData();
  const [tabAtivo, setTabAtivo] = useState("ativas");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!fd.loading && !fd.profile.perfil_completo) {
      setProfileOpen(true);
    }
  }, [fd.loading, fd.profile.perfil_completo]);

  const stats = useMemo(
    () => computeFinanceStats(fd.payments, fd.extras, fd.profile.salario, fd.profile.reserva),
    [fd.payments, fd.extras, fd.profile.salario, fd.profile.reserva]
  );

  const pagamentosAtivos = fd.payments.filter(isAtivo);
  const pagamentosEncerrados = fd.payments.filter((p) => !isAtivo(p));

  const snapshot = useMemo(() => ({
    salario: fd.profile.salario,
    reserva: fd.profile.reserva,
    perfil_vida: buildProfileContextForAi(fd.profile),
    saldo_em_aberto: Math.round(stats.saldoEmAberto),
    exposicao_ativa: Math.round(stats.exposicaoAtiva),
    historico_encerrado: Math.round(stats.historicoEncerrado),
    compromisso_mensal_total: Math.round(stats.compromissoMensalTotal),
    compromisso_consumo: Math.round(stats.compromissoConsumo),
    compromisso_investimento: Math.round(stats.compromissoInvestimento),
    renda_livre: Math.round(stats.rendaLivre),
    margem_seguranca_pct: Number(stats.margemSeguranca.toFixed(1)),
    meses_reserva: Number(stats.mesesReserva.toFixed(1)),
    taxa_endividamento_anual_pct: Number(stats.taxaEndividamentoAnual.toFixed(1)),
    pct_renda_comprometida: Number(stats.pctRendaComprometida.toFixed(1)),
    tempo_ate_quitacao_meses: stats.tempoAteQuitacaoMeses,
    capacidade_compra_parcelada: Math.round(stats.capacidadeCompraParcelada),
    cobertura_quitacao_reserva_pct: Number(stats.coberturaQuitacaoReserva.toFixed(1)),
    liberacao_mensal_3_meses: Math.round(stats.liberacaoMensal3Meses),
    peso_cartao_pct: Number(stats.pesoCartao.toFixed(1)),
    indice_risco: stats.indiceRisco,
    saude_financeira: stats.riscoLabel,
    despesas_extras_mensais: fd.extras.map((e) => ({ item: e.item, valor: Number(e.valor_mensal) })),
    dividas: fd.payments.map((p) => ({
      item: p.item,
      tipo_obrigacao: p.tipo_obrigacao ?? p.tipo,
      categoria: p.categoria,
      natureza_financeira: p.natureza_financeira ?? p.tipo_financeiro,
      origem_tipo: p.origem_tipo,
      origem: p.origem,
      total: Number(p.total),
      parcelas: p.parcelas,
      ja_pago: p.ja_pago,
      encerrado_em: p.encerrado_em,
      parcela_mensal: Math.round(p.total / Math.max(p.parcelas, 1)),
      falta_pagar: Math.round((p.total / Math.max(p.parcelas, 1)) * Math.max(p.parcelas - p.ja_pago, 0)),
      status: isAtivo(p) ? "ativo" : "encerrado",
    })),
  }), [fd, stats]);

  if (loading || !user) {
    return <div className="min-h-screen bg-gradient-soft flex items-center justify-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container max-w-6xl py-6 md:py-10">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
              Mapa Zero · Gestão financeira pessoal
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Controle de Pagamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão operacional, indicadores de saúde financeira e histórico de contratos.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setProfileOpen(true)} title="Editar perfil de vida">
              <Pencil className="h-4 w-4" />
            </Button>
            {user?.email && <ChangePasswordDialog email={user.email} />}
            <AddPaymentDialog onAdd={fd.addPayment} />
            <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate("/auth"))}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <p className="text-xs text-muted-foreground mb-4 border-l-2 border-primary pl-3">
          Painel de apoio à decisão. Não substitui consultoria contábil, fiscal ou planejamento financeiro formal.
        </p>

        {fd.loadError && (
          <Card className="p-4 mb-4 border-destructive/40 bg-destructive/5 text-sm">
            <p className="font-medium text-destructive">Não foi possível carregar seus dados</p>
            <p className="text-muted-foreground mt-1">{fd.loadError}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => fd.refresh()}>
              Tentar novamente
            </Button>
          </Card>
        )}

        <FinancialAlerts profile={fd.profile} stats={stats} />

        {/* Saúde financeira — destaque */}
        <Card className={`p-5 mb-6 border-2 ${SEMAFORO_CLASS[stats.riscoSemaforo]}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saúde financeira</p>
                <p className="text-2xl font-bold">{stats.riscoLabel}</p>
                <p className="text-xs text-muted-foreground">Índice de risco: {stats.indiceRisco}/100</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Comprometimento</p>
                <p className="font-semibold">{stats.pctRendaComprometida.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Renda livre</p>
                <p className="font-semibold tabular-nums">{brl(stats.rendaLivre)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Meses reserva</p>
                <p className="font-semibold">{stats.mesesReserva.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Quita em</p>
                <p className="font-semibold">{stats.tempoAteQuitacaoMeses > 0 ? `${stats.tempoAteQuitacaoMeses} meses` : "—"}</p>
              </div>
            </div>
          </div>
        </Card>

        <section className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Operacional</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Exposição ativa" hint="Contratos em aberto" value={stats.exposicaoAtiva} icon={Wallet} semaforo="info" />
            <MetricCard label="Saldo em aberto" hint="Parcelas devidas" value={stats.saldoEmAberto} icon={TrendingDown} semaforo={stats.semaforos.endividamento} />
            <MetricCard label="Comprometimento mensal" hint="Fixos do mês" value={stats.compromissoMensalTotal} icon={Calendar} semaforo={stats.semaforos.comprometimento} highlight />
            <MetricCard label="Renda livre" hint="Salário − compromissos" value={stats.rendaLivre} icon={Banknote} semaforo={stats.semaforos.rendaLivre} />
          </div>
        </section>

        <Collapsible className="mb-6 group">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-sm font-medium hover:bg-muted/50 transition">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Indicadores detalhados
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4 space-y-4">
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reserva e endividamento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Meses de reserva"
              hint="Reserva ÷ compromisso"
              display={stats.mesesReserva > 0 ? `${stats.mesesReserva.toFixed(1)} meses` : "—"}
              icon={Shield}
              semaforo={stats.semaforos.reserva}
            />
            <MetricCard
              label="Endividamento anual"
              hint="Saldo ÷ renda anual"
              display={stats.taxaEndividamentoAnual > 0 ? `${stats.taxaEndividamentoAnual.toFixed(1)}%` : "—"}
              icon={Percent}
              semaforo={stats.semaforos.endividamento}
            />
            <MetricCard
              label="Cobertura p/ quitar"
              hint="Reserva ÷ saldo em aberto"
              display={`${stats.coberturaQuitacaoReserva.toFixed(0)}%`}
              icon={Target}
              semaforo={stats.semaforos.coberturaReserva}
            />
            <MetricCard label="Histórico encerrado" hint="Contratos quitados" value={stats.historicoEncerrado} icon={History} semaforo="info" />
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Capacidade e prazo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Capacidade de parcela"
              hint="Até 30% da renda livre"
              value={stats.capacidadeCompraParcelada}
              icon={ShoppingCart}
              semaforo={stats.semaforos.rendaLivre}
            />
            <MetricCard
              label="Tempo até quitação"
              hint="Maior prazo restante"
              display={stats.tempoAteQuitacaoMeses > 0 ? `${stats.tempoAteQuitacaoMeses} meses` : "—"}
              icon={Clock}
              semaforo={stats.semaforos.tempoQuitacao}
            />
            <MetricCard
              label="Margem de segurança"
              hint="% da renda livre"
              display={`${stats.margemSeguranca.toFixed(0)}%`}
              icon={TrendingUp}
              semaforo={stats.semaforos.margemSeguranca}
            />
            <MetricCard
              label="Libera em 3 meses"
              hint="Parcelas que encerram"
              value={stats.liberacaoMensal3Meses}
              icon={Sparkles}
              semaforo="info"
            />
          </div>
        </section>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Composição do compromisso</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricCard
              label="Endiv. produtivo"
              hint="% investimento no total"
              display={`${stats.pctCompromissoProdutivo.toFixed(0)}%`}
              icon={TrendingUp}
              semaforo={stats.semaforos.produtivo}
            />
            <MetricCard
              label="Peso do cartão"
              hint="% cartão no compromisso"
              display={`${stats.pesoCartao.toFixed(0)}%`}
              icon={CreditCard}
              semaforo={stats.semaforos.pesoCartao}
            />
            <MetricCard
              label="Consumo + obrigação"
              hint="% não produtivo"
              display={`${stats.pctCompromissoConsumo.toFixed(0)}%`}
              icon={Banknote}
              semaforo={stats.semaforos.produtivo}
            />
          </div>
        </section>
          </CollapsibleContent>
        </Collapsible>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2 p-6 border shadow-soft">
            <h2 className="text-lg font-semibold mb-4">Contratos</h2>
            <Tabs value={tabAtivo} onValueChange={setTabAtivo}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="ativas">Ativos ({pagamentosAtivos.length})</TabsTrigger>
                <TabsTrigger value="encerrados">Encerrados ({pagamentosEncerrados.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="ativas" className="mt-4">
                <PaymentsTable payments={pagamentosAtivos} onUpdate={fd.updatePayment} onRemove={fd.removePayment} capacidadeParcela={stats.capacidadeCompraParcelada} />
              </TabsContent>
              <TabsContent value="encerrados" className="mt-4">
                <PaymentsTable payments={pagamentosEncerrados} onUpdate={fd.updatePayment} onRemove={fd.removePayment} encerrados />
              </TabsContent>
            </Tabs>
          </Card>

          <MonthlyCommitments
            extras={fd.extras}
            payments={fd.payments}
            salario={fd.profile.salario}
            stats={stats}
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
            compromissoMensal={stats.compromissoMensalTotal}
            stats={stats}
          />
          <div className="lg:col-span-2">
            <Timeline payments={fd.payments} />
          </div>
        </div>

        <div className="mb-6">
          <Charts payments={fd.payments} extras={fd.extras} />
        </div>

        <div className="mb-6">
          <AdvisorChat snapshot={snapshot} profile={fd.profile} stats={stats} />
        </div>

        <UserProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          profile={fd.profile}
          onSave={fd.saveProfile}
          onboarding={!fd.profile.perfil_completo}
        />

        <footer className="text-center text-xs text-muted-foreground mt-10 space-y-1">
          <p>Dados criptografados em trânsito · acesso restrito à sua conta</p>
          <p>Mapa Zero não presta consultoria contábil ou fiscal. Valores são declarados pelo usuário.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
