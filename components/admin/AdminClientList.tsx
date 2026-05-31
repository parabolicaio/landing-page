'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

const COLORS = ['#0FBAB0','#6366F1','#F59E0B','#EF4444','#10B981','#8B5CF6','#EC4899','#F97316'];
const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

type ClientRow = {
  id: string; name: string; slug: string; description: string | null;
  color: string | null; logo_url: string | null; created_at: string; projectCount: number;
};

export default function AdminClientList({ initialClients }: { initialClients: ClientRow[] }) {
  const [clients, setClients] = useState(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<ClientRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', color: COLORS[0] });
  const router = useRouter();
  const supabase = createClient();

  function slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function upd(k: string, v: string) {
    setForm(f => { const n = { ...f, [k]: v }; if (k === 'name') n.slug = slugify(v); return n; });
  }

  function openNew() {
    setEditClient(null);
    setForm({ name: '', slug: '', description: '', color: COLORS[0] });
    setError('');
    setShowForm(true);
  }

  function openEdit(c: ClientRow) {
    setEditClient(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', color: c.color || COLORS[0] });
    setError('');
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('');
    if (editClient) {
      const { data, error: err } = await supabase.from('clients').update({
        name: form.name, slug: form.slug, description: form.description || null, color: form.color,
      }).eq('id', editClient.id).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      setClients(cs => cs.map(c => c.id === editClient.id ? { ...c, ...data } : c));
    } else {
      const { data, error: err } = await supabase.from('clients').insert({
        name: form.name, slug: form.slug, description: form.description || null, color: form.color,
      }).select().single();
      if (err) { setError(err.message); setLoading(false); return; }
      setClients(cs => [{ ...data, projectCount: 0 }, ...cs]);
    }
    setShowForm(false); setLoading(false); router.refresh();
  }

  async function deleteClient(id: string, name: string) {
    if (!confirm(`Delete client "${name}"?`)) return;
    await supabase.from('clients').delete().eq('id', id);
    setClients(cs => cs.filter(c => c.id !== id));
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 transition-colors">
          + New client
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && setShowForm(false)}>
          <div className="bg-white rounded-surface shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">{editClient ? 'Edit client' : 'New client'}</h2>
              <button onClick={() => setShowForm(false)} aria-label="Close" className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {[
                { label: 'Client name *', key: 'name', placeholder: 'Acme Corp' },
                { label: 'Slug *', key: 'slug', placeholder: 'acme-corp' },
                { label: 'Description', key: 'description', placeholder: 'Optional description' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">{f.label}</label>
                  <input required={f.label.includes('*')} value={(form as Record<string,string>)[f.key]}
                    onChange={e => upd(f.key, e.target.value)} className={inputCls} placeholder={f.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => upd('color', c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: form.color === c ? '#0B0F12' : 'transparent' }} />
                  ))}
                </div>
              </div>
              {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
                  {loading ? 'Saving…' : editClient ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-surface border border-neutral-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              {['Client', 'Slug', 'Projects', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color || '#0FBAB0' }} />
                    <span className="font-medium text-neutral-900">{c.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-500 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3 text-neutral-500">{c.projectCount}</td>
                <td className="px-4 py-3 flex gap-3">
                  <button onClick={() => openEdit(c)} className="text-xs text-parabolica hover:underline">Edit</button>
                  <button onClick={() => deleteClient(c.id, c.name)} className="text-xs text-red-500 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-12 text-center text-neutral-400">No clients yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
