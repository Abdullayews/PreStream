import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { addFriend, blockUser, fetchFriends } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/friends?key=…&name=… → a user's friends (+ unconfirmed). */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const name = (req.nextUrl.searchParams.get('name') ?? '').trim() || ctx.profile.username || '';
    if (!name) return NextResponse.json({ error: 'Missing user name' }, { status: 400 });
    const friends = await fetchFriends(ctx.session, name);
    return NextResponse.json(friends);
  } catch (err) {
    return accountError(err);
  }
}

/** POST /api/account/friends  { apiKey, action: add|block, userId } */
export async function POST(req: NextRequest) {
  const body = await readJson<{ apiKey: string; action?: string; userId?: number }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const userId = Number(body.userId);
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }
    if (body.action === 'add') {
      await addFriend(ctx.session, userId);
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'block') {
      await blockUser(ctx.session, userId);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Unknown friends action' }, { status: 400 });
  } catch (err) {
    return accountError(err);
  }
}
