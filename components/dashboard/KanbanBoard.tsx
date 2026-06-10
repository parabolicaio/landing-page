'use client';
import React, { useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import { useRouter } from 'next/navigation';
import TaskActivityFeed from './TaskActivityFeed';

const COLUMNS = [
  { id: 'backlog',     label: 'Backlog',      color: '#94A3B8' },
  { id: 'todo',        label: 'To Do',         color: '#60A5FA' },
  { id: 'in_progress', label: 'In Progress',   color: '#F59E0B' },
  { id: 'review',      label: 'Review',        color: '#A78BFA' },
  { id: 'done',        label: 'Done',          color: '#10B981' },
] as const;

const PRIORITIES = [
  { id: 'low',    label: 'Low',    color: '#94A3B8' },
  { id: 'medium', label: 'Medium', color: '#60A5FA' },
  { id: 'high',   label: 'High',   color: '#F59E0B' },
  { id: 'urgent', label: 'Urgent', color: '#EF4444' },
] as const;

type ColumnId = typeof COLUMNS[number]['id'];

type Task = {
  id: string; project_id: string; title: string; description: string | null;
  status: string; priority: string; assignee_id: string | null;
  due_date: string | null; position: number;
  profiles?: { full_name: string | null } | null;
};

type Milestone = {
  id: string; project_id: string; title: string; description: string | null;
  due_date: string | null; progress: number; status: string;
  visible_to_client: boolean; position: number;
};

type Member = {
  user_id: string; role: string;
  profiles?: { full_name: string | null } | null;
};

interface Props {
  project: { id: string; name: string; color?: string; slug: string };
  initialTasks: Task[];
  initialMilestones: Milestone[];
  members: Member[];
  currentUserId: string;
  isAdmin: boolean;
}

const labelCls = 'block text-xs font-medium text-neutral-600 mb-1.5';
const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white';

export default function KanbanBoard({ project, initialTasks, initialMilestones, members, currentUserId, isAdmin }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);
  const [activeTab, setActiveTab] = useState<'board' | 'milestones'>('board');
  const [newTaskCol, setNewTaskCol] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);
  const [showNewMilestone, setShowNewMilestone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const supabase = createClient();
  const router = useRouter();

  // Suppress unused variable warning — isAdmin reserved for future permission checks
  void isAdmin;
  void currentUserId;

  async function addTask(status: string) {
    if (!newTaskTitle.trim()) return;
    setLoading(true);
    setBoardError('');
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        project_id: project.id,
        title: newTaskTitle.trim(),
        status,
        priority: 'medium',
        position: tasks.filter(t => t.status === status).length,
      })
      .select('*, profiles(full_name)')
      .single();

    if (error) {
      setBoardError('Failed to add task: ' + error.message);
      setLoading(false);
      return;
    }
    if (data) setTasks(t => [...t, data as Task]);
    setNewTaskTitle('');
    setNewTaskCol(null);
    setLoading(false);
  }

  async function updateTaskStatus(taskId: string, newStatus: string) {
    const oldTask = tasks.find(t => t.id === taskId);
    setTasks(t => t.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId);
    // Log activity
    if (oldTask && oldTask.status !== newStatus) {
      await supabase.from('task_activity').insert({
        task_id: taskId,
        user_id: currentUserId,
        type: 'status_change',
        from_value: oldTask.status,
        to_value: newStatus,
      });
    }
    router.refresh();
  }

  async function saveTask(updates: Partial<Task>) {
    if (!editTask) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', editTask.id)
      .select('*, profiles(full_name)')
      .single();

    if (error) {
      setBoardError('Failed to save task: ' + error.message);
      setLoading(false);
      return;
    }
    if (data) setTasks(t => t.map(task => task.id === editTask.id ? data as Task : task));
    setEditTask(null);
    setLoading(false);
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return;
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(t => t.filter(task => task.id !== id));
  }

  async function saveMilestone(form: Partial<Milestone>, isNew = false) {
    setLoading(true);
    if (isNew) {
      const { data, error } = await supabase
        .from('milestones')
        .insert({ ...form, project_id: project.id, position: milestones.length })
        .select()
        .single();
      if (!error && data) setMilestones(m => [...m, data as Milestone]);
    } else if (editMilestone) {
      const { data, error } = await supabase
        .from('milestones')
        .update(form)
        .eq('id', editMilestone.id)
        .select()
        .single();
      if (!error && data) setMilestones(m => m.map(ms => ms.id === editMilestone.id ? data as Milestone : ms));
    }
    setEditMilestone(null);
    setShowNewMilestone(false);
    setLoading(false);
  }

  async function deleteMilestone(id: string) {
    if (!confirm('Delete this milestone?')) return;
    await supabase.from('milestones').delete().eq('id', id);
    setMilestones(m => m.filter(ms => ms.id !== id));
  }

  const tasksByCol = (status: string) =>
    tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)]">
      {/* Tabs */}
      <div className="bg-white border-b border-neutral-200 px-6 flex gap-1 pt-2">
        {(['board', 'milestones'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
              activeTab === tab
                ? 'bg-neutral-100 text-neutral-900 border-b-2 border-parabolica'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {tab}
            {tab === 'board' && (
              <span className="ml-2 text-xs bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {boardError && (
        <div className="mx-6 mt-3 flex items-center justify-between text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          <span>{boardError}</span>
          <button onClick={() => setBoardError('')} aria-label="Dismiss" className="ml-3 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Board */}
      {activeTab === 'board' && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map(col => (
              <div key={col.id} className="w-72 flex flex-col">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">{col.label}</span>
                  <span className="ml-auto text-xs text-neutral-400 font-medium">{tasksByCol(col.id).length}</span>
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  {tasksByCol(col.id).map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => setEditTask(task)}
                      onDelete={() => deleteTask(task.id)}
                      onMove={updateTaskStatus}
                    />
                  ))}

                  {newTaskCol === col.id ? (
                    <div className="bg-white rounded-lg border border-parabolica p-3 shadow-sm">
                      <input
                        autoFocus
                        value={newTaskTitle}
                        onChange={e => setNewTaskTitle(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addTask(col.id);
                          if (e.key === 'Escape') { setNewTaskCol(null); setNewTaskTitle(''); }
                        }}
                        className="w-full text-sm border-none outline-none resize-none bg-transparent placeholder-neutral-300"
                        placeholder="Task title…"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => addTask(col.id)}
                          disabled={loading || !newTaskTitle.trim()}
                          className="text-xs px-3 py-1.5 bg-parabolica text-white rounded-md font-medium disabled:opacity-40"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => { setNewTaskCol(null); setNewTaskTitle(''); }}
                          className="text-xs px-2 py-1.5 text-neutral-400 hover:text-neutral-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setNewTaskCol(col.id)}
                      className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 px-1 py-2 rounded-lg hover:bg-white transition-colors"
                    >
                      <span className="text-base leading-none">+</span> Add task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {activeTab === 'milestones' && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-semibold text-neutral-900">Milestones</h2>
                <p className="text-xs text-neutral-400 mt-0.5">Visible to client on their progress board</p>
              </div>
              <button
                onClick={() => setShowNewMilestone(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-parabolica text-white text-xs font-semibold rounded-lg hover:bg-parabolica-700"
              >
                + Add milestone
              </button>
            </div>

            <div className="space-y-3">
              {milestones.map(ms => (
                <MilestoneRow
                  key={ms.id}
                  milestone={ms}
                  onEdit={() => setEditMilestone(ms)}
                  onDelete={() => deleteMilestone(ms.id)}
                />
              ))}
              {milestones.length === 0 && !showNewMilestone && (
                <div className="text-center py-16 border-2 border-dashed border-neutral-200 rounded-surface">
                  <p className="text-neutral-400 text-sm">No milestones yet</p>
                  <p className="text-neutral-300 text-xs mt-1">These appear on the client progress board</p>
                </div>
              )}
            </div>

            {showNewMilestone && (
              <MilestoneForm
                onSave={form => saveMilestone(form, true)}
                onCancel={() => setShowNewMilestone(false)}
                loading={loading}
              />
            )}
          </div>
        </div>
      )}

      {editTask && (
        <TaskEditModal
          task={editTask}
          members={members}
          onSave={saveTask}
          onClose={() => setEditTask(null)}
          loading={loading}
          currentUserId={currentUserId}
        />
      )}

      {editMilestone && (
        <MilestoneEditModal
          milestone={editMilestone}
          onSave={form => saveMilestone(form, false)}
          onClose={() => setEditMilestone(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function TaskCard({ task, onEdit, onDelete, onMove }: {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (id: string, status: string) => void;
}) {
  const [showMove, setShowMove] = useState(false);
  const priority = PRIORITIES.find(p => p.id === task.priority);

  return (
    <div className="group bg-white rounded-lg border border-neutral-200 p-3 shadow-sm hover:border-neutral-300 hover:shadow-md transition-all cursor-pointer relative">
      <div onClick={onEdit} className="flex-1">
        <div className="flex items-start gap-2">
          <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: priority?.color || '#94A3B8' }} />
          <p className="text-sm text-neutral-900 font-medium leading-snug">{task.title}</p>
        </div>
        <div className="flex items-center gap-2 mt-2 ml-4">
          {task.due_date && (
            <span className="text-[11px] text-neutral-400">
              📅 {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {task.profiles?.full_name && (
            <span className="text-[11px] text-neutral-400 truncate max-w-[80px]">
              👤 {task.profiles.full_name.split(' ')[0]}
            </span>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
        <button
          onClick={e => { e.stopPropagation(); setShowMove(!showMove); }}
          className="w-6 h-6 flex items-center justify-center rounded text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 text-xs"
          aria-label="Move task"
        >
          ⇄
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="w-6 h-6 flex items-center justify-center rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 text-xs"
          aria-label="Delete task"
        >
          ×
        </button>
      </div>

      {showMove && (
        <div className="absolute top-8 right-2 z-20 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[130px]">
          {COLUMNS.filter(c => c.id !== (task.status as ColumnId)).map(c => (
            <button
              key={c.id}
              onClick={e => { e.stopPropagation(); onMove(task.id, c.id); setShowMove(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskEditModal({ task, members, onSave, onClose, loading, currentUserId }: {
  task: Task; members: Member[];
  onSave: (updates: Partial<Task>) => void;
  onClose: () => void;
  loading: boolean;
  currentUserId: string;
}) {
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    assignee_id: task.assignee_id || '',
    due_date: task.due_date || '',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div className="bg-white rounded-surface shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-neutral-100">
          <h3 className="font-semibold text-neutral-900">Edit task</h3>
          <button onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-700">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls + ' resize-none'} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={inputCls}>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Assignee</label>
              <select value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))} className={inputCls}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name || m.user_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Due date</label>
              <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </div>
        {/* Activity feed */}
        <div className="px-5 pb-2">
          <TaskActivityFeed
            taskId={task.id}
            currentUserId={currentUserId}
            memberNames={Object.fromEntries(
              members.map(m => [m.user_id, m.profiles?.full_name || m.user_id.slice(0, 8)])
            )}
          />
        </div>

        <div className="flex gap-3 p-5 border-t border-neutral-100">
          <button onClick={onClose} className="flex-1 py-2 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">Cancel</button>
          <button
            onClick={() => onSave({
              title: form.title,
              description: form.description || null,
              status: form.status,
              priority: form.priority,
              assignee_id: form.assignee_id || null,
              due_date: form.due_date || null,
            })}
            disabled={loading || !form.title.trim()}
            className="flex-1 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MilestoneRow({ milestone, onEdit, onDelete }: {
  milestone: Milestone; onEdit: () => void; onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    upcoming: '#60A5FA', in_progress: '#F59E0B', completed: '#10B981', delayed: '#EF4444',
  };
  const dotColor = statusColors[milestone.status] || '#0FBAB0';

  return (
    <div className="group bg-white rounded-surface border border-neutral-200 p-4 hover:border-neutral-300 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-sm font-semibold text-neutral-900">{milestone.title}</span>
            <span
              className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${dotColor}20`, color: dotColor }}
            >
              {milestone.status.replace('_', ' ')}
            </span>
            {milestone.visible_to_client && (
              <span className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded-full">
                Client visible
              </span>
            )}
          </div>

          {milestone.description && (
            <p className="text-xs text-neutral-500 mb-2">{milestone.description}</p>
          )}

          <div className="flex items-center gap-4">
            {milestone.due_date && (
              <span className="text-xs text-neutral-400">
                Due {new Date(milestone.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            <div className="flex-1 flex items-center gap-2 max-w-48">
              <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${milestone.progress}%`, backgroundColor: dotColor }} />
              </div>
              <span className="text-xs font-medium text-neutral-600 w-8">{milestone.progress}%</span>
            </div>
          </div>
        </div>

        <div className="hidden group-hover:flex items-center gap-1">
          <button onClick={onEdit} className="text-xs px-2.5 py-1.5 text-neutral-500 hover:text-parabolica border border-neutral-200 rounded-lg hover:border-parabolica transition-colors">Edit</button>
          <button onClick={onDelete} className="text-xs px-2.5 py-1.5 text-neutral-400 hover:text-red-500 border border-neutral-200 rounded-lg hover:border-red-200 transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

const STATUS_OPTIONS = ['upcoming', 'in_progress', 'completed', 'delayed'] as const;

function MilestoneForm({ onSave, onCancel, loading, initial }: {
  onSave: (form: Partial<Milestone>) => void;
  onCancel: () => void;
  loading: boolean;
  initial?: Partial<Milestone>;
}) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    due_date: initial?.due_date || '',
    progress: initial?.progress ?? 0,
    status: initial?.status || 'upcoming',
    visible_to_client: initial?.visible_to_client ?? true,
  });

  return (
    <div className="mt-4 bg-white rounded-surface border border-parabolica p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">
        {initial ? 'Edit milestone' : 'New milestone'}
      </h4>
      <div className="space-y-3">
        <div>
          <label className={labelCls}>Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} placeholder="e.g. Design approved" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Optional details…" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Due date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputCls}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Progress: {form.progress}%</label>
          <input
            type="range" min={0} max={100} value={form.progress}
            onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
            className="w-full accent-parabolica"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.visible_to_client}
            onChange={e => setForm(f => ({ ...f, visible_to_client: e.target.checked }))}
            className="w-4 h-4 accent-parabolica"
          />
          <span className="text-xs text-neutral-600">Visible to client</span>
        </label>
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onCancel} className="flex-1 py-2 border border-neutral-200 text-sm rounded-lg hover:bg-neutral-50">Cancel</button>
        <button
          onClick={() => onSave({
            title: form.title,
            description: form.description || null,
            due_date: form.due_date || null,
            progress: form.progress,
            status: form.status,
            visible_to_client: form.visible_to_client,
          })}
          disabled={loading || !form.title.trim()}
          className="flex-1 py-2 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function MilestoneEditModal({ milestone, onSave, onClose, loading }: {
  milestone: Milestone;
  onSave: (form: Partial<Milestone>) => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div className="bg-white rounded-surface shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-neutral-900">Edit milestone</h3>
          <button onClick={onClose} aria-label="Close" className="text-neutral-400 hover:text-neutral-700">✕</button>
        </div>
        <MilestoneForm onSave={onSave} onCancel={onClose} loading={loading} initial={milestone} />
      </div>
    </div>
  );
}
