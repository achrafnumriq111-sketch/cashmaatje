// Super-admin only: list testers with login info, delete organizations / users.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) {
      return json({ error: "unauthenticated" }, 401);
    }
    const admin = createClient(url, service);
    const { data: roleCheck } = await admin
      .from("platform_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    if (!roleCheck) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;

    if (action === "list_testers") {
      // tester organizations + their owners + auth info
      const { data: orgs, error: orgErr } = await admin
        .from("organizations")
        .select("id, name, created_at, is_tester")
        .eq("is_tester", true)
        .order("created_at", { ascending: false });
      if (orgErr) throw orgErr;

      const orgIds = (orgs ?? []).map((o) => o.id);
      const { data: members } = await admin
        .from("organization_members")
        .select("organization_id, user_id, is_owner, role")
        .in("organization_id", orgIds.length ? orgIds : ["00000000-0000-0000-0000-000000000000"]);

      const ownerByOrg = new Map<string, string>();
      (members ?? []).forEach((m: any) => {
        if (m.is_owner && !ownerByOrg.has(m.organization_id)) ownerByOrg.set(m.organization_id, m.user_id);
      });

      // collect all unique tester user ids (owners + members)
      const userIds = Array.from(new Set((members ?? []).map((m: any) => m.user_id)));

      // Pull all auth users (paginate up to 1000 — fine for now)
      const authUsers: any[] = [];
      let page = 1;
      while (true) {
        const { data: list, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        if (error) throw error;
        authUsers.push(...list.users);
        if (list.users.length < 200) break;
        page++;
        if (page > 10) break;
      }
      const authById = new Map(authUsers.map((u) => [u.id, u]));

      const testers = (orgs ?? []).map((o: any) => {
        const ownerId = ownerByOrg.get(o.id);
        const u = ownerId ? authById.get(ownerId) : null;
        return {
          organization_id: o.id,
          organization_name: o.name,
          organization_created_at: o.created_at,
          owner_user_id: ownerId ?? null,
          email: u?.email ?? null,
          full_name: u?.user_metadata?.full_name ?? null,
          last_sign_in_at: u?.last_sign_in_at ?? null,
          user_created_at: u?.created_at ?? null,
          email_confirmed_at: u?.email_confirmed_at ?? null,
        };
      });

      return json({ testers });
    }

    if (action === "list_org_owners") {
      const orgIds = (body.organization_ids as string[]) ?? [];
      if (!orgIds.length) return json({ owners: {} });
      const { data: members } = await admin
        .from("organization_members")
        .select("organization_id, user_id, is_owner")
        .in("organization_id", orgIds)
        .eq("is_owner", true);
      const ownerIds = Array.from(new Set((members ?? []).map((m: any) => m.user_id)));
      const { data: profs } = await admin
        .from("user_profiles")
        .select("id, email, full_name")
        .in("id", ownerIds.length ? ownerIds : ["00000000-0000-0000-0000-000000000000"]);
      const profById = new Map((profs ?? []).map((p: any) => [p.id, p]));
      const out: Record<string, { email: string | null; full_name: string | null }> = {};
      (members ?? []).forEach((m: any) => {
        const p = profById.get(m.user_id);
        out[m.organization_id] = { email: p?.email ?? null, full_name: p?.full_name ?? null };
      });
      return json({ owners: out });
    }

    if (action === "delete_organization") {
      const orgId = body.organization_id as string;
      if (!orgId) return json({ error: "organization_id required" }, 400);
      const { error } = await admin.from("organizations").delete().eq("id", orgId);
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete_user") {
      const userId = body.user_id as string;
      if (!userId) return json({ error: "user_id required" }, 400);
      // Delete owned organizations first (cascade their data)
      const { data: owned } = await admin
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .eq("is_owner", true);
      const ids = (owned ?? []).map((o: any) => o.organization_id);
      if (ids.length) {
        await admin.from("organizations").delete().in("id", ids);
      }
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e: any) {
    console.error(e);
    return json({ error: e?.message ?? String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
