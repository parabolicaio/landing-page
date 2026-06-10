import { NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';
import { createAdminClient } from '../../../../lib/supabase/admin';

/**
 * Generates a one-time signup/login link the admin copies and sends manually
 * (WhatsApp, email, etc). Avoids Supabase's unreliable built-in SMTP.
 * - New email  → 'invite' link: creates the user; they set a password on first visit
 * - Existing email → 'magiclink': logs them straight in
 */
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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const redirectTo = `${siteUrl}/api/auth/callback`;

  const adminClient = createAdminClient();

  // Try an invite link first (creates the user)
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'invite',
    email,
    options: { data: { full_name: full_name || '' }, redirectTo },
  });

  if (!error && data?.properties?.action_link) {
    return NextResponse.json({
      link: data.properties.action_link,
      kind: 'invite',
      user: data.user,
    });
  }

  // User likely already exists — fall back to a magic login link
  const { data: magicData, error: magicErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  });

  if (magicErr || !magicData?.properties?.action_link) {
    return NextResponse.json(
      { error: magicErr?.message || error?.message || 'Failed to generate link' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    link: magicData.properties.action_link,
    kind: 'magiclink',
    user: magicData.user,
  });
}
