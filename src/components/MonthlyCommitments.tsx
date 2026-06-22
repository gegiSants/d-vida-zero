import { useState } from "react";
import { DBExtra, DBPayment } from "@/hooks/useFinanceData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { brl } from "@/lib/format";
import { FinanceStats, isAtivo, isAssinatura, parcelaMensal, SEMAFORO_LABEL } from "@/lib/financeMetrics";
import { isNaturezaProdutiva, resolveNatureza, Categoria, CATEGORIA_GROUPS, CATEGORIA_LABEL } from "@/types/financeTaxonomy";

interface Props {
  extras: DBExtra[];
  payments: DBPayment[];
  salario: number;
  stats: FinanceStats;
  onAddExtra: (item: string, valor: number, categoria?: string, natureza?: string) => void;
  onRemoveExtra: (id: string) => void;
  onSalarioChange: (v: number) => void;
}

export const MonthlyCommitments = ({
  extras, payments, salario, stats, onAddExtra, onRemoveExtra, onSalarioChange,
}: Props) => {
  const [name, setName] = useState("");
  const [val, setVal] = useState("");
  const [extraCategoria, setExtraCategoria] = useState<Categoria>(Categoria.MORADIA);
  const [editingSal, setEditingSal] = useState(false);
  const [salDraft, setSalDraft] = useState(String(salario || ""));

  const submit = () => {
    if (!name || !val) return;
    onAddExtra(name, Number(val), extraCategoria, "essencial");
    setName("");
    setVal("");
  };

  const derivedFromDebts = payments
    .filter(isAtivo)
    .map((p) => ({
      id: p.id,
      item: p.item,
      valor: parcelaMensal(p),
      tag: isAssinatura(p) ? "recorrente" : isNaturezaProdutiva(resolveNatureza(p)) ? "produtivo" : "consumo",
    }));

  const total = stats.compromissoMensalTotal;
  const livre = salario - total;
  const pctComp = stats.pctRendaComprometida;

  const semaforoClass =
    stats.semaforos.comprometimento === "success" ? "text-success" :
    stats.semaforos.comprometimento === "warning" ? "text-yellow-700" : "text-destructive";

  return (
    <Card className="p-6 border shadow-soft">
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-semibold">Comprometimento mensal</h2>
          <p className="text-sm text-muted-foreground">Consumo, investimento e despesas fixas.</p>
        </div>
        <div className="text-right shrink-0">
          <label className="text-xs text-muted-foreground block">Salário líquido</label>
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

      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div className="rounded-md border p-2">
          <span className="text-muted-foreground">Consumo + obrigação</span>
          <p className="font-semibold tabular-nums">{brl(stats.compromissoConsumo + stats.compromissoMensalExtras)}</p>
        </div>
        <div className="rounded-md border p-2">
          <span className="text-muted-foreground">Investimento (ferramentas)</span>
          <p className="font-semibold tabular-nums">{brl(stats.compromissoInvestimento)}</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
        {derivedFromDebts.map((d) => (
          <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium truncate">{d.item}</span>
              <span className="text-xs text-muted-foreground shrink-0">({d.tag})</span>
            </div>
            <span className="font-semibold tabular-nums shrink-0">{brl(d.valor)}</span>
          </div>
        ))}
        {extras.map((it) => (
          <div key={it.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
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

      <div className="flex gap-2 mb-5 flex-wrap">
        <Input placeholder="Despesa fixa (ex: aluguel)" value={name} onChange={(e) => setName(e.target.value)} className="flex-1 min-w-[140px]" />
        <select
          value={extraCategoria}
          onChange={(e) => setExtraCategoria(e.target.value as Categoria)}
          className="h-10 rounded-md border bg-background px-2 text-sm"
        >
          {CATEGORIA_GROUPS.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {g.items.map((cat) => (
                <option key={cat} value={cat}>{CATEGORIA_LABEL[cat]}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <Input type="number" placeholder="R$" value={val} onChange={(e) => setVal(e.target.value)} className="w-28" />
        <Button onClick={submit} variant="secondary"><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total comprometido</span>
          <span className="text-xl font-bold text-primary tabular-nums">{brl(total)}</span>
        </div>
        {salario > 0 && (
          <>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, pctComp)}%` }} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-semibold ${semaforoClass}`}>
                {SEMAFORO_LABEL[stats.semaforos.comprometimento]} · {pctComp.toFixed(0)}% da renda
              </span>
              <span className={`font-semibold tabular-nums ${livre < 0 ? "text-destructive" : "text-success"}`}>
                Sobra: {brl(livre)}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
