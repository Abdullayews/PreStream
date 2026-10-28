import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { fetchForumCategory, fetchForumIndex, fetchForumThread, replyToThread } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/forum?key=…            → index (categories + latest threads)
 * GET /api/account/forum?key=…&category=N → one category's threads
 * GET /api/account/forum?key=…&thread=N   → thread posts
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const category = parseInt(sp.get('category') ?? '', 10);
    const thread = parseInt(sp.get('thread') ?? '', 10);
    if (Number.isFinite(category) && category > 0) {
      return NextResponse.json({ category: await fetchForumCategory(ctx.session, category) });
    }
    if (Number.isFinite(thread) && thread > 0) {
      return NextResponse.json(await fetchForumThread(ctx.session, thread));
    }
    return NextResponse.json(await fetchForumIndex(ctx.session));
  } catch (err) {
    return accountError(err);
  }
}

/** POST /api/account/forum  { apiKey, threadId, body } — reply to a thread. */
export async function POST(req: NextRequest) {
  const body = await readJson<{ apiKey: string; threadId?: number; body?: string }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const threadId = Number(body.threadId);
    const text = (body.body ?? '').trim();
    if (!threadId || !text) {
      return NextResponse.json({ error: 'Thread and reply body are required' }, { status: 400 });
    }
    await replyToThread(ctx.session, threadId, text.slice(0, 20000));
    return NextResponse.json({ ok: true });
  } catch (err) {
    return accountError(err);
  }
}
