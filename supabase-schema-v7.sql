-- ============================================================
-- Parabolica PM — Schema V7 (run AFTER supabase-schema-v6.sql)
-- Adds: task_type (bug | feature | request | improvement)
-- ============================================================

alter table tasks add column if not exists task_type text default 'feature';

-- Existing rows without a type fall back to 'feature'
update tasks set task_type = 'feature' where task_type is null;
