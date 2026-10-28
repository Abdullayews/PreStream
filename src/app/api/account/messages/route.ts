import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { fetchMessages, sendDirectMessage } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/messages?key=… → DM inbox. */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const threads = await fetchMessages(ctx.session);
    return NextResponse.json({ threads });
  } catch (err) {
    return accountError(err);
  }
}

/** POST /api/account/messages  { apiKey, toName, toUserId?, body } — send a DM. */
export async function POST(req: NextRequest) {
  const body = await readJson<{ apiKey: string; toName: string; toUserId?: number; body: string }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const toName = (body.toName ?? '').trim();
    const text = (body.body ?? '').trim();
    if (!toName || !text) {
      return NextResponse.json({ error: 'Recipient and message are required' }, { status: 400 });
    }
    await sendDirectMessage(ctx.session, {
      toName: toName.slice(0, 40),
      toUserId: Number(body.toUserId) || undefined,
      body: text.slice(0, 8000),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return accountError(err);
  }
}
