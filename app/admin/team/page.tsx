import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import AdminTeamManager from '../../../components/admin/AdminTeamManager';

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const { data: users } = await supabase.rpc('admin_get_all_users');
  const { data: projects } = await supabase.from('projects').select('id, name, color');

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Team</h1>
        <p className="text-sm text-neutral-500 mt-1">{users?.length ?? 0} team members</p>
      </div>
      <AdminTeamManager initialUsers={users || []} projects={projects || []} />
    </div>
  );
}
