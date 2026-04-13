import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from JWT
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader ?? "" } },
    });
    const { data: { user } } = await anonClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { analysisType, organizationId, data: contextData } = await req.json();

    // Fetch financial context from DB
    const [bankRes, invoiceRes, txRes, healthRes] = await Promise.all([
      supabase.from("bank_accounts").select("name, current_balance, bank_name").eq("organization_id", organizationId).eq("is_active", true),
      supabase.from("invoices").select("invoice_type, status, total_amount, amount_paid, due_date, invoice_date, contact_name").eq("organization_id", organizationId).order("invoice_date", { ascending: false }).limit(50),
      supabase.from("bank_transactions").select("transaction_date, amount, counterparty_name, status, description").eq("organization_id", organizationId).order("transaction_date", { ascending: false }).limit(100),
      supabase.from("financial_health_snapshots").select("*").eq("organization_id", organizationId).order("snapshot_date", { ascending: false }).limit(3),
    ]);

    const financialContext = {
      bankAccounts: bankRes.data ?? [],
      recentInvoices: invoiceRes.data ?? [],
      recentTransactions: txRes.data ?? [],
      healthSnapshots: healthRes.data ?? [],
      additionalContext: contextData,
    };

    const systemPrompts: Record<string, string> = {
      "cash-runway": `Je bent een financieel analist voor een Nederlands bedrijf (ZZP/eenmanszaak). Analyseer de financiële data en geef een gedetailleerde cash runway analyse in het Nederlands. Geef:
1. Huidige kaspositie
2. Gemiddelde maandelijkse uitgaven (burn rate)
3. Cash runway in maanden
4. Risicofactoren
5. Concrete aanbevelingen om runway te verlengen
Gebruik exacte bedragen waar mogelijk. Wees specifiek en actionable.`,

      "revenue-forecast": `Je bent een financieel analist. Analyseer de omzet- en factuurhistorie en geef een omzetprognose voor de komende 3-6 maanden in het Nederlands. Geef:
1. Trend analyse (stijgend/dalend/stabiel)
2. Verwachte maandelijkse omzet
3. Seizoenspatronen
4. Risico's en kansen
5. Concrete groeistrategieën
Baseer je op de werkelijke data.`,

      "expense-optimization": `Je bent een financieel adviseur. Analyseer de uitgaven en transacties en geef optimalisatieadvies in het Nederlands. Geef:
1. Top kostenposten
2. Onnodige of hoge uitgaven
3. Besparingsmogelijkheden met geschatte besparingen
4. Vergelijking met branche-gemiddelden
5. Prioriteit actiepunten`,

      "tax-strategy": `Je bent een Nederlands fiscaal adviseur voor ZZP'ers. Analyseer de financiële situatie en geef belastingadvies in het Nederlands. Geef:
1. Geschatte belastingdruk
2. Beschikbare aftrekposten (zelfstandigenaftrek, startersaftrek, MKB-winstvrijstelling)
3. BTW-optimalisatie
4. Voorlopige aanslag advies
5. Kwartaal actiepunten voor fiscale optimalisatie`,

      "health-assessment": `Je bent een financieel analist. Geef een overall financiële gezondheidsanalyse in het Nederlands. Geef:
1. Score per categorie (liquiditeit, winstgevendheid, groei, schuld)
2. Sterke punten
3. Verbeterpunten
4. Vergelijking met vorige periodes
5. Top 3 prioriteiten voor financiële gezondheid`,
    };

    const systemPrompt = systemPrompts[analysisType] || systemPrompts["health-assessment"];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyseer de volgende financiële data:\n\n${JSON.stringify(financialContext, null, 2)}`,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit bereikt, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits op, voeg credits toe in Lovable instellingen." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("financial-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
