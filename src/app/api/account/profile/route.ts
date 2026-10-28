import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchUserProfile } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/profile?key=…&name=… → any PrimeWire user's profile + wall. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const name = (req.nextUrl.searchParams.get('name') ?? '').trim();
    if (!name || name.length > 40) {
      return NextResponse.json({ error: 'Missing user name' }, { status: 400 });
    }
    const profile = await fetchUserProfile(ctx.session, name);
    return NextResponse.json({ profile });
  } catch (err) {
    return accountError(err);
  }
}
