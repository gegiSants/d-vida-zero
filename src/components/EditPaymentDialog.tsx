import { useState } from "react";
import { DBPayment } from "@/hooks/useFinanceData";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";
import { isAssinatura } from "@/lib/financeMetrics";
import {
  TipoObrigacao,
  Categoria,
  NaturezaFinanceira,
  OrigemTipo,
  TIPO_OBRIGACAO_LABEL,
  CATEGORIA_GROUPS,
  CATEGORIA_LABEL,
  ORIGEM_TIPO_LABEL,
  NATUREZA_LABEL,
  DEFAULTS_POR_CATEGORIA,
  syncLegacyTipo,
  syncLegacyTipoFinanceiro,
  resolveTipoObrigacao,
  resolveCategoria,
  resolveNatureza,
} from "@/types/financeTaxonomy";

interface Props {
  payment: DBPayment;
  onUpdate: (id: string, patch: Partial<DBPayment>) => void;
}

const isParcelado = (parcelas: number) => parcelas > 1;

const totalFromParcela = (valorParcela: number, parcelas: number) => {
  if (parcelas > 1 && valorParcela > 0) return Math.round(valorParcela * parcelas * 100) / 100;
  return null;
};

export const EditPaymentDialog = ({ payment, onUpdate }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    ...payment,
    tipo_obrigacao: resolveTipoObrigacao(payment),
    categoria: resolveCategoria(payment),
    natureza_financeira: resolveNatureza(payment),
    origem_tipo: payment.origem_tipo ?? OrigemTipo.OUTRO,
  });
  const [valorParcela, setValorParcela] = useState(
    payment.parcelas > 1 ? payment.total / payment.parcelas : 0
  );
  const recorrente = isAssinatura(form as DBPayment);
  const parcelado = !recorrente && isParcelado(form.parcelas);

  const handleCategoriaChange = (categoria: Categoria) => {
    const defaults = DEFAULTS_POR_CATEGORIA[categoria];
    setForm({
      ...form,
      categoria,
      natureza_financeira: defaults?.natureza ?? form.natureza_financeira,
      origem_tipo: defaults?.origem_tipo ?? form.origem_tipo,
    });
  };

  const submit = () => {
    const natureza = form.natureza_financeira as NaturezaFinanceira;
    const tipoObrigacao = form.tipo_obrigacao as TipoObrigacao;
    onUpdate(payment.id, {
      item: form.item,
      tipo: syncLegacyTipo(tipoObrigacao),
      tipo_obrigacao: tipoObrigacao,
      total: Number(form.total),
      origem: form.origem,
      origem_tipo: form.origem_tipo,
      categoria: form.categoria,
      tipo_financeiro: syncLegacyTipoFinanceiro(natureza),
      natureza_financeira: natureza,
      parcelas: Number(form.parcelas),
      ja_pago: Number(form.ja_pago),
    });
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setForm({
            ...payment,
            tipo_obrigacao: resolveTipoObrigacao(payment),
            categoria: resolveCategoria(payment),
            natureza_financeira: resolveNatureza(payment),
            origem_tipo: payment.origem_tipo ?? OrigemTipo.OUTRO,
          });
          setValorParcela(payment.parcelas > 1 ? payment.total / payment.parcelas : 0);
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar contrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Item</Label>
            <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de obrigação</Label>
              <Select
                value={form.tipo_obrigacao}
                onValueChange={(v) => {
                  const tipo_obrigacao = v as TipoObrigacao;
                  if (tipo_obrigacao === TipoObrigacao.RECORRENTE) {
                    setForm({ ...form, tipo_obrigacao, parcelas: 1 });
                  } else {
                    setForm({ ...form, tipo_obrigacao });
                  }
                }}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TIPO_OBRIGACAO_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Natureza financeira</Label>
              <Select value={form.natureza_financeira} onValueChange={(v) => setForm({ ...form, natureza_financeira: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(NATUREZA_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => handleCategoriaChange(v as Categoria)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIA_GROUPS.map((g) => (
                    <SelectGroup key={g.label}>
                      <SelectLabel>{g.label}</SelectLabel>
                      {g.items.map((cat) => (
                        <SelectItem key={cat} value={cat}>{CATEGORIA_LABEL[cat]}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Origem (tipo)</Label>
              <Select value={form.origem_tipo} onValueChange={(v) => setForm({ ...form, origem_tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORIGEM_TIPO_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Credor / origem (nome)</Label>
            <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </div>

          {recorrente ? (
            <div className="grid gap-1.5">
              <Label>Valor mensal (R$)</Label>
              <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: Number(e.target.value) })} />
            </div>
          ) : (
            <div className={`grid gap-3 ${parcelado ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
              <div className="grid gap-1.5">
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.parcelas}
                  onChange={(e) => {
                    const parcelas = Number(e.target.value);
                    const patch = { ...form, parcelas };
                    if (isParcelado(parcelas) && valorParcela > 0) {
                      const t = totalFromParcela(valorParcela, parcelas);
                      if (t != null) patch.total = t;
                    }
                    setForm(patch);
                  }}
                />
              </div>
              {parcelado && (
                <div className="grid gap-1.5">
                  <Label>Parcela mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorParcela || ""}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setValorParcela(v);
                      const t = totalFromParcela(v, form.parcelas);
                      if (t != null) setForm({ ...form, total: t });
                    }}
                  />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>Total (R$)</Label>
                <Input
                  type="number"
                  value={form.total}
                  readOnly={parcelado}
                  className={parcelado ? "bg-muted" : undefined}
                  onChange={(e) => !parcelado && setForm({ ...form, total: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Já pago</Label>
                <Input type="number" value={form.ja_pago} onChange={(e) => setForm({ ...form, ja_pago: Number(e.target.value) })} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-primary hover:bg-primary/90">
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
