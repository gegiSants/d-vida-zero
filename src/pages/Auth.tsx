import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const mapRecoverError = (error: { message?: string; code?: string }) => {
  const msg = (error.message ?? "").toLowerCase();
  const code = error.code ?? "";

  if (msg.includes("rate limit") || code === "over_email_send_rate_limit") {
    return "Limite de emails atingido (2/hora no plano padrão). Aguarde cerca de 1 hora.";
  }
  if (
    code === "email_address_not_authorized" ||
    msg.includes("not authorized") ||
    msg.includes("error sending recovery email") ||
    code === "unexpected_failure"
  ) {
    return "O Supabase não envia email de recuperação para usuários finais no SMTP padrão — só para emails da equipe do projeto. Configure SMTP customizado (ex.: Resend, grátis) em Authentication → SMTP, ou use a troca de senha pelo ícone de chave estando logada.";
  }
  return error.message ?? "Não foi possível enviar o email de recuperação.";
};

const MIN_PASSWORD = 6;
const redirectUrl = () => `${window.location.origin}/auth`;

type View = "signin" | "signup" | "forgot" | "reset";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [view, setView] = useState<View>("signin");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user && view !== "reset") {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, view]);

  const signUp = async () => {
    setBusy(true);
    setSignupSuccess("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return toast.error("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.");
      }
      return toast.error(error.message);
    }
    setSignupSuccess("Conta criada com sucesso. Agora faça login com seu email e senha.");
    toast.success("Conta criada. Faça login para continuar.");
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate("/", { replace: true });
  };

  const requestPasswordReset = async () => {
    if (!email.trim()) {
      toast.error("Informe o email da sua conta.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: redirectUrl(),
    });
    setBusy(false);

    if (error) {
      return toast.error(mapRecoverError(error), { duration: 12000 });
    }

    setForgotSent(true);
    toast.success("Se o email estiver cadastrado, você receberá um link em instantes.");
  };

  const saveNewPassword = async () => {
    if (newPassword.length < MIN_PASSWORD) {
      toast.error(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("A confirmação não confere com a nova senha.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);

    if (error) return toast.error(error.message);

    toast.success("Senha redefinida. Entrando no painel...");
    navigate("/", { replace: true });
  };

  if (view === "reset") {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border shadow-soft">
          <div className="text-center mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Mapa Zero</p>
            <h1 className="text-2xl font-bold">Nova senha</h1>
            <p className="text-sm text-muted-foreground mt-1">Defina sua nova senha de acesso</p>
          </div>
          <div className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`Mínimo ${MIN_PASSWORD} caracteres`}
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Confirmar nova senha</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
              />
            </div>
            <Button
              disabled={busy || !newPassword || !confirmPassword}
              onClick={saveNewPassword}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              Salvar e entrar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (view === "forgot") {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 border shadow-soft">
          <div className="text-center mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Mapa Zero</p>
            <h1 className="text-2xl font-bold">Recuperar senha</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enviaremos um link para o email cadastrado
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-sm mx-auto">
              Requer SMTP configurado no Supabase. Sem isso, use o ícone de chave no painel (logada) ou peça suporte.
            </p>
          </div>

          {forgotSent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Se <strong>{email}</strong> estiver cadastrado, verifique sua caixa de entrada e o spam.
                O link abre esta página para você definir uma nova senha.
              </p>
              <Button variant="outline" className="w-full" onClick={() => { setView("signin"); setForgotSent(false); }}>
                Voltar ao login
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="voce@email.com"
                />
              </div>
              <Button
                disabled={busy || !email}
                onClick={requestPasswordReset}
                className="bg-primary hover:bg-primary/90 w-full"
              >
                Enviar link de recuperação
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => setView("signin")}>
                Voltar ao login
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border shadow-soft">
        <div className="text-center mb-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Mapa Zero</p>
          <h1 className="text-2xl font-bold">Acesso ao sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">Entre com seu email e senha</p>
        </div>

        {signupSuccess && (
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-4 text-center shadow-soft">
            <p className="text-lg font-semibold text-primary">{signupSuccess}</p>
            <p className="mt-1 text-sm text-muted-foreground">Se você acabou de se cadastrar, use a aba Entrar para acessar.</p>
          </div>
        )}

        <Tabs defaultValue="signin">
          <TabsList className="grid grid-cols-2 w-full mb-4">
            <TabsTrigger value="signin">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Criar conta</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" />
            </div>
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Senha</Label>
                <button
                  type="button"
                  onClick={() => setView("forgot")}
                  className="text-xs text-primary hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <Button
              disabled={busy || !email || !password}
              onClick={signIn}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              Entrar
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="voce@email.com" />
            </div>
            <div className="grid gap-1.5">
              <Label>Senha</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            </div>
            <Button
              disabled={busy || !email || !password}
              onClick={signUp}
              className="bg-primary hover:bg-primary/90 w-full"
            >
              Criar conta
            </Button>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
