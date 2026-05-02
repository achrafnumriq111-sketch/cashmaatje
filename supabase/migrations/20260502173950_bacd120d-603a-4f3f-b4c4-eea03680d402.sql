CREATE OR REPLACE FUNCTION public.apply_industry_preset(p_org_id uuid, p_industry text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_extra jsonb;
  v_row jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not authorised for organisation %', p_org_id;
  END IF;

  IF p_industry IS NULL OR p_industry = '' THEN RETURN; END IF;

  -- Extra account presets per branche
  v_extra := CASE p_industry
    WHEN 'zzp_it' THEN '[
      {"code":"7431","name":"Hosting & cloud","type":"expense","subtype":"operating_expense","balance":"debit","sort":7431},
      {"code":"7432","name":"Software-licenties","type":"expense","subtype":"operating_expense","balance":"debit","sort":7432},
      {"code":"7660","name":"Studiekosten & opleidingen","type":"expense","subtype":"operating_expense","balance":"debit","sort":7660}
    ]'::jsonb
    WHEN 'webshop' THEN '[
      {"code":"4150","name":"Omzet webshop","type":"revenue","subtype":"sales_revenue","balance":"credit","sort":415},
      {"code":"7050","name":"Inkoopwaarde verkochte goederen","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":705},
      {"code":"7250","name":"Verzendkosten uit","type":"expense","subtype":"operating_expense","balance":"debit","sort":725},
      {"code":"7260","name":"Betaalproviderkosten (Stripe/Mollie)","type":"expense","subtype":"operating_expense","balance":"debit","sort":726}
    ]'::jsonb
    WHEN 'horeca' THEN '[
      {"code":"4110","name":"Omzet keuken (9%)","type":"revenue","subtype":"sales_revenue","balance":"credit","sort":411},
      {"code":"4120","name":"Omzet drank (21%)","type":"revenue","subtype":"sales_revenue","balance":"credit","sort":412},
      {"code":"7060","name":"Inkoop voedingsmiddelen","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":706},
      {"code":"7070","name":"Inkoop dranken","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":707},
      {"code":"7560","name":"Personeel inhuur","type":"expense","subtype":"payroll_expense","balance":"debit","sort":756}
    ]'::jsonb
    WHEN 'bouw' THEN '[
      {"code":"7080","name":"Materiaalkosten","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":708},
      {"code":"7090","name":"Onderaanneming","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":709},
      {"code":"7350","name":"Gereedschap & klein materiaal","type":"expense","subtype":"operating_expense","balance":"debit","sort":735},
      {"code":"4550","name":"Omzet BTW verlegd (bouw)","type":"revenue","subtype":"sales_revenue","balance":"credit","sort":455}
    ]'::jsonb
    WHEN 'holding' THEN '[
      {"code":"0300","name":"Deelnemingen","type":"asset","subtype":"fixed_asset","balance":"debit","sort":30},
      {"code":"4910","name":"Dividendinkomsten","type":"revenue","subtype":"other_income","balance":"credit","sort":491},
      {"code":"4920","name":"Managementfee opbrengst","type":"revenue","subtype":"service_revenue","balance":"credit","sort":492}
    ]'::jsonb
    WHEN 'retail' THEN '[
      {"code":"4150","name":"Omzet winkel","type":"revenue","subtype":"sales_revenue","balance":"credit","sort":415},
      {"code":"7050","name":"Inkoopwaarde verkochte goederen","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":705},
      {"code":"1410","name":"Voorraad winkel","type":"asset","subtype":"inventory","balance":"debit","sort":141}
    ]'::jsonb
    WHEN 'zorg' THEN '[
      {"code":"4250","name":"Omzet zorg (vrijgesteld)","type":"revenue","subtype":"service_revenue","balance":"credit","sort":425},
      {"code":"7670","name":"Beroepsaansprakelijkheid","type":"expense","subtype":"insurance","balance":"debit","sort":767},
      {"code":"7680","name":"BIG-registratie & contributies","type":"expense","subtype":"operating_expense","balance":"debit","sort":768}
    ]'::jsonb
    WHEN 'creatief' THEN '[
      {"code":"7270","name":"Materiaal & productie","type":"expense","subtype":"cost_of_goods","balance":"debit","sort":727},
      {"code":"7280","name":"Freelancers / inhuur","type":"expense","subtype":"professional_fees","balance":"debit","sort":728},
      {"code":"4260","name":"Omzet creatieve diensten","type":"revenue","subtype":"service_revenue","balance":"credit","sort":426}
    ]'::jsonb
    ELSE '[]'::jsonb
  END;

  FOR v_row IN SELECT * FROM jsonb_array_elements(v_extra) LOOP
    INSERT INTO accounts (
      organization_id, code, name, name_nl, account_type, account_subtype,
      is_system, normal_balance, sort_order
    ) VALUES (
      p_org_id,
      v_row->>'code',
      v_row->>'name',
      v_row->>'name',
      (v_row->>'type')::account_type,
      (v_row->>'subtype')::account_subtype,
      false,
      v_row->>'balance',
      (v_row->>'sort')::int
    )
    ON CONFLICT (organization_id, code) DO NOTHING;
  END LOOP;

  -- Markeer in settings welke preset is toegepast
  UPDATE organizations
  SET settings = COALESCE(settings, '{}'::jsonb) || jsonb_build_object('industry_preset_applied', p_industry)
  WHERE id = p_org_id;
END;
$function$;