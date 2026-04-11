import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { document_id, file_path, organization_id } = await req.json();

    if (!document_id || !file_path || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing document_id, file_path, or organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to processing
    await supabase
      .from("documents")
      .update({ ocr_status: "processing", processing_status: "processing" })
      .eq("id", document_id);

    // Generate a signed URL (valid 10 min) so AI can read the private file
    const { data: signedData, error: signedError } = await supabase.storage
      .from("documents")
      .createSignedUrl(file_path, 600);

    if (signedError || !signedData?.signedUrl) {
      console.error("Failed to create signed URL:", signedError);
      await supabase
        .from("documents")
        .update({ ocr_status: "error", processing_status: "inbox" })
        .eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "Failed to access document file" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fileUrl = signedData.signedUrl;

    // Check for existing supplier patterns to give AI context
    const { data: patterns } = await supabase
      .from("supplier_patterns")
      .select("supplier_name, default_category, default_vat_rate_type, default_tax_box, is_business")
      .eq("organization_id", organization_id)
      .limit(50);

    const patternContext = patterns && patterns.length > 0
      ? `\nKnown suppliers and their defaults:\n${patterns.map(p => 
          `- "${p.supplier_name}": category=${p.default_category}, vat=${p.default_vat_rate_type}, tax_box=${p.default_tax_box}, business=${p.is_business}`
        ).join('\n')}`
      : '';

    // Fetch existing contacts for smart matching
    const { data: contacts } = await supabase
      .from("contacts")
      .select("id, name, legal_name, btw_number, iban, is_supplier")
      .eq("organization_id", organization_id)
      .eq("is_active", true)
      .limit(200);

    const contactContext = contacts && contacts.length > 0
      ? `\nKnown contacts (for matching):\n${contacts.filter(c => c.is_supplier).map(c =>
          `- id="${c.id}" name="${c.name}" legal="${c.legal_name || ''}" btw="${c.btw_number || ''}" iban="${c.iban || ''}"`
        ).join('\n')}`
      : '';

    // Call Lovable AI with the image/PDF URL for OCR extraction
    const startTime = Date.now();

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a Dutch tax-intelligent OCR system for a bookkeeping application. You extract ALL data from receipts, invoices, and financial documents with maximum accuracy. Your goal is to make the user's life as easy as possible — they should not have to enter anything manually.

Extract structured data from the provided document. Return ONLY valid JSON with these fields:
{
  "supplier_name": "string or null",
  "invoice_number": "string or null",
  "invoice_date": "YYYY-MM-DD or null",
  "vat_number": "string or null - Dutch BTW number format",
  "subtotal": "number or null - amount excluding VAT",
  "vat_amounts": [{"rate": 21, "amount": 0.00}],
  "total_amount": "number or null",
  "iban": "string or null",
  "payment_reference": "string or null",
  "currency": "EUR",
  "country_of_origin": "two-letter country code, default NL",
  
  "line_items": [
    {"description": "string", "quantity": 1, "unit_price": 0.00, "vat_rate": 21, "total": 0.00}
  ],
  
  "matched_contact_id": "UUID of matching contact from known contacts list, or null",
  
  "document_type": "purchase_invoice | sales_invoice | receipt | credit_note | other",
  "category": "one of: inventory, marketing, travel, food_drink, office, software, insurance, professional_services, utilities, rent, vehicle, telecom, shipping, bank_fees, payroll, depreciation, other",
  "is_business_expense": true,
  "business_private_reasoning": "short explanation why this is business or private",
  
  "vat_rate_type": "high | low | zero | exempt | reverse_charge | icp | import | margin",
  "tax_box_mapping": "Dutch VAT box: 1a | 1b | 1c | 1d | 1e | 2a | 3a | 3b | 4a | 5b",
  "tax_reasoning": "explain why this VAT treatment was chosen",
  
  "suggested_account_code": "string - most likely RGS account code (e.g. 7430 for software, 7100 for rent)",
  
  "has_valid_invoice_requirements": true,
  "missing_invoice_fields": [],
  "risk_flags": [],
  
  "confidence": {
    "supplier_name": 0.0-1.0,
    "invoice_number": 0.0-1.0,
    "invoice_date": 0.0-1.0,
    "vat_number": 0.0-1.0,
    "subtotal": 0.0-1.0,
    "vat_amounts": 0.0-1.0,
    "total_amount": 0.0-1.0,
    "iban": 0.0-1.0,
    "payment_reference": 0.0-1.0,
    "category": 0.0-1.0,
    "vat_rate_type": 0.0-1.0,
    "is_business_expense": 0.0-1.0
  }
}

DUTCH TAX RULES:
- Standard VAT rate: 21% (most goods/services)
- Reduced rate: 9% (food, books, medicine, hairdresser, etc.)
- Zero rate: exports, intra-EU supplies
- Reverse charge: services from abroad
- Purchase invoices → box 5b (input VAT)
- Sales invoices → boxes 1a/1b based on rate
- Foreign suppliers → check reverse charge rules
- Invoices MUST have: supplier name, date, invoice number, VAT number, amounts
- Missing fields = risk flag
- Receipts under €100 are allowed without full invoice details

CONTACT MATCHING:
- Match supplier to known contacts by name, BTW number, or IBAN
- Use fuzzy matching on names (e.g. "Albert Heijn BV" matches "Albert Heijn")
- Only set matched_contact_id if you are confident in the match

RECEIPT-SPECIFIC:
- Read EVERY line item on the receipt
- Supermarkt bonnen: read individual products, identify food (9% BTW) vs non-food (21% BTW)
- Tankstation: separate fuel from shop purchases
- Restaurant: full amount, check for tip

RISK FLAGS to detect:
- "unusual_vat_percentage" if VAT % doesn't match standard Dutch rates
- "missing_vat_number" if amount > €100 and no BTW number
- "possible_private" if expense looks personal
- "mixed_receipt" if receipt contains both business and private items
- "foreign_vat" if foreign VAT was charged
- "high_amount" if total > €5000
${patternContext}
${contactContext}

Be precise with amounts. Use dot as decimal separator. Parse Dutch date formats correctly. Read the ENTIRE document — every line, every number.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: fileUrl },
              },
              {
                type: "text",
                text: "Extract ALL data from this document. Read every line item. Determine the category, VAT treatment, and tax box mapping. Match to known contacts if possible. Flag any risks. Return only the JSON object.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      await supabase
        .from("documents")
        .update({ ocr_status: "error", processing_status: "inbox" })
        .eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "AI processing failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from AI response
    let extracted;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      extracted = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch {
      console.error("Failed to parse AI response:", content);
      await supabase
        .from("documents")
        .update({ ocr_status: "error", ocr_text: content, processing_status: "inbox" })
        .eq("id", document_id);
      return new Response(
        JSON.stringify({ error: "Failed to parse OCR results" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processingTime = Date.now() - startTime;
    const totalVat = extracted.vat_amounts?.reduce(
      (sum: number, v: { amount: number }) => sum + (v.amount || 0),
      0
    ) ?? 0;

    // === SMART DUPLICATE DETECTION ===
    let isDuplicate = false;
    let duplicateOf = null;
    let duplicateReason = "";

    // Method 1: Exact match on invoice number + supplier
    if (extracted.invoice_number && extracted.supplier_name) {
      const { data: existing } = await supabase
        .from("documents")
        .select("id, file_name")
        .eq("organization_id", organization_id)
        .eq("extracted_invoice_number", extracted.invoice_number)
        .eq("extracted_supplier_name", extracted.supplier_name)
        .neq("id", document_id)
        .limit(1);
      if (existing && existing.length > 0) {
        isDuplicate = true;
        duplicateOf = existing[0].id;
        duplicateReason = `Factuurnummer "${extracted.invoice_number}" van "${extracted.supplier_name}" bestaat al (${existing[0].file_name})`;
      }
    }

    // Method 2: Same supplier + same amount + same date (fuzzy match)
    if (!isDuplicate && extracted.supplier_name && extracted.total_amount && extracted.invoice_date) {
      const { data: similar } = await supabase
        .from("documents")
        .select("id, file_name, extracted_supplier_name")
        .eq("organization_id", organization_id)
        .eq("extracted_date", extracted.invoice_date)
        .neq("id", document_id)
        .gte("extracted_amount", extracted.total_amount * 0.99)
        .lte("extracted_amount", extracted.total_amount * 1.01);

      if (similar && similar.length > 0) {
        // Fuzzy name match
        const normalizedNew = extracted.supplier_name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const match = similar.find((s: any) => {
          const normalizedExisting = (s.extracted_supplier_name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          return normalizedExisting === normalizedNew || 
                 normalizedNew.includes(normalizedExisting) || 
                 normalizedExisting.includes(normalizedNew);
        });
        if (match) {
          isDuplicate = true;
          duplicateOf = match.id;
          duplicateReason = `Zelfde leverancier, bedrag (€${extracted.total_amount}) en datum (${extracted.invoice_date}) als "${match.file_name}"`;
        }
      }
    }

    // Method 3: Same amount + same date (no supplier match but suspicious)
    if (!isDuplicate && extracted.total_amount && extracted.invoice_date) {
      const { data: amountMatches } = await supabase
        .from("documents")
        .select("id, file_name")
        .eq("organization_id", organization_id)
        .eq("extracted_date", extracted.invoice_date)
        .eq("extracted_amount", extracted.total_amount)
        .neq("id", document_id)
        .limit(1);

      if (amountMatches && amountMatches.length > 0) {
        // Not marked as duplicate but add a risk flag
        if (!extracted.risk_flags) extracted.risk_flags = [];
        extracted.risk_flags.push("possible_duplicate");
        duplicateOf = amountMatches[0].id;
        duplicateReason = `Zelfde bedrag (€${extracted.total_amount}) en datum als "${amountMatches[0].file_name}" — controleer of dit een duplicaat is`;
      }
    }

    // Create notification for duplicate detection
    if (isDuplicate || duplicateReason) {
      await supabase.from("notifications").insert({
        organization_id,
        title: isDuplicate ? "⚠️ Duplicaat gedetecteerd" : "🔍 Mogelijk duplicaat",
        message: duplicateReason,
        message_nl: duplicateReason,
        severity: isDuplicate ? "warning" : "info",
        category: "document",
        entity_type: "document",
        entity_id: document_id,
        action_label: "Bekijk origineel",
        action_url: `/documenten?doc=${duplicateOf}`,
      });
    }

    // Calculate average confidence
    const confidenceValues = extracted.confidence
      ? Object.values(extracted.confidence).filter((v): v is number => typeof v === "number")
      : [];
    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a: number, b: number) => a + b, 0) / confidenceValues.length
        : 0;

    // Determine processing status based on confidence and risk flags
    const hasRisks = extracted.risk_flags && extracted.risk_flags.length > 0;
    const processingStatus = (avgConfidence >= 0.85 && !hasRisks && !isDuplicate)
      ? "processed"
      : "inbox";

    // Map document_type to our enum
    const docTypeMap: Record<string, string> = {
      purchase_invoice: "invoice",
      sales_invoice: "invoice",
      receipt: "receipt",
      credit_note: "credit_note",
      other: "other",
    };
    const docType = docTypeMap[extracted.document_type] || "other";

    // Auto-link contact if AI matched one
    const contactId = extracted.matched_contact_id || null;

    // Update document with all extracted data
    await supabase
      .from("documents")
      .update({
        ocr_status: "completed",
        ocr_data: extracted,
        ocr_confidence: avgConfidence,
        extracted_supplier_name: extracted.supplier_name,
        extracted_invoice_number: extracted.invoice_number,
        extracted_date: extracted.invoice_date,
        extracted_vat_number: extracted.vat_number,
        extracted_amount: extracted.total_amount,
        extracted_vat_amount: totalVat,
        extracted_iban: extracted.iban,
        extracted_currency: extracted.currency || "EUR",
        is_duplicate: isDuplicate,
        duplicate_of: duplicateOf,
        document_type: docType,
        category: extracted.category,
        vat_rate_type_detected: extracted.vat_rate_type,
        tax_box_mapping: extracted.tax_box_mapping,
        is_business_expense: extracted.is_business_expense ?? true,
        processing_status: processingStatus,
        country_of_origin: extracted.country_of_origin || "NL",
        ai_category_confidence: extracted.confidence?.category,
        contact_id: contactId,
      })
      .eq("id", document_id);

    // Auto-create contact if supplier not found and confidence is high
    if (!contactId && extracted.supplier_name && avgConfidence >= 0.8) {
      const { data: newContact } = await supabase
        .from("contacts")
        .insert({
          organization_id,
          name: extracted.supplier_name,
          btw_number: extracted.vat_number || null,
          iban: extracted.iban || null,
          is_supplier: true,
          is_customer: false,
          is_domestic: (extracted.country_of_origin || "NL") === "NL",
          is_eu: ["NL","DE","BE","FR","IT","ES","AT","LU","IE","PT","FI","GR","EE","LV","LT","MT","SK","SI","CY","BG","RO","HR","CZ","DK","HU","PL","SE"].includes(extracted.country_of_origin || "NL"),
          address_country: extracted.country_of_origin || "NL",
        })
        .select("id")
        .single();

      if (newContact) {
        await supabase
          .from("documents")
          .update({ contact_id: newContact.id })
          .eq("id", document_id);
      }
    }

    // Update or create supplier pattern (AI learning loop)
    if (extracted.supplier_name) {
      const normalizedName = extracted.supplier_name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      
      const { data: existingPattern } = await supabase
        .from("supplier_patterns")
        .select("id, times_seen")
        .eq("organization_id", organization_id)
        .eq("normalized_name", normalizedName)
        .limit(1);

      if (existingPattern && existingPattern.length > 0) {
        await supabase
          .from("supplier_patterns")
          .update({
            times_seen: (existingPattern[0].times_seen || 0) + 1,
            last_seen_at: new Date().toISOString(),
            default_category: extracted.category,
            default_vat_rate_type: extracted.vat_rate_type,
            default_tax_box: extracted.tax_box_mapping,
            is_business: extracted.is_business_expense ?? true,
          })
          .eq("id", existingPattern[0].id);

        await supabase
          .from("documents")
          .update({ supplier_pattern_id: existingPattern[0].id })
          .eq("id", document_id);
      } else {
        const { data: newPattern } = await supabase
          .from("supplier_patterns")
          .insert({
            organization_id,
            supplier_name: extracted.supplier_name,
            normalized_name: normalizedName,
            default_category: extracted.category,
            default_vat_rate_type: extracted.vat_rate_type,
            default_tax_box: extracted.tax_box_mapping,
            is_business: extracted.is_business_expense ?? true,
            country: extracted.country_of_origin || "NL",
          })
          .select("id")
          .single();

        if (newPattern) {
          await supabase
            .from("documents")
            .update({ supplier_pattern_id: newPattern.id })
            .eq("id", document_id);
        }
      }
    }

    // Create anomalies for risk flags
    if (extracted.risk_flags && extracted.risk_flags.length > 0) {
      const anomalies = extracted.risk_flags.map((flag: string) => {
        const flagLabels: Record<string, { title: string; desc: string; severity: string }> = {
          unusual_vat_percentage: { title: "Ongebruikelijk BTW-percentage", desc: "Het BTW-percentage op dit document komt niet overeen met standaard Nederlandse tarieven.", severity: "warning" },
          missing_vat_number: { title: "Ontbrekend BTW-nummer", desc: "Dit document heeft geen BTW-nummer terwijl het bedrag boven €100 is.", severity: "warning" },
          possible_private: { title: "Mogelijk privé-uitgave", desc: "Deze uitgave lijkt privé en niet zakelijk.", severity: "info" },
          mixed_receipt: { title: "Gemengd bonnetje", desc: "Dit bonnetje bevat zowel zakelijke als privé-items.", severity: "warning" },
          foreign_vat: { title: "Buitenlandse BTW", desc: "Er is buitenlandse BTW berekend. Dit is niet verrekenbaar in de Nederlandse BTW-aangifte.", severity: "warning" },
          high_amount: { title: "Hoog bedrag", desc: "Het bedrag is hoger dan €5.000. Extra verificatie aanbevolen.", severity: "info" },
        };
        const info = flagLabels[flag] || { title: flag, desc: flag, severity: "info" };
        return {
          organization_id,
          entity_type: "document",
          entity_id: document_id,
          anomaly_type: flag,
          title: info.title,
          description: info.desc,
          description_nl: info.desc,
          severity: info.severity,
          status: "open",
          confidence: avgConfidence,
        };
      });

      await supabase.from("anomalies").insert(anomalies);
    }

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        extracted,
        is_duplicate: isDuplicate,
        processing_status: processingStatus,
        risk_flags: extracted.risk_flags || [],
        processing_time_ms: processingTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("OCR processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
