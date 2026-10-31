-- MedCoach AI — document pipeline tables.

create table public.documents (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  file_name        text not null,
  mime_type        text not null,
  size_bytes       bigint not null default 0,
  storage_path     text not null,
  subject_id       uuid references public.subjects(id) on delete set null,
  folder           text,
  status           text not null default 'uploaded'
                   check (status in ('uploaded','extracting','chunking','embedding','ready','failed')),
  page_count       int,
  char_count       int,
  error_message    text,
  checksum         text,
  extracted_preview text,
  processed_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index documents_user_idx on public.documents(user_id);
create index documents_status_idx on public.documents(status);
create index documents_folder_idx on public.documents(user_id, folder);
create index documents_checksum_idx on public.documents(checksum) where checksum is not null;

create table public.document_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  page           int,
  chunk_index    int not null,
  content        text not null,
  token_estimate int not null default 0,
  embedding      vector(1536),
  embedding_model text,
  unique (document_id, chunk_index)
);

create index chunks_document_idx on public.document_chunks(document_id);

create table public.document_jobs (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  status        text not null default 'queued'
                check (status in ('queued','running','succeeded','failed')),
  stage         text not null default 'uploaded',
  attempts      int not null default 0,
  error_message text,
  started_at    timestamptz,
  finished_at   timestamptz,
  created_at    timestamptz not null default now(),
  unique (document_id)
);

create index jobs_status_idx on public.document_jobs(status);

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.document_jobs enable row level security;

-- Documents are private to their owner; admins may read all.
create policy documents_select_own on public.documents for select
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy documents_insert_own on public.documents for insert
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy documents_update_own on public.documents for update
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy documents_delete_own on public.documents for delete
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

create policy chunks_select_own on public.document_chunks for select
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy chunks_insert_own on public.document_chunks for insert
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy chunks_update_own on public.document_chunks for update
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy chunks_delete_own on public.document_chunks for delete
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));

create policy jobs_select_own on public.document_jobs for select
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy jobs_insert_own on public.document_jobs for insert
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy jobs_update_own on public.document_jobs for update
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()))
  with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
create policy jobs_delete_own on public.document_jobs for delete
  using (auth.uid() = user_id or public.is_platform_admin(auth.uid()));
