import { useState } from "react";
import { MonthlyCommitment } from "@/types/payment";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";

interface Props {
  items: MonthlyCommitment[];
  onAdd: (item: MonthlyCommitment) => void;
  onRemove: (id: string) => void;
  derivedFromDebts: { item: string; valor: number }[];
  salario: number;
  onSalarioChange: (v: number) => void;
}

export const MonthlyCommitments = ({
  items,
  onAdd,
  onRemove,
  derivedFromDebts,
  salario,
  onSalarioChange,
}: Props) => {
  const [name, setName] = useState("");
  const [val, setVal] = useState("");

  const submit = () => {
    if (!name || !val) return;
    onAdd({ id: crypto.randomUUID(), item: name, valorMensal: Number(val) });
    setName("");
    setVal("");
  };

  const totalExtras = items.reduce((s, i) => s + i.valorMensal, 0);
  const totalDebts = derivedFromDebts.reduce((s, i) => s + i.valor, 0);
  const total = totalExtras + totalDebts;
  const livre = salario - total;
  const pctComp = salario > 0 ? Math.min(100, (total / salario) * 100) : 0;

  return (
    <Card className="p-6 border-0 shadow-soft">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">🗓️ Compromisso mensal</h2>
          <p className="text-sm text-muted-foreground">
            Quanto da sua renda já está comprometida.
          </p>
        </div>
        <div className="text-right">
          <label className="text-xs text-muted-foreground block">Salário</label>
          <Input
            type="number"
            value={salario || ""}
            placeholder="0"
            onChange={(e) => onSalarioChange(Number(e.target.value) || 0)}
            className="w-32 text-right font-semibold"
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {derivedFromDebts.map((d, i) => (
          <div
            key={`d-${i}`}
            className="flex items-center justify-between p-3 rounded-lg bg-secondary"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{d.item}</span>
              <span className="text-xs text-muted-foreground">(dívida)</span>
            </div>
            <span className="font-semibold tabular-nums">{brl(d.valor)}</span>
          </div>
        ))}
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between p-3 rounded-lg bg-accent/40"
          >
            <span className="text-sm font-medium">{it.item}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{brl(it.valorMensal)}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(it.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <Input
          placeholder="Ex: Aluguel, Netflix..."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="number"
          placeholder="R$"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="w-28"
        />
        <Button onClick={submit} variant="secondary">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total comprometido</span>
          <span className="text-xl font-bold text-primary">{brl(total)}</span>
        </div>
        {salario > 0 && (
          <>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all"
                style={{ width: `${pctComp}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {pctComp.toFixed(0)}% da renda
              </span>
              <span
                className={`font-semibold ${
                  livre < 0 ? "text-destructive" : "text-success"
                }`}
              >
                Sobra: {brl(livre)}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
