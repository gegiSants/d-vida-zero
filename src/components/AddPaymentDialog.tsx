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
import { Plus } from "lucide-react";
import {
  TipoObrigacao,
  Categoria,
  OrigemTipo,
  NaturezaFinanceira,
  TIPO_OBRIGACAO_LABEL,
  CATEGORIA_GROUPS,
  CATEGORIA_LABEL,
  ORIGEM_TIPO_LABEL,
  NATUREZA_LABEL,
  DEFAULTS_POR_CATEGORIA,
  syncLegacyTipo,
  syncLegacyTipoFinanceiro,
} from "@/types/financeTaxonomy";

interface Props {
  onAdd: (p: Omit<DBPayment, "id">) => void;
}

const empty = {
  item: "",
  tipo_obrigacao: TipoObrigacao.PARCELADO,
  total: "",
  parcelas: "1",
  valor_parcela: "",
  ja_pago: "0",
  origem: "",
  origem_tipo: OrigemTipo.OUTRO,
  categoria: Categoria.OUTRO,
  natureza_financeira: NaturezaFinanceira.DISCRICIONARIO,
};

const isParcelado = (tipo: string, parcelas: string) =>
  tipo !== TipoObrigacao.RECORRENTE && Number(parcelas) > 1;

const totalFromParcela = (valorParcela: string, parcelas: string) => {
  const n = Number(parcelas);
  const v = Number(valorParcela);
  if (n > 1 && v > 0) return String(Math.round(v * n * 100) / 100);
  return "";
};

export const AddPaymentDialog = ({ onAdd }: Props) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const recorrente = form.tipo_obrigacao === TipoObrigacao.RECORRENTE;
  const parcelado = isParcelado(form.tipo_obrigacao, form.parcelas);

  const handleCategoriaChange = (categoria: Categoria) => {
    const defaults = DEFAULTS_POR_CATEGORIA[categoria];
    setForm({
      ...form,
      categoria,
      natureza_financeira: defaults?.natureza ?? form.natureza_financeira,
      origem_tipo: defaults?.origem_tipo ?? form.origem_tipo,
      tipo_obrigacao: defaults?.tipo_obrigacao ?? form.tipo_obrigacao,
    });
  };

  const handleTipoObrigacaoChange = (tipo_obrigacao: TipoObrigacao) => {
    if (tipo_obrigacao === TipoObrigacao.RECORRENTE) {
      setForm({ ...form, tipo_obrigacao, parcelas: "1", valor_parcela: "", ja_pago: "0" });
    } else {
      setForm({ ...form, tipo_obrigacao });
    }
  };

  const submit = () => {
    if (!form.item || !form.total) return;
    if (!recorrente && !form.parcelas) return;
    const natureza = form.natureza_financeira as NaturezaFinanceira;
    const tipoObrigacao = form.tipo_obrigacao as TipoObrigacao;
    onAdd({
      item: form.item,
      tipo: syncLegacyTipo(tipoObrigacao),
      tipo_obrigacao: tipoObrigacao,
      total: Number(form.total),
      parcelas: recorrente ? 1 : Number(form.parcelas),
      ja_pago: Number(form.ja_pago) || 0,
      origem: form.origem,
      origem_tipo: form.origem_tipo,
      categoria: form.categoria,
      tipo_financeiro: syncLegacyTipoFinanceiro(natureza),
      natureza_financeira: natureza,
      start_date: new Date().toISOString().slice(0, 10),
    });
    setForm(empty);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> Novo contrato
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar contrato</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Item</Label>
            <Input placeholder="Ex: MacBook, Netflix, aluguel" value={form.item} onChange={(e) => setForm({ ...form, item: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de obrigação</Label>
              <Select value={form.tipo_obrigacao} onValueChange={(v) => handleTipoObrigacaoChange(v as TipoObrigacao)}>
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
                        <SelectItem key={cat} value={cat}>
                          {CATEGORIA_LABEL[cat]}
                        </SelectItem>
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
            <Input placeholder="Ex: Nubank, Netflix" value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
          </div>

          {recorrente ? (
            <div className="grid gap-1.5">
              <Label>Valor mensal (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 49,90"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Informe o valor <strong>mensal</strong> da assinatura. Para planos anuais já cadastrados com 12 parcelas, o sistema divide o total automaticamente.
              </p>
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
                    const parcelas = e.target.value;
                    const next = { ...form, parcelas };
                    if (isParcelado(form.tipo_obrigacao, parcelas) && form.valor_parcela) {
                      next.total = totalFromParcela(form.valor_parcela, parcelas);
                    } else if (!isParcelado(form.tipo_obrigacao, parcelas)) {
                      next.valor_parcela = "";
                    }
                    setForm(next);
                  }}
                />
              </div>
              {parcelado && (
                <div className="grid gap-1.5">
                  <Label>Parcela mensal (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.valor_parcela}
                    onChange={(e) => {
                      const valor_parcela = e.target.value;
                      setForm({
                        ...form,
                        valor_parcela,
                        total: totalFromParcela(valor_parcela, form.parcelas),
                      });
                    }}
                  />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label>Total contratado (R$)</Label>
                <Input
                  type="number"
                  value={form.total}
                  readOnly={parcelado}
                  className={parcelado ? "bg-muted" : undefined}
                  onChange={(e) => !parcelado && setForm({ ...form, total: e.target.value })}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Parcelas já pagas</Label>
                <Input type="number" value={form.ja_pago} onChange={(e) => setForm({ ...form, ja_pago: e.target.value })} />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={submit} className="bg-primary hover:bg-primary/90 w-full">
            Adicionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
