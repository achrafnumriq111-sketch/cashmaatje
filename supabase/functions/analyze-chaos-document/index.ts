// FIX THE CHAOS — document analyzer
// Reads a chaos_uploads row, downloads the file, sends it to Gemini 2.5 Pro,
// classifies it and writes one or more chaos_items rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Je bent een ervaren Nederlandse boekhouder, fiscalist en debiteurenspecialist.
Je analyseert ALLEEN documenten gerelateerd aan ondernemerschap, belasting, boekhouding en zakelijke financiën.
Bron: belastingdienst.nl/ondernemers en officiële Nederlandse wet- en regelgeving.

Je krijgt 1 document (PDF, foto, scan of screenshot). Bepaal:
1. Wat is dit voor document?
2. Wie heeft het gestuurd (Belastingdienst, deurwaarder, leverancier, UWV, gemeente, bank, overig)?
3. Welk bedrag (indien) en welke deadline (indien)?
4. Hoe URGENT is dit? (red = wettelijke deadline binnen 7 dagen of dwangbevel/incasso, orange = belangrijke actie binnen 30 dagen, green = informatief / bevestiging)
5. Wat moet de ondernemer NU concreet doen? Geen vage adviezen. Eén heldere actie.
6. Indien bellen relevant: telefoonnummer + voorbeeld-script in het Nederlands.
7. Welke documenten heeft de ondernemer nodig om de actie uit te voeren?

Wees concreet, kort en operationeel. Geen "raadpleeg uw adviseur" tenzij echt onvermijdelijk.
Als het document NIET zakelijk/fiscaal/boekhoudkundig is, zet category="overig" en priority="green".`;

const TOOL = {
  type: "function",
  function: {
    name: "register_chaos_item",
    description: "Registreer 1 geanalyseerd chaos-document",
    parameters: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: [
            "belastingdienst",
            "deurwaarder",
            "leverancier",
            "uwv",
            "gemeente",
            "bank",
            "kvk",
            "overig",
          ],
        },
        sender_name: { type: "string", description: "Wie heeft het gestuurd" },
        document_title: { type: "string", description: "Korte titel" },
        summary: { type: "string", description: "1-3 zinnen samenvatting" },
        amount_due: { type: ["number", "null"] },
        currency: { type: "string", default: "EUR" },
        reference_number: { type: ["string", "null"] },
        payment_deadline: {
          type: ["string", "null"],
          description: "YYYY-MM-DD",
        },
        legal_deadline: {
          type: ["string", "null"],
          description: "YYYY-MM-DD",
        },
        priority: { type: "string", enum: ["red", "orange", "green"] },
        risk_level: { type: "integer", minimum: 1, maximum: 10 },
        risk_if_ignored: {
          type: "string",
          description: "Wat gebeurt er als je dit negeert",
        },
        recommended_action: {
          type: "string",
          description: "Eén concrete actie — bv 'Bel Belastingdienst Zakelijk en vraag betalingsregeling'",
        },
        phone_number: { type: ["string", "null"] },
        phone_script: {
          type: ["string", "null"],
          description: "Wat te zeggen aan de telefoon",
        },
        required_documents: {
          type: "array",
          items: { type: "string" },
        },
        ai_confidence: { type: "number", minimum: 0, maximum: 1 },
        ai_reasoning: { type: "string" },
      },
      required: [
        "category",
        "document_title",
        "priority",
        "recommended_action",
        "ai_confidence",
        "ai_reasoning",
      ],
      additionalProperties: false,
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { upload_id } = await req.json();
    if (!upload_id) {
      return json({ error: "upload_id required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) throw new Error("LOVABLE_API_KEY niet geconfigureerd");

    const admin = createClient(supabaseUrl, serviceKey);

    // Auth check via the caller's JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData.user) return json({ error: "unauthorized" }, 401);

    const { data: upload, error: upErr } = await admin
      .from("chaos_uploads")
      .select("*")
      .eq("id", upload_id)
      .maybeSingle();
    if (upErr || !upload) return json({ error: "upload not found" }, 404);

    // Verify membership
    const { data: member } = await admin
      .from("organization_members")
      .select("id")
      .eq("organization_id", upload.organization_id)
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (!member) return json({ error: "forbidden" }, 403);

    await admin
      .from("chaos_uploads")
      .update({ status: "analyzing", error_message: null })
      .eq("id", upload_id);

    // Download file
    const { data: fileBlob, error: dlErr } = await admin.storage
      .from("chaos-docs")
      .download(upload.file_path);
    if (dlErr || !fileBlob) throw new Error("kon bestand niet downloaden: " + dlErr?.message);

    const buf = new Uint8Array(await fileBlob.arrayBuffer());
    // base64
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    const b64 = btoa(binary);

    const mime = upload.mime_type || "application/octet-stream";

    const userContent: any[] = [
      {
        type: "text",
        text: `Bestandsnaam: ${upload.file_name}\nAnalyseer dit document en roep register_chaos_item aan.`,
      },
    ];
    if (mime.startsWith("image/")) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${b64}` },
      });
    } else if (mime === "application/pdf") {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:application/pdf;base64,${b64}` },
      });
    } else {
      // try as text
      const text = new TextDecoder().decode(buf).slice(0, 50000);
      userContent.push({ type: "text", text: `\n\n--- BESTANDSINHOUD ---\n${text}` });
    }

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
          { role: "user", content: userContent },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "register_chaos_item" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI error", aiRes.status, txt);
      await admin
        .from("chaos_uploads")
        .update({ status: "failed", error_message: `AI ${aiRes.status}: ${txt.slice(0, 500)}` })
        .eq("id", upload_id);
      if (aiRes.status === 429)
        return json({ error: "AI rate limit, probeer over een minuut opnieuw" }, 429);
      if (aiRes.status === 402)
        return json({ error: "AI credits op — vul ze aan in Settings > Workspace > Usage" }, 402);
      return json({ error: "AI fout" }, 500);
    }

    const aiJson = await aiRes.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      await admin
        .from("chaos_uploads")
        .update({ status: "failed", error_message: "Geen analyse ontvangen" })
        .eq("id", upload_id);
      return json({ error: "geen analyse" }, 500);
    }

    const args = JSON.parse(toolCall.function.arguments);

    const { error: insErr } = await admin.from("chaos_items").insert({
      organization_id: upload.organization_id,
      upload_id: upload.id,
      category: args.category,
      sender_name: args.sender_name ?? null,
      document_title: args.document_title,
      summary: args.summary ?? null,
      amount_due: args.amount_due ?? null,
      currency: args.currency ?? "EUR",
      reference_number: args.reference_number ?? null,
      payment_deadline: args.payment_deadline ?? null,
      legal_deadline: args.legal_deadline ?? null,
      priority: args.priority,
      risk_level: args.risk_level ?? null,
      risk_if_ignored: args.risk_if_ignored ?? null,
      recommended_action: args.recommended_action,
      phone_number: args.phone_number ?? null,
      phone_script: args.phone_script ?? null,
      required_documents: args.required_documents ?? null,
      ai_confidence: args.ai_confidence,
      ai_reasoning: args.ai_reasoning,
    });
    if (insErr) throw insErr;

    await admin
      .from("chaos_uploads")
      .update({ status: "analyzed" })
      .eq("id", upload_id);

    return json({ ok: true });
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
