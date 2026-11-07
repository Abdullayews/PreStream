import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pwLogout } from '@/lib/primewire/session';
import { KEY_RE } from '@/lib/account-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/logout  { apiKey, pwSession? }
 * Ends the PrimeWire session and detaches it from the profile
 * (theme + watchlist stay cached for the next sign-in).
 *
 * `pwSession` is optional: when a redeploy already wiped the profile row,
 * the client still asks us to kill its PrimeWire session — without it the
 * row lookup would 404 and the upstream session would live on.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      apiKey?: string;
      pwSession?: string;
    };
    const key = (body.apiKey ?? '').trim();
    if (!KEY_RE.test(key)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }
    const clientSession =
      typeof body.pwSession === 'string' && body.pwSession.includes('_primewire_key')
        ? body.pwSession.trim()
        : null;

    const row = await db.profile.findUnique({ where: { apiKey: key } });
    if (!row && !clientSession) {
      return NextResponse.json({ error: 'Unknown API key' }, { status: 404 });
    }

    // Kill the live PrimeWire session — the row's, or the client's mirror
    // of it when the row was already lost to a redeploy.
    const sessionToKill = row?.pwSession ?? clientSession;
    if (sessionToKill) {
      await pwLogout(sessionToKill);
    }
    if (row) {
      await db.profile.update({
        where: { id: row.id },
        data: { pwSession: null, pwApiKey: null },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-out failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
