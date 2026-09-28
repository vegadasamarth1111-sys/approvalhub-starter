-- =====================================================
-- Request & Approval Portal - Supabase schema
-- Run this whole file once in: Supabase > SQL Editor
-- =====================================================

-- 1) Types
create type public.app_role as enum ('employee', 'manager', 'admin');
create type public.request_status as enum ('pending', 'approved', 'rejected');

-- 2) Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'employee',
  created_at timestamptz not null default now()
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  status public.request_status not null default 'pending',
  decided_by uuid references public.profiles(id),
  decision_comment text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index requests_requester_idx on public.requests (requester_id);
create index requests_status_idx on public.requests (status);

-- 3) Auto-create a profile whenever someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 4) Helper: current user's role (security definer avoids RLS recursion)
create function public.get_my_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- 5) Row Level Security
alter table public.profiles enable row level security;
alter table public.requests enable row level security;

-- profiles: see your own; managers/admins see everyone; only admins change roles
create policy "profiles_select" on public.profiles
  for select using (id = auth.uid() or public.get_my_role() in ('manager', 'admin'));

create policy "profiles_update_admin" on public.profiles
  for update using (public.get_my_role() = 'admin')
  with check (public.get_my_role() = 'admin');

-- requests: employees see/create their own; managers/admins see all and decide
create policy "requests_select" on public.requests
  for select using (
    requester_id = auth.uid() or public.get_my_role() in ('manager', 'admin')
  );

create policy "requests_insert_own" on public.requests
  for insert with check (requester_id = auth.uid() and status = 'pending');

-- a manager/admin can decide, but never on their own request
create policy "requests_decide" on public.requests
  for update using (public.get_my_role() in ('manager', 'admin'))
  with check (
    public.get_my_role() in ('manager', 'admin') and requester_id <> auth.uid()
  );

-- 6) Guard: only decision fields may change, only once, and stamp who/when
create function public.guard_request_update()
returns trigger
language plpgsql
as $$
begin
  if new.requester_id <> old.requester_id
     or new.title <> old.title
     or new.amount <> old.amount
     or new.description is distinct from old.description then
    raise exception 'Only the decision fields can be changed';
  end if;

  if old.status <> 'pending' then
    raise exception 'This request has already been decided';
  end if;

  new.decided_by := auth.uid();
  new.decided_at := now();
  return new;
end;
$$;

create trigger requests_guard
before update on public.requests
for each row execute function public.guard_request_update();

-- =====================================================
-- After you sign up your 3 test users in the app, promote them here
-- (the SQL Editor bypasses RLS, so this works):
--
-- update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@test.com');
-- update public.profiles set role = 'manager'
--   where id = (select id from auth.users where email = 'manager@test.com');
-- =====================================================
