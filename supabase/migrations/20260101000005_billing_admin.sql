-- MedCoach AI — billing, usage, provider configs, notifications and admin.

create table public.plans (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  name              text not null,
  price_cents_month int not null default 0,
  price_cents_year  int not null default 0,
  monthly_credits   int not null default 0,
  features          text[] not null default '{}',
  is_active         boolean not null default true
);

create table public.subscriptions (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  plan_code            text not null references public.plans(code),
  status               text not null default 'active'
                       check (status in ('trialing','active','past_due','canceled')),
  interval             text not null default 'month' check (interval in ('month','year')),
  started_at           timestamptz not null default now(),
  current_period_end   timestamptz,
  provider             text not null default 'manual',
  provider_ref         text,
  cancel_at_period_end boolean not null default false
);

create index subscriptions_user_idx on public.subscriptions(user_id);

create table public.credit_transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  amount        int not null,
  balance_after int not null,
  reason        text not null,
  feature       text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index credits_user_idx on public.credit_transactions(user_id);

create table public.usage_logs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users(id) on delete set null,
  feature          text not null,
  provider         text,
  model            text,
  prompt_tokens    int not null default 0,
  completion_tokens int not null default 0,
  cost_cents       int not null default 0,
  latency_ms       int,
  status           text not null default 'success' check (status in ('success','error')),
  error_code       text,
  created_at       timestamptz not null default now()
);

create index usage_user_idx on public.usage_logs(user_id);
create index usage_feature_idx on public.usage_logs(feature);
create index usage_created_idx on public.usage_logs(created_at);

create table public.ai_provider_configs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  provider      text not null check (provider in ('openai','anthropic','gemini','deepseek','openrouter','custom')),
  label         text not null,
  base_url      text,
  model         text,
  encrypted_key text not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index provider_cfg_user_idx on public.ai_provider_configs(user_id);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null,
  body       text,
  kind       text not null default 'info' check (kind in ('info','success','warning','system')),
  href       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications(user_id, read_at);

create table public.admin_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references auth.users(id) on delete set null,
  actor_email text,
  action      text not null,
  target_type text not null,
  target_id   uuid,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index audit_actor_idx on public.audit_logs(actor_id);
create index audit_created_idx on public.audit_logs(created_at);

alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.usage_logs enable row level security;
alter table public.ai_provider_configs enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_settings enable row level security;
alter table public.audit_logs enable row level security;

create policy plans_select on public.plans for select using (true);
create policy plans_admin on public.plans for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

select public.owner_row_policies('subscriptions');
select public.owner_row_policies('credit_transactions');
select public.owner_row_policies('usage_logs');
select public.owner_row_policies('ai_provider_configs');
select public.owner_row_policies('notifications');

-- admin_settings + audit_logs: platform admins only.
create policy admin_settings_admin on public.admin_settings for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));
create policy audit_admin on public.audit_logs for all
  using (public.is_platform_admin(auth.uid())) with check (public.is_platform_admin(auth.uid()));

-- Seed subscription plans.
insert into public.plans (code, name, price_cents_month, price_cents_year, monthly_credits, features) values
  ('free', 'Free', 0, 0, 50,
   '["Limited AI tutoring", "50 credits / month", "Basic quizzes"]'),
  ('student', 'Student', 1200, 12000, 500,
   '["More AI usage", "Notes generation", "Advanced MCQs", "Study planner"]'),
  ('pro', 'Pro', 2400, 24000, 2000,
   '["Advanced clinical simulations", "AI viva examiner", "Extensive document processing", "Detailed analytics"]'),
  ('institution', 'Institution', 9999, 99990, 0,
   '["Multi-student seats", "Instructor dashboard", "Group assignments", "Centralized billing"]');

-- Helpful function: conservative credit balance (authored from ledger).
create or replace function public.credit_balance(uid uuid)
returns int language sql stable security definer set search_path = public as $$
  select coalesce((
    select balance_after
    from public.credit_transactions
    where user_id = uid
    order by created_at desc
    limit 1
  ), 0);
$$;
