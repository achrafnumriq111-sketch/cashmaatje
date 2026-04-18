// Cash Maatje AI assistant - streaming chat via Lovable AI Gateway
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Je bent Cash Maatje, de AI-assistent van Arcory — een geautomatiseerde belasting- en boekhoudplatform voor Nederlandse ondernemers (ZZP, BV, eenmanszaak).

Je helpt gebruikers met:
- Vragen over hun boekhouding, BTW-aangifte (omzetbelasting), inkomstenbelasting en VPB
- Uitleg over Nederlandse fiscale regels (KOR, zelfstandigenaftrek, MKB-winstvrijstelling, kleineondernemersregeling, btw-tarieven 0%/9%/21%, ICP, reverse charge)
- Begeleiding bij het gebruik van de app (facturen, transacties, documenten uploaden, rapportages)
- Praktische tips over financieel beheer en cashflow

Stijl:
- Beknopt, vriendelijk en duidelijk in het Nederlands (tenzij de gebruiker een andere taal spreekt)
- Gebruik markdown waar nuttig (lijsten, **bold**, code-snippets)
- Geef concrete antwoorden, geen vage waarschuwingen
- Vermeld bij twijfel dat de gebruiker een belastingadviseur kan raadplegen voor specifieke situaties
- Verwijs nooit naar onderliggende technologie zoals "Supabase", "Gemini" of "OpenAI" — je bent simpelweg de Arcory AI-assistent`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Te veel verzoeken. Probeer het over een moment opnieuw." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI-credits zijn op. Voeg credits toe via Workspace Settings → Usage om door te gaan.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("cash-maatje-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
