-- MedCoach AI — learning core: notes, flashcards (FSRS), MCQ bank, mock exams.

create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  title       text not null,
  mode        text not null default 'detailed'
              check (mode in ('detailed','short','long_answer','high_yield')),
  content     text not null,
  model       text,
  created_at  timestamptz not null default now()
);

create index notes_user_idx on public.notes(user_id);

create table public.flashcard_decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  description text,
  subject_id  uuid references public.subjects(id) on delete set null,
  document_id uuid references public.documents(id) on delete set null,
  card_count  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index decks_user_idx on public.flashcard_decks(user_id);

create table public.flashcards (
  id                uuid primary key default gen_random_uuid(),
  deck_id           uuid not null references public.flashcard_decks(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  front             text not null,
  back              text not null,
  card_type         text not null default 'basic'
                    check (card_type in ('basic','cloze','image')),
  image_url         text,
  cloze_text        text,
  difficulty        text not null default 'medium'
                    check (difficulty in ('easy','medium','hard')),
  tags              text[] not null default '{}',
  due_at            timestamptz not null default now(),
  stability         double precision not null default 0,
  difficulty_fsrs   double precision not null default 0,
  elapsed_days      int not null default 0,
  scheduled_days    int not null default 0,
  reps              int not null default 0,
  lapses            int not null default 0,
  state             text not null default 'new'
                    check (state in ('new','learning','review','relearning')),
  last_reviewed_at  timestamptz,
  created_at        timestamptz not null default now()
);

create index cards_deck_idx on public.flashcards(deck_id);
create index cards_user_due_idx on public.flashcards(user_id, due_at);

create table public.flashcard_reviews (
  id          uuid primary key default gen_random_uuid(),
  card_id     uuid not null references public.flashcards(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      int not null check (rating between 1 and 4),
  state       text not null,
  scheduled_days int not null,
  stability   double precision not null,
  difficulty  double precision not null,
  reviewed_at timestamptz not null default now()
);

create index reviews_card_idx on public.flashcard_reviews(card_id);

create table public.mcq_questions (
  id               uuid primary key default gen_random_uuid(),
  subject_id        uuid references public.subjects(id) on delete set null,
  topic            text,
  stem             text not null,
  options          text[] not null,
  correct_index    int not null check (correct_index between 0 and 5),
  explanation      text not null,
  option_explanations text[],
  difficulty       text not null default 'medium'
                   check (difficulty in ('easy','medium','hard')),
  is_clinical      boolean not null default false,
  source           text not null default 'manual',
  generated        boolean not null default false,
  verified         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index mcq_subject_idx on public.mcq_questions(subject_id);
create index mcq_difficulty_idx on public.mcq_questions(difficulty);

create table public.question_attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  question_id        uuid not null references public.mcq_questions(id) on delete cascade,
  selected_index      int,
  is_correct         boolean not null,
  time_spent_seconds int,
  session_id         uuid,
  created_at         timestamptz not null default now()
);

create index attempts_user_idx on public.question_attempts(user_id);
create index attempts_question_idx on public.question_attempts(question_id);

create table public.exam_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  kind            text not null default 'mcq'
                  check (kind in ('mcq','saq','laq','mixed')),
  status          text not null default 'in_progress'
                  check (status in ('in_progress','submitted','graded')),
  duration_minutes int,
  question_count  int not null default 0,
  config          jsonb not null default '{}'::jsonb,
  score           numeric,
  max_score       numeric,
  started_at      timestamptz not null default now(),
  submitted_at    timestamptz
);

create index exams_user_idx on public.exam_sessions(user_id);

create table public.exam_questions (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.exam_sessions(id) on delete cascade,
  position     int not null,
  kind         text not null check (kind in ('mcq','saq','laq')),
  prompt       text not null,
  options      text[],
  correct_index int,
  model_answer text,
  rubric       jsonb,
  points       int not null default 1,
  unique (session_id, position)
);

create index examq_session_idx on public.exam_questions(session_id);

create table public.exam_answers (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.exam_sessions(id) on delete cascade,
  question_id   uuid not null references public.exam_questions(id) on delete cascade,
  answer_text   text,
  selected_index int,
  awarded_points numeric,
  is_ai_estimate boolean not null default false,
  feedback      text,
  created_at    timestamptz not null default now(),
  unique (session_id, question_id)
);

create index answers_session_idx on public.exam_answers(session_id);

alter table public.notes enable row level security;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;
alter table public.flashcard_reviews enable row level security;
alter table public.mcq_questions enable row level security;
alter table public.question_attempts enable row level security;
alter table public.exam_sessions enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_answers enable row level security;

-- Owner-scoped helper policies.
create or replace function public.owner_row_policies(tbl text) returns void language plpgsql as $$
begin
  execute format('create policy %I on %I for select using (auth.uid() = user_id or public.is_platform_admin(auth.uid()))', tbl || '_select', tbl);
  execute format('create policy %I on %I for insert with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()))', tbl || '_insert', tbl);
  execute format('create policy %I on %I for update using (auth.uid() = user_id or public.is_platform_admin(auth.uid())) with check (auth.uid() = user_id or public.is_platform_admin(auth.uid()))', tbl || '_update', tbl);
  execute format('create policy %I on %I for delete using (auth.uid() = user_id or public.is_platform_admin(auth.uid()))', tbl || '_delete', tbl);
end;
$$;

select public.owner_row_policies('notes');
select public.owner_row_policies('flashcard_decks');
select public.owner_row_policies('flashcards');
select public.owner_row_policies('flashcard_reviews');
select public.owner_row_policies('question_attempts');
select public.owner_row_policies('exam_sessions');
select public.owner_row_policies('exam_questions');
select public.owner_row_policies('exam_answers');

-- MCQ bank: readable by all authenticated users (shared verified bank),
-- writable by platform admins and instructors.
create policy mcq_select on public.mcq_questions for select
  using (auth.role() = 'authenticated' or public.is_platform_admin(auth.uid()));
create policy mcq_write on public.mcq_questions for all
  using (public.is_platform_admin(auth.uid()) or public.user_role(auth.uid()) = 'instructor')
  with check (public.is_platform_admin(auth.uid()) or public.user_role(auth.uid()) = 'instructor');
