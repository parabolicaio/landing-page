-- ============================================================
-- Parabolica PM — Schema V5 (run AFTER supabase-schema-v4.sql)
-- Adds: client-facing quick links + important messages
-- ============================================================

-- ── 1. Quick access links shown on the client portal ─────────
create table if not exists project_links (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  label       text not null,
  url         text not null,
  "position"  int default 0,
  created_at  timestamptz default now()
);

-- ── 2. Important messages shown on the client portal ─────────
create table if not exists project_messages (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid references projects(id) on delete cascade,
  title             text not null,
  body              text,
  level             text not null default 'info', -- 'info' | 'success' | 'warning' | 'urgent'
  pinned            boolean default false,
  visible_to_client boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ── 3. RLS — project members manage, super admins see all ────
alter table project_links    enable row level security;
alter table project_messages enable row level security;

create policy "members can manage project links"
  on project_links for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_links.project_id and pm.user_id = auth.uid()
    )
  );

create policy "super admins can manage all links"
  on project_links for all
  using (exists (select 1 from profiles where id = auth.uid() and is_super_admin = true));

create policy "members can manage project messages"
  on project_messages for all
  using (
    exists (
      select 1 from project_members pm
      where pm.project_id = project_messages.project_id and pm.user_id = auth.uid()
    )
  );

create policy "super admins can manage all messages"
  on project_messages for all
  using (exists (select 1 from profiles where id = auth.uid() and is_super_admin = true));

-- ── 4. Public RPCs for the PIN-gated client portal ────────────
create or replace function get_client_links(p_project_id uuid)
returns table (id uuid, label text, url text, "position" int) as $$
begin
  return query
    select l.id, l.label, l.url, l.position
    from project_links l
    where l.project_id = p_project_id
    order by l.position asc, l.created_at asc;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function get_client_messages(p_project_id uuid)
returns table (id uuid, title text, body text, level text, pinned boolean, created_at timestamptz) as $$
begin
  return query
    select m.id, m.title, m.body, m.level, m.pinned, m.created_at
    from project_messages m
    where m.project_id = p_project_id and m.visible_to_client = true
    order by m.pinned desc, m.created_at desc;
end;
$$ language plpgsql security definer set search_path = public;
