-- ============================================================
-- Parabolica PM — Schema V2 (run AFTER supabase-schema.sql)
-- Adds: clients table, super_admin role, service-role helpers
-- ============================================================

-- ── 1. Add super_admin flag to profiles ─────────────────────
alter table profiles add column if not exists is_super_admin boolean default false;
alter table profiles add column if not exists is_active      boolean default true;

-- ── 2. Clients table ────────────────────────────────────────
create table if not exists clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,          -- used for their portal URL namespace
  description text,
  logo_url    text,
  color       text default '#0FBAB0',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Link clients to projects (a client can have many projects)
alter table projects add column if not exists client_id uuid references clients(id) on delete set null;

-- ── 3. RLS for clients ──────────────────────────────────────
alter table clients enable row level security;

-- Only authenticated users see clients
create policy "authenticated users can view clients"
  on clients for select using (auth.uid() is not null);

-- Only super admins can mutate clients
create policy "super admins can manage clients"
  on clients for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- ── 4. Super admin can see/manage ALL projects ───────────────
create policy "super admins can view all projects"
  on projects for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

create policy "super admins can update all projects"
  on projects for update
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

create policy "super admins can delete projects"
  on projects for delete
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Super admin can manage ALL project_members
create policy "super admins can view all memberships"
  on project_members for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

create policy "super admins can manage all memberships"
  on project_members for all
  using (
    exists (select 1 from profiles where id = auth.uid() and is_super_admin = true)
  );

-- Super admin can view all profiles
create policy "super admins can update all profiles"
  on profiles for update
  using (
    exists (select 1 from profiles p2 where p2.id = auth.uid() and p2.is_super_admin = true)
  );

-- ── 5. Admin helper RPCs (run as service role = bypass RLS) ──

-- Invite a new team member (wraps Supabase admin invite API — call from server-side API route)
-- This is a placeholder; actual invite uses supabase-admin client in the API route.

-- Get all users + their profiles for admin panel
create or replace function admin_get_all_users()
returns table (
  id uuid, email text, full_name text, is_super_admin boolean,
  is_active boolean, created_at timestamptz
) as $$
begin
  return query
    select
      u.id,
      u.email::text,
      p.full_name,
      coalesce(p.is_super_admin, false),
      coalesce(p.is_active, true),
      u.created_at
    from auth.users u
    left join profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$ language plpgsql security definer;

-- Get all projects with stats for admin table
create or replace function admin_get_projects_with_stats()
returns table (
  id uuid, name text, slug text, description text, color text,
  client_id uuid, client_name text, task_total bigint, task_done bigint,
  member_count bigint, created_at timestamptz
) as $$
begin
  return query
    select
      p.id, p.name, p.slug, p.description, p.color,
      p.client_id,
      c.name as client_name,
      count(distinct t.id)::bigint as task_total,
      count(distinct t.id) filter (where t.status = 'done')::bigint as task_done,
      count(distinct pm.user_id)::bigint as member_count,
      p.created_at
    from projects p
    left join clients c on c.id = p.client_id
    left join tasks t on t.project_id = p.id
    left join project_members pm on pm.project_id = p.id
    group by p.id, c.name
    order by p.created_at desc;
end;
$$ language plpgsql security definer;

-- Update project PIN
create or replace function admin_update_project_pin(p_project_id uuid, p_new_pin text)
returns void as $$
begin
  update projects
  set client_pin = crypt(p_new_pin, gen_salt('bf')),
      updated_at = now()
  where id = p_project_id;
end;
$$ language plpgsql security definer;

-- ── 6. Make yourself super_admin ────────────────────────────
-- Run this after setup, replacing your email:
-- update profiles set is_super_admin = true
-- where id = (select id from auth.users where email = 'your@email.com');
