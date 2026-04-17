-- Contact activities (call/email/note logging)
CREATE TABLE public.contact_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  contact_id uuid NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('call', 'email', 'note', 'meeting', 'sms')),
  subject text,
  notes text,
  outcome text,
  performed_by uuid REFERENCES auth.users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_contact_activities_contact ON public.contact_activities(contact_id, performed_at DESC);
CREATE INDEX idx_contact_activities_org ON public.contact_activities(organization_id);

ALTER TABLE public.contact_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view contact_activities"
  ON public.contact_activities FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert contact_activities"
  ON public.contact_activities FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()) AND performed_by = auth.uid());

CREATE POLICY "Performer can update own contact_activities"
  ON public.contact_activities FOR UPDATE TO authenticated
  USING (performed_by = auth.uid());

CREATE POLICY "Performer or admin can delete contact_activities"
  ON public.contact_activities FOR DELETE TO authenticated
  USING (performed_by = auth.uid() OR organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('admin','accountant')
  ));

CREATE TRIGGER update_contact_activities_updated_at
  BEFORE UPDATE ON public.contact_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payment reminders (herinneringsschema's)
CREATE TABLE public.payment_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  days_after_due integer NOT NULL DEFAULT 7,
  subject text NOT NULL,
  body_template text NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email','sms')),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_reminders_org ON public.payment_reminders(organization_id, sort_order);

ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view payment_reminders"
  ON public.payment_reminders FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert payment_reminders"
  ON public.payment_reminders FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Bookkeeper+ can update payment_reminders"
  ON public.payment_reminders FOR UPDATE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('bookkeeper','accountant','admin','entrepreneur')
  ));

CREATE POLICY "Bookkeeper+ can delete payment_reminders"
  ON public.payment_reminders FOR DELETE TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('bookkeeper','accountant','admin','entrepreneur')
  ));

CREATE TRIGGER update_payment_reminders_updated_at
  BEFORE UPDATE ON public.payment_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice reminders sent log
CREATE TABLE public.invoice_reminders_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  invoice_id uuid NOT NULL,
  reminder_id uuid REFERENCES public.payment_reminders(id) ON DELETE SET NULL,
  channel text NOT NULL DEFAULT 'email',
  sent_to text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','pending'))
);

CREATE INDEX idx_invoice_reminders_invoice ON public.invoice_reminders_sent(invoice_id, sent_at DESC);

ALTER TABLE public.invoice_reminders_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invoice_reminders_sent"
  ON public.invoice_reminders_sent FOR SELECT TO authenticated
  USING (organization_id IN (SELECT get_user_org_ids()));

CREATE POLICY "Org members can insert invoice_reminders_sent"
  ON public.invoice_reminders_sent FOR INSERT TO authenticated
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));