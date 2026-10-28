import { NextRequest, NextResponse } from 'next/server';
import { checkExternalProviders } from '@/lib/primewire/external-sources';

export const dynamic = 'force-dynamic';

/**
 * GET /api/primewire/external-providers?type=movie|tv&tmdb=…[&season=…&number=…]
 *
 * Health + exact embed URLs + iframe sandbox policy for the external
 * provider registry (VidSrc, VidLink, VidFast, 2Embed, Videm, Videasy)
 * against ONE title. The exact URL for the title is probed (alive +
 * framing + parked-page detection), so the picker can badge providers
 * live exactly like PrimeWire's own host rows. `sandbox` is the iframe
 * sandbox attribute to use — or null when the provider must be embedded
 * WITHOUT the attribute (most of them detect and refuse any sandbox).
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const type = sp.get('type') === 'tv' ? 'tv' : 'movie';
  const tmdb = parseInt(sp.get('tmdb') ?? '', 10);
  const season = parseInt(sp.get('season') ?? '', 10);
  const number = parseInt(sp.get('number') ?? '', 10);

  if (!Number.isFinite(tmdb) || tmdb <= 0) {
    return NextResponse.json({ error: 'invalid tmdb id' }, { status: 400 });
  }

  const providers = await checkExternalProviders({
    type,
    tmdb,
    season: Number.isFinite(season) && season > 0 ? season : null,
    number: Number.isFinite(number) && number > 0 ? number : null,
  });
  return NextResponse.json({ providers });
}
