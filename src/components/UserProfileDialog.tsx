import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserLifeProfile,
  MomentoVida,
  MoradiaSituacao,
  Dependentes,
  RendaTipo,
  ObjetivoPrincipal,
  MOMENTO_VIDA_LABEL,
  MORADIA_LABEL,
  DEPENDENTES_LABEL,
  RENDA_LABEL,
  OBJETIVO_LABEL,
} from "@/types/userProfile";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: UserLifeProfile;
  onSave: (patch: Partial<UserLifeProfile>) => Promise<boolean>;
  onboarding?: boolean;
}

export const UserProfileDialog = ({ open, onOpenChange, profile, onSave, onboarding }: Props) => {
  const [form, setForm] = useState(profile);
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    if (o) setForm(profile);
    onOpenChange(o);
  };

  const applyMoradia = (moradia: MoradiaSituacao) => {
    const mora_com_pais = moradia === MoradiaSituacao.COM_PAIS || moradia === MoradiaSituacao.UNIVERSITARIO;
    const paga_aluguel = moradia === MoradiaSituacao.ALUGUEL;
    setForm({
      ...form,
      moradia_situacao: moradia,
      mora_com_pais,
      paga_aluguel,
      paga_contas_casa: mora_com_pais ? false : form.paga_contas_casa,
    });
  };

  const submit = async () => {
    if (!form.momento_vida || !form.moradia_situacao) return;
    setSaving(true);
    const ok = await onSave({ ...form, perfil_completo: true });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const canSave = Boolean(form.momento_vida && form.moradia_situacao);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{onboarding ? "Conte um pouco sobre você" : "Seu perfil de vida"}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {onboarding
              ? "Isso ajuda a análise orientada a entender seu contexto — sem presumir contas que você não paga."
              : "Atualize quando sua situação mudar. A IA usa esses dados para personalizar orientações."}
          </p>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Momento de vida</Label>
            <Select value={form.momento_vida} onValueChange={(v) => setForm({ ...form, momento_vida: v as MomentoVida })}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(MOMENTO_VIDA_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>Moradia</Label>
            <Select value={form.moradia_situacao} onValueChange={(v) => applyMoradia(v as MoradiaSituacao)}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(MORADIA_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Tipo de renda</Label>
              <Select value={form.renda_tipo} onValueChange={(v) => setForm({ ...form, renda_tipo: v as RendaTipo })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RENDA_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Dependentes</Label>
              <Select value={form.dependentes} onValueChange={(v) => setForm({ ...form, dependentes: v as Dependentes })}>
                <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(DEPENDENTES_LABEL).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Objetivo principal agora</Label>
            <Select value={form.objetivo_principal} onValueChange={(v) => setForm({ ...form, objetivo_principal: v as ObjetivoPrincipal })}>
              <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
              <SelectContent>
                {Object.entries(OBJETIVO_LABEL).map(([k, label]) => (
                  <SelectItem key={k} value={k}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Responsabilidades na casa</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.paga_contas_casa} onCheckedChange={(c) => setForm({ ...form, paga_contas_casa: !!c })} />
              Pago contas da casa (luz, água, internet, gás)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.paga_aluguel} onCheckedChange={(c) => setForm({ ...form, paga_aluguel: !!c })} />
              Pago aluguel ou financiamento de moradia
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.sustenta_familia} onCheckedChange={(c) => setForm({ ...form, sustenta_familia: !!c })} />
              Ajudo financeiramente pais ou familiares
            </label>
            {form.mora_com_pais && !form.paga_contas_casa && (
              <p className="text-xs text-muted-foreground">
                Entendido: você não arca com contas básicas de moradia. A IA não vai sugerir priorizar luz/água sem você cadastrar.
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label>Algo mais que a IA deve saber? (opcional)</Label>
            <Textarea
              placeholder="Ex: Sou jovem, moro com meus pais e só pago parcelas do celular e curso de inglês."
              value={form.contexto_livre}
              onChange={(e) => setForm({ ...form, contexto_livre: e.target.value })}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!onboarding && (
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Cancelar
            </Button>
          )}
          <Button onClick={submit} disabled={!canSave || saving} className="bg-primary w-full sm:w-auto">
            {onboarding ? "Salvar e continuar" : "Salvar perfil"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
