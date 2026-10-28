import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchUserLinks } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/links?key=… → the user's submitted streaming links. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const username = ctx.profile.username;
    if (!username) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const links = await fetchUserLinks(ctx.session, username);
    return NextResponse.json({ links });
  } catch (err) {
    return accountError(err);
  }
}
