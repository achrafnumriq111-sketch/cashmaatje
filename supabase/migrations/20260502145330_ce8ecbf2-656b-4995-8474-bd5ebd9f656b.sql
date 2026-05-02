-- ============================================================
-- 1. MILEAGE TRIPS (rittenadministratie per organisatie)
-- ============================================================

CREATE TYPE public.mileage_trip_type AS ENUM ('business', 'commute', 'private');

CREATE TABLE public.mileage_trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trip_date date NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  from_lat numeric(10,7),
  from_lng numeric(10,7),
  to_lat numeric(10,7),
  to_lng numeric(10,7),
  km numeric(10,2) NOT NULL CHECK (km >= 0),
  return_trip boolean NOT NULL DEFAULT false,
  trip_type public.mileage_trip_type NOT NULL DEFAULT 'business',
  purpose text,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  vehicle_id uuid REFERENCES public.company_car(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual', -- manual | gps | route | import
  route_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mileage_trips_org_date ON public.mileage_trips (organization_id, trip_date DESC);
CREATE INDEX idx_mileage_trips_type ON public.mileage_trips (organization_id, trip_type);

ALTER TABLE public.mileage_trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org trips"
  ON public.mileage_trips FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "members can insert org trips"
  ON public.mileage_trips FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()) AND created_by = auth.uid());

CREATE POLICY "members can update org trips"
  ON public.mileage_trips FOR UPDATE
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "members can delete org trips"
  ON public.mileage_trips FOR DELETE
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_mileage_trips_updated_at
  BEFORE UPDATE ON public.mileage_trips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. MILEAGE ROUTES (opgeslagen vaste routes)
-- ============================================================

CREATE TABLE public.mileage_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  from_address text NOT NULL,
  to_address text NOT NULL,
  from_lat numeric(10,7),
  from_lng numeric(10,7),
  to_lat numeric(10,7),
  to_lng numeric(10,7),
  km numeric(10,2) NOT NULL CHECK (km >= 0),
  default_trip_type public.mileage_trip_type NOT NULL DEFAULT 'business',
  default_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mileage_routes_org ON public.mileage_routes (organization_id);

ALTER TABLE public.mileage_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members can view org routes"
  ON public.mileage_routes FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "members can insert org routes"
  ON public.mileage_routes FOR INSERT
  WITH CHECK (organization_id IN (SELECT public.get_user_org_ids()) AND created_by = auth.uid());

CREATE POLICY "members can update org routes"
  ON public.mileage_routes FOR UPDATE
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "members can delete org routes"
  ON public.mileage_routes FOR DELETE
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE TRIGGER update_mileage_routes_updated_at
  BEFORE UPDATE ON public.mileage_routes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.mileage_trips
  ADD CONSTRAINT mileage_trips_route_fk
  FOREIGN KEY (route_id) REFERENCES public.mileage_routes(id) ON DELETE SET NULL;

-- ============================================================
-- 3. BENEFITS PROFILE (toeslagenprofiel per gebruiker)
-- ============================================================

CREATE TYPE public.rent_type AS ENUM ('social', 'private', 'none');

CREATE TABLE public.benefits_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  birth_year integer,
  has_partner boolean NOT NULL DEFAULT false,
  partner_birth_year integer,
  partner_yearly_income numeric(12,2) NOT NULL DEFAULT 0,
  num_children integer NOT NULL DEFAULT 0,
  children_ages jsonb NOT NULL DEFAULT '[]'::jsonb,
  rent_type public.rent_type NOT NULL DEFAULT 'none',
  monthly_rent numeric(10,2) NOT NULL DEFAULT 0,
  monthly_service_costs numeric(10,2) NOT NULL DEFAULT 0,
  has_childcare boolean NOT NULL DEFAULT false,
  childcare_hours_per_month numeric(8,2) NOT NULL DEFAULT 0,
  childcare_hourly_rate numeric(8,2) NOT NULL DEFAULT 0,
  total_assets numeric(12,2) NOT NULL DEFAULT 0,
  health_insurance_yearly numeric(10,2) NOT NULL DEFAULT 0,
  income_override numeric(12,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.benefits_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can view own benefits profile"
  ON public.benefits_profile FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users can insert own benefits profile"
  ON public.benefits_profile FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "users can update own benefits profile"
  ON public.benefits_profile FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "users can delete own benefits profile"
  ON public.benefits_profile FOR DELETE
  USING (user_id = auth.uid());

CREATE TRIGGER update_benefits_profile_updated_at
  BEFORE UPDATE ON public.benefits_profile
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();