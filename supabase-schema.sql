-- ============================================================
-- Parabolica Project Management — Supabase Schema V1
-- Run this first in Supabase Dashboard → SQL Editor
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  color       text default '#0FBAB0',
  client_name text,
  client_pin  text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists project_members (
  project_id  uuid references projects(id) on delete cascade,
  user_id     uuid references auth.users(id) on delete cascade,
  role        text default 'member',
  joined_at   timestamptz default now(),
  primary key (project_id, user_id)
);

create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'backlog',
  priority    text default 'medium',
  assignee_id uuid references auth.users(id) on delete set null,
  due_date    date,
  position    int default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists milestones (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects(id) on delete cascade,
  title             text not null,
  description       text,
  due_date          date,
  progress          int default 0 check (progress >= 0 and progress <= 100),
  status            text default 'upcoming',
  visible_to_client boolean default true,
  position          int default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  updated_at  timestamptz default now()
);

-- Auto-create profile on new user signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Enable RLS
alter table projects        enable row level security;
alter table project_members enable row level security;
alter table tasks           enable row level security;
alter table milestones      enable row level security;
alter table profiles        enable row level security;

-- Projects
create policy "members can view their projects" on projects for select
  using (exists (select 1 from project_members where project_members.project_id = projects.id and project_members.user_id = auth.uid()));

create policy "admins can insert projects" on projects for insert
  with check (auth.uid() is not null);

create policy "admins can update their projects" on projects for update
  using (exists (select 1 from project_members where project_members.project_id = projects.id and project_members.user_id = auth.uid() and project_members.role = 'admin'));

-- Project members
create policy "users see their own memberships" on project_members for select
  using (user_id = auth.uid());

create policy "admins can manage members" on project_members for all
  using (exists (select 1 from project_members pm2 where pm2.project_id = project_members.project_id and pm2.user_id = auth.uid() and pm2.role = 'admin'));

-- Tasks
create policy "members can view tasks" on tasks for select
  using (exists (select 1 from project_members where project_members.project_id = tasks.project_id and project_members.user_id = auth.uid()));

create policy "members can insert tasks" on tasks for insert
  with check (exists (select 1 from project_members where project_members.project_id = tasks.project_id and project_members.user_id = auth.uid()));

create policy "members can update tasks" on tasks for update
  using (exists (select 1 from project_members where project_members.project_id = tasks.project_id and project_members.user_id = auth.uid()));

create policy "members can delete tasks" on tasks for delete
  using (exists (select 1 from project_members where project_members.project_id = tasks.project_id and project_members.user_id = auth.uid()));

-- Milestones
create policy "members can view milestones" on milestones for select
  using (exists (select 1 from project_members where project_members.project_id = milestones.project_id and project_members.user_id = auth.uid()));

create policy "members can manage milestones" on milestones for all
  using (exists (select 1 from project_members where project_members.project_id = milestones.project_id and project_members.user_id = auth.uid()));

-- Profiles
create policy "profiles are viewable by authenticated users" on profiles for select
  using (auth.uid() is not null);

create policy "users can update own profile" on profiles for update
  using (auth.uid() = id);

-- RPC: verify client PIN (no auth required — security definer)
create or replace function verify_client_pin(p_slug text, p_pin text)
returns json as $$
declare
  v_project projects%rowtype;
begin
  select * into v_project from projects where slug = p_slug;
  if not found then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if v_project.client_pin = crypt(p_pin, v_project.client_pin) then
    return json_build_object(
      'ok', true,
      'project_id', v_project.id,
      'name', v_project.name,
      'color', v_project.color,
      'client_name', v_project.client_name
    );
  else
    return json_build_object('ok', false, 'error', 'invalid_pin');
  end if;
end;
$$ language plpgsql security definer;

-- RPC: get client-visible milestones (no auth required)
create or replace function get_client_milestones(p_project_id uuid)
returns table (id uuid, title text, description text, due_date date, progress int, status text, "position" int) as $$
begin
  return query
    select m.id, m.title, m.description, m.due_date, m.progress, m.status, m.position
    from milestones m
    where m.project_id = p_project_id and m.visible_to_client = true
    order by m.position asc, m.due_date asc nulls last;
end;
$$ language plpgsql security definer;

-- RPC: hash a PIN for storage
create or replace function hash_pin(p_pin text)
returns text as $$
begin
  return crypt(p_pin, gen_salt('bf'));
end;
$$ language plpgsql security definer;
