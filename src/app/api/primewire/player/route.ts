import { NextRequest, NextResponse } from 'next/server';
import { getPlayer } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';

export const dynamic = 'force-dynamic';

/**
 * GET /api/primewire/player?type=movie|tv&id=…&slug=…[&season=…&number=…]
 *
 * Resolves PrimeWire's embeddable player (PrimeSrc) for a movie or TV
 * episode plus the user-submitted source list. TV requests without
 * season/number resolve to the first released episode.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const type = sp.get('type');
    const id = parseInt(sp.get('id') ?? '', 10);
    const slug = (sp.get('slug') ?? '').slice(0, 200);
    const season = parseInt(sp.get('season') ?? '', 10);
    const number = parseInt(sp.get('number') ?? '', 10);

    if (type !== 'movie' && type !== 'tv') {
      return NextResponse.json({ error: 'type must be movie or tv' }, { status: 400 });
    }
    if (!Number.isFinite(id) || id <= 0) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 });
    }

    const data = await getPlayer({
      type,
      id,
      slug,
      season: Number.isFinite(season) && season > 0 ? season : undefined,
      number: Number.isFinite(number) && number > 0 ? number : undefined,
    });
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to load player';
    return NextResponse.json({ error: message }, { status });
  }
}
