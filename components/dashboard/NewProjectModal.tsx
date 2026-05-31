'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';

const COLORS = [
  '#0FBAB0', '#6366F1', '#F59E0B', '#EF4444',
  '#10B981', '#8B5CF6', '#EC4899', '#F97316',
];

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function NewProjectModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', description: '', client_name: '', slug: '', client_pin: '', color: COLORS[0],
  });
  const router = useRouter();
  const supabase = createClient();

  function slugify(val: string) {
    return val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function update(field: string, value: string) {
    setForm(f => {
      const updated: Record<string, string> = { ...f, [field]: value };
      if (field === 'name') updated.slug = slugify(value);
      return updated as typeof form;
    });
  }

  function close() {
    setOpen(false);
    setError('');
    setForm({ name: '', description: '', client_name: '', slug: '', client_pin: '', color: COLORS[0] });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.client_pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      setLoading(false);
      return;
    }

    const { data: hashData, error: hashErr } = await supabase.rpc('hash_pin', { p_pin: form.client_pin });

    if (hashErr) {
      setError('Failed to hash PIN: ' + hashErr.message);
      setLoading(false);
      return;
    }

    const { data: project, error: insertErr } = await supabase
      .from('projects')
      .insert({
        name: form.name,
        description: form.description || null,
        client_name: form.client_name || null,
        slug: form.slug,
        client_pin: hashData,
        color: form.color,
      })
      .select()
      .single();

    if (insertErr) {
      setError(insertErr.message);
      setLoading(false);
      return;
    }

    await supabase.from('project_members').insert({
      project_id: project.id,
      user_id: userId,
      role: 'admin',
    });

    close();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 transition-colors"
      >
        <span className="text-lg leading-none">+</span> New project
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onKeyDown={e => e.key === 'Escape' && close()}
        >
          <div className="bg-white rounded-surface shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900">New project</h2>
              <button onClick={close} aria-label="Close" className="text-neutral-400 hover:text-neutral-700">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>

            <form onSubmit={submit} className="p-6 space-y-4">
              <Field label="Project name *">
                <input required value={form.name} onChange={e => update('name', e.target.value)} className={inputCls} placeholder="e.g. Acme Corp Website" />
              </Field>

              <Field label="URL slug *">
                <input required value={form.slug} onChange={e => update('slug', e.target.value)} className={inputCls} placeholder="acme-corp-website" pattern="[a-z0-9-]+" />
                <p className="text-[11px] text-neutral-400 mt-1">Client portal URL: /client/{form.slug || 'your-slug'}</p>
              </Field>

              <Field label="Client name">
                <input value={form.client_name} onChange={e => update('client_name', e.target.value)} className={inputCls} placeholder="e.g. Acme Corp" />
              </Field>

              <Field label="Client PIN * (min 4 digits)">
                <input required type="password" value={form.client_pin} onChange={e => update('client_pin', e.target.value)} className={inputCls} placeholder="e.g. 4821" minLength={4} maxLength={10} />
                <p className="text-[11px] text-neutral-400 mt-1">Share this PIN with your client to access their progress board.</p>
              </Field>

              <Field label="Description">
                <textarea value={form.description} onChange={e => update('description', e.target.value)} className={inputCls + ' resize-none'} rows={2} placeholder="Brief project description…" />
              </Field>

              <Field label="Color">
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => update('color', c)}
                      className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                      style={{ backgroundColor: c, borderColor: form.color === c ? '#0B0F12' : 'transparent' }}
                    />
                  ))}
                </div>
              </Field>

              {error && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={close} className="flex-1 py-2.5 border border-neutral-200 text-sm font-medium rounded-lg hover:bg-neutral-50">Cancel</button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
                  {loading ? 'Creating…' : 'Create project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
