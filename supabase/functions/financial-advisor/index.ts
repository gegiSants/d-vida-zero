import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, snapshot } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY") ?? Deno.env.get("LOVABLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

    const sys = `Você é uma consultora financeira pessoal brasileira, calorosa, direta e prática.
Fale em português, use R$ para valores, nunca invente números — use apenas os dados abaixo.
Seja objetiva: dê recomendações concretas (quanto poupar, se vale quitar à vista, prazos).
Use markdown leve (negrito, listas curtas). Evite respostas longas demais.

DADOS REAIS DA USUÁRIA:
${JSON.stringify(snapshot, null, 2)}`;

    const resp = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GOOGLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gemini-3-flash-preview",
        stream: false,
        messages: [{ role: "system", content: sys }, ...messages],
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      console.error("Gemini error:", resp.status, t);
      if (resp.status === 429)
        return new Response(JSON.stringify({ error: "Muitas requisições, tente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      if (resp.status === 402)
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados. Adicione em Settings → Workspace → Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      return new Response(JSON.stringify({ error: `Erro na IA: ${t}` }), {
        status: resp.status || 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
