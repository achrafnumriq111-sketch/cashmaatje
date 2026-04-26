-- ENUMS
create type public.chaos_priority as enum ('red', 'orange', 'green');
create type public.chaos_status as enum ('pending', 'analyzing', 'analyzed', 'failed', 'resolved');

-- UPLOADS TABLE
create table public.chaos_uploads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  mime_type text,
  status public.chaos_status not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chaos_uploads_org on public.chaos_uploads(organization_id, created_at desc);
create index idx_chaos_uploads_status on public.chaos_uploads(status);

-- ITEMS TABLE
create table public.chaos_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  upload_id uuid not null references public.chaos_uploads(id) on delete cascade,
  category text not null,
  sender_name text,
  document_title text not null,
  summary text,
  amount_due numeric(12,2),
  currency text default 'EUR',
  reference_number text,
  payment_deadline date,
  legal_deadline date,
  priority public.chaos_priority not null default 'orange',
  risk_level int check (risk_level between 1 and 10),
  risk_if_ignored text,
  recommended_action text not null,
  action_owner text default 'jij',
  phone_number text,
  phone_script text,
  required_documents text[],
  is_resolved boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  notes text,
  ai_confidence numeric(3,2),
  ai_reasoning text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_chaos_items_org on public.chaos_items(organization_id, priority, payment_deadline);
create index idx_chaos_items_upload on public.chaos_items(upload_id);
create index idx_chaos_items_open on public.chaos_items(organization_id) where is_resolved = false;

-- RLS
alter table public.chaos_uploads enable row level security;
alter table public.chaos_items enable row level security;

create policy "members read uploads" on public.chaos_uploads
  for select to authenticated using (organization_id in (select get_user_org_ids()));
create policy "members insert uploads" on public.chaos_uploads
  for insert to authenticated with check (organization_id in (select get_user_org_ids()));
create policy "members update uploads" on public.chaos_uploads
  for update to authenticated using (organization_id in (select get_user_org_ids()));
create policy "members delete uploads" on public.chaos_uploads
  for delete to authenticated using (organization_id in (select get_user_org_ids()));

create policy "members read items" on public.chaos_items
  for select to authenticated using (organization_id in (select get_user_org_ids()));
create policy "members insert items" on public.chaos_items
  for insert to authenticated with check (organization_id in (select get_user_org_ids()));
create policy "members update items" on public.chaos_items
  for update to authenticated using (organization_id in (select get_user_org_ids()));
create policy "members delete items" on public.chaos_items
  for delete to authenticated using (organization_id in (select get_user_org_ids()));

-- updated_at triggers
create trigger trg_chaos_uploads_updated before update on public.chaos_uploads
  for each row execute function public.update_updated_at_column();
create trigger trg_chaos_items_updated before update on public.chaos_items
  for each row execute function public.update_updated_at_column();

-- STORAGE BUCKET
insert into storage.buckets (id, name, public)
values ('chaos-docs', 'chaos-docs', false)
on conflict (id) do nothing;

create policy "chaos members read"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'chaos-docs'
    and (((storage.foldername(name))[1])::uuid) in (select get_user_org_ids())
  );
create policy "chaos members insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chaos-docs'
    and (((storage.foldername(name))[1])::uuid) in (select get_user_org_ids())
  );
create policy "chaos members delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'chaos-docs'
    and (((storage.foldername(name))[1])::uuid) in (select get_user_org_ids())
  );