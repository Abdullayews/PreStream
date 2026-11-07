import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { KEY_RE } from '@/lib/account-auth';
import { fetchMe, fetchSettings } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/heal  { apiKey, pwSession }
 *
 * Self-heal after a redeploy wiped the local database. Free-tier hosts
 * (Render free: "local files lost on redeploy") replace the instance on
 * every deploy, so the SQLite file — and with it every Profile row — is
 * gone. The apiKey in the user's browser then resolves to nothing and the
 * client would normally be bounced to the sign-in prompt.
 *
 * The login response mirrors the user's PrimeWire session cookie to the
 * client; when a request fails with `unknown-key`, the client posts that
 * session here. If the session is still alive on PrimeWire we rebuild the
 * profile row and return the same shape as /login:
 *   - no row for the PrimeWire username → recreate one, REUSING the
 *     client's apiKey (their stored key keeps working);
 *   - a row exists (the user re-logged-in on another device after the
 *     wipe) → refresh it and return ITS canonical apiKey — the client
 *     adopts it, so both devices converge on one row.
 * The client then transparently retries the failed request: the user
 * stays signed in across deploys.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      apiKey?: string;
      pwSession?: string;
    };
    const key = (body.apiKey ?? '').trim();
    const session = (body.pwSession ?? '').trim();

    if (!KEY_RE.test(key)) {
      return NextResponse.json({ error: 'Invalid API key', code: 'bad-key' }, { status: 400 });
    }
    if (!session || !session.includes('_primewire_key')) {
      return NextResponse.json(
        { error: 'No PrimeWire session to restore', code: 'no-session' },
        { status: 401 },
      );
    }

    // 1. The PrimeWire session must still be alive upstream
    let me;
    try {
      me = await fetchMe(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Session check failed';
      const expired = /session|sign in|not signed/i.test(message);
      return NextResponse.json(
        {
          error: expired ? 'Your PrimeWire session expired — sign in again' : message,
          code: 'session-expired',
        },
        { status: 401 },
      );
    }
    if (!me.username) {
      return NextResponse.json(
        { error: 'Could not identify the PrimeWire account', code: 'session-expired' },
        { status: 401 },
      );
    }

    // 2. Best-effort PrimeWire API key refresh (same as login)
    let pwApiKey: string | null = null;
    try {
      pwApiKey = (await fetchSettings(session)).apiKey;
    } catch {
      // non-fatal
    }

    // 3. Find the row by username; recreate or refresh it
    let row = await db.profile.findUnique({ where: { username: me.username } });
    if (row) {
      row = await db.profile.update({
        where: { id: row.id },
        data: { pwSession: session, pwUserId: me.userId, pwApiKey, avatar: me.avatar },
      });
    } else {
      try {
        row = await db.profile.create({
          data: {
            apiKey: key, // reuse the client's stored key
            username: me.username,
            pwSession: session,
            pwUserId: me.userId,
            pwApiKey,
            avatar: me.avatar,
          },
        });
      } catch {
        // Two tabs healed concurrently — the row this key now maps to
        // already exists. Adopt it instead of failing the heal.
        row = await db.profile.findUnique({ where: { apiKey: key } });
        if (!row) throw new Error('Profile rebuild failed');
        row = await db.profile.update({
          where: { id: row.id },
          data: { pwSession: session, pwUserId: me.userId, pwApiKey, avatar: me.avatar },
        });
      }
    }

    let watchlist: unknown = [];
    try {
      watchlist = JSON.parse(row.watchlist || '[]');
    } catch {
      watchlist = [];
    }

    return NextResponse.json({
      apiKey: row.apiKey, // canonical — may differ from the client's stale key
      isNew: false,
      user: {
        username: me.username,
        userId: me.userId,
        avatar: me.avatar,
        pwApiKey,
        gender: me.gender,
        from: me.from,
        joined: me.joined,
        online: me.online,
        sourceUrl: me.sourceUrl,
      },
      sidebar: me.sidebar,
      themeId: row.themeId,
      watchlist,
      pwSession: session,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Session restore failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
