'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string; email: string; full_name: string | null;
  is_super_admin: boolean; is_active: boolean; created_at: string;
};
type Project = { id: string; name: string; color: string | null };
type Membership = { project_id: string; name: string; color: string | null; role: string };

interface Props {
  initialUsers: User[];
  projects: Project[];
  initialMemberships: Record<string, Membership[]>;
}

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

export default function AdminTeamManager({ initialUsers, projects, initialMemberships }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [memberships, setMemberships] = useState<Record<string, Membership[]>>(initialMemberships);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [creds, setCreds] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState('');
  const router = useRouter();

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setInviting(true); setInviteError(''); setCreds(null); setCopied(false);
    const res = await fetch('/api/admin/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, full_name: inviteName }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(json.error || 'Failed to create account'); return; }
    setCreds({ email: json.email, password: json.password });
    setInviteEmail(''); setInviteName('');
    router.refresh();
  }

  async function copyCreds() {
    if (!creds) return;
    const text = `Parabolica workspace login\nURL: ${window.location.origin}/login\nEmail: ${creds.email}\nTemporary password: ${creds.password}\n\nYou can change your password after signing in.`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function toggleActive(userId: string, current: boolean) {
    const res = await fetch('/api/admin/deactivate-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_active: !current }),
    });
    if (res.ok) setUsers(us => us.map(u => u.id === userId ? { ...u, is_active: !current } : u));
    else showToast('Failed to update status');
  }

  async function toggleAdmin(userId: string, current: boolean) {
    const res = await fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_super_admin: !current }),
    });
    if (res.ok) setUsers(us => us.map(u => u.id === userId ? { ...u, is_super_admin: !current } : u));
    else showToast('Failed to update role');
  }

  async function assignToProject(userId: string, projectId: string) {
    if ((memberships[userId] || []).some(m => m.project_id === projectId)) {
      showToast('Already assigned to that project');
      return;
    }
    const res = await fetch('/api/admin/project-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, user_id: userId, role: 'member', action: 'add' }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) { showToast(json.error || 'Failed to assign'); return; }

    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setMemberships(m => ({
        ...m,
        [userId]: [...(m[userId] || []), { project_id: proj.id, name: proj.name, color: proj.color, role: 'member' }],
      }));
    }
    showToast('Added to project');
  }

  async function removeFromProject(userId: string, projectId: string) {
    const res = await fetch('/api/admin/project-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, user_id: userId, action: 'remove' }),
    });
    if (!res.ok) { showToast('Failed to remove'); return; }
    setMemberships(m => ({ ...m, [userId]: (m[userId] || []).filter(x => x.project_id !== projectId) }));
    showToast('Removed from project');
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">{toast}</div>
      )}

      {/* Invite */}
      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Add team member</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Creates the account instantly with a temporary password. Copy the credentials and send them yourself — no email needed.
        </p>
        <form onSubmit={invite} className="flex gap-3 flex-wrap">
          <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
            className={inputCls + ' max-w-48'} placeholder="Full name" />
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            required className={inputCls + ' max-w-64'} placeholder="email@example.com" />
          <button type="submit" disabled={inviting}
            className="px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
            {inviting ? 'Creating…' : 'Create account'}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-xs text-red-600">{inviteError}</p>}
        {creds && (
          <div className="mt-4 bg-parabolica/5 border border-parabolica/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-neutral-700 mb-2">
              Account created — send these credentials to {creds.email}
            </p>
            <div className="text-xs font-mono text-neutral-700 bg-white border border-neutral-200 rounded-lg px-3 py-2 mb-2 space-y-0.5">
              <p>Email: {creds.email}</p>
              <p>Temp password: <span className="font-bold">{creds.password}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={copyCreds} type="button"
                className="px-4 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700">
                {copied ? '✓ Copied' : 'Copy login details'}
              </button>
              <span className="text-[11px] text-neutral-400">They can change the password after signing in.</span>
            </div>
          </div>
        )}
      </div>

      {/* Team table */}
      <div className="bg-white rounded-surface border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {['Member', 'Status', 'Super admin', 'Projects', 'Joined'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map(u => {
              const userProjects = memberships[u.id] || [];
              const unassigned = projects.filter(p => !userProjects.some(up => up.project_id === p.id));
              return (
                <tr key={u.id} className="hover:bg-neutral-50 transition-colors align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{u.full_name || '—'}</p>
                    <p className="text-xs text-neutral-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(u.id, u.is_active)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                        u.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                          : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAdmin(u.id, u.is_super_admin)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                        u.is_super_admin
                          ? 'bg-parabolica/10 text-parabolica hover:bg-neutral-100 hover:text-neutral-600'
                          : 'bg-neutral-100 text-neutral-500 hover:bg-parabolica/10 hover:text-parabolica'}`}>
                      {u.is_super_admin ? 'Admin' : 'Member'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5 mb-2 max-w-xs">
                      {userProjects.map(p => (
                        <span key={p.project_id}
                          className="group inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${p.color || '#0FBAB0'}1f`, color: p.color || '#0FBAB0' }}>
                          {p.name}
                          <button onClick={() => removeFromProject(u.id, p.project_id)}
                            aria-label={`Remove from ${p.name}`}
                            className="opacity-50 group-hover:opacity-100 hover:text-red-600">×</button>
                        </span>
                      ))}
                      {userProjects.length === 0 && <span className="text-[11px] text-neutral-300">No projects</span>}
                    </div>
                    {unassigned.length > 0 && (
                      <select
                        value=""
                        onChange={e => { if (e.target.value) assignToProject(u.id, e.target.value); }}
                        className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-parabolica">
                        <option value="">+ Add to project</option>
                        {unassigned.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-400">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
