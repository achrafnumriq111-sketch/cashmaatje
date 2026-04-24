-- Drop the previous subscribers table (we replace it with the standard pattern)
DROP TABLE IF EXISTS public.subscribers CASCADE;

-- Standard subscriptions table per stripe-webhooks knowledge
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text NOT NULL UNIQUE,
  stripe_customer_id text NOT NULL,
  product_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_admin());

-- Service role bypasses RLS, so no INSERT/UPDATE policies needed for the webhook.

CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
    AND environment = check_env
    AND (
      (status IN ('active', 'trialing') AND (current_period_end IS NULL OR current_period_end > now()))
      OR (status = 'canceled' AND current_period_end > now())
    )
  );
$$;

-- Map price_id -> plan tier
CREATE OR REPLACE FUNCTION public.tier_from_price(p_price_id text)
RETURNS plan_tier
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_price_id LIKE 'start%' THEN 'start'::plan_tier
    WHEN p_price_id LIKE 'smart%' THEN 'smart'::plan_tier
    WHEN p_price_id LIKE 'pro%' THEN 'pro'::plan_tier
    ELSE NULL
  END;
$$;

-- Add subscriptions to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;