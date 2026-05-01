// Cash Maatje action executor — voert AI-acties uit met server-side autorisatie
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Action {
  type: string;
  params: Record<string, unknown>;
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

async function isMember(userId: string, orgId: string) {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("user_id", userId)
    .eq("organization_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const user = await authenticate(req);
    if (!user) {
      return new Response(JSON.stringify({ error: "Niet ingelogd" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, organization_id } = body as { action: Action; organization_id: string };

    if (!action?.type || !organization_id) {
      return new Response(JSON.stringify({ error: "action.type en organization_id zijn vereist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!(await isMember(user.id, organization_id))) {
      return new Response(JSON.stringify({ error: "Geen toegang tot deze organisatie" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const params = action.params ?? {};

    switch (action.type) {
      case "mark_invoice_paid": {
        const invoiceId = params.invoice_id as string;
        if (!invoiceId) throw new Error("invoice_id ontbreekt");
        const { data: inv, error: invErr } = await admin
          .from("invoices")
          .select("id, total_amount, organization_id")
          .eq("id", invoiceId)
          .eq("organization_id", organization_id)
          .single();
        if (invErr || !inv) throw new Error("Factuur niet gevonden");
        const { error } = await admin
          .from("invoices")
          .update({
            status: "paid",
            amount_paid: inv.total_amount,
            paid_date: new Date().toISOString().slice(0, 10),
          })
          .eq("id", invoiceId);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, message: "Factuur gemarkeerd als betaald" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send_payment_reminder": {
        const invoiceId = params.invoice_id as string;
        if (!invoiceId) throw new Error("invoice_id ontbreekt");
        const { data: inv, error: invErr } = await admin
          .from("invoices")
          .select("id, invoice_number, contact_name, amount_due, organization_id")
          .eq("id", invoiceId)
          .eq("organization_id", organization_id)
          .single();
        if (invErr || !inv) throw new Error("Factuur niet gevonden");

        // Best-effort: log een herinneringsrij in payment_reminders als die tabel bestaat,
        // anders alleen audit log. We willen geen externe e-mail versturen zonder expliciete config.
        try {
          await admin.from("payment_reminders").insert({
            organization_id,
            invoice_id: invoiceId,
            reminder_type: "first_reminder",
            sent_at: new Date().toISOString(),
            created_by: user.id,
          });
        } catch (_) {
          // tabel bestaat misschien niet of heeft andere kolommen — niet fataal
        }
        await admin.from("audit_log").insert({
          organization_id,
          user_id: user.id,
          action: "create",
          entity_type: "payment_reminder",
          entity_id: invoiceId,
          change_summary: `Herinnering ingepland voor ${inv.invoice_number} (${inv.contact_name})`,
        });
        return new Response(
          JSON.stringify({ ok: true, message: `Herinnering ingepland voor ${inv.invoice_number}` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      case "categorize_transaction": {
        const txId = params.transaction_id as string;
        const accountCode = params.account_code as string | undefined;
        const accountId = params.account_id as string | undefined;
        if (!txId) throw new Error("transaction_id ontbreekt");
        let resolvedAccountId = accountId;
        if (!resolvedAccountId && accountCode) {
          const { data: acc } = await admin
            .from("accounts")
            .select("id")
            .eq("organization_id", organization_id)
            .eq("code", accountCode)
            .maybeSingle();
          resolvedAccountId = acc?.id;
        }
        if (!resolvedAccountId) throw new Error("Geen geldige rekening opgegeven");
        const { error } = await admin
          .from("bank_transactions")
          .update({ account_id: resolvedAccountId, status: "manually_matched" })
          .eq("id", txId)
          .eq("organization_id", organization_id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, message: "Transactie gecategoriseerd" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "exclude_transaction": {
        const txId = params.transaction_id as string;
        if (!txId) throw new Error("transaction_id ontbreekt");
        const { error } = await admin
          .from("bank_transactions")
          .update({ status: "excluded" })
          .eq("id", txId)
          .eq("organization_id", organization_id);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true, message: "Transactie uitgesloten" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create_draft_invoice": {
        // Read-side: validate + lookup contact. Write-side: insert draft invoice only (status=draft, no journal entry, never sent).
        const contactId = (params.contact_id as string | undefined) ?? null;
        const contactNameRaw = (params.contact_name as string | undefined) ?? null;
        const subtotal = Number(params.subtotal ?? 0);
        const vatPct = Number(params.vat_percentage ?? 21);
        const description = (params.description as string | undefined) ?? "Concept factuur";
        const dueDays = Number.isFinite(Number(params.due_days)) ? Number(params.due_days) : 30;

        if (!Number.isFinite(subtotal) || subtotal <= 0) throw new Error("Ongeldig subtotaalbedrag");
        if (![0, 9, 21].includes(vatPct)) throw new Error("Ongeldig BTW-percentage (0, 9 of 21)");
        if (!contactId && !contactNameRaw) throw new Error("Contact_id of contact_name vereist");

        let resolvedContactId: string | null = contactId;
        let resolvedContactName: string | null = contactNameRaw;
        if (resolvedContactId) {
          const { data: c, error: cErr } = await admin
            .from("contacts")
            .select("id, name")
            .eq("id", resolvedContactId)
            .eq("organization_id", organization_id)
            .maybeSingle();
          if (cErr) throw cErr;
          if (!c) throw new Error("Contact niet gevonden in deze organisatie");
          resolvedContactName = c.name;
        }

        const total_vat = Math.round(subtotal * vatPct) / 100;
        const total_amount = Math.round((subtotal + total_vat) * 100) / 100;

        const year = new Date().getFullYear();
        const { count } = await admin
          .from("invoices")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", organization_id)
          .eq("invoice_type", "sales")
          .gte("invoice_date", `${year}-01-01`);
        const seq = String((count ?? 0) + 1).padStart(3, "0");
        const invoice_number = `CONCEPT-${year}-${seq}`;

        const today = new Date();
        const due = new Date(today.getTime() + dueDays * 86400000);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);

        const { data: inv, error: insErr } = await admin
          .from("invoices")
          .insert({
            organization_id,
            invoice_type: "sales",
            invoice_number,
            status: "draft",
            invoice_date: fmt(today),
            due_date: fmt(due),
            contact_id: resolvedContactId,
            contact_name: resolvedContactName,
            subtotal,
            total_vat,
            total_amount,
            amount_due: total_amount,
            notes: description,
            created_by: user.id,
          })
          .select("id, invoice_number")
          .single();
        if (insErr) throw insErr;

        await admin.from("audit_log").insert({
          organization_id,
          user_id: user.id,
          action: "create",
          entity_type: "invoice",
          entity_id: inv.id,
          change_summary: `Concept factuur ${inv.invoice_number} aangemaakt via AI (€${total_amount.toFixed(2)}) — niet verzonden`,
        });

        return new Response(
          JSON.stringify({
            ok: true,
            message: `Concept ${inv.invoice_number} aangemaakt — open in Verkoop om te versturen`,
            invoice_id: inv.id,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      default:
        return new Response(JSON.stringify({ error: `Onbekende actie: ${action.type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (e) {
    console.error("cash-maatje-action error:", e);
    const msg = e instanceof Error ? e.message : "Onbekende fout";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
