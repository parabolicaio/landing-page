import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import KanbanBoard from '../../../components/dashboard/KanbanBoard';
import Link from 'next/link';

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Check membership (RLS also enforces this)
  const { data: membership } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!membership) notFound();

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (!project) notFound();

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, profiles(full_name)')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  const { data: milestones } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true });

  const { data: rawMembers } = await supabase
    .from('project_members')
    .select('user_id, role, profiles(full_name)')
    .eq('project_id', projectId);

  // Normalise the profiles join (Supabase can return array or object)
  const members = (rawMembers || []).map((m) => ({
    user_id: m.user_id,
    role: m.role,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    profiles: Array.isArray((m as any).profiles) ? (m as any).profiles[0] ?? null : (m as any).profiles,
  }));

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center gap-3">
        <Link href="/dashboard" className="text-sm text-neutral-400 hover:text-parabolica transition-colors">
          ← Projects
        </Link>
        <span className="text-neutral-200">/</span>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color || '#0FBAB0' }}
          />
          <span className="text-sm font-semibold text-neutral-900">{project.name}</span>
        </div>
        {project.client_name && (
          <span className="text-xs text-neutral-400 ml-1">— {project.client_name}</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <a
            href={`/client/${project.slug}`}
            target="_blank"
            className="text-xs text-parabolica hover:underline"
          >
            Client view ↗
          </a>
          {membership.role === 'admin' && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-parabolica bg-parabolica/10 px-2 py-0.5 rounded-full">
              Admin
            </span>
          )}
        </div>
      </div>

      <KanbanBoard
        project={project}
        initialTasks={tasks || []}
        initialMilestones={milestones || []}
        members={members}
        currentUserId={user.id}
        isAdmin={membership.role === 'admin'}
      />
    </div>
  );
}
