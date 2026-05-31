'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';

interface Props {
  params: Promise<{ slug: string }>;
}

type Milestone = {
  id: string; title: string; description: string | null;
  due_date: string | null; progress: number; status: string; position: number;
};

type ProjectInfo = {
  ok: boolean;
  project_id?: string;
  name?: string;
  color?: string;
  client_name?: string;
  error?: string;
};

// ─── Milestone Timeline ────────────────────────────────────────────────────

const STATUS_DOT_COLORS: Record<string, string> = {
  upcoming:    '#60A5FA',
  in_progress: '#F59E0B',
  completed:   '#10B981',
  delayed:     '#EF4444',
};

function MilestoneTimeline({ milestones, color }: { milestones: Milestone[]; color: string }) {
  const dated = milestones.filter(m => m.due_date);
  if (dated.length < 2) return null; // Need at least 2 points for a meaningful timeline

  const sorted = [...dated].sort((a, b) =>
    new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
  );

  const minTs = new Date(sorted[0].due_date!).getTime();
  const maxTs = new Date(sorted[sorted.length - 1].due_date!).getTime();
  const range = maxTs - minTs || 1;

  const nowTs = Date.now();
  const nowPct = Math.min(1, Math.max(0, (nowTs - minTs) / range));

  // SVG layout
  const W = 700;
  const H = 80;
  const PAD = 40;
  const trackW = W - PAD * 2;
  const trackY = 36;
  const nodeR = 9;

  function xOf(ts: number) { return PAD + ((ts - minTs) / range) * trackW; }

  const [tooltip, setTooltip] = React.useState<{ ms: Milestone; x: number } | null>(null);

  return (
    <div className="mb-6 overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full min-w-[400px]"
        style={{ height: H }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Background track */}
        <line x1={PAD} y1={trackY} x2={W - PAD} y2={trackY} stroke="#E5E7EB" strokeWidth={4} strokeLinecap="round" />

        {/* Filled track up to today */}
        <line
          x1={PAD} y1={trackY}
          x2={PAD + nowPct * trackW} y2={trackY}
          stroke={color} strokeWidth={4} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />

        {/* Milestone nodes */}
        {sorted.map(ms => {
          const x = xOf(new Date(ms.due_date!).getTime());
          const dotColor = STATUS_DOT_COLORS[ms.status] || '#94A3B8';
          return (
            <g
              key={ms.id}
              onMouseEnter={() => setTooltip({ ms, x })}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={trackY} r={nodeR + 4} fill="transparent" />
              <circle cx={x} cy={trackY} r={nodeR} fill="white" stroke={dotColor} strokeWidth={3} />
              {ms.status === 'completed' && (
                <text x={x} y={trackY + 4} textAnchor="middle" fontSize={10} fill={dotColor} fontWeight="bold">✓</text>
              )}
              {/* Date label below */}
              <text x={x} y={trackY + 22} textAnchor="middle" fontSize={9} fill="#9CA3AF">
                {new Date(ms.due_date!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          );
        })}

        {/* Today marker */}
        {nowPct > 0 && nowPct < 1 && (
          <g>
            <line
              x1={PAD + nowPct * trackW} y1={trackY - 14}
              x2={PAD + nowPct * trackW} y2={trackY + 14}
              stroke={color} strokeWidth={1.5} strokeDasharray="3 2"
            />
            <text x={PAD + nowPct * trackW} y={trackY - 18} textAnchor="middle" fontSize={8} fill={color} fontWeight="600">
              Today
            </text>
          </g>
        )}
      </svg>

      {/* Tooltip — rendered as HTML overlay */}
      {tooltip && (
        <div
          className="mt-1 bg-neutral-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg inline-block"
          style={{ marginLeft: `${(tooltip.x / W) * 100}%`, transform: 'translateX(-50%)' }}
        >
          <p className="font-semibold">{tooltip.ms.title}</p>
          <p className="text-neutral-400">
            Due {new Date(tooltip.ms.due_date!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
          <p className="text-neutral-400">{tooltip.ms.progress}% complete</p>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  upcoming:    { label: 'Upcoming',    bg: 'bg-blue-50',   text: 'text-blue-700',   dot: '#60A5FA' },
  in_progress: { label: 'In Progress', bg: 'bg-amber-50',  text: 'text-amber-700',  dot: '#F59E0B' },
  completed:   { label: 'Completed',   bg: 'bg-green-50',  text: 'text-green-700',  dot: '#10B981' },
  delayed:     { label: 'Delayed',     bg: 'bg-red-50',    text: 'text-red-700',    dot: '#EF4444' },
};

export default function ClientPortalPage({ params }: Props) {
  const [slug, setSlug] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '', '', '']);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    params.then(p => setSlug(p.slug));
  }, [params]);

  async function verifyPin() {
    const fullPin = pinDigits.join('');
    if (fullPin.length < 4) return;
    setLoading(true);
    setError('');

    const { data, error: rpcErr } = await supabase.rpc('verify_client_pin', {
      p_slug: slug,
      p_pin: fullPin,
    });

    if (rpcErr || !data?.ok) {
      setError(data?.error === 'not_found' ? 'Project not found.' : 'Incorrect PIN. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPinDigits(['', '', '', '', '', '']);
      setLoading(false);
      return;
    }

    setProjectInfo(data);

    const { data: msData } = await supabase.rpc('get_client_milestones', {
      p_project_id: data.project_id,
    });

    setMilestones(msData || []);
    setLoading(false);
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...pinDigits];
    next[index] = value.slice(-1);
    setPinDigits(next);
    if (value && index < 5) {
      document.getElementById(`pin-${index + 1}`)?.focus();
    }
    if (next.filter(Boolean).length >= 4 && next.every((d, i) => i >= 4 || d)) {
      setTimeout(() => verifyPin(), 100);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
      document.getElementById(`pin-${index - 1}`)?.focus();
    }
    if (e.key === 'Enter') verifyPin();
  }

  if (!projectInfo?.ok) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0FBAB0 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-parabolica to-transparent opacity-40" />

        <div className="relative z-10 w-full max-w-sm">
          <div className="text-center mb-10">
            <img src="/brand/logo-1-white.png" alt="Parabolica" className="h-8 mx-auto opacity-90" />
          </div>

          <div className="bg-neutral-800 rounded-2xl border border-neutral-700 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-parabolica/10 border border-parabolica/20 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C9.24 2 7 4.24 7 7v2H6a2 2 0 00-2 2v9a2 2 0 002 2h12a2 2 0 002-2v-9a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v2H9V7c0-1.66 1.34-3 3-3zm0 10a2 2 0 110 4 2 2 0 010-4z" fill="#0FBAB0" />
                </svg>
              </div>
              <h1 className="text-white font-bold text-xl">Project Portal</h1>
              <p className="text-neutral-400 text-sm mt-1.5">Enter your PIN to view your project</p>
            </div>

            <div className={`flex justify-center gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
              {pinDigits.map((d, i) => (
                <input
                  key={i}
                  id={`pin-${i}`}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-neutral-700 text-white transition-all focus:outline-none ${
                    d
                      ? 'border-parabolica bg-parabolica/10 text-parabolica'
                      : 'border-neutral-600 focus:border-parabolica'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="mb-4 text-center text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <button
              onClick={verifyPin}
              disabled={loading || pinDigits.filter(Boolean).length < 4}
              className="w-full py-3 bg-parabolica text-white font-semibold rounded-xl hover:bg-parabolica-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" />
                  </svg>
                  Verifying…
                </span>
              ) : 'Access project'}
            </button>
          </div>

          <p className="text-center text-neutral-600 text-xs mt-6">
            Contact your project manager if you need access.
          </p>
        </div>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-8px); }
            40%, 80% { transform: translateX(8px); }
          }
          .animate-shake { animation: shake 0.4s ease-in-out; }
        `}</style>
      </div>
    );
  }

  const overallProgress = milestones.length > 0
    ? Math.round(milestones.reduce((sum, m) => sum + m.progress, 0) / milestones.length)
    : 0;

  const completed  = milestones.filter(m => m.status === 'completed').length;
  const inProgress = milestones.filter(m => m.status === 'in_progress').length;
  const upcoming   = milestones.filter(m => m.status === 'upcoming').length;
  const delayed    = milestones.filter(m => m.status === 'delayed').length;
  const color      = projectInfo.color || '#0FBAB0';

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/brand/logo-2-color.png" alt="Parabolica" className="h-7" />
          <div className="text-right">
            <p className="text-xs text-neutral-400">Project portal</p>
            <p className="text-sm font-semibold text-neutral-700">{projectInfo.client_name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero card */}
        <div
          className="rounded-2xl p-8 mb-8 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${color}ee, ${color}99)` }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: 'white', transform: 'translate(30%, -30%)' }}
          />
          <div className="relative z-10">
            <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-2">
              {projectInfo.client_name}
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-6">{projectInfo.name}</h1>

            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                  <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="white" strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - overallProgress / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{overallProgress}%</span>
                </div>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Overall Progress</p>
                <p className="text-white/70 text-sm mt-0.5">
                  {completed} of {milestones.length} milestones complete
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Completed',   value: completed,   color: '#10B981' },
            { label: 'In Progress', value: inProgress,  color: '#F59E0B' },
            { label: 'Upcoming',    value: upcoming,    color: '#60A5FA' },
            { label: 'Delayed',     value: delayed,     color: '#EF4444' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border border-neutral-200 p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Milestones */}
        <div>
          <h2 className="text-lg font-bold text-neutral-900 mb-4">Project Milestones</h2>

          {/* SVG Timeline — only when milestones have due dates */}
          <MilestoneTimeline milestones={milestones} color={color} />

          {milestones.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-neutral-200">
              <p className="text-neutral-400">No milestones yet. Check back soon.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {milestones.map(ms => {
                const st = STATUS_CONFIG[ms.status] || STATUS_CONFIG.upcoming;
                return (
                  <div key={ms.id} className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
                          <h3 className="font-semibold text-neutral-900">{ms.title}</h3>
                          <span className={`text-[11px] font-semibold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                            {st.label}
                          </span>
                        </div>
                        {ms.description && (
                          <p className="text-sm text-neutral-500 mb-3 ml-5">{ms.description}</p>
                        )}
                        <div className="ml-5">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-neutral-400">Progress</span>
                            <span className="text-xs font-semibold text-neutral-700">{ms.progress}%</span>
                          </div>
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${ms.progress}%`, backgroundColor: st.dot }}
                            />
                          </div>
                        </div>
                      </div>
                      {ms.due_date && (
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">Due</p>
                          <p className="text-sm font-semibold text-neutral-700">
                            {new Date(ms.due_date).toLocaleDateString('en-GB', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-200 flex items-center justify-between">
          <img src="/brand/logo-2-color.png" alt="Parabolica" className="h-6 opacity-60" />
          <p className="text-xs text-neutral-400">
            Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}
