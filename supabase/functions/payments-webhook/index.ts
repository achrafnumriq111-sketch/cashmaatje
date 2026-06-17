import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";
import {
  activateReferralForCustomer,
  deactivateReferralForSubscription,
  recalcAndSyncForOrg,
} from "../_shared/referral-discount.ts";

const supabase: any = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getOrgIdForUser(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("is_owner", true)
    .limit(1)
    .maybeSingle();
  return data?.organization_id ?? null;
}

function isEntityAddon(subscription: any): boolean {
  return subscription.metadata?.addon_type === "entity";
}

async function ensureChildOrgForEntityAddon(subscription: any, env: StripeEnv): Promise<string | null> {
  const md = subscription.metadata ?? {};
  const parentOrgId = md.parentOrgId;
  const userId = md.userId;
  if (!parentOrgId || !userId) {
    console.error("entity addon missing parentOrgId/userId");
    return null;
  }

  // Already exists?
  const { data: existing } = await supabase
    .from("entity_addons")
    .select("child_organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (existing?.child_organization_id) return existing.child_organization_id;

  let draft: any = {};
  try { draft = JSON.parse(md.entityDraft ?? "{}"); } catch { /* ignore */ }

  const orgType = ["eenmanszaak", "vof", "bv", "stichting", "vereniging"].includes(draft.org_type)
    ? draft.org_type
    : "bv";

  const { data: childOrg, error: orgErr } = await supabase
    .from("organizations")
    .insert({
      name: draft.name ?? "Nieuwe entiteit",
      legal_name: draft.legal_name || null,
      org_type: orgType,
      kvk_number: draft.kvk_number || null,
      btw_number: draft.btw_number || null,
      parent_organization_id: parentOrgId,
      entity_ownership_pct: typeof draft.ownership_pct === "number" ? draft.ownership_pct : 100,
    })
    .select("id")
    .single();
  if (orgErr || !childOrg) {
    console.error("Failed to create child org", orgErr);
    return null;
  }

  // Add owner as member of child org too
  await supabase.from("organization_members").insert({
    organization_id: childOrg.id,
    user_id: userId,
    role: "owner",
    is_owner: true,
  });

  return childOrg.id;
}

async function upsertEntityAddon(subscription: any, env: StripeEnv, childOrgId: string) {
  const item = subscription.items?.data?.[0];
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;
  const md = subscription.metadata ?? {};

  await supabase.from("entity_addons").upsert(
    {
      parent_organization_id: md.parentOrgId,
      child_organization_id: childOrgId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_item_id: item?.id ?? null,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      created_by: md.userId ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }

  // Entity add-on path: create child org + entity_addons row, NIET in subscriptions tabel.
  if (isEntityAddon(subscription)) {
    const childOrgId = await ensureChildOrgForEntityAddon(subscription, env);
    if (childOrgId) await upsertEntityAddon(subscription, env, childOrgId);
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await supabase.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" }
  );

  // Stripe customer id op org bewaren (handig voor referral lookups)
  const orgId = await getOrgIdForUser(userId);
  if (orgId) {
    await supabase
      .from("organizations")
      .update({ stripe_customer_id: subscription.customer })
      .eq("id", orgId);
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  if (isEntityAddon(subscription)) {
    const { data: existing } = await supabase
      .from("entity_addons")
      .select("child_organization_id")
      .eq("stripe_subscription_id", subscription.id)
      .maybeSingle();
    if (existing?.child_organization_id) {
      await upsertEntityAddon(subscription, env, existing.child_organization_id);
    }
    return;
  }

  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      product_id: productId,
      price_id: priceId,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  if (isEntityAddon(subscription)) {
    await supabase
      .from("entity_addons")
      .update({ status: "canceled", updated_at: new Date().toISOString() })
      .eq("stripe_subscription_id", subscription.id)
      .eq("environment", env);
    return;
  }

  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);

  // Referral cancellen + recalc voor referrer
  const result = await deactivateReferralForSubscription({
    admin: supabase,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: subscription.customer,
    newStatus: "cancelled",
  });
  if (result.referrerOrgId) {
    await recalcAndSyncForOrg({
      admin: supabase,
      env,
      organizationId: result.referrerOrgId,
      reason: "referral_cancelled",
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: any, env: StripeEnv) {
  // Eerste succesvolle betaling van de referred customer activeert de referral
  const customerId: string | undefined = invoice.customer;
  const subscriptionId: string | undefined = invoice.subscription;
  if (!customerId) return;

  // userId via subscriptions tabel
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const result = await activateReferralForCustomer({
    admin: supabase,
    env,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId ?? null,
    userId: sub?.user_id ?? null,
  });

  if (result.activated && result.referrerOrgId) {
    await recalcAndSyncForOrg({
      admin: supabase,
      env,
      organizationId: result.referrerOrgId,
      reason: "referral_activated_after_first_payment",
    });
  }
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  // Niet direct cancellen — Stripe retried zelf. Recalc gebeurt pas op subscription.deleted.
  console.log("invoice.payment_failed", invoice.id, invoice.subscription);
}

async function handleCheckoutSessionCompleted(session: any, env: StripeEnv) {
  // Sales-invoice betaling: metadata.invoice_id is gezet door create-invoice-payment-link
  const invoiceId: string | undefined = session.metadata?.invoice_id;
  if (!invoiceId) return; // andere checkouts: subscription create-event handelt dit zelf af

  const amountPaid = typeof session.amount_total === "number" ? session.amount_total / 100 : null;
  if (!amountPaid) {
    console.warn("checkout.session.completed for invoice but no amount_total", session.id);
    return;
  }

  // Idempotent: alleen aanmaken als er nog geen allocation is voor deze session
  const { data: existing } = await supabase
    .from("payment_allocations")
    .select("id")
    .eq("invoice_id", invoiceId)
    .eq("amount", amountPaid)
    .limit(1)
    .maybeSingle();
  if (existing) return;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("organization_id, created_by, payment_link_session_id")
    .eq("id", invoiceId)
    .single();
  if (!invoice) return;

  // Update session_id voor traceability
  if (invoice.payment_link_session_id !== session.id) {
    await supabase.from("invoices").update({ payment_link_session_id: session.id }).eq("id", invoiceId);
  }

  // Maak allocation → trigger update_invoice_paid_amount zet status op paid
  await supabase.from("payment_allocations").insert({
    organization_id: invoice.organization_id,
    invoice_id: invoiceId,
    bank_transaction_id: null,
    amount: amountPaid,
    allocation_date: new Date().toISOString().split("T")[0],
    created_by: invoice.created_by,
  });

  console.log(`Invoice ${invoiceId} marked paid via Stripe checkout session ${session.id}`);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "customer.subscription.created":
      await handleSubscriptionCreated(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "invoice.payment_succeeded":
      await handleInvoicePaymentSucceeded(event.data.object, env);
      break;
    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutSessionCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    console.error("Webhook with invalid env:", rawEnv);
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
