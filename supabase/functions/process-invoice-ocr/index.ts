import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { document_id, file_url, organization_id } = await req.json();

    if (!document_id || !file_url || !organization_id) {
      return new Response(
        JSON.stringify({ error: "Missing document_id, file_url, or organization_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Update status to processing
    await supabase
      .from("documents")
      .update({ ocr_status: "processing" })
      .eq("id", document_id);

    // Call Lovable AI with the image/PDF URL for OCR extraction
    const startTime = Date.now();

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
            content: `You are a Dutch invoice OCR extraction system. Extract structured data from the provided invoice image/document. Return ONLY valid JSON with these fields:
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
  "confidence": {
    "supplier_name": 0.0-1.0,
    "invoice_number": 0.0-1.0,
    "invoice_date": 0.0-1.0,
    "vat_number": 0.0-1.0,
    "subtotal": 0.0-1.0,
    "vat_amounts": 0.0-1.0,
    "total_amount": 0.0-1.0,
    "iban": 0.0-1.0,
    "payment_reference": 0.0-1.0
  }
}
Be precise with amounts. Use dot as decimal separator. Parse Dutch date formats correctly.`,
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: file_url },
              },
              {
                type: "text",
                text: "Extract all invoice data from this document. Return only the JSON object.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      await supabase
        .from("documents")
        .update({ ocr_status: "error" })
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
        .update({ ocr_status: "error", ocr_text: content })
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

    // Check for duplicates by invoice number + supplier
    let isDuplicate = false;
    let duplicateOf = null;
    if (extracted.invoice_number && extracted.supplier_name) {
      const { data: existing } = await supabase
        .from("documents")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("extracted_invoice_number", extracted.invoice_number)
        .eq("extracted_supplier_name", extracted.supplier_name)
        .neq("id", document_id)
        .limit(1);
      if (existing && existing.length > 0) {
        isDuplicate = true;
        duplicateOf = existing[0].id;
      }
    }

    // Calculate average confidence
    const confidenceValues = extracted.confidence
      ? Object.values(extracted.confidence).filter((v): v is number => typeof v === "number")
      : [];
    const avgConfidence =
      confidenceValues.length > 0
        ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
        : 0;

    // Update document with extracted data
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
      })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        extracted,
        is_duplicate: isDuplicate,
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
