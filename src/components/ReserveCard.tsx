import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { PiggyBank, Sparkles } from "lucide-react";
import { DBPayment } from "@/hooks/useFinanceData";

interface Props {
  reserva: number;
  onChange: (v: number) => void;
  payments: DBPayment[];
}

export const ReserveCard = ({ reserva, onChange, payments }: Props) => {
  const [selected, setSelected] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(reserva || ""));

  const target = payments.find((p) => p.id === selected);
  const restanteParcelas = target ? target.parcelas - target.ja_pago : 0;
  const restanteValor = target ? (target.total / target.parcelas) * restanteParcelas : 0;
  const podeQuitar = target && reserva >= restanteValor;
  const sobra = reserva - restanteValor;
  const economiaMensal = target ? target.total / target.parcelas : 0;

  return (
    <Card className="p-6 border-0 shadow-soft">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <PiggyBank className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Reserva</h2>
          <p className="text-xs text-muted-foreground">Seu dinheiro guardado</p>
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
            className="bg-gradient-primary"
          >
            Salvar
          </Button>
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(String(reserva));
            setEditing(true);
          }}
          className="block w-full text-left mb-4 p-4 rounded-xl bg-gradient-soft hover:opacity-90 transition"
        >
          <div className="text-3xl font-bold text-primary">{brl(reserva)}</div>
          <div className="text-xs text-muted-foreground mt-1">Toque para editar</div>
        </button>
      )}

      {payments.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Simular quitação</h3>
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full p-2 rounded-lg border bg-background text-sm mb-3"
          >
            <option value="">Escolher dívida...</option>
            {payments
              .filter((p) => p.parcelas - p.ja_pago > 0)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.item} — falta {brl((p.total / p.parcelas) * (p.parcelas - p.ja_pago))}
                </option>
              ))}
          </select>

          {target && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quitar à vista</span>
                <span className="font-semibold">{brl(restanteValor)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sobra na reserva</span>
                <span className={`font-semibold ${sobra < 0 ? "text-destructive" : "text-success"}`}>
                  {brl(sobra)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Libera por mês</span>
                <span className="font-semibold text-primary">+{brl(economiaMensal)}</span>
              </div>
              <div
                className={`mt-3 p-3 rounded-lg text-xs font-medium ${
                  podeQuitar
                    ? "bg-success/10 text-success"
                    : "bg-destructive/10 text-destructive"
                }`}
              >
                {podeQuitar
                  ? `✅ Dá pra quitar e ainda sobra ${brl(sobra)} de reserva.`
                  : `⚠️ Faltam ${brl(-sobra)} na reserva pra quitar agora.`}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
