-- ============================================================
-- Parabolica PM — Schema V3: Task comments & activity log
-- Run AFTER supabase-schema-v2.sql
-- ============================================================

-- Comments on tasks
create table if not exists task_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references tasks(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz default now()
);

-- Activity log (status changes, assignee changes, comments, creation)
create table if not exists task_activity (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid references tasks(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete set null,
  type       text not null, -- 'status_change' | 'assignee_change' | 'comment' | 'created'
  from_value text,
  to_value   text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table task_comments enable row level security;
alter table task_activity enable row level security;

-- task_comments: project members can view/insert
create policy "members can view task comments"
  on task_comments for select
  using (
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_comments.task_id and pm.user_id = auth.uid()
    )
  );

create policy "members can insert task comments"
  on task_comments for insert
  with check (
    auth.uid() is not null and
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_comments.task_id and pm.user_id = auth.uid()
    )
  );

-- task_activity: project members can view; insert via trigger / client
create policy "members can view task activity"
  on task_activity for select
  using (
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_activity.task_id and pm.user_id = auth.uid()
    )
  );

create policy "members can insert task activity"
  on task_activity for insert
  with check (
    auth.uid() is not null and
    exists (
      select 1 from tasks t
      join project_members pm on pm.project_id = t.project_id
      where t.id = task_activity.task_id and pm.user_id = auth.uid()
    )
  );

-- Super admins can see everything
create policy "super admins can view all task comments"
  on task_comments for all
  using (exists (select 1 from profiles where id = auth.uid() and is_super_admin = true));

create policy "super admins can view all task activity"
  on task_activity for all
  using (exists (select 1 from profiles where id = auth.uid() and is_super_admin = true));
