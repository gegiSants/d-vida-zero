import { useState } from "react";
import { DBPayment } from "@/hooks/useFinanceData";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

interface Props {
  payment: DBPayment;
  onUpdate: (id: string, patch: Partial<DBPayment>) => void;
}

const CATEGORIAS = ["Trabalho", "Educação", "Lazer", "Necessidade", "Assinatura", "Outro"];
const TIPOS_FINANCEIROS = ["Investimento", "Consumo", "Obrigação"];

const isParcelado = (parcelas: number) => parcelas > 1;

const totalFromParcela = (valorParcela: number, parcelas: number) => {
  if (parcelas > 1 && valorParcela > 0) return Math.round(valorParcela * parcelas * 100) / 100;
  return null;
};

export const EditPaymentDialog = ({ payment, onUpdate }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(payment);
  const [valorParcela, setValorParcela] = useState(
    payment.parcelas > 1 ? payment.total / payment.parcelas : 0
  );
  const parcelado = isParcelado(form.parcelas);

  const submit = () => {
    onUpdate(payment.id, {
      item: form.item,
      tipo: form.tipo,
      total: Number(form.total),
      origem: form.origem,
      categoria: form.categoria,
      tipo_financeiro: form.tipo_financeiro,
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
          setForm(payment);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar pagamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Item</Label>
            <Input value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Dívida">Dívida</SelectItem>
                  <SelectItem value="Cartão">Cartão</SelectItem>
                  <SelectItem value="Assinatura">Assinatura</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Tipo Financeiro</Label>
              <Select value={form.tipo_financeiro} onValueChange={(v) => setForm({ ...form, tipo_financeiro: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_FINANCEIROS.map(tf => (
                    <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Origem</Label>
            <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </div>

          <div className={`grid gap-3 ${parcelado ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="grid gap-1.5">
              <Label>Parcelas</Label>
              <Input
                type="number"
                min={1}
                value={form.parcelas}
                onChange={(e) => {
                  const parcelas = Number(e.target.value);
                  const patch: typeof form = { ...form, parcelas };
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90">
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
