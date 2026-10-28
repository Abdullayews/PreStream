import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchLibrary } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

const STATUSES = new Set(['watched', 'in-progress', 'plan-to-watch', 'on-hold', 'dropped']);

/**
 * GET /api/account/library?key=…[&status=&favorite=on&type=&sort=&direction=&page=]
 * The signed-in user's PrimeWire library.
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get('status') ?? undefined;
    const username = ctx.profile.username ?? '';
    if (!username) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const result = await fetchLibrary(ctx.session, username, {
      status: status && STATUSES.has(status) ? status : undefined,
      favorite: sp.get('favorite') === 'on' || sp.get('favorite') === 'true',
      type: sp.get('type') === 'movie' || sp.get('type') === 'tv' ? sp.get('type')! : undefined,
      sort: sp.get('sort') ?? undefined,
      direction: sp.get('direction') === 'asc' || sp.get('direction') === 'desc' ? sp.get('direction')! : undefined,
      page: parseInt(sp.get('page') ?? '1', 10) || 1,
    });
    return NextResponse.json(result);
  } catch (err) {
    return accountError(err);
  }
}
