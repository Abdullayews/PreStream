import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pwLogout } from '@/lib/primewire/session';
import { KEY_RE } from '@/lib/account-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/logout  { apiKey }
 * Ends the PrimeWire session and detaches it from the profile
 * (theme + watchlist stay cached for the next sign-in).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { apiKey?: string };
    const key = (body.apiKey ?? '').trim();
    if (!KEY_RE.test(key)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }
    const row = await db.profile.findUnique({ where: { apiKey: key } });
    if (!row) return NextResponse.json({ error: 'Unknown API key' }, { status: 404 });

    if (row.pwSession) {
      await pwLogout(row.pwSession);
    }
    await db.profile.update({
      where: { id: row.id },
      data: { pwSession: null, pwApiKey: null },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-out failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
