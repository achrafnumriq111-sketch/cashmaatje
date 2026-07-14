ALTER TABLE public.chaos_items
  ADD COLUMN IF NOT EXISTS page_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS related_upload_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS grouping_reason text;