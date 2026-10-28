import { NextRequest, NextResponse } from 'next/server';
import { browseMedia } from '@/lib/primewire';
import { PrimeWireError } from '@/lib/primewire/client';
import { PW_GENRES } from '@/lib/primewire/types';
import type { BrowseParams } from '@/lib/primewire/types';

export const dynamic = 'force-dynamic';

function clampInt(v: string | null, min: number, max: number): number | undefined {
  if (!v) return undefined;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n) || n < min || n > max) return undefined;
  return n;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const q = sp.get('q')?.toString().slice(0, 120).trim() || undefined;

    const typeRaw = sp.get('type');
    const type = typeRaw === 'movie' || typeRaw === 'tv' ? typeRaw : undefined;

    const genreParam = sp.get('genre') ?? '';
    const genres = genreParam
      .split(',')
      .map((g) => g.trim())
      .filter((g) => (PW_GENRES as readonly string[]).includes(g))
      .slice(0, 4);

    const sort = sp.get('sort')?.slice(0, 40) || undefined;
    const directionRaw = sp.get('direction');
    const direction = directionRaw === 'asc' || directionRaw === 'desc' ? directionRaw : undefined;

    const yearFrom = clampInt(sp.get('yearFrom'), 1900, 2100);
    const yearTo = clampInt(sp.get('yearTo'), 1900, 2100);
    // PrimeWire rating scale is 0–5 stars (not TMDB 0–10)
    const ratingRaw = sp.get('rating');
    let ratingAbove: number | undefined;
    if (ratingRaw) {
      const r = parseFloat(ratingRaw);
      if (Number.isFinite(r) && r > 0 && r <= 5) ratingAbove = r;
    }

    const country = sp.get('country')?.slice(0, 60) || undefined;
    const cast = sp.get('cast')?.slice(0, 120) || undefined;
    const qualityRaw = sp.get('quality');
    const quality =
      qualityRaw === 'HD' || qualityRaw === 'DVD' || qualityRaw === 'TS' || qualityRaw === 'CAM'
        ? qualityRaw
        : undefined;
    const page = clampInt(sp.get('page'), 1, 500) ?? 1;

    const params: BrowseParams = {
      q, type, genres, sort, direction, yearFrom, yearTo, ratingAbove, country, cast, quality, page,
    };
    const data = await browseMedia(params);
    return NextResponse.json(data);
  } catch (err) {
    const status = err instanceof PrimeWireError ? err.status : 500;
    const message = err instanceof Error ? err.message : 'Failed to browse PrimeWire';
    return NextResponse.json({ error: message }, { status });
  }
}
