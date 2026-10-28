import { NextRequest, NextResponse } from 'next/server';
import { accountError, readJson, requireAccount } from '@/lib/account-auth';
import { rate } from '@/lib/primewire/account';

export const dynamic = 'force-dynamic';

/**
 * POST /api/account/rate
 * { apiKey, rating: 1–5, showId? | videoId? | linkId? | hostId? }
 * → { rating, votes } (the new average on PrimeWire)
 */
export async function POST(req: NextRequest) {
  const body = await readJson<{
    apiKey: string; rating: number; showId?: number; videoId?: number; linkId?: number; hostId?: number;
  }>(req);
  const ctx = await requireAccount(body.apiKey);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const rating = Number(body.rating);
    const target = {
      showId: Number(body.showId) || undefined,
      videoId: Number(body.videoId) || undefined,
      linkId: Number(body.linkId) || undefined,
      hostId: Number(body.hostId) || undefined,
    };
    if (!Number.isFinite(rating) || rating < 1 || rating > 5 || !Object.values(target).some(Boolean)) {
      return NextResponse.json({ error: 'Invalid rating target' }, { status: 400 });
    }
    const result = await rate(ctx.session, target, rating);
    return NextResponse.json(result);
  } catch (err) {
    return accountError(err);
  }
}
