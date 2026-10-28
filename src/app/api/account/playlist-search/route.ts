import { NextRequest, NextResponse } from 'next/server';
import { accountError, requireAccount } from '@/lib/account-auth';
import { playlistSearch } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * GET /api/account/playlist-search?key=…&playlistId=…&q=…[&type=]
 * PrimeWire's playlist-editor search — shows that can be added to a playlist.
 */
export async function GET(req: NextRequest) {
  const ctx = await requireAccount(req.nextUrl.searchParams.get('key'));
  if (ctx instanceof NextResponse) return ctx;
  try {
    const sp = req.nextUrl.searchParams;
    const playlistId = parseInt(sp.get('playlistId') ?? '', 10);
    const q = (sp.get('q') ?? '').trim();
    if (!Number.isFinite(playlistId) || playlistId <= 0 || !q) {
      return NextResponse.json({ error: 'playlistId and q are required' }, { status: 400 });
    }
    const type = sp.get('type') === 'movie' || sp.get('type') === 'tv' ? sp.get('type')! : undefined;
    const items = await playlistSearch(ctx.session, playlistId, { q, type });
    return NextResponse.json({ items });
  } catch (err) {
    return accountError(err);
  }
}
