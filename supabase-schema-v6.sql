-- ============================================================
-- Parabolica PM — Schema V6 (run AFTER supabase-schema-v5.sql)
-- Adds: assignment + completion timestamps for elapsed-time display
-- Maintained automatically by a trigger (no client changes needed)
-- ============================================================

alter table tasks add column if not exists assigned_at timestamptz;
alter table tasks add column if not exists done_at     timestamptz;

-- Backfill existing rows so cards have something to show immediately
update tasks set assigned_at = coalesce(assigned_at, created_at) where assignee_id is not null;
update tasks set done_at     = coalesce(done_at, updated_at)     where status = 'done';

-- Trigger keeps the timestamps correct on every insert/update path
-- (drag-and-drop, edit modal, API — all go through the tasks table)
create or replace function tasks_track_timestamps()
returns trigger as $$
begin
  if (tg_op = 'INSERT') then
    if new.assignee_id is not null and new.assigned_at is null then
      new.assigned_at := now();
    end if;
    if new.status = 'done' and new.done_at is null then
      new.done_at := now();
    end if;

  elsif (tg_op = 'UPDATE') then
    -- Assignment changed: stamp on assign, clear on unassign
    if new.assignee_id is distinct from old.assignee_id then
      if new.assignee_id is null then
        new.assigned_at := null;
      else
        new.assigned_at := now();
      end if;
    end if;

    -- Status changed: freeze on done, resume on move-out
    if new.status is distinct from old.status then
      if new.status = 'done' then
        new.done_at := now();
      else
        new.done_at := null;
      end if;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_tasks_track_timestamps on tasks;
create trigger trg_tasks_track_timestamps
  before insert or update on tasks
  for each row execute function tasks_track_timestamps();
