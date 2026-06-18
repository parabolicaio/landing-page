import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

/**
 * Creates a team account directly with a temporary password and returns the
 * credentials for the admin to copy and share (WhatsApp, email, etc).
 * Avoids OTP/magic-link expiry and email-scanner consumption entirely.
 */
function generateTempPassword(): string {
  // 9 url-safe chars + fixed suffix guarantees length/complexity rules pass
  const raw = randomBytes(7).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
  return `Pc-${raw}`;
}

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

  const { email, full_name } = await request.json() as { email: string; full_name?: string };

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const password = generateTempPassword();

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification — account is usable immediately
    user_metadata: { full_name: full_name || '' },
  });

  if (error) {
    // Most common: user already exists
    if (error.message?.toLowerCase().includes('already')) {
      return NextResponse.json(
        { error: 'A user with this email already exists. Reset their password from Supabase if needed.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Ensure the full_name lands on the profile (trigger may not pick up metadata reliably)
  if (full_name && data.user) {
    await adminClient.from('profiles').update({ full_name }).eq('id', data.user.id);
  }

  return NextResponse.json({ email, password, user: data.user });
}
