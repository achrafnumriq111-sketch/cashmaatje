import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const { data: orgs, error: orgErr } = await supabase
      .from("organizations")
      .select("id, auto_archive_months")
      .not("auto_archive_months", "is", null);

    if (orgErr) throw orgErr;

    let archivedTotal = 0;
    const perOrg: Array<{ org_id: string; archived: number }> = [];

    for (const org of orgs ?? []) {
      const months = Number((org as any).auto_archive_months);
      if (!months || months <= 0) continue;
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const cutoffIso = cutoff.toISOString().slice(0, 10);

      const { data: updated, error } = await supabase
        .from("invoices")
        .update({ archived: true, archived_at: new Date().toISOString() })
        .eq("organization_id", (org as any).id)
        .eq("archived", false)
        .eq("status", "paid")
        .lte("paid_date", cutoffIso)
        .select("id");

      if (error) {
        console.error("archive error for org", (org as any).id, error.message);
        continue;
      }
      const n = updated?.length ?? 0;
      archivedTotal += n;
      perOrg.push({ org_id: (org as any).id, archived: n });
    }

    return new Response(JSON.stringify({ ok: true, archived: archivedTotal, orgs: perOrg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
