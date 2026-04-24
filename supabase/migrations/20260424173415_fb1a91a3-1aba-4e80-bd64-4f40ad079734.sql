CREATE OR REPLACE FUNCTION public.tier_from_price(p_price_id text)
RETURNS plan_tier
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_price_id LIKE 'start%' THEN 'start'::plan_tier
    WHEN p_price_id LIKE 'smart%' THEN 'smart'::plan_tier
    WHEN p_price_id LIKE 'pro%' THEN 'pro'::plan_tier
    ELSE NULL
  END;
$$;