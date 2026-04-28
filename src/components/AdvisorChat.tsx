import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

interface Props {
  snapshot: Record<string, unknown>;
}

const SUGGESTIONS = [
  "Vale a pena quitar alguma dívida com minha reserva?",
  "Em quantos meses fico sem dívidas?",
  "Como organizar melhor meu salário?",
];

export const AdvisorChat = ({ snapshot }: Props) => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/financial-advisor`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], snapshot }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) toast.error("Muitas requisições. Tente novamente em instantes.");
        else if (resp.status === 402) toast.error("Créditos da IA esgotados.");
        else toast.error("Erro ao falar com a consultora.");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: acc } : x)));
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch (e) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-0 shadow-soft flex flex-col" style={{ minHeight: 500 }}>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Consultora IA</h2>
          <p className="text-xs text-muted-foreground">Analisa seus números e te ajuda a decidir</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 mb-3 max-h-96 pr-1">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Sparkles className="h-3 w-3" /> Sugestões pra começar:
            </div>
            {SUGGESTIONS.map((s) => (
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
                ? "bg-gradient-primary text-primary-foreground ml-8"
                : "bg-secondary mr-8"
            }`}
          >
            {m.role === "assistant" ? (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1">
                <ReactMarkdown>{m.content || "..."}</ReactMarkdown>
              </div>
            ) : (
              m.content
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 border-t pt-3">
        <Input
          placeholder="Pergunta algo sobre suas finanças..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          disabled={loading}
        />
        <Button onClick={() => send(input)} disabled={loading || !input.trim()} className="bg-gradient-primary">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};
