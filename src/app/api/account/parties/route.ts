import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchWatchParties } from '@/lib/primewire/account';
import { PRIMARY_MIRROR } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

/** GET /api/account/parties?key=… → active watch parties. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const parties = await fetchWatchParties(ctx.session);
    return NextResponse.json({
      parties: parties.map((p) => ({ ...p, url: `${PRIMARY_MIRROR}/party/${p.code}` })),
    });
  } catch (err) {
    return accountError(err);
  }
}
