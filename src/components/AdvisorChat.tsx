import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { FinanceStats } from "@/lib/financeMetrics";
import { getAiSuggestions, UserLifeProfile } from "@/types/userProfile";

type Msg = { role: "user" | "assistant"; content: string };

const TypingIndicator = () => (
  <div className="flex items-center gap-1 p-3 rounded-2xl bg-secondary mr-8 w-fit" aria-label="Gerando análise">
    {[0, 150, 300].map((delay) => (
      <span
        key={delay}
        className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
        style={{ animationDelay: `${delay}ms` }}
      />
    ))}
  </div>
);

const buildErrorPayload = (
  erro: string,
  status: number | null,
  pergunta: string,
  historico: Msg[],
  snapshot: Record<string, unknown>
) =>
  JSON.stringify(
    {
      erro,
      status,
      timestamp: new Date().toISOString(),
      pergunta,
      historico_chat: historico,
      snapshot_financeiro: snapshot,
    },
    null,
    2
  );

const notifyAiError = (mensagem: string, json: string) => {
  toast.error(mensagem, {
    duration: 12000,
    action: {
      label: "Copiar JSON",
      onClick: () => {
        navigator.clipboard.writeText(json).then(
          () => toast.success("JSON copiado — cole em outra IA para análise."),
          () => toast.error("Não foi possível copiar. Veja o console (F12).")
        );
      },
    },
  });
  console.error("[Análise orientada]", mensagem, json);
};

interface Props {
  snapshot: Record<string, unknown>;
  profile: UserLifeProfile;
  stats: FinanceStats;
}

export const AdvisorChat = ({ snapshot, profile, stats }: Props) => {
  const { session } = useAuth();
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = getAiSuggestions(profile, stats);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    if (!session?.access_token) {
      toast.error("Sessão ainda não carregou. Aguarde alguns segundos e tente de novo.");
      return;
    }
    const userMsg: Msg = { role: "user", content: text };
    const historico = [...messages, userMsg];
    setMessages(historico);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ messages: historico, snapshot }),
      });

      if (!resp.ok) {
        const payload = await resp.json().catch(() => null);
        const erroMsg =
          resp.status === 429
            ? "Muitas requisições. Tente novamente em instantes."
            : resp.status === 402
              ? "Créditos da IA esgotados."
              : (payload?.error as string) || "Erro ao falar com a consultora.";
        notifyAiError(
          erroMsg,
          buildErrorPayload(erroMsg, resp.status, text, historico, snapshot)
        );
        setLoading(false);
        return;
      }

      const payload = await resp.json();
      if (payload?.error) {
        const erroMsg = String(payload.error);
        notifyAiError(
          erroMsg,
          buildErrorPayload(erroMsg, null, text, historico, snapshot)
        );
        setLoading(false);
        return;
      }

      const assistantText = payload?.content || "Sem resposta da IA.";
      setMessages((m) => [...m, { role: "assistant", content: assistantText }]);
    } catch (e) {
      const erroMsg = e instanceof Error ? e.message : "Erro de conexão";
      notifyAiError(
        "Erro de conexão com a consultora.",
        buildErrorPayload(erroMsg, null, text, historico, snapshot)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-0 shadow-soft flex flex-col" style={{ minHeight: 500 }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Análise orientada</h2>
          <p className="text-xs text-muted-foreground">
            {profile.perfil_completo
              ? "Orientação personalizada ao seu perfil e dados cadastrados"
              : "Complete o perfil de vida para análises mais precisas"}
          </p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-4 border border-border rounded-md p-3 bg-muted/30">
        Análise orientada com base nos dados cadastrados. Não constitui consultoria contábil, fiscal, jurídica ou recomendação de investimento. Decisões financeiras são de responsabilidade do usuário.
      </p>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-96 pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <MessageSquare className="h-3 w-3" /> Sugestões para o seu contexto:
            </div>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left text-sm p-3 rounded-xl bg-accent/40 hover:bg-accent transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-2xl text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground ml-8"
                : "bg-secondary mr-8"
            }`}
          >
            {m.role === "assistant" ? (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}
        {loading && <TypingIndicator />}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <Input
          placeholder="Pergunta algo sobre suas finanças..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          disabled={loading}
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="bg-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
