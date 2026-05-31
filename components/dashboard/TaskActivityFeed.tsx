'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '../../lib/supabase/client';

type ActivityEntry = {
  id: string;
  type: 'status_change' | 'assignee_change' | 'comment' | 'created';
  from_value: string | null;
  to_value: string | null;
  created_at: string;
  user_id: string | null;
  body?: string;          // only for comments
  author_name?: string;
};

interface Props {
  taskId: string;
  currentUserId: string;
  /** map of user_id -> display name for all project members */
  memberNames: Record<string, string>;
}

export default function TaskActivityFeed({ taskId, currentUserId, memberNames }: Props) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const [{ data: activities }, { data: comments }] = await Promise.all([
        supabase
          .from('task_activity')
          .select('id, type, from_value, to_value, created_at, user_id')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true }),
        supabase
          .from('task_comments')
          .select('id, body, created_at, user_id')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true }),
      ]);

      if (!mounted) return;

      const combined: ActivityEntry[] = [
        ...(activities || []).map(a => ({
          ...a,
          type: a.type as ActivityEntry['type'],
          author_name: a.user_id ? (memberNames[a.user_id] || 'Team member') : 'System',
        })),
        ...(comments || []).map(c => ({
          id: c.id,
          type: 'comment' as const,
          from_value: null,
          to_value: null,
          created_at: c.created_at,
          user_id: c.user_id,
          body: c.body,
          author_name: c.user_id ? (memberNames[c.user_id] || 'Team member') : 'Unknown',
        })),
      ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      setEntries(combined);
      setLoading(false);
    }

    load();
    return () => { mounted = false; };
  }, [taskId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom when new entries arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  async function submitComment() {
    const body = comment.trim();
    if (!body) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: taskId, user_id: currentUserId, body })
      .select()
      .single();

    if (!error && data) {
      const newEntry: ActivityEntry = {
        id: data.id,
        type: 'comment',
        from_value: null,
        to_value: null,
        created_at: data.created_at,
        user_id: data.user_id,
        body: data.body,
        author_name: memberNames[currentUserId] || 'You',
      };
      setEntries(e => [...e, newEntry]);
      setComment('');
    }
    setSubmitting(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  function renderEntry(e: ActivityEntry) {
    const initials = (e.author_name || 'T').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    if (e.type === 'comment') {
      return (
        <div key={e.id} className="flex gap-2.5">
          <div className="w-6 h-6 rounded-full bg-parabolica/20 flex items-center justify-center text-parabolica text-[10px] font-bold shrink-0 mt-0.5">
            {initials}
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-1.5 mb-0.5">
              <span className="text-xs font-semibold text-neutral-700">{e.author_name}</span>
              <span className="text-[10px] text-neutral-400">{formatTime(e.created_at)}</span>
            </div>
            <div className="text-xs text-neutral-600 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">
              {e.body}
            </div>
          </div>
        </div>
      );
    }

    const msg = formatActivityMessage(e);
    return (
      <div key={e.id} className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 text-[10px] font-bold shrink-0 mt-0.5">
          {initials}
        </div>
        <div>
          <span className="text-xs text-neutral-500">
            <span className="font-medium text-neutral-600">{e.author_name}</span> {msg}
          </span>
          <span className="ml-1.5 text-[10px] text-neutral-400">{formatTime(e.created_at)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-100 pt-4">
      <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">Activity</h4>

      {loading ? (
        <p className="text-xs text-neutral-400 py-4 text-center">Loading activity…</p>
      ) : entries.length === 0 ? (
        <p className="text-xs text-neutral-400 py-4 text-center">No activity yet.</p>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-1 mb-4">
          {entries.map(renderEntry)}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Comment input */}
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); } }}
          placeholder="Add a comment… (Enter to send)"
          className="flex-1 text-xs px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white"
        />
        <button
          onClick={submitComment}
          disabled={submitting || !comment.trim()}
          className="px-3 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-40"
        >
          {submitting ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}

function formatActivityMessage(e: ActivityEntry): string {
  switch (e.type) {
    case 'created':
      return 'created this task';
    case 'status_change':
      return `moved from ${e.from_value ?? '?'} → ${e.to_value ?? '?'}`;
    case 'assignee_change':
      return e.to_value
        ? `assigned to ${e.to_value}`
        : 'removed assignee';
    default:
      return e.to_value ?? '';
  }
}
