// Contract Intelligence: Wet DBA + compliance analyse via Lovable AI Gateway
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const MODEL = "google/gemini-2.5-flash";

const SYSTEM = `Je bent een Nederlandse jurist en fiscaal adviseur. Analyseer contracten op:
1. Wet DBA / schijnzelfstandigheid (gezagsverhouding, vrije vervanging, ondernemersrisico)
2. Exclusiviteitsclausules
3. Fiscale risico's (BTW, belastingaftrek, geldigheid voor Belastingdienst)
4. Betalingsvoorwaarden (termijnen, boetes, marktconform)

Geef per categorie: status ("ok" | "warning" | "risk"), score (0-100), reasoning (1-3 zinnen NL), findings (array korte bullets NL).
Geef ook een overall_risk: "low" | "medium" | "high" en een samenvatting (max 3 zinnen NL).`;

const TOOL = {
  type: "function",
  function: {
    name: "report_contract_analysis",
    description: "Geeft de gestructureerde contract analyse",
    parameters: {
      type: "object",
      properties: {
        overall_risk: { type: "string", enum: ["low", "medium", "high"] },
        summary: { type: "string" },
        checks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string", enum: ["wet_dba", "exclusiviteit", "fiscaal", "betaling"] },
              label: { type: "string" },
              status: { type: "string", enum: ["ok", "warning", "risk"] },
              score: { type: "number" },
              reasoning: { type: "string" },
              findings: { type: "array", items: { type: "string" } },
            },
            required: ["category", "label", "status", "score", "reasoning", "findings"],
          },
        },
      },
      required: ["overall_risk", "summary", "checks"],
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string" || text.length < 50) {
      return new Response(JSON.stringify({ error: "Contracttekst is te kort (min 50 tekens)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const truncated = text.slice(0, 30000);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Analyseer dit contract:\n\n${truncated}` },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "report_contract_analysis" } },
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Te veel verzoeken. Probeer het zo opnieuw." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI-tegoed op. Voeg credits toe in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      console.error("AI error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway fout" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "Geen analyse ontvangen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const analysis = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
