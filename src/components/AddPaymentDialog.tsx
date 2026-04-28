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
import { Plus } from "lucide-react";

interface Props {
  onAdd: (p: Omit<DBPayment, "id">) => void;
}

const empty = {
  item: "",
  tipo: "Dívida",
  total: "",
  parcelas: "",
  ja_pago: "0",
  origem: "",
};

export const AddPaymentDialog = ({ onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  const submit = () => {
    if (!form.item || !form.total || !form.parcelas) return;
    onAdd({
      item: form.item,
      tipo: form.tipo,
      total: Number(form.total),
      parcelas: Number(form.parcelas),
      ja_pago: Number(form.ja_pago) || 0,
      origem: form.origem,
      start_date: new Date().toISOString().slice(0, 10),
    });
    setForm(empty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary hover:opacity-90 shadow-soft">
          <Plus className="h-4 w-4 mr-1" /> Nova dívida
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar pagamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Item</Label>
            <Input placeholder="Ex: MacBook" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Origem</Label>
              <Input placeholder="Ex: Nubank" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Total (R$)</Label>
              <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Parcelas</Label>
              <Input type="number" value={form.parcelas} onChange={(e) => setForm({ ...form, parcelas: e.target.value })} />
            </div>
            <div className="grid gap-1.5">
              <Label>Já pago</Label>
              <Input type="number" value={form.ja_pago} onChange={(e) => setForm({ ...form, ja_pago: e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={submit} className="bg-gradient-primary hover:opacity-90 w-full">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
