import React from 'react';
import { createClient } from '../../lib/supabase/server';

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  const [
    { count: projectCount },
    { count: clientCount },
    { count: teamCount },
    { count: taskCount },
  ] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Projects',   value: projectCount ?? 0, icon: '□',  href: '/admin/projects' },
    { label: 'Clients',    value: clientCount  ?? 0, icon: '◈',  href: '/admin/clients'  },
    { label: 'Team',       value: teamCount    ?? 0, icon: '◉',  href: '/admin/team'     },
    { label: 'Tasks',      value: taskCount    ?? 0, icon: '✓',  href: null              },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Overview</h1>
        <p className="text-sm text-neutral-500 mt-1">Agency-wide stats at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-surface border border-neutral-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-parabolica text-lg">{s.icon}</span>
              <span className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{s.label}</span>
            </div>
            <p className="text-3xl font-bold text-neutral-900">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Quick links</h2>
        <p className="text-sm text-neutral-500 mb-4">Jump to common admin tasks</p>
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Create project',  href: '/admin/projects' },
            { label: 'Add client',      href: '/admin/clients'  },
            { label: 'Invite team',     href: '/admin/team'     },
          ].map(l => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 bg-parabolica/10 text-parabolica text-sm font-semibold rounded-lg hover:bg-parabolica hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
