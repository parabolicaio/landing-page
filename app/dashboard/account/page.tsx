'use client';
import React, { useState } from 'react';
import { createClient } from '../../../lib/supabase/client';

export default function AccountPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(false);
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setPassword(''); setConfirm('');
  }

  return (
    <div className="max-w-md mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-1">Account settings</h1>
      <p className="text-sm text-neutral-500 mb-6">Change your password.</p>

      <div className="bg-white rounded-surface border border-neutral-200 p-6">
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">New password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required autoComplete="new-password" minLength={6}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white"
              placeholder="At least 6 characters" />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1.5">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              required autoComplete="new-password"
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-parabolica/20 focus:border-parabolica bg-white"
              placeholder="Re-enter password" />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</div>}
          {success && <div className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">Password updated successfully.</div>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-parabolica text-white text-sm font-semibold rounded-lg hover:bg-parabolica-700 disabled:opacity-50">
            {loading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
