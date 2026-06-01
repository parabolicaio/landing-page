# Changelog

## v1.0.0 — Project Management System (2026-06-01)

### Added

**Core system (`feature/admin-dashboard`)**
- Supabase auth: SSR client/server helpers, middleware with route guards, `/api/auth/callback`
- `/login` — Email + password team login with loading and error states
- `/dashboard` — Project grid with progress bars and create-project modal (PIN hashing via RPC)
- `/dashboard/[projectId]` — Kanban board (5 columns: Backlog → Done) + Milestones tab with client-visibility toggle
- `/client/[slug]` — PIN-gated client progress portal with animated circular progress ring
- `/admin` — Overview stats (projects, clients, team, tasks)
- `/admin/projects` — Full project table using `admin_get_projects_with_stats()` RPC
- `/admin/projects/[id]` — Edit details, client assignment, colour, member management, PIN rotation, delete
- `/admin/clients` — Client CRUD with slug, colour, project count
- `/admin/team` — Invite via email, toggle active/super_admin, assign to projects
- 4 server-side API routes: `invite-user`, `deactivate-user`, `update-profile`, `project-membership`
- SQL schemas: `supabase-schema.sql` (V1) + `supabase-schema-v2.sql` (V2 super_admin + clients)

**Enhancements (`feature/enhancements`)**
- Task comments & activity log — `task_comments` + `task_activity` tables with RLS; `TaskActivityFeed` component inside every task modal; status changes auto-logged (`supabase-schema-v3.sql`)
- Richer dashboard project cards — coloured status dots, overdue/due-soon badge, member avatars (up to 3 + N more) — all in 2 queries, no N+1
- Milestone SVG timeline on client portal — horizontal scrollable timeline proportional by due date, fills to today in project colour, hover tooltips

### Fixed
- `infinite recursion` in `project_members` RLS — replaced with `is_project_admin()` security definer function
- `position` reserved keyword in `get_client_milestones` SQL function
- Landing page `Header` scoped to home page only (was rendering on all routes)
- Client portal crash (`t.then is not a function`) — replaced `useEffect` param unwrapping with `React.use(params)` for Next.js 15
- `handle_new_user` trigger failure on user creation — added `ON CONFLICT DO NOTHING` and explicit `search_path`
