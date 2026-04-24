CREATE OR REPLACE FUNCTION public.calculate_vat_return(p_org_id uuid, p_start_date date, p_end_date date)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
BEGIN
  WITH vat_data AS (
    SELECT
      jl.vat_box,
      jl.vat_rate_type,
      jl.vat_percentage,
      SUM(
        CASE
          WHEN jl.vat_box IN ('1a','1b','1c','1d','1e','2a','3a','3b','3c','4a','4b')
            THEN (jl.debit_amount - jl.credit_amount)
          ELSE 0
        END
      ) AS base_amount,
      SUM(jl.vat_amount) AS vat_amount
    FROM public.journal_lines jl
    JOIN public.journal_entries je ON je.id = jl.journal_entry_id
    WHERE je.organization_id = p_org_id
      AND je.date BETWEEN p_start_date AND p_end_date
      AND je.status = 'posted'
      AND jl.vat_box IS NOT NULL
    GROUP BY jl.vat_box, jl.vat_rate_type, jl.vat_percentage
  ),
  totals AS (
    SELECT jsonb_build_object(
      'period_start', p_start_date,
      'period_end', p_end_date,
      'box_1a_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '1a'), 0),
      'box_1a_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '1a'), 0),
      'box_1b_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '1b'), 0),
      'box_1b_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '1b'), 0),
      'box_1c_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '1c'), 0),
      'box_1c_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '1c'), 0),
      'box_1d_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '1d'), 0),
      'box_1d_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '1d'), 0),
      'box_1e_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '1e'), 0),
      'box_1e_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '1e'), 0),
      'box_2a_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '2a'), 0),
      'box_2a_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '2a'), 0),
      'box_3a_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '3a'), 0),
      'box_3b_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '3b'), 0),
      'box_3c_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '3c'), 0),
      'box_4a_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '4a'), 0),
      'box_4a_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '4a'), 0),
      'box_4b_base', COALESCE(SUM(base_amount) FILTER (WHERE vat_box = '4b'), 0),
      'box_4b_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '4b'), 0),
      'box_5b_vat', COALESCE(SUM(vat_amount) FILTER (WHERE vat_box = '5b'), 0),
      'details', COALESCE(jsonb_agg(row_to_json(vat_data)), '[]'::jsonb)
    ) AS payload
    FROM vat_data
  )
  SELECT payload INTO result FROM totals;

  result := result || jsonb_build_object(
    'box_5a_vat',
      COALESCE((result->>'box_1a_vat')::numeric, 0) +
      COALESCE((result->>'box_1b_vat')::numeric, 0) +
      COALESCE((result->>'box_1c_vat')::numeric, 0) +
      COALESCE((result->>'box_1d_vat')::numeric, 0) +
      COALESCE((result->>'box_1e_vat')::numeric, 0) +
      COALESCE((result->>'box_2a_vat')::numeric, 0) +
      COALESCE((result->>'box_4a_vat')::numeric, 0) +
      COALESCE((result->>'box_4b_vat')::numeric, 0)
  );

  result := result || jsonb_build_object(
    'box_5c_vat',
      COALESCE((result->>'box_5a_vat')::numeric, 0) - COALESCE((result->>'box_5b_vat')::numeric, 0)
  );

  result := result || jsonb_build_object(
    'box_5f_vat',
      COALESCE((result->>'box_5c_vat')::numeric, 0)
  );

  RETURN COALESCE(result, '{}'::jsonb);
END;
$function$;