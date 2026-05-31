import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import DashboardNav from '../../components/dashboard/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_super_admin')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-neutral-100">
      <DashboardNav user={user} profile={profile} />
      <div className="pt-16">
        {children}
      </div>
    </div>
  );
}
