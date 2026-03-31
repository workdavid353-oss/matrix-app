import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  // Verify the caller is an admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { userId, userName } = await req.json();
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  // Get user email via admin API
  const adminClient = createAdminClient();
  const { data: { user: targetUser } } = await adminClient.auth.admin.getUserById(userId);
  const userEmail = targetUser?.email;
  if (!userEmail) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Email not configured' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://matrix-app.workdavid353.workers.dev';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'Matrix App <noreply@yourdomain.com>',
      to: [userEmail],
      subject: 'Your account has been approved!',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h2 style="color: #111; margin-bottom: 8px;">Hi ${userName ?? 'there'} 👋</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Your account on <strong>יוצאים מהמטריקס</strong> has been approved by an admin.
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            You can now sign in and access the app.
          </p>
          <a href="${appUrl}" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 500;">
            Sign in now
          </a>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
