-- ============================================================
-- Parabolica PM — Schema V4 (run AFTER supabase-schema-v3.sql)
-- Fixes: task/member joins to profiles, PIN length for portal UI
-- ============================================================

-- ── 1. Re-point FKs to profiles so PostgREST embedded joins work ──
-- tasks.assignee_id and project_members.user_id referenced auth.users,
-- which PostgREST cannot join to profiles. Every auth user has a profile
-- (created by trigger), so pointing at profiles is safe and equivalent.

alter table tasks drop constraint if exists tasks_assignee_id_fkey;
alter table tasks
  add constraint tasks_assignee_id_fkey
  foreign key (assignee_id) references profiles(id) on delete set null;

alter table project_members drop constraint if exists project_members_user_id_fkey;
alter table project_members
  add constraint project_members_user_id_fkey
  foreign key (user_id) references profiles(id) on delete cascade;

alter table task_comments drop constraint if exists task_comments_user_id_fkey;
alter table task_comments
  add constraint task_comments_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

alter table task_activity drop constraint if exists task_activity_user_id_fkey;
alter table task_activity
  add constraint task_activity_user_id_fkey
  foreign key (user_id) references profiles(id) on delete set null;

-- ── 2. Store PIN length so the portal can render the right boxes ──
-- (bcrypt hashes cannot reveal length; existing rows default to 4)
alter table projects add column if not exists pin_length int default 4;

-- Public RPC: portal fetches how many PIN boxes to show
create or replace function get_client_pin_length(p_slug text)
returns int as $$
declare
  v_len int;
begin
  select coalesce(pin_length, 4) into v_len from projects where slug = p_slug;
  if not found then
    return null;
  end if;
  return least(v_len, 5);
end;
$$ language plpgsql security definer set search_path = public;

-- Keep pin_length in sync when admin rotates the PIN
create or replace function admin_update_project_pin(p_project_id uuid, p_new_pin text)
returns void as $$
begin
  update projects
  set client_pin = crypt(p_new_pin, gen_salt('bf')),
      pin_length = length(p_new_pin),
      updated_at = now()
  where id = p_project_id;
end;
$$ language plpgsql security definer set search_path = public;
