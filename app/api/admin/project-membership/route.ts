import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { project_id, user_id, role, action } = await request.json() as {
    project_id: string;
    user_id: string;
    role?: string;
    action: 'add' | 'remove';
  };

  if (!project_id || !user_id || !action) {
    return NextResponse.json({ error: 'project_id, user_id, and action are required' }, { status: 400 });
  }

  if (action === 'remove') {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', project_id)
      .eq('user_id', user_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await supabase
      .from('project_members')
      .upsert({ project_id, user_id, role: role || 'member' }, { onConflict: 'project_id,user_id' });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
