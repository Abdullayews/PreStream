import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchRecommended } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/recommended?key=… → recommendations based on library + favorites. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const userId = ctx.profile.pwUserId;
    if (!userId) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
    const items = await fetchRecommended(ctx.session, userId, req.nextUrl.searchParams.get('recent') !== 'false');
    return NextResponse.json({ items });
  } catch (err) {
    return accountError(err);
  }
}
