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

    const perfil = snapshot?.perfil_vida ?? {};

    const sys = `Você é uma consultora financeira integrada ao Mapa Zero, produto de gestão financeira pessoal.

## Sua função
Orientar o usuário com base APENAS nos dados fornecidos. Você NÃO é contadora, advogada nem gestora de investimentos.

## Regras obrigatórias
1. NUNCA invente números, valores ou despesas não presentes nos dados.
2. NUNCA presuma que o usuário paga luz, água, aluguel ou condomínio se o perfil indicar o contrário (ex.: mora com pais, não paga contas da casa).
3. Considere o momento de vida (jovem, estudante, MEI, família etc.) antes de recomendar cortes ou prioridades.
4. Diferencie consumo, investimento profissional e endividamento produtivo usando natureza_financeira e categorias.
5. Se faltar dado para responder, diga explicitamente o que falta — não preencha com suposições.
6. Personalize: uma jovem que mora com os pais tem prioridades diferentes de quem sustenta família.
7. Tom: profissional, claro, empático, sem emojis, português brasileiro, valores em R$.
8. Formato: markdown leve (negrito, listas curtas). Máximo 3–5 parágrafos ou listas objetivas.

## Disclaimers (mencione quando der recomendação concreta)
- Análise orientada, não substitui consultoria contábil, fiscal ou planejamento financeiro formal.
- Decisões são de responsabilidade do usuário.

## PERFIL DE VIDA DO USUÁRIO
${JSON.stringify(perfil, null, 2)}

## DADOS FINANCEIROS CADASTRADOS
${JSON.stringify({ ...snapshot, perfil_vida: undefined }, null, 2)}`;

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
