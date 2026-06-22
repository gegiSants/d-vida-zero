import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { PiggyBank, Calculator } from "lucide-react";
import { DBPayment } from "@/hooks/useFinanceData";
import { isAssinatura, isAtivo, parcelaMensal, saldoItem, FinanceStats, SEMAFORO_LABEL } from "@/lib/financeMetrics";

interface Props {
  reserva: number;
  onChange: (v: number) => void;
  payments: DBPayment[];
  compromissoMensal: number;
  stats: FinanceStats;
}

export const ReserveCard = ({ reserva, onChange, payments, compromissoMensal, stats }: Props) => {
  const [selected, setSelected] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(reserva || ""));

  const target = payments.find((p) => p.id === selected);
  const restanteValor = target ? saldoItem(target) : 0;
  const podeQuitar = target && !isAssinatura(target) && reserva >= restanteValor;
  const sobra = reserva - restanteValor;
  const economiaMensal = target ? parcelaMensal(target) : 0;

  return (
    <Card className="p-6 border shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <PiggyBank className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Reserva de emergência</h2>
          <p className="text-xs text-muted-foreground">Caixa disponível para quitação antecipada</p>
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2 mb-4">
          <Input
            type="number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="0"
            className="text-right font-semibold"
          />
          <Button
            onClick={() => {
              onChange(Number(draft) || 0);
              setEditing(false);
            }}
            className="bg-primary"
          >
            Salvar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft(String(reserva));
            setEditing(true);
          }}
          className="block w-full text-left mb-4 p-4 rounded-lg border border-border bg-muted/40 hover:bg-muted/60 transition"
        >
          <div className="text-3xl font-bold text-foreground tabular-nums">{brl(reserva)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {compromissoMensal > 0
              ? `${(reserva / compromissoMensal).toFixed(1)} meses · ${SEMAFORO_LABEL[stats.semaforos.reserva]}`
              : "Clique para editar"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Capacidade segura de nova parcela: {brl(stats.capacidadeCompraParcelada)}
          </div>
        </button>
      )}

      {payments.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Simulação de quitação</h3>
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full p-2 rounded-md border bg-background text-sm mb-3"
          >
            <option value="">Selecionar dívida...</option>
            {payments
              .filter((p) => isAtivo(p) && !isAssinatura(p))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.item} — saldo {brl(saldoItem(p))}
                </option>
              ))}
          </select>

          {target && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quitação à vista</span>
                <span className="font-semibold tabular-nums">{brl(restanteValor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Saldo na reserva após quitar</span>
                <span className={`font-semibold tabular-nums ${sobra < 0 ? "text-destructive" : "text-success"}`}>
                  {brl(sobra)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Libera por mês</span>
                <span className="font-semibold text-primary tabular-nums">+{brl(economiaMensal)}</span>
              </div>
              <div
                className={`mt-3 p-3 rounded-md text-xs font-medium border ${
                  podeQuitar
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }`}
              >
                {podeQuitar
                  ? `Reserva suficiente. Após quitar, sobram ${brl(sobra)}.`
                  : `Reserva insuficiente. Faltam ${brl(-sobra)} para quitação à vista.`}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
