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
import { Sparkles } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState("");

  useEffect(() => {
    if (!loading && user) navigate("/", { replace: true });
  }, [user, loading, navigate]);

  const signUp = async () => {
    setBusy(true);
    setSignupSuccess("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setBusy(false);
    if (error) {
      if (error.message.toLowerCase().includes("rate limit")) {
        return toast.error("Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente de novo.");
      }
      return toast.error(error.message);
    }
    setSignupSuccess("Conta criada com sucesso. Agora faça login com seu email e senha.");
    toast.success("Conta criada! Você já pode entrar 💜");
  };

  const signIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 border-0 shadow-glow">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/60 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Controle financeiro</span>
          </div>
          <h1 className="text-2xl font-bold">
            Bem-vinda de volta <span className="text-gradient">💜</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Entre para acessar suas finanças</p>
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

          {(["signin", "signup"] as const).map((mode) => (
            <TabsContent key={mode} value={mode} className="space-y-3">
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="text" placeholder="voce@email.com" />
              </div>
              <div className="grid gap-1.5">
                <Label>Senha</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
              </div>
              <Button
                disabled={busy || !email || !password}
                onClick={mode === "signin" ? signIn : signUp}
                className="bg-gradient-primary hover:opacity-90 w-full"
              >
                {mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default Auth;
