'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export type ProjectLink = {
  id: string; project_id: string; label: string; url: string; position: number;
};

export type ProjectMessage = {
  id: string; project_id: string; title: string; body: string | null;
  level: string; pinned: boolean; visible_to_client: boolean; created_at: string;
};

const LEVELS = [
  { id: 'info',    label: 'Info',    color: '#60A5FA' },
  { id: 'success', label: 'Success', color: '#10B981' },
  { id: 'warning', label: 'Warning', color: '#F59E0B' },
  { id: 'urgent',  label: 'Urgent',  color: '#EF4444' },
] as const;

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';
const labelCls = 'block text-xs font-medium text-neutral-600 mb-1.5';

interface Props {
  projectId: string;
  initialLinks: ProjectLink[];
  initialMessages: ProjectMessage[];
}

export default function ClientUpdatesPanel({ projectId, initialLinks, initialMessages }: Props) {
  const [links, setLinks] = useState(initialLinks);
  const [messages, setMessages] = useState(initialMessages);
  const [error, setError] = useState('');
  const supabase = createClient();

  // ── Links ──────────────────────────────────────────────────
  const [linkForm, setLinkForm] = useState({ label: '', url: '' });
  const [savingLink, setSavingLink] = useState(false);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    setSavingLink(true); setError('');
    const url = /^https?:\/\//.test(linkForm.url) ? linkForm.url : `https://${linkForm.url}`;
    const { data, error: err } = await supabase
      .from('project_links')
      .insert({ project_id: projectId, label: linkForm.label, url, position: links.length })
      .select()
      .single();
    setSavingLink(false);
    if (err) { setError('Failed to add link: ' + err.message); return; }
    setLinks(l => [...l, data as ProjectLink]);
    setLinkForm({ label: '', url: '' });
  }

  async function deleteLink(id: string) {
    const { error: err } = await supabase.from('project_links').delete().eq('id', id);
    if (err) { setError('Failed to delete link: ' + err.message); return; }
    setLinks(l => l.filter(x => x.id !== id));
  }

  // ── Messages ───────────────────────────────────────────────
  const [msgForm, setMsgForm] = useState({ title: '', body: '', level: 'info', pinned: false });
  const [savingMsg, setSavingMsg] = useState(false);

  async function addMessage(e: React.FormEvent) {
    e.preventDefault();
    setSavingMsg(true); setError('');
    const { data, error: err } = await supabase
      .from('project_messages')
      .insert({
        project_id: projectId,
        title: msgForm.title,
        body: msgForm.body || null,
        level: msgForm.level,
        pinned: msgForm.pinned,
        visible_to_client: true,
      })
      .select()
      .single();
    setSavingMsg(false);
    if (err) { setError('Failed to post message: ' + err.message); return; }
    setMessages(m => [data as ProjectMessage, ...m]);
    setMsgForm({ title: '', body: '', level: 'info', pinned: false });
  }

  async function togglePinned(msg: ProjectMessage) {
    const { error: err } = await supabase
      .from('project_messages')
      .update({ pinned: !msg.pinned })
      .eq('id', msg.id);
    if (err) { setError('Failed to update: ' + err.message); return; }
    setMessages(m => m.map(x => x.id === msg.id ? { ...x, pinned: !x.pinned } : x));
  }

  async function toggleVisible(msg: ProjectMessage) {
    const { error: err } = await supabase
      .from('project_messages')
      .update({ visible_to_client: !msg.visible_to_client })
      .eq('id', msg.id);
    if (err) { setError('Failed to update: ' + err.message); return; }
    setMessages(m => m.map(x => x.id === msg.id ? { ...x, visible_to_client: !x.visible_to_client } : x));
  }

  async function deleteMessage(id: string) {
    if (!confirm('Delete this message?')) return;
    const { error: err } = await supabase.from('project_messages').delete().eq('id', id);
    if (err) { setError('Failed to delete: ' + err.message); return; }
    setMessages(m => m.filter(x => x.id !== id));
  }

  const levelOf = (id: string) => LEVELS.find(l => l.id === id) || LEVELS[0];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <p className="text-xs text-neutral-400 -mb-4">
        Everything here appears on the client&apos;s progress board (/client/…).
      </p>

      {error && (
        <div className="flex items-center justify-between text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span>{error}</span>
          <button onClick={() => setError('')} aria-label="Dismiss" className="text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Quick links */}
      <div className="bg-white rounded-surface border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-1">Quick access links</h3>
        <p className="text-xs text-neutral-400 mb-4">Staging URLs, design files, docs — anything the client needs one click away.</p>

        <form onSubmit={addLink} className="flex gap-2 flex-wrap mb-4">
          <input required value={linkForm.label} onChange={e => setLinkForm(f => ({ ...f, label: e.target.value }))}
            className={inputCls + ' max-w-44'} placeholder="Label (e.g. Staging site)" />
          <input required value={linkForm.url} onChange={e => setLinkForm(f => ({ ...f, url: e.target.value }))}
            className={inputCls + ' flex-1 min-w-48'} placeholder="https://…" />
          <button type="submit" disabled={savingLink}
            className="px-4 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50 shrink-0">
            {savingLink ? 'Adding…' : '+ Add link'}
          </button>
        </form>

        <div className="space-y-2">
          {links.map(l => (
            <div key={l.id} className="group flex items-center gap-3 py-2 px-3 border border-neutral-100 rounded-lg hover:border-neutral-200">
              <span className="text-parabolica">🔗</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800">{l.label}</p>
                <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neutral-400 hover:text-parabolica truncate block">{l.url}</a>
              </div>
              <button onClick={() => deleteLink(l.id)} aria-label={`Delete ${l.label}`}
                className="hidden group-hover:block text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          ))}
          {links.length === 0 && <p className="text-xs text-neutral-300 py-2">No links yet.</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="bg-white rounded-surface border border-neutral-200 p-5">
        <h3 className="font-semibold text-neutral-900 mb-1">Important messages</h3>
        <p className="text-xs text-neutral-400 mb-4">Announcements, blockers, action items — pinned messages stay at the top.</p>

        <form onSubmit={addMessage} className="space-y-3 mb-5 pb-5 border-b border-neutral-100">
          <input required value={msgForm.title} onChange={e => setMsgForm(f => ({ ...f, title: e.target.value }))}
            className={inputCls} placeholder="Message title *" />
          <textarea value={msgForm.body} onChange={e => setMsgForm(f => ({ ...f, body: e.target.value }))}
            className={inputCls + ' resize-none'} rows={2} placeholder="Details (optional)" />
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className={labelCls}>Type</label>
              <div className="flex gap-1.5">
                {LEVELS.map(lv => (
                  <button key={lv.id} type="button" onClick={() => setMsgForm(f => ({ ...f, level: lv.id }))}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors"
                    style={msgForm.level === lv.id
                      ? { backgroundColor: `${lv.color}20`, color: lv.color, borderColor: lv.color }
                      : { color: '#9CA3AF', borderColor: '#E5E7EB' }}>
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer mt-4">
              <input type="checkbox" checked={msgForm.pinned}
                onChange={e => setMsgForm(f => ({ ...f, pinned: e.target.checked }))}
                className="w-4 h-4 accent-parabolica" />
              <span className="text-xs text-neutral-600">Pin to top</span>
            </label>
            <button type="submit" disabled={savingMsg}
              className="ml-auto mt-3 px-4 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
              {savingMsg ? 'Posting…' : 'Post message'}
            </button>
          </div>
        </form>

        <div className="space-y-2">
          {[...messages].sort((a, b) => Number(b.pinned) - Number(a.pinned)).map(msg => {
            const lv = levelOf(msg.level);
            return (
              <div key={msg.id} className={`group border rounded-lg p-3 ${msg.visible_to_client ? 'border-neutral-100' : 'border-dashed border-neutral-200 opacity-60'}`}>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: lv.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-neutral-900">{msg.title}</span>
                      {msg.pinned && <span className="text-[10px] text-parabolica">📌 Pinned</span>}
                      {!msg.visible_to_client && <span className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 rounded-full">Hidden from client</span>}
                    </div>
                    {msg.body && <p className="text-xs text-neutral-500 mt-0.5">{msg.body}</p>}
                    <p className="text-[10px] text-neutral-300 mt-1">
                      {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-2 shrink-0">
                    <button onClick={() => togglePinned(msg)} className="text-[11px] text-neutral-400 hover:text-parabolica">
                      {msg.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => toggleVisible(msg)} className="text-[11px] text-neutral-400 hover:text-parabolica">
                      {msg.visible_to_client ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => deleteMessage(msg.id)} className="text-[11px] text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <p className="text-xs text-neutral-300 py-2">No messages yet.</p>}
        </div>
      </div>
    </div>
  );
}
