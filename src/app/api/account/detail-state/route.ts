import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { fetchDetailState } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/detail-state?key=…&type=movie|tv&id=…&slug=…
 * → the signed-in user's tracker state + episode watched states for a show.
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type') === 'tv' ? 'tv' : 'movie';
    const id = parseInt(sp.get('id') ?? '', 10);
    const slug = (sp.get('slug') ?? '').replace(/[^a-z0-9-]/gi, '');
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid show id' }, { status: 400 });
    }
    const state = await fetchDetailState(ctx.session, type, id, slug || 'x');
    return NextResponse.json(state);
  } catch (err) {
    return accountError(err);
  }
}
