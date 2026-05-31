'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

const COLORS = ['#0FBAB0','#6366F1','#F59E0B','#EF4444','#10B981','#8B5CF6','#EC4899','#F97316'];
const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

export default function AdminNewProjectModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', client_pin: '', color: COLORS[0] });
  const router = useRouter();
  const supabase = createClient();

  function slugify(v: string) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function upd(k: string, v: string) {
    setForm(f => { const n = { ...f, [k]: v }; if (k === 'name') n.slug = slugify(v); return n; });
  }
  function close() { setOpen(false); setError(''); setForm({ name: '', slug: '', description: '', client_pin: '', color: COLORS[0] }); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    if (form.client_pin.length < 4) { setError('PIN must be at least 4 digits.'); setLoading(false); return; }

    const { data: hash, error: hashErr } = await supabase.rpc('hash_pin', { p_pin: form.client_pin });
    if (hashErr) { setError(hashErr.message); setLoading(false); return; }

    const { error: err } = await supabase.from('projects').insert({
      name: form.name, slug: form.slug,
      description: form.description || null,
      client_pin: hash, color: form.color,
    });
    if (err) { setError(err.message); setLoading(false); return; }
    close(); router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 transition-colors">
        + New project
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && close()}>
          <div className="bg-white rounded-surface shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">New project</h2>
              <button onClick={close} aria-label="Close" className="text-neutral-400 hover:text-neutral-700">✕</button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {[
                { label: 'Project name *', key: 'name', type: 'text', placeholder: 'Acme Corp Website', required: true },
                { label: 'URL slug *', key: 'slug', type: 'text', placeholder: 'acme-corp-website', required: true },
                { label: 'Description', key: 'description', type: 'text', placeholder: 'Optional…', required: false },
                { label: 'Client PIN * (min 4 digits)', key: 'client_pin', type: 'password', placeholder: '••••', required: true },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5">{f.label}</label>
                  <input
                    type={f.type} required={f.required} value={(form as Record<string,string>)[f.key]}
                    onChange={e => upd(f.key, e.target.value)}
                    className={inputCls} placeholder={f.placeholder}
                  />
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
                <button type="button" onClick={close} className="flex-1 py-2.5 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
                  {loading ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
