import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';
import AdminSidebar from '../../components/admin/AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-neutral-100 flex">
      <AdminSidebar user={user} profile={profile} />
      <div className="flex-1 ml-56 min-h-screen">
        {children}
      </div>
    </div>
  );
}
