import React from 'react';
import { createClient } from '../../lib/supabase/server';
import Link from 'next/link';
import NewProjectModal from '../../components/dashboard/NewProjectModal';

type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';

const STATUS_DOTS: Record<TaskStatus, string> = {
  backlog:     '#94A3B8',
  todo:        '#60A5FA',
  in_progress: '#F59E0B',
  review:      '#A78BFA',
  done:        '#10B981',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('project_members')
    .select(`role, projects (id, name, slug, description, color, client_name, created_at)`)
    .eq('user_id', user!.id);

  const projects = (memberships || []).map(m => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(m.projects as any),
    role: m.role,
  }));

  if (projects.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
            <p className="mt-1 text-sm text-neutral-500">No projects yet — create one to get started.</p>
          </div>
          <NewProjectModal userId={user!.id} />
        </div>
        <div className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-surface">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-neutral-500 text-sm">No projects yet</p>
          <p className="text-neutral-400 text-xs mt-1">Create your first project above</p>
        </div>
      </div>
    );
  }

  const projectIds = projects.map((p: { id: string }) => p.id);

  // Fetch tasks + members in 2 queries (not N)
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysFromNow = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const [{ data: allTasks }, { data: allMembers }] = await Promise.all([
    supabase
      .from('tasks')
      .select('project_id, status, due_date')
      .in('project_id', projectIds),
    supabase
      .from('project_members')
      .select('project_id, user_id, profiles(full_name)')
      .in('project_id', projectIds),
  ]);

  const projectsWithStats = projects.map((p: { id: string; [key: string]: unknown }) => {
    const tasks = (allTasks || []).filter(t => t.project_id === p.id);

    // Status counts
    const statusCounts: Record<string, number> = {};
    tasks.forEach(t => { statusCounts[t.status] = (statusCounts[t.status] || 0) + 1; });

    // Nearest upcoming due date (within 7 days or overdue)
    let nearestDue: { date: string; overdue: boolean } | null = null;
    tasks.forEach(t => {
      if (!t.due_date || t.status === 'done') return;
      const isOverdue = t.due_date < today;
      const isUpcoming = t.due_date >= today && t.due_date <= sevenDaysFromNow;
      if (isOverdue || isUpcoming) {
        if (!nearestDue || t.due_date < nearestDue.date) {
          nearestDue = { date: t.due_date, overdue: isOverdue };
        }
      }
    });

    // Member avatars
    const members = (allMembers || [])
      .filter(m => m.project_id === p.id)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map(m => ({ user_id: m.user_id, full_name: (Array.isArray((m as any).profiles) ? (m as any).profiles[0]?.full_name : (m as any).profiles?.full_name) ?? null }));

    return {
      ...p,
      taskTotal: tasks.length,
      taskDone: tasks.filter(t => t.status === 'done').length,
      statusCounts,
      nearestDue,
      members,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {projects.length} project{projects.length > 1 ? 's' : ''} you&apos;re part of
          </p>
        </div>
        <NewProjectModal userId={user!.id} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectsWithStats.map(p => (
          <ProjectCard key={p.id as string} project={p} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  const taskTotal = project.taskTotal as number;
  const taskDone  = project.taskDone  as number;
  const progress  = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
  const color     = (project.color as string) || '#0FBAB0';
  const statusCounts = (project.statusCounts as Record<string, number>) || {};
  const nearestDue   = project.nearestDue as { date: string; overdue: boolean } | null;
  const members      = (project.members as Array<{ user_id: string; full_name: string | null }>) || [];

  return (
    <Link href={`/dashboard/${project.id}`} className="group block">
      <div className="bg-white rounded-surface border border-neutral-200 p-5 hover:border-parabolica hover:shadow-md transition-all">
        <div className="w-8 h-1.5 rounded-full mb-4" style={{ backgroundColor: color }} />

        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="font-semibold text-neutral-900 group-hover:text-parabolica transition-colors">
            {project.name as string}
          </h2>
          {project.role === 'admin' && (
            <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-parabolica bg-parabolica/10 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>

        {project.client_name && (
          <p className="text-xs text-neutral-400 mb-2">Client: {project.client_name as string}</p>
        )}

        {project.description && (
          <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{project.description as string}</p>
        )}

        {/* Status dots */}
        {taskTotal > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            {(Object.entries(STATUS_DOTS) as [TaskStatus, string][]).map(([status, dotColor]) => {
              const count = statusCounts[status] || 0;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-0.5" title={`${status}: ${count}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
                  <span className="text-[10px] text-neutral-400">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Upcoming / overdue due date */}
        {nearestDue && (
          <div className={`flex items-center gap-1 text-[11px] font-semibold mb-3 ${
            nearestDue.overdue ? 'text-red-600' : 'text-amber-600'
          }`}>
            <span>{nearestDue.overdue ? '⚠ Overdue' : '📅 Due soon'}:</span>
            <span>{new Date(nearestDue.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>{taskDone}/{taskTotal} done</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: color }} />
          </div>
        </div>

        {/* Member avatars */}
        {members.length > 0 && (
          <div className="flex items-center mt-3">
            <div className="flex -space-x-1.5">
              {members.slice(0, 3).map(m => {
                const initials = (m.full_name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
                return (
                  <div
                    key={m.user_id}
                    title={m.full_name || m.user_id}
                    className="w-6 h-6 rounded-full bg-parabolica/20 border-2 border-white flex items-center justify-center text-[9px] font-bold text-parabolica"
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
            {members.length > 3 && (
              <span className="ml-1.5 text-[10px] text-neutral-400">+{members.length - 3} more</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
