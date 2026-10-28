import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { createComment, fetchCommentsFeed, fetchCommentsSection, voteComment } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/comments?key=…
 *   &sort=latest|best-recent [&user=NAME]  → comments feed
 *   &type=show&id=SHOWID                   → comments for one show (tree)
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type');
    const id = parseInt(sp.get('id') ?? '', 10);
    if (type && Number.isFinite(id)) {
      const comments = await fetchCommentsSection(ctx.session, type, id);
      return NextResponse.json({ comments });
    }
    const sort = sp.get('sort') === 'best-recent' ? 'best-recent' : 'latest';
    const user = sp.get('user') ?? undefined;
    const feed = await fetchCommentsFeed(ctx.session, sort, user);
    return NextResponse.json(feed);
  } catch (err) {
    return accountError(err);
  }
}

/**
 * POST /api/account/comments
 * { apiKey, action: create|vote, … }
 *  create: { showId?, videoId?, parentId?, body, review?, spoiler?, aboutLinks? }
 *  vote:   { commentId, direction: up|down|none }
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; action?: string;
    showId?: number; videoId?: number; parentId?: number;
    body?: string; review?: boolean; spoiler?: boolean; aboutLinks?: boolean;
    commentId?: number; direction?: string;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    if (body.action === 'create') {
      const text = (body.body ?? '').trim();
      if (!text) return NextResponse.json({ error: 'Comment body is required' }, { status: 400 });
      await createComment(ctx.session, {
        showId: Number(body.showId) || undefined,
        videoId: Number(body.videoId) || undefined,
        parentId: Number(body.parentId) || undefined,
        body: text.slice(0, 8000),
        review: Boolean(body.review),
        spoiler: Boolean(body.spoiler),
        aboutLinks: Boolean(body.aboutLinks),
      });
      return NextResponse.json({ ok: true });
    }
    if (body.action === 'vote') {
      const commentId = Number(body.commentId);
      const direction = body.direction;
      if (!commentId || !['up', 'down', 'none'].includes(direction ?? '')) {
        return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
      }
      const result = await voteComment(ctx.session, commentId, direction as 'up' | 'down' | 'none');
      return NextResponse.json(result);
    }
    return NextResponse.json({ error: 'Unknown comments action' }, { status: 400 });
  } catch (err) {
    return accountError(err);
  }
}
