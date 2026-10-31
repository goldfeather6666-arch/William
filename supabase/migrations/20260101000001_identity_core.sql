-- MedCoach AI — identity & core reference tables
-- Provides: institutions, curricula, subjects, profiles, RLS helpers, auth trigger.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

create table public.institutions (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  country        text,
  curriculum_code text,
  created_at     timestamptz not null default now()
);

create table public.curricula (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  title      text not null,
  region     text not null,
  description text,
  exam_format text
);

create table public.subjects (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique not null,
  name       text not null,
  discipline text not null,
  description text,
  color      text not null default '#0f766e'
);

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  email               text,
  role                text not null default 'student'
                      check (role in ('student','instructor','institution_admin','platform_admin')),
  institution_id      uuid references public.institutions(id) on delete set null,
  institution_name    text,
  country             text,
  curriculum          text,
  degree              text,
  academic_year       int check (academic_year between 1 and 12),
  preferred_subjects  text[] not null default '{}',
  exam_date           date,
  daily_study_minutes int check (daily_study_minutes between 0 and 1440),
  explanation_level   text not null default 'student'
                      check (explanation_level in ('beginner','student','advanced')),
  onboarded_at        timestamptz,
  avatar_url          text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index profiles_institution_idx on public.profiles(institution_id);
create index profiles_curriculum_idx on public.profiles(curriculum);

-- ---------------------------------------------------------------------------
-- Helpers used by RLS policies
-- ---------------------------------------------------------------------------

create or replace function public.user_role(uid uuid)
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = uid;
$$;

create or replace function public.is_platform_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.role = 'platform_admin');
$$;

create or replace function public.is_institution_admin(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.role = 'institution_admin');
$$;

-- Trigger: create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.institutions enable row level security;
alter table public.curricula    enable row level security;
alter table public.subjects     enable row level security;
alter table public.profiles     enable row level security;

-- Reference data: readable by everyone, writable only by platform admins.
create policy institutions_read on public.institutions for select using (true);
create policy institutions_write on public.institutions for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

create policy curricula_read on public.curricula for select using (true);
create policy curricula_write on public.curricula for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

create policy subjects_read on public.subjects for select using (true);
create policy subjects_write on public.subjects for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

-- Profiles: users manage their own; admins manage all.
create policy profiles_select_own on public.profiles for select
  using (auth.uid() = id or public.is_platform_admin(auth.uid()));
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id or public.is_platform_admin(auth.uid()))
  with check (auth.uid() = id or public.is_platform_admin(auth.uid()));
create policy profiles_insert_own on public.profiles for insert
  with check (auth.uid() = id or public.is_platform_admin(auth.uid()));
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_platform_admin(auth.uid()));

-- Seed curricula.
insert into public.curricula (code, title, region, description, exam_format) values
  ('bd-mbbs', 'Bangladesh MBBS', 'Bangladesh', 'Bangladesh MBBS curriculum', 'Written + viva + MCQ'),
  ('pk-mbbs', 'Pakistan MBBS', 'Pakistan', 'Pakistan MBBS curriculum', 'Written + OSCE'),
  ('in-mbbs', 'Indian MBBS', 'India', 'Indian MBBS (NMC) curriculum', 'Written + practical'),
  ('usmle', 'USMLE', 'USA', 'United States Medical Licensing Examination', 'Computer-based MCQ'),
  ('plab', 'PLAB', 'UK', 'Professional and Linguistic Assessments Board', 'Written + OSCE'),
  ('amc', 'AMC', 'Australia', 'Australian Medical Council', 'Computer-based MCQ + clinical'),
  ('nursing', 'Nursing', 'International', 'Nursing education', 'Written + skills'),
  ('pharmacy', 'Pharmacy', 'International', 'Pharmacy education', 'Written + practical'),
  ('generic', 'Generic Medicine', 'International', 'General medical education', 'Mixed');

insert into public.subjects (slug, name, discipline, description, color) values
  ('anatomy', 'Anatomy', 'Basic sciences', 'Gross anatomy, histology and embryology', '#0f766e'),
  ('physiology', 'Physiology', 'Basic sciences', 'Normal function of human systems', '#2563eb'),
  ('biochemistry', 'Biochemistry', 'Basic sciences', 'Molecular basis of life and metabolism', '#7c3aed'),
  ('pharmacology', 'Pharmacology', 'Basic sciences', 'Drugs, mechanisms and therapeutics', '#b45309'),
  ('pathology', 'Pathology', 'Basic sciences', 'Mechanisms of disease', '#be123c'),
  ('microbiology', 'Microbiology', 'Basic sciences', 'Pathogens and immunity', '#047857'),
  ('medicine', 'Medicine', 'Clinical', 'Internal medicine and its subspecialties', '#0f766e'),
  ('surgery', 'Surgery', 'Clinical', 'Surgical principles and practice', '#9333ea'),
  ('pediatrics', 'Pediatrics', 'Clinical', 'Child health and development', '#ea580c'),
  ('obgyn', 'Obstetrics & Gynecology', 'Clinical', 'Reproduction and women''s health', '#db2777'),
  ('psychiatry', 'Psychiatry', 'Clinical', 'Mental health and behavior', '#4f46e5'),
  ('community', 'Community Medicine', 'Clinical', 'Public health and epidemiology', '#059669');
