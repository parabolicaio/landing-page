'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

const COLORS = ['#0FBAB0','#6366F1','#F59E0B','#EF4444','#10B981','#8B5CF6','#EC4899','#F97316'];
const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

type Project = {
  id: string; name: string; slug: string; description: string | null;
  color: string | null; client_id: string | null; client_name: string | null;
};
type Client = { id: string; name: string };
type Member = { user_id: string; role: string; full_name: string | null };
type User = { id: string; email: string; full_name: string | null };

interface Props {
  project: Project;
  clients: Client[];
  members: Member[];
  allUsers: User[];
}

export default function AdminProjectEditor({ project, clients, members: initMembers, allUsers }: Props) {
  const [members, setMembers] = useState(initMembers);
  const [saving, setSaving] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    name: project.name, description: project.description || '',
    color: project.color || COLORS[0], client_id: project.client_id || '',
  });
  const router = useRouter();
  const supabase = createClient();

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000); }

  async function saveDetails(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const { error } = await supabase.from('projects').update({
      name: form.name, description: form.description || null,
      color: form.color, client_id: form.client_id || null,
    }).eq('id', project.id);
    setSaving(false);
    if (error) showToast('Error: ' + error.message);
    else { showToast('Saved!'); router.refresh(); }
  }

  async function updatePin(e: React.FormEvent) {
    e.preventDefault(); if (pinValue.length < 4) return;
    setPinSaving(true);
    const { error } = await supabase.rpc('admin_update_project_pin', {
      p_project_id: project.id, p_new_pin: pinValue,
    });
    setPinSaving(false);
    if (error) showToast('Error: ' + error.message);
    else { showToast('PIN updated!'); setPinValue(''); }
  }

  async function addMember(userId: string) {
    const res = await fetch('/api/admin/project-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, user_id: userId, role: 'member', action: 'add' }),
    });
    if (res.ok) {
      const u = allUsers.find(u => u.id === userId);
      setMembers(m => [...m, { user_id: userId, role: 'member', full_name: u?.full_name || null }]);
      showToast('Member added');
    }
  }

  async function removeMember(userId: string) {
    const res = await fetch('/api/admin/project-membership', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: project.id, user_id: userId, action: 'remove' }),
    });
    if (res.ok) { setMembers(m => m.filter(x => x.user_id !== userId)); showToast('Member removed'); }
  }

  async function deleteProject() {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await supabase.from('projects').delete().eq('id', project.id);
    router.push('/admin/projects');
  }

  const nonMembers = allUsers.filter(u => !members.find(m => m.user_id === u.id));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-neutral-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      {/* Details */}
      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Project details</h2>
        <form onSubmit={saveDetails} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Name *</label>
              <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1.5">Client</label>
              <select value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))} className={inputCls}>
                <option value="">— No client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls + ' resize-none'} rows={2} />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0B0F12' : 'transparent' }} />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-5 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>

      {/* PIN */}
      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Client PIN</h2>
        <p className="text-xs text-neutral-500 mb-4">Change the PIN clients use to access the progress board.</p>
        <form onSubmit={updatePin} className="flex gap-3">
          <input
            type="password" value={pinValue} onChange={e => setPinValue(e.target.value)}
            className={inputCls + ' max-w-48'} placeholder="New PIN (4–5 digits)" minLength={4} maxLength={5} required
          />
          <button type="submit" disabled={pinSaving || pinValue.length < 4}
            className="px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
            {pinSaving ? 'Updating…' : 'Update PIN'}
          </button>
        </form>
      </div>

      {/* Members */}
      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">Members ({members.length})</h2>

        <div className="space-y-2 mb-4">
          {members.map(m => (
            <div key={m.user_id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-parabolica/10 flex items-center justify-center text-parabolica text-xs font-bold">
                  {(m.full_name || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm text-neutral-700">{m.full_name || m.user_id.slice(0, 12)}</span>
                <span className="text-xs text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded-full">{m.role}</span>
              </div>
              <button onClick={() => removeMember(m.user_id)} className="text-xs text-red-500 hover:text-red-700 transition-colors">Remove</button>
            </div>
          ))}
          {members.length === 0 && <p className="text-sm text-neutral-400">No members yet.</p>}
        </div>

        {nonMembers.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Add member</label>
            <select
              defaultValue=""
              onChange={e => { if (e.target.value) { addMember(e.target.value); e.target.value = ''; } }}
              className={inputCls + ' max-w-64'}
            >
              <option value="">— Select user —</option>
              {nonMembers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.email}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-surface border border-red-200 p-6">
        <h2 className="font-semibold text-red-700 mb-1">Danger zone</h2>
        <p className="text-xs text-neutral-500 mb-4">Deleting a project also removes all tasks, milestones, and memberships.</p>
        <button
          onClick={deleteProject}
          disabled={deleting}
          className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : 'Delete project'}
        </button>
      </div>
    </div>
  );
}
