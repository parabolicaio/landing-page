'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Props {
  user: User;
  profile: { full_name: string | null; is_super_admin?: boolean | null } | null;
}

const NAV = [
  { href: '/admin',          label: 'Overview',  icon: '◎' },
  { href: '/admin/projects', label: 'Projects',  icon: '□' },
  { href: '/admin/clients',  label: 'Clients',   icon: '◈' },
  { href: '/admin/team',     label: 'Team',      icon: '◉' },
];

export default function AdminSidebar({ user, profile }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const supabase = createClient();

  async function signOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push('/login');
  }

  const initials = (profile?.full_name || user.email || 'A')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-neutral-900 flex flex-col z-30">
      <div className="p-4 border-b border-neutral-800">
        <img src="/brand/logo-1-white.png" alt="Parabolica" className="h-7 mb-1" />
        <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Admin</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map(item => {
          const active = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-parabolica text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-neutral-800">
        <Link href="/dashboard" className="flex items-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 mb-3 transition-colors">
          ← Back to workspace
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-parabolica flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <span className="text-xs text-neutral-400 truncate">{profile?.full_name || user.email}</span>
        </div>
        <button onClick={signOut} disabled={signingOut} className="mt-2 text-xs text-neutral-600 hover:text-neutral-400 transition-colors w-full text-left">
          {signingOut ? '…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
}
