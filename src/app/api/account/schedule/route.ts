import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchPersonalSchedule } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/schedule?key=… → personal schedule (library shows' episodes). */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const days = await fetchPersonalSchedule(ctx.session);
    return NextResponse.json({ days, updatedAt: new Date().toISOString() });
  } catch (err) {
    return accountError(err);
  }
}
