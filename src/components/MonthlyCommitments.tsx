import { useState } from "react";
import { DBExtra, DBPayment } from "@/hooks/useFinanceData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";

interface Props {
  extras: DBExtra[];
  payments: DBPayment[];
  salario: number;
  onAddExtra: (item: string, valor: number) => void;
  onRemoveExtra: (id: string) => void;
  onSalarioChange: (v: number) => void;
}

export const MonthlyCommitments = ({
  extras, payments, salario, onAddExtra, onRemoveExtra, onSalarioChange,
}: Props) => {
  const [name, setName] = useState("");
  const [val, setVal] = useState("");
  const [editingSal, setEditingSal] = useState(false);
  const [salDraft, setSalDraft] = useState(String(salario || ""));

  const submit = () => {
    if (!name || !val) return;
    onAddExtra(name, Number(val));
    setName("");
    setVal("");
  };

  const derivedFromDebts = payments
    .filter((p) => p.parcelas - p.ja_pago > 0)
    .map((p) => ({ id: p.id, item: p.item, valor: p.total / p.parcelas }));

  const totalExtras = extras.reduce((s, i) => s + Number(i.valor_mensal), 0);
  const totalDebts = derivedFromDebts.reduce((s, i) => s + i.valor, 0);
  const total = totalExtras + totalDebts;
  const livre = salario - total;
  const pctComp = salario > 0 ? Math.min(100, (total / salario) * 100) : 0;

  const semaforo =
    pctComp < 30 ? { c: "text-success", t: "🟢 Saudável" } :
    pctComp < 50 ? { c: "text-yellow-600", t: "🟡 Atenção" } :
    { c: "text-destructive", t: "🔴 Comprometido" };

  return (
    <Card className="p-6 border-0 shadow-soft">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold">🗓️ Compromisso mensal</h2>
          <p className="text-sm text-muted-foreground">Quanto da sua renda já está comprometida.</p>
        </div>
        <div className="text-right shrink-0">
          <label className="text-xs text-muted-foreground block">Salário</label>
          {editingSal ? (
            <div className="flex gap-1">
              <Input type="number" value={salDraft} onChange={(e) => setSalDraft(e.target.value)} className="w-28 text-right" />
              <Button size="sm" onClick={() => { onSalarioChange(Number(salDraft) || 0); setEditingSal(false); }}>OK</Button>
            </div>
          ) : (
            <button onClick={() => { setSalDraft(String(salario)); setEditingSal(true); }}
              className="font-semibold text-primary text-lg hover:underline">
              {brl(salario)}
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {derivedFromDebts.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{d.item}</span>
              <span className="text-xs text-muted-foreground">(dívida)</span>
            </div>
            <span className="font-semibold tabular-nums">{brl(d.valor)}</span>
          </div>
        ))}
        {extras.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/40">
            <span className="text-sm font-medium">{it.item}</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold tabular-nums">{brl(Number(it.valor_mensal))}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveExtra(it.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        <Input placeholder="Ex: Aluguel, Netflix..." value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="number" placeholder="R$" value={val} onChange={(e) => setVal(e.target.value)} className="w-28" />
        <Button onClick={submit} variant="secondary"><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total comprometido</span>
          <span className="text-xl font-bold text-primary">{brl(total)}</span>
        </div>
        {salario > 0 && (
          <>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-primary transition-all" style={{ width: `${pctComp}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${semaforo.c}`}>{semaforo.t} • {pctComp.toFixed(0)}%</span>
              <span className={`font-semibold ${livre < 0 ? "text-destructive" : "text-success"}`}>
                Sobra: {brl(livre)}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
