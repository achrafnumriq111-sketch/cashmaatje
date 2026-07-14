// FIX THE CHAOS — document analyzer (enhanced rescue layer)
// Reads a chaos_uploads row, downloads the file, sends it to Gemini 2.5 Pro,
// classifies it, and writes a chaos_items row enriched with panic score,
// urgency lane, missing-document detection and risk-timeline mapping.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Je bent een ervaren Nederlandse boekhouder, fiscalist, debiteurenspecialist en crisismanager.
Je analyseert ALLEEN documenten gerelateerd aan ondernemerschap, belasting, boekhouding en zakelijke financiën.
Bron: belastingdienst.nl/ondernemers en officiële Nederlandse wet- en regelgeving.

Je werkt voor een ondernemer die zijn financiële chaos bij jou dropt. Jouw taak is hem of haar ONMIDDELLIJK rust te geven door glashelder te zijn over wat er moet gebeuren.

BELANGRIJK — MULTI-PAGE:
Het document dat je krijgt kan meerdere pagina's bevatten (PDF of samengevoegde scan). Behandel het altijd als ÉÉN geheel:
- Baseer titel, bedrag, kenmerk, deadline en risk timeline op alle pagina's samen.
- Herhaal geen items en maak geen aparte samenvattingen per pagina.
- Vul page_count in met het aantal pagina's dat je hebt gezien.
- Als het duidelijk twee losstaande brieven zijn die per ongeluk samengevoegd zijn, kies de belangrijkste (hoogste panic score) en noem de andere in de summary.

Bepaal:
1. Wat is dit voor document?
2. Wie heeft het gestuurd (Belastingdienst, deurwaarder, leverancier, UWV, gemeente, bank, overig)?
3. Welk bedrag (indien) en welke deadline (indien)?
4. Hoe URGENT is dit op de Nederlandse incassoladder:
   herinnering → aanmaning → naheffingsaanslag/boete → dwangbevel → invordering/beslag → deurwaarder.
   Plaats dit document op die ladder.
5. PANIC SCORE 0–100. Bereken concreet:
   - dwangbevel of beslag aangekondigd → minimaal 85
   - deurwaarder → minimaal 90
   - aanmaning Belastingdienst met deadline binnen 7 dagen → 70–85
   - boete of naheffingsaanslag → 60–80
   - openstaand bedrag > €5000 met korte deadline → +10
   - eerste herinnering, deadline > 14 dagen → 20–40
   - informatief (bevestiging, jaaropgave) → 5–20
6. URGENCY LANE: today (binnen 24u actie nodig) / this_week / later
7. RISK TIMELINE: array van vervolgstappen als ondernemer NIETS doet, met realistische termijnen ("over 14 dagen → aanmaning + €7 kosten", enz.). 3–6 stappen.
8. Welke andere documenten ontbreken waarschijnlijk om dit op te lossen? (bv. bankafschrift Q3, kopie originele factuur, betaalbewijs).
9. Concreet: één heldere actie. Geen vage adviezen, geen "raadpleeg uw adviseur" tenzij echt onvermijdelijk.
10. Indien bellen relevant: telefoonnummer + Nederlands telefoonscript (1e zin, kenmerknummer noemen, vraag, gewenst resultaat).

Wees direct, kort, operationeel. Schrijf zoals een ervaren accountant tegen een paniekerige klant: kalm, autoritair, concreet.
Als het document NIET zakelijk/fiscaal/boekhoudkundig is, zet category="overig" en priority="green" en panic_score=0.`;

const TOOL = {
  type: "function",
  function: {
    name: "register_chaos_item",
    description: "Registreer 1 geanalyseerd chaos-document met volledige rescue-data",
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
        panic_score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "0–100, gebruik kalibratie uit systeem-prompt",
        },
        urgency_lane: {
          type: "string",
          enum: ["today", "this_week", "later"],
        },
        risk_level: { type: "integer", minimum: 1, maximum: 10 },
        risk_if_ignored: {
          type: "string",
          description: "Wat gebeurt er als je dit negeert",
        },
        risk_timeline: {
          type: "array",
          description: "3–6 vervolgstappen als ondernemer niets doet",
          items: {
            type: "object",
            properties: {
              stage: { type: "string", description: "Naam van de fase, bv 'Aanmaning'" },
              when: { type: "string", description: "Wanneer, bv 'over 14 dagen'" },
              consequence: { type: "string", description: "Wat dit concreet betekent" },
            },
            required: ["stage", "when", "consequence"],
          },
        },
        missing_documents: {
          type: "array",
          description: "Documenten die de ondernemer waarschijnlijk nog moet aanleveren",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              why: { type: "string" },
              severity: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["name", "why"],
          },
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
          description: "Documenten die je BIJ DE HAND moet hebben voor de actie",
        },
        ai_confidence: { type: "number", minimum: 0, maximum: 1 },
        ai_reasoning: { type: "string" },
        page_count: {
          type: "integer",
          minimum: 1,
          description: "Aantal pagina's dat je in dit document hebt gezien (voor multi-page brieven)",
        },
      },
      required: [
        "category",
        "document_title",
        "priority",
        "panic_score",
        "urgency_lane",
        "recommended_action",
        "ai_confidence",
        "ai_reasoning",
      ],
      additionalProperties: false,
    },
  },
};

function bandFromPanic(score: number): string {
  if (score >= 81) return "immediate";
  if (score >= 61) return "high";
  if (score >= 31) return "warning";
  return "stable";
}

function bandFromConfidence(c: number | null | undefined): string {
  if (c == null) return "medium";
  if (c >= 0.8) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

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

    // Idempotent retry: clear any prior chaos_items linked to this upload
    // (e.g. from an earlier partial run) and reset status to analyzing.
    await admin.from("chaos_items").delete().eq("upload_id", upload_id);

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
    const panicScore = Math.min(100, Math.max(0, Number(args.panic_score) || 0));
    const panicBand = bandFromPanic(panicScore);
    const confidenceBand = bandFromConfidence(args.ai_confidence);

    const { data: inserted, error: insErr } = await admin
      .from("chaos_items")
      .insert({
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
        panic_score: panicScore,
        panic_band: panicBand,
        urgency_lane: args.urgency_lane ?? "later",
        confidence_band: confidenceBand,
        risk_timeline: args.risk_timeline ?? null,
        missing_documents: args.missing_documents ?? null,
        risk_level: args.risk_level ?? null,
        risk_if_ignored: args.risk_if_ignored ?? null,
        recommended_action: args.recommended_action,
        phone_number: args.phone_number ?? null,
        phone_script: args.phone_script ?? null,
        required_documents: args.required_documents ?? null,
        ai_confidence: args.ai_confidence,
        ai_reasoning: args.ai_reasoning,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    await admin
      .from("chaos_uploads")
      .update({ status: "analyzed" })
      .eq("id", upload_id);

    // Recompute daily anchor for this org: highest panic score among open items
    const { data: top } = await admin
      .from("chaos_items")
      .select("id, panic_score")
      .eq("organization_id", upload.organization_id)
      .eq("is_resolved", false)
      .order("panic_score", { ascending: false, nullsFirst: false })
      .limit(1);
    const newAnchorId = top?.[0]?.id ?? null;
    if (newAnchorId) {
      await admin
        .from("chaos_items")
        .update({ daily_anchor: false })
        .eq("organization_id", upload.organization_id)
        .neq("id", newAnchorId);
      await admin
        .from("chaos_items")
        .update({ daily_anchor: true })
        .eq("id", newAnchorId);
    }

    return json({ ok: true, item_id: inserted?.id });
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
