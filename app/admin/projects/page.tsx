import React from 'react';
import { createClient } from '../../../lib/supabase/server';
import Link from 'next/link';
import AdminNewProjectModal from '../../../components/admin/AdminNewProjectModal';

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .rpc('admin_get_projects_with_stats')
    .order('created_at', { ascending: false });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Projects</h1>
          <p className="text-sm text-neutral-500 mt-1">{projects?.length ?? 0} total projects</p>
        </div>
        <AdminNewProjectModal />
      </div>

      <div className="bg-white rounded-surface border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {['Project', 'Client', 'Tasks', 'Members', 'Created', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {(projects || []).map((p) => (
              <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color || '#0FBAB0' }} />
                    <span className="font-medium text-neutral-900">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500">{p.client_name ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-500">
                  {p.task_done}/{p.task_total}
                </td>
                <td className="px-4 py-3 text-neutral-500">{p.member_count}</td>
                <td className="px-4 py-3 text-neutral-400 text-xs">
                  {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/projects/${p.id}`} className="text-xs text-parabolica hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
            {!projects?.length && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-neutral-400">
                  No projects yet — create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
