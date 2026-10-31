-- MedCoach AI — AI tutoring, clinical cases, study planning, learning progress.

create table public.ai_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  mode        text not null default 'detailed'
              check (mode in ('beginner','mbbs_exam','detailed','clinical','quick_revision','viva')),
  subject_id  uuid references public.subjects(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  is_saved   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index convs_user_idx on public.ai_conversations(user_id);

create table public.ai_messages (
  id             uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id        uuid not null references auth.users(id) on delete cascade,
  role           text not null check (role in ('user','assistant','system')),
  content        text not null,
  citations      jsonb not null default '[]'::jsonb,
  model          text,
  token_estimate int,
  created_at     timestamptz not null default now()
);

create index messages_conv_idx on public.ai_messages(conversation_id);

create table public.clinical_cases (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  subject          text not null,
  difficulty       text not null default 'medium'
                   check (difficulty in ('easy','medium','hard')),
  demographics      jsonb not null,
  chief_complaint  text not null,
  history          jsonb not null,
  past_history     jsonb not null default '[]'::jsonb,
  examination      jsonb not null default '[]'::jsonb,
  vitals          jsonb not null default '[]'::jsonb,
  investigations   jsonb not null default '[]'::jsonb,
  differentials    jsonb not null default '[]'::jsonb,
  diagnosis        text not null,
  diagnosis_notes  text,
  management       jsonb not null default '[]'::jsonb,
  teaching_points  jsonb not null default '[]'::jsonb,
  is_published     boolean not null default true
);

create table public.case_attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  case_id             uuid not null references public.clinical_cases(id) on delete cascade,
  history_asked       jsonb not null default '[]'::jsonb,
  investigations_ordered jsonb not null default '[]'::jsonb,
  differential_entered jsonb not null default '[]'::jsonb,
  final_diagnosis     text,
  management_entered  jsonb not null default '[]'::jsonb,
  reasoning_score     numeric,
  feedback            text,
  completed_at        timestamptz,
  created_at          timestamptz not null default now()
);

create index case_attempts_user_idx on public.case_attempts(user_id);

create table public.study_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  exam_date     date,
  daily_minutes int not null default 120,
  generated_by  text not null default 'rules' check (generated_by in ('ai','rules')),
  rationale     text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index plans_user_idx on public.study_plans(user_id);

create table public.study_tasks (
  id            uuid primary key default gen_random_uuid(),
  plan_id       uuid not null references public.study_plans(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  scheduled_for date not null,
  title         text not null,
  subject_slug  text,
  kind          text not null check (kind in ('read','flashcards','mcq','case','revision','mock_exam','osce')),
  duration_minutes int not null default 30,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index tasks_user_scheduled_idx on public.study_tasks(user_id, scheduled_for);

create table public.learning_progress (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  subject_slug        text not null,
  topic               text,
  mastery             numeric not null default 0 check (mastery between 0 and 1),
  questions_attempted int not null default 0,
  questions_correct   int not null default 0,
  last_studied_at     timestamptz,
  created_at          timestamptz not null default now(),
  unique (user_id, subject_slug, topic)
);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.clinical_cases enable row level security;
alter table public.case_attempts enable row level security;
alter table public.study_plans enable row level security;
alter table public.study_tasks enable row level security;
alter table public.learning_progress enable row level security;

select public.owner_row_policies('ai_conversations');
select public.owner_row_policies('ai_messages');
select public.owner_row_policies('case_attempts');
select public.owner_row_policies('study_plans');
select public.owner_row_policies('study_tasks');
select public.owner_row_policies('learning_progress');

-- Clinical cases: readable by all authenticated users, writable by admins/instructors.
create policy cases_select on public.clinical_cases for select
  using (auth.role() = 'authenticated');
create policy cases_write on public.clinical_cases for all
  using (public.is_platform_admin(auth.uid()) or public.user_role(auth.uid()) = 'instructor')
  with check (public.is_platform_admin(auth.uid()) or public.user_role(auth.uid()) = 'instructor');

-- Seed a few published clinical cases.
insert into public.clinical_cases
  (slug, title, subject, difficulty, demographics, chief_complaint, history, past_history, examination, vitals, investigations, differentials, diagnosis, diagnosis_notes, management, teaching_points)
values
  ('chest-pain-exertional', 'Exertional chest pain', 'Medicine', 'medium',
   '{"age": 58, "sex": "male", "occupation": "accountant"}',
   'Retrosternal chest pain on climbing stairs',
   '["Pain is crushing in nature, relieved by rest within 2 minutes", "No sweating or vomiting at onset", "Progressive over the past 3 months"]',
   '["Hypertension for 8 years", "Type 2 diabetes", "Smoker: 20 pack-years"]',
   '["BMI 30", "No precordial heave", "Soft flow murmur over carotid"]',
   '[{"label": "BP", "value": "158/92", "flag": "high"}, {"label": "HR", "value": "84"}, {"label": "BMI", "value": "30", "flag": "high"}]',
   '[{"name": "ECG", "result": "SR, poor R wave progression", "cost": 1}, {"name": "Exercise tolerance test", "result": "ST depression 2mm at stage III", "cost": 2}]',
   '["Acute coronary syndrome", "Gastro-oesophageal reflux", "Musculoskeletal chest wall pain"]',
   'Chronic stable angina due to coronary artery disease',
   'Exertional chest pain relieved by rest, risk factors of HTN, diabetes and smoking.',
   '["Aspirin 75 mg daily", "Atorvastatin 40 mg nocte", "Sublingual GTN as needed", "Refer for coronary assessment"]',
   '["Angina is a clinical diagnosis; exertional nature is key", "Risk stratification guides investigation", "Exclude ACS first"]'),
  ('fever-cough-dyspnea', 'Fever, cough and dyspnea', 'Medicine', 'easy',
   '{"age": 34, "sex": "female", "occupation": "teacher"}',
   'Fever, productive cough and breathlessness for 5 days',
   '["Cough with rusty sputum", "Fever with chills at night", "Increasing breathlessness on exertion"]',
   '["No significant past medical history", "Complete immunisation"]',
   '["Fever 38.6°C", "Bronchial breathing at right lung base", "Chest radiograph: right lower zone consolidation"]',
   '[{"label": "Temp", "value": "38.6", "flag": "high"}, {"label": "HR", "value": "102", "flag": "high"}, {"label": "RR", "value": "24", "flag": "high"}]',
   '[{"name": "Chest X-ray", "result": "Right lower lobe consolidation", "cost": 1}, {"name": "Sputum gram stain", "result": "Gram-positive diplococci", "cost": 1}]',
   '["Community-acquired pneumonia", "Pulmonary tuberculosis", "Pulmonary embolism"]',
   'Community-acquired pneumonia (likely pneumococcal)',
   'Typical lobar pneumonia picture with productive fever and focal signs.',
   '["Amoxicillin or a macrolide", "Paracetamol for fever", "Reassess in 48 hours"]',
   '["Bronchial breathing is a key sign of consolidation", "Rusty sputum suggests pneumococcus", "Assess severity with CURB-65"]');
