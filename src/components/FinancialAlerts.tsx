import { Card } from "@/components/ui/card";
import { AlertTriangle, Info } from "lucide-react";
import { FinanceStats } from "@/lib/financeMetrics";
import { UserLifeProfile } from "@/types/userProfile";
import { brl } from "@/lib/format";

interface Props {
  profile: UserLifeProfile;
  stats: FinanceStats;
}

export const FinancialAlerts = ({ profile, stats }: Props) => {
  const alerts: { type: "warning" | "info"; text: string }[] = [];

  if (!profile.perfil_completo) {
    alerts.push({
      type: "info",
      text: "Complete seu perfil de vida (ícone de lápis no topo) para análises mais personalizadas.",
    });
  }

  if (stats.pctRendaComprometida > 50) {
    alerts.push({
      type: "warning",
      text: `Comprometimento alto: ${stats.pctRendaComprometida.toFixed(0)}% da renda. Avalie cortes em itens discricionários.`,
    });
  }

  if (stats.rendaLivre < 0) {
    alerts.push({
      type: "warning",
      text: `Renda livre negativa (${brl(stats.rendaLivre)}). Compromissos cadastrados superam o salário informado.`,
    });
  }

  if (stats.mesesReserva < 3 && stats.compromissoMensalTotal > 0 && profile.objetivo_principal === "montar_reserva") {
    alerts.push({
      type: "info",
      text: `Reserva cobre ${stats.mesesReserva.toFixed(1)} meses de compromisso — abaixo da meta usual de 3–6 meses.`,
    });
  }

  if (profile.mora_com_pais && !profile.paga_contas_casa && stats.compromissoMensalTotal > 0) {
    alerts.push({
      type: "info",
      text: "Seu perfil indica que você não paga contas de moradia. Cadastre aqui só o que realmente sai do seu bolso.",
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2 mb-4">
      {alerts.map((a, i) => (
        <Card
          key={i}
          className={`p-3 border text-sm flex gap-2 items-start ${
            a.type === "warning"
              ? "border-yellow-500/40 bg-yellow-500/5 text-yellow-900"
              : "border-primary/30 bg-primary/5"
          }`}
        >
          {a.type === "warning" ? (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          )}
          <span>{a.text}</span>
        </Card>
      ))}
    </div>
  );
};
