-- Products catalog
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'stuks',
  sales_price NUMERIC(12,2) DEFAULT 0,
  purchase_price NUMERIC(12,2) DEFAULT 0,
  vat_percentage NUMERIC(5,2) DEFAULT 21,
  current_stock NUMERIC(12,3) DEFAULT 0,
  min_stock NUMERIC(12,3) DEFAULT 0,
  barcode TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, sku)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view products" ON public.products
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can insert products" ON public.products
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update products" ON public.products
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete products" ON public.products
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock movements
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL, -- purchase, sale, count_adjustment, manual_correction, return
  quantity NUMERIC(12,3) NOT NULL, -- positive=in, negative=out
  unit_price NUMERIC(12,2),
  reference_type TEXT, -- invoice, manual, count
  reference_id UUID,
  notes TEXT,
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stock_movements" ON public.stock_movements
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can insert stock_movements" ON public.stock_movements
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update stock_movements" ON public.stock_movements
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete stock_movements" ON public.stock_movements
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Function to update product stock on movement
CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products SET current_stock = current_stock + NEW.quantity, updated_at = NOW() WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.products SET current_stock = current_stock - OLD.quantity, updated_at = NOW() WHERE id = OLD.product_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_apply_stock_movement
  AFTER INSERT OR DELETE ON public.stock_movements
  FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Stock counts
CREATE TABLE public.stock_counts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, completed, cancelled
  notes TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stock_counts" ON public.stock_counts
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can insert stock_counts" ON public.stock_counts
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update stock_counts" ON public.stock_counts
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete stock_counts" ON public.stock_counts
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_stock_counts_updated_at BEFORE UPDATE ON public.stock_counts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock count lines
CREATE TABLE public.stock_count_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_count_id UUID NOT NULL REFERENCES public.stock_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  expected_quantity NUMERIC(12,3) NOT NULL DEFAULT 0,
  counted_quantity NUMERIC(12,3),
  difference NUMERIC(12,3) GENERATED ALWAYS AS (COALESCE(counted_quantity, 0) - expected_quantity) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stock_count_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view stock_count_lines" ON public.stock_count_lines
  FOR SELECT USING (stock_count_id IN (SELECT id FROM public.stock_counts WHERE organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can insert stock_count_lines" ON public.stock_count_lines
  FOR INSERT WITH CHECK (stock_count_id IN (SELECT id FROM public.stock_counts WHERE organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can update stock_count_lines" ON public.stock_count_lines
  FOR UPDATE USING (stock_count_id IN (SELECT id FROM public.stock_counts WHERE organization_id IN (SELECT public.get_user_org_ids())));
CREATE POLICY "Org members can delete stock_count_lines" ON public.stock_count_lines
  FOR DELETE USING (stock_count_id IN (SELECT id FROM public.stock_counts WHERE organization_id IN (SELECT public.get_user_org_ids())));

-- Integration connections
CREATE TABLE public.integration_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  integration_key TEXT NOT NULL, -- shopify, mollie, stripe, etc.
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disconnected', -- connected, disconnected, error, pending
  config JSONB DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  connected_at TIMESTAMPTZ,
  connected_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, integration_key)
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view integration_connections" ON public.integration_connections
  FOR SELECT USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can insert integration_connections" ON public.integration_connections
  FOR INSERT WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can update integration_connections" ON public.integration_connections
  FOR UPDATE USING (organization_id IN (SELECT public.get_user_org_ids()));
CREATE POLICY "Org members can delete integration_connections" ON public.integration_connections
  FOR DELETE USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON public.integration_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_org ON public.products(organization_id);
CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_stock_movements_org ON public.stock_movements(organization_id);
CREATE INDEX idx_stock_counts_org ON public.stock_counts(organization_id);
CREATE INDEX idx_integration_connections_org ON public.integration_connections(organization_id);