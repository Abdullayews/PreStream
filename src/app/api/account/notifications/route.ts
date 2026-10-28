import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { clearNotifications, fetchNotifications } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/** GET /api/account/notifications?key=… */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const notifications = await fetchNotifications(ctx.session);
    return NextResponse.json({ notifications });
  } catch (err) {
    return accountError(err);
  }
}

/** POST /api/account/notifications  { apiKey, action: "clear" } */
export async function POST(req: NextRequest) {
  const body = await readJson<{ apiKey: string; action?: string }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    if (body.action !== 'clear') {
      return NextResponse.json({ error: 'Unknown notifications action' }, { status: 400 });
    }
    await clearNotifications(ctx.session);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return accountError(err);
  }
}
