import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pwLogin } from '@/lib/primewire/session';
import { fetchMe, fetchSettings } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/login  { login, password }
 * Signs in to PrimeWire with the user's own account, stores the session
 * cookie (never the password) in their profile and returns the identity
 * (username, avatar, PrimeWire API key — all straight from PrimeWire).
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { login?: string; password?: string };
    const login = (body.login ?? '').trim();
    const password = body.password ?? '';
    if (!login || !password) {
      return NextResponse.json({ error: 'Enter your PrimeWire email/username and password' }, { status: 400 });
    }

    // 1. Sign in to PrimeWire
    const { session } = await pwLogin(login, password);

    // 2. Read the identity + API key straight from PrimeWire
    const me = await fetchMe(session);
    let pwApiKey: string | null = null;
    try {
      pwApiKey = (await fetchSettings(session)).apiKey;
    } catch {
      // non-fatal
    }

    // 3. Find or create our profile row for this PrimeWire username
    let row = me.username ? await db.profile.findUnique({ where: { username: me.username } }) : null;
    if (row) {
      row = await db.profile.update({
        where: { id: row.id },
        data: {
          pwSession: session,
          pwUserId: me.userId,
          pwApiKey,
          avatar: me.avatar,
        },
      });
    } else {
      row = await db.profile.create({
        data: {
          apiKey: `ps_${randomBytes(16).toString('hex')}`,
          username: me.username,
          pwSession: session,
          pwUserId: me.userId,
          pwApiKey,
          avatar: me.avatar,
        },
      });
    }

    let watchlist: unknown = [];
    try {
      watchlist = JSON.parse(row.watchlist || '[]');
    } catch {
      watchlist = [];
    }

    return NextResponse.json({
      apiKey: row.apiKey,
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
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign-in failed';
    const status = /password|confirm/i.test(message) ? (err as { status?: number }).status ?? 401 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
