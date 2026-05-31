'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User;
  profile: { full_name: string | null; is_super_admin?: boolean | null } | null;
}

export default function DashboardNav({ user, profile }: Props) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = (profile?.full_name || user.email || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-neutral-200 flex items-center px-6">
      <div className="flex items-center gap-3 flex-1">
        <Link href="/dashboard">
          <img src="/brand/logo-2-color.png" alt="Parabolica" className="h-7 w-auto" />
        </Link>
        <span className="text-xs text-neutral-400 font-medium tracking-wide uppercase ml-1">
          Workspace
        </span>
      </div>

      <div className="flex items-center gap-3">
        {profile?.is_super_admin && (
          <Link
            href="/admin"
            className="text-xs font-semibold text-parabolica hover:underline px-2 py-1"
          >
            Admin ↗
          </Link>
        )}

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-parabolica flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
          <span className="text-sm text-neutral-600 hidden sm:block">
            {profile?.full_name || user.email}
          </span>
        </div>

        <button
          onClick={signOut}
          disabled={signingOut}
          className="text-xs text-neutral-400 hover:text-neutral-700 transition-colors px-2 py-1"
        >
          {signingOut ? '…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
