import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchFeed } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/feed?key=… → the user's activity feed. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const comments = await fetchFeed(ctx.session);
    return NextResponse.json({ comments });
  } catch (err) {
    return accountError(err);
  }
}
