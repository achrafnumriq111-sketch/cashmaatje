// supabase/functions/send-bank-csv-reminders/index.ts
// Daily cron: sends monthly "upload your bank CSV" reminders to organizations
// that have the reminder enabled, when today matches the configured day of month
// and no bank import has happened in the last 25 days.
//
// Organization settings shape (organizations.settings JSONB):
//   bank_csv_reminder: {
//     enabled: boolean,
//     day: number (1..28),
//     extra_recipients: string[],   // extra emails to CC in addition to org.email
//     last_sent_at?: string         // ISO timestamp, written back after send
//   }

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MONTHS_NL = [
  "januari", "februari", "maart", "april", "mei", "juni",
  "juli", "augustus", "september", "oktober", "november", "december",
];

function monthLabelPrevious(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return `${MONTHS_NL[d.getMonth()]} ${d.getFullYear()}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const svc = createClient(supabaseUrl, serviceKey);
  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://cashmaatje.com";

  const now = new Date();
  const today = now.getUTCDate();

  // Optional overrides for testing
  let forceOrgId: string | null = null;
  let dryRun = false;
  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      forceOrgId = body?.organization_id ?? null;
      dryRun = !!body?.dry_run;
    }
  } catch {}

  let query = svc
    .from("organizations")
    .select("id, name, email, settings")
    .not("settings->bank_csv_reminder", "is", null);

  if (forceOrgId) query = query.eq("id", forceOrgId);

  const { data: orgs, error } = await query;
  if (error) {
    console.error("Fetch orgs failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const org of orgs ?? []) {
    const cfg = (org.settings as any)?.bank_csv_reminder ?? {};
    if (!cfg.enabled) continue;
    const day = Number(cfg.day) || 3;
    if (!forceOrgId && day !== today) continue;

    // Skip if a bank import happened in the last 25 days
    const cutoff = new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentUploads } = await svc
      .from("bank_transactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", org.id)
      .gte("created_at", cutoff);

    if (!forceOrgId && (recentUploads ?? 0) > 0) {
      results.push({ org: org.id, skipped: "recent_import", count: recentUploads });
      continue;
    }

    // Skip if last_sent_at within 20 days (idempotency guard against duplicate cron runs)
    if (!forceOrgId && cfg.last_sent_at) {
      const lastSent = new Date(cfg.last_sent_at);
      const days = (now.getTime() - lastSent.getTime()) / (24 * 60 * 60 * 1000);
      if (days < 20) {
        results.push({ org: org.id, skipped: "already_sent", days });
        continue;
      }
    }

    // Recipients: org.email + extra_recipients + all owner/admin member emails
    const recipients = new Set<string>();
    if (org.email) recipients.add(org.email.toLowerCase());
    for (const e of (cfg.extra_recipients ?? []) as string[]) {
      if (e) recipients.add(e.toLowerCase());
    }

    if (recipients.size === 0) {
      // Fallback: fetch owner email from auth via organization_members
      const { data: members } = await svc
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", org.id)
        .eq("is_owner", true)
        .limit(1);
      const ownerId = members?.[0]?.user_id;
      if (ownerId) {
        const { data: u } = await svc.auth.admin.getUserById(ownerId);
        if (u?.user?.email) recipients.add(u.user.email.toLowerCase());
      }
    }

    const monthLabel = monthLabelPrevious(now);
    const uploadUrl = `${appOrigin}/bank/import`;

    if (dryRun) {
      results.push({ org: org.id, would_send_to: [...recipients], monthLabel });
      continue;
    }

    let sentCount = 0;
    for (const recipientEmail of recipients) {
      const sendRes = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
          "apikey": serviceKey,
        },
        body: JSON.stringify({
          templateName: "bank-csv-reminder",
          recipientEmail,
          idempotencyKey: `bank-csv-${org.id}-${now.getUTCFullYear()}-${now.getUTCMonth() + 1}`,
          templateData: {
            siteName: "CashMaatje",
            monthLabel,
            uploadUrl,
          },
        }),
      });
      if (sendRes.ok) sentCount++;
      else console.error("send failed", org.id, recipientEmail, await sendRes.text());
    }

    // In-app notification for org members
    await svc.from("notifications").insert({
      organization_id: org.id,
      title: "Upload je bank-CSV",
      message: `Tijd om je bankafschrift over ${monthLabel} te uploaden.`,
      message_nl: `Tijd om je bankafschrift over ${monthLabel} te uploaden.`,
      severity: "info",
      category: "bank_import",
      action_url: "/bank/import",
      action_label: "Upload CSV",
    });

    // Persist last_sent_at
    const newSettings = { ...(org.settings as any || {}), bank_csv_reminder: { ...cfg, last_sent_at: now.toISOString() } };
    await svc.from("organizations").update({ settings: newSettings }).eq("id", org.id);

    results.push({ org: org.id, sent: sentCount, recipients: [...recipients] });
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
