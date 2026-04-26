# FIX THE CHAOS — Advanced Enhancement Layer

**Scope:** Pure additive layer on top of the working core (upload → AI → dashboard → action agent). **Nothing existing gets removed or rewritten.** Existing files are extended, not replaced. RLS, Gemini flow, status system, current cards: untouched.

Position throughout: **Business Rescue System**, not document management.

---

## 1. Database additions (one migration)

Extend `chaos_items` (additive only, all nullable):
- `panic_score int` (0–100)
- `panic_band text` (`stable` | `warning` | `high` | `immediate`) — derived, stored for fast filtering
- `urgency_lane text` (`today` | `this_week` | `later`)
- `confidence_band text` (`high` | `medium` | `low`)
- `missing_documents jsonb` (array of `{name, why, severity}`)
- `risk_timeline jsonb` (array of `{stage, when, consequence}` — today → reminder → aanmaning → boete → dwangbevel → beslag → deurwaarder)
- `daily_anchor boolean default false` (the single "most important thing today" item)

New tables:
- **`chaos_actions`** — every concrete action taken on an item
  `id, organization_id, chaos_item_id, action_type (call|payment_arrangement|objection|delay_request|email_sent|payment_made|other), status (open|in_progress|done), notes, performed_at, performed_by`
- **`chaos_action_proofs`** — proof vault attachments per action
  `id, action_id, file_path, file_name, mime_type, file_size, uploaded_by, created_at`
- **`chaos_recovery_plans`** — generated 7-day plans
  `id, organization_id, generated_at, generated_by, summary, days jsonb (array of {day, date, title, item_id, action_type, why}), status (active|completed|archived)`
- **`chaos_handover_packs`** — generated bookkeeper packages
  `id, organization_id, generated_at, generated_by, file_path (PDF in chaos-docs), payload jsonb, status`
- **`chaos_prevention_rules`** — Never Again Mode
  `id, organization_id, rule_type (vat_quarterly|ib_yearly|payroll_monthly|payment_alert|custom), label, next_due_at, cadence, channel (email|in_app), is_active`

RLS on all new tables: `organization_id IN (SELECT get_user_org_ids())` for SELECT/INSERT/UPDATE/DELETE — same pattern as existing chaos tables.

Storage: reuse `chaos-docs` bucket with subpath `proofs/<org_id>/...` and `handover/<org_id>/...`. RLS already org-scoped.

---

## 2. Edge function changes — `analyze-chaos-document`

Extend the tool schema (no breaking changes — all new fields optional). AI now also returns:
- `panic_score` (0–100) computed from deadline proximity, amount, sender severity, dwangbevel/incasso flag, repeated-reminder hints
- `urgency_lane` (`today`/`this_week`/`later`)
- `confidence_band` derived from `ai_confidence` (≥0.8 high / 0.5–0.8 medium / <0.5 low)
- `missing_documents` array — proactive detection (e.g. "Bank statement Q1 ontbreekt waarschijnlijk")
- `risk_timeline` array of stages with relative dates ("over 14 dagen", "over 6 weken")

System prompt update: emphasise Belastingdienst escalation ladder (herinnering → aanmaning → naheffingsaanslag + boete → dwangbevel → invordering/beslag → deurwaarder) and ask Gemini to map this document onto that ladder.

After insert, trigger a lightweight post-processing step (same function, after item created):
- Recompute `panic_band` from score
- Mark `daily_anchor=true` on the single highest panic-score open item per org (clears prior anchor)

Two new edge functions:
- **`generate-recovery-plan`** — input `{organization_id}`, reads all open `chaos_items`, asks Gemini 2.5 Pro to produce a 7-day operational plan referencing real item IDs, writes to `chaos_recovery_plans`.
- **`generate-handover-pack`** — input `{organization_id}`, builds structured JSON (situation summary, open issues, deadlines, amounts, uploaded docs, missing docs, actions taken/required), renders to PDF (using existing patterns or simple HTML→PDF via Gemini text + client-side jsPDF fallback), stores in `chaos-docs/handover/`.

Both functions use `verify_jwt = false` default + in-code JWT validation, org membership check, CORS headers from existing pattern.

---

## 3. Hook updates — `useChaosData.ts`

Add (no removals):
- New types for the added fields
- `recoveryPlan` query (latest active plan)
- `generateRecoveryPlan` mutation → invokes `generate-recovery-plan`
- `generateHandoverPack` mutation → invokes `generate-handover-pack`, returns signed URL for download
- `logAction(itemId, type, notes)` mutation → inserts into `chaos_actions`
- `uploadProof(actionId, file)` mutation → uploads to `chaos-docs/proofs/<org>/...` + inserts `chaos_action_proofs`
- `preventionRules` query + `togglePreventionRule` mutation
- Derived `lanes` selector: `{ today: [...], thisWeek: [...], later: [...] }` from `urgency_lane`
- Derived `dailyAnchor` selector: open item with `daily_anchor=true`
- Stats extended: `avgPanic`, `topPanic`, `confidenceLowCount`

---

## 4. New components (all under `src/components/chaos/`)

- **`PanicScoreGauge.tsx`** — minimal circular/arc gauge, 4 bands with semantic colors (stable=emerald, warning=amber, high=orange, immediate=red). Premium serious style, no progress-bar gimmicks. Used at top of `FixTheChaos` page and inside item detail sheet.
- **`DailyAnchorCard.tsx`** — single hero card: "Doe dit vandaag" + one-sentence anchor + jump-to-item button. Replaces nothing; sits above the lanes.
- **`UrgencyLanes.tsx`** — three-column (mobile: stacked) layout: TODAY / THIS WEEK / LATER. Each lane renders existing `ChaosItemCard`s. Default view of the open tab; the existing flat list moves behind a "list view" toggle.
- **`CallModePanel.tsx`** — opens from item sheet. Shows: who, number (tap-to-call), best time window, opening sentence, what to ask, reference number, required docs checklist before calling, post-call notes textarea that saves a `chaos_actions` entry of type `call`.
- **`RiskTimelineStrip.tsx`** — horizontal stepped timeline rendered from `risk_timeline` array. Past stages dim, current stage highlighted, future stages with relative dates. Lives inside item sheet, replacing nothing — added below "Als je dit negeert".
- **`MissingDocsPanel.tsx`** — list of AI-detected missing items per chaos item, each with an inline upload button that posts straight to `chaos-docs` and links via a new `chaos_item_attachments` link (or reuses upload pipeline).
- **`ConfidenceChip.tsx`** — replaces the plain "AI-zekerheid: 87%" line with HIGH/MEDIUM/LOW chip. When LOW, shows inline CTA: "Upload scherpere scan" / "Pagina ontbreekt?".
- **`OneClickTemplates.tsx`** — dropdown on item sheet: Betalingsregeling / Uitstel / Bezwaar / Accountant-mail / Leverancier-betaalverzoek / Belastinguitstel / Belscript. Each generates a Dutch, situation-specific draft via `generate-template` edge call (or a small client-side template registry seeded with the item's data). Output appears in a copyable/editable textarea + "Markeer als verzonden" button → logs `chaos_actions`.
- **`ProofVault.tsx`** — per item, lists all `chaos_actions` with their proofs. Inline file upload, preview, delete (own org only). Audit trail.
- **`SevenDayPlanCard.tsx`** + **`SevenDayPlanView.tsx`** — dashboard CTA card ("Genereer je 7-daags herstelplan") and a dedicated section/sheet showing the plan. Each day: title, why, link to source item, "Klaar" toggle.
- **`BookkeeperHandoverButton.tsx`** — single premium button on the chaos page; click → loading state → download PDF + toast "Pakket klaar voor je boekhouder".
- **`NeverAgainPanel.tsx`** — appears when `stats.open === 0` (or always at bottom of page). Toggle list of prevention rules (BTW Q-reminder, IB jaarlijks, payroll maandelijks, betaal-alerts). Stored in `chaos_prevention_rules`. Wired to existing notifications system.
- **`PositioningHeader.tsx`** — small refinement: header subtitle changes to rescue-system language ("Je business-reddingssysteem. Geen administratie — actie.").

---

## 5. Page changes — `src/pages/FixTheChaos.tsx`

Layout becomes (top → bottom), all additive:
1. Existing header (copy refresh)
2. **NEW:** PanicScoreGauge + DailyAnchorCard (side-by-side on desktop)
3. Existing 4 stat cards (kept; `Urgent`/`Belangrijk` already filterable per prior plan)
4. Existing upload zone + analyzing placeholder + failed-uploads block
5. Existing tabs `Open / Afgehandeld`
   - Inside Open tab: **NEW** view toggle `Lanes (default) | Lijst`
     - Lanes view → `UrgencyLanes`
     - Lijst view → existing flat list (unchanged)
6. **NEW:** SevenDayPlanCard (collapses to view if plan exists)
7. **NEW:** BookkeeperHandoverButton row
8. **NEW:** NeverAgainPanel

Item detail sheet (`ChaosItemCard`) gains tabs/sections inside the existing sheet: Overzicht (current content) / **Bel-modus** (CallModePanel) / **Templates** (OneClickTemplates) / **Bewijs** (ProofVault) / **Risico-tijdlijn** (RiskTimelineStrip) / **Ontbrekend** (MissingDocsPanel). Confidence line swaps to ConfidenceChip.

Dashboard CTA (`FixTheChaosCta.tsx`): copy upgraded to lead with rescue language and surface `dailyAnchor` text when present ("Vandaag: bel Belastingdienst over dwangbevel"), plus the existing `red` count.

---

## 6. Security & RLS verification (deliverable)

Before shipping, we add a short `SECURITY.md` note inside `supabase/functions/analyze-chaos-document/` documenting:
- All chaos tables (`chaos_uploads`, `chaos_items`, `chaos_actions`, `chaos_action_proofs`, `chaos_recovery_plans`, `chaos_handover_packs`, `chaos_prevention_rules`) use `organization_id IN (SELECT get_user_org_ids())` on every CRUD policy.
- Storage bucket `chaos-docs` is private; storage RLS uses the same helper via path prefix `<org_id>/...`.
- Every edge function validates JWT + membership (`organization_members`) before reading or writing.
- Client hook only ever filters by `organization_id = orgId` (defense-in-depth).

This is verification, not new security work — the foundation already enforces it.

---

## 7. What we explicitly DO NOT touch

- Existing `analyze-chaos-document` JSON contract for the original fields (additive only)
- Existing `ChaosItemCard` outer card UI (only the inside sheet gains sections)
- Existing priority colors / labels / category mapping
- Existing upload pipeline, polling, retry, and failed-uploads block
- RLS helper functions (`get_user_org_ids`, `has_role`)
- Sidebar entry, route, dashboard widget placement
- Subscription gating (already removed)

---

## Delivery order (single implementation pass)

1. Migration: extend `chaos_items` + create 5 new tables + RLS
2. Edge function: extend `analyze-chaos-document` schema & prompt; create `generate-recovery-plan` and `generate-handover-pack`
3. Hook: extend `useChaosData` with new queries/mutations and selectors
4. Components: build all new chaos components above
5. Page: re-compose `FixTheChaos.tsx` (additive sections) and extend the item sheet
6. Dashboard CTA: copy + daily anchor surface
7. Smoke test via existing test uploads; verify org isolation in Network tab

After approval, this ships as one cohesive enhancement without breaking the live core flow.