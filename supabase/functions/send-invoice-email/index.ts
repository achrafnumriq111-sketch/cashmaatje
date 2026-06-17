// supabase/functions/send-invoice-email/index.ts
// Sends a sales invoice via Lovable Emails to the customer.
// 1) Validates the caller is a member of the invoice's organization
// 2) Looks up org + customer + invoice details
// 3) Invokes send-transactional-email with template "invoice-sent"
// 4) Marks the invoice as sent (sets sent_at, bumps status from draft → sent)

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(n);

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    // Auth: identify caller
    const authClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const invoiceId: string = body.invoice_id;
    const recipientEmailOverride: string | undefined = body.recipient_email;
    const customMessage: string | undefined = body.message;

    if (!invoiceId) {
      return new Response(JSON.stringify({ error: "invoice_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const svc = createClient(supabaseUrl, serviceKey);

    // Fetch invoice
    const { data: invoice, error: invErr } = await svc
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .single();
    if (invErr || !invoice) {
      return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Membership check
    const { data: membership } = await svc
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", invoice.organization_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a member of this organisation" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch org + contact
    const [{ data: org }, { data: contact }] = await Promise.all([
      svc.from("organizations").select("name, legal_name, iban, email").eq("id", invoice.organization_id).single(),
      invoice.contact_id
        ? svc.from("contacts").select("name, email").eq("id", invoice.contact_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const recipientEmail = recipientEmailOverride || contact?.email;
    if (!recipientEmail) {
      return new Response(JSON.stringify({ error: "Geen e-mailadres bekend voor deze klant" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const templateData = {
      siteName: "Cash Maatje",
      senderName: org?.legal_name || org?.name || "Onbekende verzender",
      recipientName: contact?.name || invoice.contact_name,
      invoiceNumber: invoice.invoice_number,
      invoiceDate: fmtDate(invoice.invoice_date),
      dueDate: invoice.due_date ? fmtDate(invoice.due_date) : "—",
      totalFormatted: fmtCurrency(Number(invoice.total_amount)),
      message: customMessage,
      paymentUrl: invoice.payment_link_url || undefined,
      iban: org?.iban || undefined,
      paymentReference: invoice.payment_reference || invoice.invoice_number,
    };

    // Invoke shared transactional email function
    const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({
        templateName: "invoice-sent",
        recipientEmail,
        idempotencyKey: `invoice-${invoice.id}-${Date.now()}`,
        templateData,
      }),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      console.error("send-transactional-email failed:", sendRes.status, errBody);
      return new Response(JSON.stringify({ error: "Email send failed", details: errBody }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark invoice as sent + log reminder
    const newStatus = invoice.status === "draft" ? "sent" : invoice.status;
    await svc.from("invoices").update({
      status: newStatus,
      sent_at: new Date().toISOString(),
      email_message: customMessage || null,
    }).eq("id", invoice.id);

    await svc.from("invoice_reminders_sent").insert({
      organization_id: invoice.organization_id,
      invoice_id: invoice.id,
      reminder_type: "initial",
      sent_to: recipientEmail,
      sent_by: user.id,
    });

    return new Response(JSON.stringify({ ok: true, sentTo: recipientEmail }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-invoice-email error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
