import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { postToWall } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** POST /api/account/wall  { apiKey, toUserId, body } — post on a user's wall. */
export async function POST(req: NextRequest) {
  const body = await readJson<{ apiKey: string; toUserId: number; body: string }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const toUserId = Number(body.toUserId);
    const text = (body.body ?? '').trim();
    if (!Number.isFinite(toUserId) || toUserId <= 0 || !text) {
      return NextResponse.json({ error: 'Missing wall post content' }, { status: 400 });
    }
    await postToWall(ctx.session, toUserId, text.slice(0, 4000));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return accountError(err);
  }
}
