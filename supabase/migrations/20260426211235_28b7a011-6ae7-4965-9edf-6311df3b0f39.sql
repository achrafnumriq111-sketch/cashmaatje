-- 1. Extend chaos_items
ALTER TABLE public.chaos_items
  ADD COLUMN IF NOT EXISTS panic_score integer,
  ADD COLUMN IF NOT EXISTS panic_band text,
  ADD COLUMN IF NOT EXISTS urgency_lane text,
  ADD COLUMN IF NOT EXISTS confidence_band text,
  ADD COLUMN IF NOT EXISTS missing_documents jsonb,
  ADD COLUMN IF NOT EXISTS risk_timeline jsonb,
  ADD COLUMN IF NOT EXISTS daily_anchor boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_chaos_items_panic ON public.chaos_items(organization_id, panic_score DESC NULLS LAST) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_chaos_items_lane ON public.chaos_items(organization_id, urgency_lane) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_chaos_items_anchor ON public.chaos_items(organization_id) WHERE daily_anchor = true;

-- 2. chaos_actions
CREATE TABLE IF NOT EXISTS public.chaos_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  chaos_item_id uuid NOT NULL REFERENCES public.chaos_items(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  notes text,
  performed_at timestamptz,
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chaos_actions_item ON public.chaos_actions(chaos_item_id, created_at DESC);
ALTER TABLE public.chaos_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_actions select own org" ON public.chaos_actions
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_actions insert own org" ON public.chaos_actions
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_actions update own org" ON public.chaos_actions
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_actions delete own org" ON public.chaos_actions
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER trg_chaos_actions_updated
  BEFORE UPDATE ON public.chaos_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. chaos_action_proofs
CREATE TABLE IF NOT EXISTS public.chaos_action_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  action_id uuid NOT NULL REFERENCES public.chaos_actions(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  file_size bigint,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chaos_proofs_action ON public.chaos_action_proofs(action_id, created_at DESC);
ALTER TABLE public.chaos_action_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_proofs select own org" ON public.chaos_action_proofs
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_proofs insert own org" ON public.chaos_action_proofs
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_proofs delete own org" ON public.chaos_action_proofs
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

-- 4. chaos_recovery_plans
CREATE TABLE IF NOT EXISTS public.chaos_recovery_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  summary text,
  days jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chaos_recovery_org ON public.chaos_recovery_plans(organization_id, generated_at DESC);
ALTER TABLE public.chaos_recovery_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_recovery select own org" ON public.chaos_recovery_plans
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_recovery insert own org" ON public.chaos_recovery_plans
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_recovery update own org" ON public.chaos_recovery_plans
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_recovery delete own org" ON public.chaos_recovery_plans
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER trg_chaos_recovery_updated
  BEFORE UPDATE ON public.chaos_recovery_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. chaos_handover_packs
CREATE TABLE IF NOT EXISTS public.chaos_handover_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  generated_by uuid,
  file_path text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'ready',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chaos_handover_org ON public.chaos_handover_packs(organization_id, generated_at DESC);
ALTER TABLE public.chaos_handover_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_handover select own org" ON public.chaos_handover_packs
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_handover insert own org" ON public.chaos_handover_packs
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_handover delete own org" ON public.chaos_handover_packs
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

-- 6. chaos_prevention_rules
CREATE TABLE IF NOT EXISTS public.chaos_prevention_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  rule_type text NOT NULL,
  label text NOT NULL,
  next_due_at timestamptz,
  cadence text,
  channel text NOT NULL DEFAULT 'in_app',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chaos_prevention_org ON public.chaos_prevention_rules(organization_id, is_active);
ALTER TABLE public.chaos_prevention_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chaos_prevention select own org" ON public.chaos_prevention_rules
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_prevention insert own org" ON public.chaos_prevention_rules
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_prevention update own org" ON public.chaos_prevention_rules
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "chaos_prevention delete own org" ON public.chaos_prevention_rules
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER trg_chaos_prevention_updated
  BEFORE UPDATE ON public.chaos_prevention_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();