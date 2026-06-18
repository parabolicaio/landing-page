import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import AdminTeamManager from '../../../components/admin/AdminTeamManager';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.rpc('admin_get_all_users');
  const { data: projects } = await supabase.from('projects').select('id, name, color');

  // Each user's current project memberships (super admin RLS sees all)
  const { data: rawMemberships } = await supabase
    .from('project_members')
    .select('user_id, project_id, role, projects(id, name, color)');

  const membershipsByUser: Record<string, { project_id: string; name: string; color: string | null; role: string }[]> = {};
  (rawMemberships || []).forEach((m) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proj = Array.isArray((m as any).projects) ? (m as any).projects[0] : (m as any).projects;
    if (!proj) return;
    (membershipsByUser[m.user_id] ||= []).push({
      project_id: m.project_id,
      name: proj.name,
      color: proj.color,
      role: m.role,
    });
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Team</h1>
        <p className="text-sm text-neutral-500 mt-1">{users?.length ?? 0} team members</p>
      </div>
      <AdminTeamManager
        initialUsers={users || []}
        projects={projects || []}
        initialMemberships={membershipsByUser}
      />
    </div>
  );
}
