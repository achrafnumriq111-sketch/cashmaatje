import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// corsHeaders imported from SDK above

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { transaction_ids, organization_id } = body;

    if (!transaction_ids?.length || !organization_id) {
      return new Response(
        JSON.stringify({ error: "transaction_ids and organization_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transactions
    const { data: transactions, error: txError } = await supabase
      .from("bank_transactions")
      .select("id, amount, description, counterparty_name, counterparty_iban, transaction_date, payment_reference, status")
      .eq("organization_id", organization_id)
      .in("id", transaction_ids);

    if (txError) throw txError;

    // Fetch bank rules for pre-matching
    const { data: bankRules } = await supabase
      .from("bank_rules")
      .select("*")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .order("priority", { ascending: true });

    // Fetch chart of accounts for this org
    const { data: accounts, error: accError } = await supabase
      .from("accounts")
      .select("id, code, name, name_nl, account_type, account_subtype")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .eq("is_header", false);

    if (accError) throw accError;

    // Fetch contacts
    const { data: contacts, error: conError } = await supabase
      .from("contacts")
      .select("id, name, iban")
      .eq("organization_id", organization_id)
      .eq("is_active", true);

    if (conError) throw conError;

    const accountsList = accounts
      .map((a: any) => `${a.code} - ${a.name_nl || a.name} (${a.account_type}/${a.account_subtype || "general"}) [id:${a.id}]`)
      .join("\n");

    const contactsList = contacts
      .map((c: any) => `${c.name}${c.iban ? ` (IBAN: ${c.iban})` : ""} [id:${c.id}]`)
      .join("\n");

    const results: any[] = [];

    for (const tx of transactions || []) {
      // First try bank rules
      let ruleMatched = false;
      for (const rule of bankRules || []) {
        const fieldValue = (tx as any)[rule.match_field] as string | null;
        if (!fieldValue) continue;
        let isMatch = false;
        const val = fieldValue.toLowerCase();
        const pattern = rule.match_value.toLowerCase();
        switch (rule.match_type) {
          case "exact": isMatch = val === pattern; break;
          case "contains": isMatch = val.includes(pattern); break;
          case "starts_with": isMatch = val.startsWith(pattern); break;
          case "regex": try { isMatch = new RegExp(rule.match_value, "i").test(fieldValue); } catch {} break;
        }
        if (isMatch && rule.account_id) {
          await supabase.from("bank_transactions").update({
            account_id: rule.account_id,
            contact_id: rule.contact_id || null,
            status: "matched",
          }).eq("id", tx.id);
          await supabase.from("bank_rules").update({
            times_applied: (rule.times_applied || 0) + 1,
            last_applied_at: new Date().toISOString(),
          }).eq("id", rule.id);
          results.push({ transaction_id: tx.id, success: true, method: "rule", rule_name: rule.name });
          ruleMatched = true;
          break;
        }
      }
      if (ruleMatched) continue;

      // No rule matched — use AI

Transaction:
- Date: ${tx.transaction_date}
- Amount: €${tx.amount}
- Description: ${tx.description || "N/A"}
- Counterparty: ${tx.counterparty_name || "N/A"}
- Counterparty IBAN: ${tx.counterparty_iban || "N/A"}
- Reference: ${tx.payment_reference || "N/A"}

Available accounts:
${accountsList}

Known contacts:
${contactsList}

Respond with JSON:
{
  "account_id": "uuid of best matching account",
  "account_code": "code of account",
  "account_name": "name of account",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation in Dutch",
  "contact_id": "uuid of matching contact or null",
  "alternatives": [{"account_id": "uuid", "account_code": "code", "account_name": "name", "confidence": 0.0}]
}`;

      try {
        const aiResp = await fetch(AI_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are a Dutch bookkeeping assistant. Always respond with valid JSON only." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
          }),
        });

        if (!aiResp.ok) {
          console.error("AI error:", await aiResp.text());
          results.push({ transaction_id: tx.id, error: "AI call failed" });
          continue;
        }

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content;
        const parsed = JSON.parse(content);

        // Update transaction with AI suggestion
        await supabase
          .from("bank_transactions")
          .update({
            ai_category_suggestion: parsed.account_id,
            ai_confidence: parsed.confidence,
            ai_reasoning: parsed.reasoning,
            ai_contact_suggestion: parsed.contact_id || null,
            status: "suggested" as any, // Will stay 'new' if enum doesn't have 'suggested'
          })
          .eq("id", tx.id);

        // Store AI decision
        await supabase.from("ai_decisions").insert({
          organization_id,
          input_type: "bank_transaction",
          input_id: tx.id,
          input_summary: `${tx.counterparty_name || "Unknown"}: €${tx.amount}`,
          action_type: "categorize",
          confidence: parsed.confidence,
          decision: {
            account_id: parsed.account_id,
            account_code: parsed.account_code,
            account_name: parsed.account_name,
          },
          reasoning: parsed.reasoning,
          reasoning_nl: parsed.reasoning,
          alternatives: parsed.alternatives || [],
          model_version: "gemini-2.5-flash",
        });

        results.push({ transaction_id: tx.id, success: true, ...parsed });
      } catch (err) {
        console.error("Error processing tx:", tx.id, err);
        results.push({ transaction_id: tx.id, error: String(err) });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
