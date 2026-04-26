// FIX THE CHAOS — generate 7-day recovery plan
// Reads all open chaos_items for an org, asks Gemini 2.5 Pro to design a
// concrete 7-day rescue plan referencing real items, archives any prior
// active plan and stores the new one.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Je bent een Nederlandse crisismanager voor ondernemers. Je krijgt een lijst openstaande chaos-items (brieven, deurwaarders, belastingschulden, leveranciers).
Maak een KALM en KRACHTIG 7-daags herstelplan. Eén actie per dag, in juiste volgorde:
- Dag 1 = de meest urgente, vaak een telefoontje of betalingsregeling.
- Daarna: opvolgacties, onderbouwing, bezwaar, leveranciers, accountantspakket, prevention.
- Verwijs ALTIJD naar het item via item_id zodat de gebruiker direct kan klikken.
- Eén concrete zin per dag. Geen bullet-soep. Geen "raadpleeg uw adviseur".
- Schrijf een korte 'summary' (max 2 zinnen) die rust geeft: "Je bent niet alleen, dit is je weg eruit."`;

const TOOL = {
  type: "function",
  function: {
    name: "register_recovery_plan",
    description: "Registreer een 7-daags herstelplan",
    parameters: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Geruststellende samenvatting (max 2 zinnen)" },
        days: {
          type: "array",
          minItems: 7,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              day: { type: "integer", minimum: 1, maximum: 7 },
              title: { type: "string", description: "Korte titel — max 8 woorden" },
              item_id: { type: ["string", "null"], description: "UUID van chaos_item indien gekoppeld" },
              action_type: {
                type: "string",
                enum: [
                  "call",
                  "payment_arrangement",
                  "objection",
                  "delay_request",
                  "email_sent",
                  "payment_made",
                  "prepare_handover",
                  "other",
                ],
              },
              why: { type: "string", description: "Waarom deze dag deze actie" },
            },
            required: ["day", "title", "action_type", "why"],
          },
        },
      },
      required: ["summary", "days"],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) return json({ error: "organization_id required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

    const admin = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: "unauthorized" }, 401);

    const { data: member } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!member) return json({ error: "forbidden" }, 403);

    const { data: items } = await admin
      .from("chaos_items")
      .select(
        "id, document_title, category, sender_name, priority, panic_score, urgency_lane, amount_due, payment_deadline, legal_deadline, recommended_action, phone_number"
      )
      .eq("organization_id", organization_id)
      .eq("is_resolved", false)
      .order("panic_score", { ascending: false, nullsFirst: false })
      .limit(40);

    if (!items || items.length === 0) {
      return json({ error: "Geen openstaande items om plan voor te maken" }, 400);
    }

    const itemsForPrompt = items.map((it) => ({
      id: it.id,
      title: it.document_title,
      sender: it.sender_name,
      category: it.category,
      priority: it.priority,
      panic_score: it.panic_score,
      lane: it.urgency_lane,
      amount: it.amount_due,
      deadline: it.payment_deadline ?? it.legal_deadline,
      action: it.recommended_action,
      phone: it.phone_number,
    }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Open chaos items (JSON):\n${JSON.stringify(itemsForPrompt, null, 2)}\n\nGenereer het 7-daags herstelplan. Gebruik echte item_id's wanneer relevant.`,
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "register_recovery_plan" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      if (aiRes.status === 429) return json({ error: "AI rate limit" }, 429);
      if (aiRes.status === 402) return json({ error: "AI credits op" }, 402);
      return json({ error: "AI fout" }, 500);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) return json({ error: "geen plan ontvangen" }, 500);
    const args = JSON.parse(toolCall.function.arguments);

    // archive previous active
    await admin
      .from("chaos_recovery_plans")
      .update({ status: "archived" })
      .eq("organization_id", organization_id)
      .eq("status", "active");

    // attach calendar dates
    const today = new Date();
    const days = (args.days ?? []).map((d: any) => {
      const dt = new Date(today);
      dt.setDate(today.getDate() + (d.day - 1));
      return { ...d, date: dt.toISOString().slice(0, 10), done: false };
    });

    const { data: plan, error: insErr } = await admin
      .from("chaos_recovery_plans")
      .insert({
        organization_id,
        generated_by: userData.user.id,
        summary: args.summary,
        days,
        status: "active",
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    return json({ ok: true, plan_id: plan?.id });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
