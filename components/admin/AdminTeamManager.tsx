'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string; email: string; full_name: string | null;
  is_super_admin: boolean; is_active: boolean; created_at: string;
};
type Project = { id: string; name: string; color: string | null };

interface Props {
  initialUsers: User[];
  projects: Project[];
}

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

export default function AdminTeamManager({ initialUsers, projects }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState<{ url: string; email: string; kind: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setInviting(true); setInviteError(''); setInviteLink(null); setCopied(false);
    const res = await fetch('/api/admin/invite-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, full_name: inviteName }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) { setInviteError(json.error || 'Failed to generate link'); return; }
    setInviteLink({ url: json.link, email: inviteEmail, kind: json.kind });
    setInviteEmail(''); setInviteName('');
    router.refresh();
  }

  async function copyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink.url);
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
  }

  async function toggleAdmin(userId: string, current: boolean) {
    const res = await fetch('/api/admin/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, is_super_admin: !current }),
    });
    if (res.ok) setUsers(us => us.map(u => u.id === userId ? { ...u, is_super_admin: !current } : u));
  }

  async function assignToProject(userId: string, projectId: string) {
    await fetch('/api/admin/project-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, user_id: userId, role: 'member', action: 'add' }),
    });
  }

  return (
    <div className="space-y-6">
      {/* Invite */}
      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Invite team member</h2>
        <p className="text-xs text-neutral-500 mb-4">
          Generates a one-time link you copy and send them yourself (WhatsApp, email, etc).
        </p>
        <form onSubmit={invite} className="flex gap-3 flex-wrap">
          <input type="text" value={inviteName} onChange={e => setInviteName(e.target.value)}
            className={inputCls + ' max-w-48'} placeholder="Full name" />
          <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            required className={inputCls + ' max-w-64'} placeholder="email@example.com" />
          <button type="submit" disabled={inviting}
            className="px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
            {inviting ? 'Generating…' : 'Generate invite link'}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-xs text-red-600">{inviteError}</p>}
        {inviteLink && (
          <div className="mt-4 bg-parabolica/5 border border-parabolica/20 rounded-lg p-4">
            <p className="text-xs font-semibold text-neutral-700 mb-1">
              {inviteLink.kind === 'invite'
                ? `Invite link for ${inviteLink.email} — they'll set their own password`
                : `Login link for ${inviteLink.email} (account already exists)`}
            </p>
            <p className="text-[11px] text-neutral-400 mb-2">One-time use. Send it to them directly.</p>
            <div className="flex gap-2">
              <input readOnly value={inviteLink.url} onFocus={e => e.target.select()}
                className="flex-1 text-xs px-3 py-2 border border-neutral-200 rounded-lg bg-white font-mono text-neutral-600" />
              <button onClick={copyLink} type="button"
                className="px-4 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700 shrink-0">
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team table */}
      <div className="bg-white rounded-surface border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {['Member', 'Status', 'Super admin', 'Assign to project', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-neutral-900">{u.full_name || '—'}</p>
                    <p className="text-xs text-neutral-400">{u.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(u.id, u.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      u.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700'
                        : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleAdmin(u.id, u.is_super_admin)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors ${
                      u.is_super_admin
                        ? 'bg-parabolica/10 text-parabolica hover:bg-neutral-100 hover:text-neutral-600'
                        : 'bg-neutral-100 text-neutral-500 hover:bg-parabolica/10 hover:text-parabolica'
                    }`}
                  >
                    {u.is_super_admin ? 'Admin' : 'Member'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <select
                    defaultValue=""
                    onChange={e => { if (e.target.value) { assignToProject(u.id, e.target.value); e.target.value = ''; } }}
                    className="text-xs border border-neutral-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-parabolica"
                  >
                    <option value="">+ Add to project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-400">
                  {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
