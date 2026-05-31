import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import AdminClientList from '../../../components/admin/AdminClientList';

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch project counts per client
  const { data: projects } = await supabase
    .from('projects')
    .select('client_id')
    .not('client_id', 'is', null);

  const projectCountByClient: Record<string, number> = {};
  (projects || []).forEach(p => {
    if (p.client_id) {
      projectCountByClient[p.client_id] = (projectCountByClient[p.client_id] || 0) + 1;
    }
  });

  const clientsWithCount = (clients || []).map(c => ({
    ...c,
    projectCount: projectCountByClient[c.id] || 0,
  }));

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Clients</h1>
        <p className="text-sm text-neutral-500 mt-1">{clients?.length ?? 0} clients</p>
      </div>
      <AdminClientList initialClients={clientsWithCount} />
    </div>
  );
}
