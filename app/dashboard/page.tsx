import React from 'react';
import { createClient } from '../../lib/supabase/server';
import Link from 'next/link';
import NewProjectModal from '../../components/dashboard/NewProjectModal';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: memberships } = await supabase
    .from('project_members')
    .select(`
      role,
      projects (
        id, name, slug, description, color, client_name, created_at
      )
    `)
    .eq('user_id', user!.id);

  const projects = (memberships || []).map(m => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(m.projects as any),
    role: m.role,
  }));

  // Fetch task counts per project in a single query
  const projectIds = projects.map((p: { id: string }) => p.id);
  const { data: allTasks } = projectIds.length > 0
    ? await supabase
        .from('tasks')
        .select('project_id, status')
        .in('project_id', projectIds)
    : { data: [] };

  const projectsWithStats = projects.map((p: { id: string; [key: string]: unknown }) => {
    const tasks = (allTasks || []).filter(t => t.project_id === p.id);
    return {
      ...p,
      taskTotal: tasks.length,
      taskDone: tasks.filter(t => t.status === 'done').length,
    };
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {projects.length === 0
              ? 'No projects yet — create one to get started.'
              : `${projects.length} project${projects.length > 1 ? 's' : ''} you're part of`}
          </p>
        </div>
        <NewProjectModal userId={user!.id} />
      </div>

      {projectsWithStats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projectsWithStats.map((p) => (
            <ProjectCard key={p.id as string} project={p} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 border-2 border-dashed border-neutral-200 rounded-surface">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-neutral-500 text-sm">No projects yet</p>
          <p className="text-neutral-400 text-xs mt-1">Create your first project above</p>
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Record<string, unknown> }) {
  const taskTotal = project.taskTotal as number;
  const taskDone = project.taskDone as number;
  const progress = taskTotal > 0 ? Math.round((taskDone / taskTotal) * 100) : 0;
  const color = (project.color as string) || '#0FBAB0';

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
          <p className="text-sm text-neutral-500 line-clamp-2 mb-4">{project.description as string}</p>
        )}

        <div className="mt-4">
          <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
            <span>{taskDone}/{taskTotal} tasks done</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
