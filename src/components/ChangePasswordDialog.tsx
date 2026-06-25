import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MIN_LENGTH = 6;

interface Props {
  email: string;
}

export const ChangePasswordDialog = ({ email }: Props) => {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  const submit = async () => {
    if (next.length < MIN_LENGTH) {
      toast.error(`A nova senha deve ter pelo menos ${MIN_LENGTH} caracteres.`);
      return;
    }
    if (next !== confirm) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }
    if (next === current) {
      toast.error("A nova senha deve ser diferente da atual.");
      return;
    }

    setBusy(true);

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (verifyError) {
      setBusy(false);
      toast.error("Senha atual incorreta.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: next });
    setBusy(false);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    toast.success("Senha alterada com sucesso.");
    reset();
    setOpen(false);
  };

  const canSubmit = current && next && confirm && !busy;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Alterar senha">
          <KeyRound className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar senha</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Por segurança, confirme sua senha atual. Não enviamos email — a validação é feita aqui na sessão ativa.
          </p>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Senha atual</Label>
            <Input
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Nova senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              placeholder={`Mínimo ${MIN_LENGTH} caracteres`}
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!canSubmit} className="bg-primary">
            {busy ? "Salvando..." : "Alterar senha"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
