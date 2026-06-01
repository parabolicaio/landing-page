import React from 'react';
import { createClient } from '../../../../lib/supabase/server';
import { notFound } from 'next/navigation';
import AdminProjectEditor from '../../../../components/admin/AdminProjectEditor';

interface Props {
  params: { id: string };
}

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();

  const [
    { data: project },
    { data: clients },
    { data: members },
    { data: allUsers },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name'),
    supabase
      .from('project_members')
      .select('user_id, role, profiles(full_name)')
      .eq('project_id', id),
    supabase.rpc('admin_get_all_users'),
  ]);

  if (!project) notFound();

  const normalisedMembers = (members || []).map(m => ({
    user_id: m.user_id,
    role: m.role,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    full_name: (Array.isArray((m as any).profiles) ? (m as any).profiles[0]?.full_name : (m as any).profiles?.full_name) ?? null,
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <a href="/admin/projects" className="text-sm text-neutral-400 hover:text-parabolica transition-colors">
          ← Projects
        </a>
        <h1 className="text-2xl font-bold text-neutral-900 mt-2">{project.name}</h1>
      </div>

      <AdminProjectEditor
        project={project}
        clients={clients || []}
        members={normalisedMembers}
        allUsers={allUsers || []}
      />
    </div>
  );
}
