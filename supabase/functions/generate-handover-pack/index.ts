// FIX THE CHAOS — generate bookkeeper handover pack
// Builds a structured rescue dossier from the org's chaos data and stores
// it as an HTML document inside the chaos-docs bucket so the entrepreneur
// can hand it straight to their accountant.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtMoney(n: number | null | undefined): string {
  if (n == null) return "—";
  return "€" + Number(n).toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { organization_id } = await req.json();
    if (!organization_id) return json({ error: "organization_id required" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const [{ data: org }, { data: items }, { data: uploads }, { data: actions }] = await Promise.all([
      admin.from("organizations").select("name, legal_name, kvk_number, btw_number").eq("id", organization_id).maybeSingle(),
      admin
        .from("chaos_items")
        .select("*")
        .eq("organization_id", organization_id)
        .order("panic_score", { ascending: false, nullsFirst: false })
        .limit(200),
      admin
        .from("chaos_uploads")
        .select("id, file_name, status, created_at")
        .eq("organization_id", organization_id)
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("chaos_actions")
        .select("chaos_item_id, action_type, status, notes, performed_at")
        .eq("organization_id", organization_id)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    const open = (items ?? []).filter((i) => !i.is_resolved);
    const totalDue = open.reduce((s, i) => s + (Number(i.amount_due) || 0), 0);

    const actionsByItem = new Map<string, any[]>();
    for (const a of actions ?? []) {
      const arr = actionsByItem.get(a.chaos_item_id) ?? [];
      arr.push(a);
      actionsByItem.set(a.chaos_item_id, arr);
    }

    const missingDocs: { name: string; why: string; severity: string }[] = [];
    for (const it of open) {
      if (Array.isArray(it.missing_documents)) {
        for (const m of it.missing_documents) missingDocs.push(m);
      }
    }

    const now = new Date();
    const generatedAt = now.toLocaleString("nl-NL");

    const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"/>
<title>Boekhouder Handover Pack — ${escapeHtml(org?.name ?? "Organisatie")}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color:#111; max-width:880px; margin:32px auto; padding:0 24px; line-height:1.5; }
  h1 { font-size: 26px; margin-bottom: 4px; }
  h2 { font-size: 18px; margin-top: 36px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  h3 { font-size: 15px; margin-bottom: 4px; }
  .meta { color:#6b7280; font-size: 13px; }
  table { width:100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
  th, td { text-align:left; padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  th { background:#f8fafc; font-weight:600; }
  .pill { display:inline-block; padding:2px 8px; border-radius: 999px; font-size: 11px; font-weight:600; }
  .pill-red { background:#fee2e2; color:#b91c1c; }
  .pill-orange { background:#fef3c7; color:#b45309; }
  .pill-green { background:#d1fae5; color:#047857; }
  .summary-box { background:#f8fafc; border:1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .grid { display:grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 12px; }
  .stat { background:#f8fafc; border:1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
  .stat .lbl { font-size: 11px; text-transform: uppercase; color: #6b7280; }
  .stat .val { font-size: 18px; font-weight: 600; margin-top: 4px; }
  ul { margin: 6px 0 0 18px; padding: 0; }
  li { margin: 2px 0; font-size: 13px; }
  .muted { color: #6b7280; font-size: 12px; }
</style></head>
<body>
  <h1>Boekhouder Handover Pack</h1>
  <div class="meta">${escapeHtml(org?.legal_name ?? org?.name ?? "")} ${org?.kvk_number ? "· KvK " + escapeHtml(org.kvk_number) : ""} ${org?.btw_number ? "· BTW " + escapeHtml(org.btw_number) : ""}</div>
  <div class="meta">Gegenereerd op ${escapeHtml(generatedAt)}</div>

  <div class="summary-box">
    <h3>Situatie in één blik</h3>
    <p style="margin:6px 0 0 0; font-size:14px;">Deze ondernemer heeft ${open.length} openstaande administratieve zaken via Cash Maatje "FIX THE CHAOS" geanalyseerd. Totaal openstaand bedrag: <b>${fmtMoney(totalDue)}</b>.</p>
    <div class="grid">
      <div class="stat"><div class="lbl">Open</div><div class="val">${open.length}</div></div>
      <div class="stat"><div class="lbl">Urgent</div><div class="val">${open.filter((i)=>i.priority==="red").length}</div></div>
      <div class="stat"><div class="lbl">Belangrijk</div><div class="val">${open.filter((i)=>i.priority==="orange").length}</div></div>
      <div class="stat"><div class="lbl">Te regelen</div><div class="val">${fmtMoney(totalDue)}</div></div>
    </div>
  </div>

  <h2>Openstaande zaken (op urgentie)</h2>
  <table>
    <thead><tr><th>Prio</th><th>Document</th><th>Afzender</th><th>Bedrag</th><th>Deadline</th><th>Actie</th></tr></thead>
    <tbody>
      ${open
        .map((it) => {
          const cls = it.priority === "red" ? "pill-red" : it.priority === "orange" ? "pill-orange" : "pill-green";
          return `<tr>
            <td><span class="pill ${cls}">${escapeHtml(it.priority?.toUpperCase() ?? "")}</span></td>
            <td><b>${escapeHtml(it.document_title)}</b><div class="muted">${escapeHtml(it.category)}</div></td>
            <td>${escapeHtml(it.sender_name ?? "—")}</td>
            <td>${fmtMoney(it.amount_due)}</td>
            <td>${fmtDate(it.payment_deadline ?? it.legal_deadline)}</td>
            <td>${escapeHtml(it.recommended_action)}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>

  <h2>Acties al ondernomen</h2>
  ${
    actions && actions.length > 0
      ? `<table><thead><tr><th>Datum</th><th>Type</th><th>Status</th><th>Notitie</th></tr></thead><tbody>
        ${actions
          .map(
            (a) => `<tr>
              <td>${a.performed_at ? fmtDate(a.performed_at) : "—"}</td>
              <td>${escapeHtml(a.action_type)}</td>
              <td>${escapeHtml(a.status)}</td>
              <td>${escapeHtml(a.notes ?? "")}</td>
            </tr>`
          )
          .join("")}
        </tbody></table>`
      : `<p class="muted">Nog geen acties geregistreerd.</p>`
  }

  <h2>Documenten die waarschijnlijk ontbreken</h2>
  ${
    missingDocs.length > 0
      ? `<ul>${missingDocs
          .map((m) => `<li><b>${escapeHtml(m.name)}</b> — <span class="muted">${escapeHtml(m.why)}</span></li>`)
          .join("")}</ul>`
      : `<p class="muted">Geen ontbrekende documenten gedetecteerd.</p>`
  }

  <h2>Geüploade brondocumenten</h2>
  <ul>
    ${(uploads ?? []).map((u) => `<li>${escapeHtml(u.file_name)} <span class="muted">(${escapeHtml(u.status)}, ${fmtDate(u.created_at)})</span></li>`).join("")}
  </ul>

  <h2>Vervolgvragen voor de ondernemer</h2>
  <ul>
    <li>Welke betalingsregeling wens je per item: spreiden, uitstel of bezwaar?</li>
    <li>Welke bankrekeningen wil je gekoppeld hebben voor afschriften?</li>
    <li>Zijn er nog niet-geüploade brieven die we moeten ontvangen?</li>
  </ul>

  <p class="muted" style="margin-top: 40px;">Gegenereerd door Cash Maatje — FIX THE CHAOS. Vragen? Stuur dit document naar je accountant en plan een 30-min sessie.</p>
</body></html>`;

    const fileName = `handover-${new Date().toISOString().slice(0, 10)}-${crypto.randomUUID().slice(0, 8)}.html`;
    const filePath = `handover/${organization_id}/${fileName}`;

    const { error: upErr } = await admin.storage
      .from("chaos-docs")
      .upload(filePath, new Blob([html], { type: "text/html" }), {
        contentType: "text/html",
        upsert: false,
      });
    if (upErr) throw upErr;

    const payload = {
      open_count: open.length,
      total_due: totalDue,
      red: open.filter((i) => i.priority === "red").length,
      orange: open.filter((i) => i.priority === "orange").length,
      missing_documents: missingDocs.slice(0, 50),
    };

    const { data: pack, error: insErr } = await admin
      .from("chaos_handover_packs")
      .insert({
        organization_id,
        generated_by: userData.user.id,
        file_path: filePath,
        payload,
        status: "ready",
      })
      .select("id, file_path")
      .single();
    if (insErr) throw insErr;

    const { data: signed } = await admin.storage
      .from("chaos-docs")
      .createSignedUrl(filePath, 60 * 60);

    return json({ ok: true, pack_id: pack?.id, file_path: filePath, signed_url: signed?.signedUrl });
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
