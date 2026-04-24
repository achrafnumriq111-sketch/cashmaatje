-- Enable realtime for VAT-relevant tables so the BTW screen updates live
-- whenever an invoice is saved, a payment is reconciled, or a document is processed.

ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;
ALTER TABLE public.journal_lines REPLICA IDENTITY FULL;
ALTER TABLE public.documents REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'journal_entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'journal_lines'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_lines;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
  END IF;
END $$;